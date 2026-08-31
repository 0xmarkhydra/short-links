import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getDestinationMetadata } from "@/lib/destination-meta";
import { Logo } from "@/components/Logo";
import { ExternalLinkGate } from "@/components/ExternalLinkGate";
import { SITE_NAME } from "@/lib/site";
import { riskNeedsRefresh, scanAndPersistLinkRisk, type RiskState } from "@/lib/risk";

export const dynamic="force-dynamic";

type PublicLink = {
  id:string;
  name:string;
  destination_url:string;
  description:string|null;
  slug:string;
  status:string;
  visit_count:string;
  risk_state:RiskState;
  risk_score:number;
  risk_checked_at:Date|null;
};

const getPublicLink = cache(async (slug:string) => {
  if (!/^[a-z0-9-]{3,64}$/.test(slug)) return null;
  const result=await query<PublicLink>(
    `SELECT id,name,destination_url,description,slug,status,visit_count::text,risk_state,risk_score,risk_checked_at
     FROM share_links
     WHERE status<>'DELETED' AND (slug=$1 OR slug LIKE $2)
     ORDER BY CASE WHEN slug=$1 THEN 0 ELSE 1 END
     LIMIT 2`,
    [slug,`${slug}-%`]
  );
  const exact=result.rows.find((row)=>row.slug===slug);
  if(exact)return exact;
  return result.rows.length===1 ? result.rows[0] : null;
});

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const link=await getPublicLink(slug);
  if(!link){
    return { title:"Share Link không tồn tại", robots:{index:false,follow:false} };
  }

  if (link.status !== "ACTIVE" || link.risk_state === "BLOCKED") {
    return {
      title: "Liên kết không khả dụng",
      description: "SHARE LINK đã hạn chế truy cập liên kết này.",
      robots: { index: false, follow: false }
    };
  }

  const destinationMeta = await getDestinationMetadata(link.destination_url);
  const title=(destinationMeta?.title || link.name).slice(0,120);
  const description=(destinationMeta?.description || link.description?.trim() || `Mở ${link.name} qua ${SITE_NAME}.`).slice(0,200);
  const fallbackImage=`/s/${encodeURIComponent(slug)}/opengraph-image`;
  const image=destinationMeta?.image || fallbackImage;

  return {
    title,
    description,
    alternates:{canonical:`/s/${slug}`},
    robots:{index:false,follow:true},
    openGraph:{
      type:"website",
      url:`/s/${slug}`,
      title,
      description,
      siteName:destinationMeta?.siteName || SITE_NAME,
      locale:"vi_VN",
      images:[image]
    },
    twitter:{card:"summary_large_image",title,description,images:[image]}
  };
}

export default async function PublicSharePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const link=await getPublicLink(slug); if(!link) notFound();

  if(link.status==='LOCKED')return <PublicFrame><div className="public-status"><span className="status-icon">!</span><h1>Share Link tạm thời bị khóa</h1><p>Liên kết này hiện không khả dụng. Vui lòng liên hệ người chia sẻ.</p></div></PublicFrame>;

  let riskState = link.risk_state;
  let riskScore = Number(link.risk_score) || 0;
  if (riskNeedsRefresh(link.risk_checked_at)) {
    const assessment = await scanAndPersistLinkRisk(link.id, link.destination_url, "ACCESS");
    riskState = assessment.state;
    riskScore = assessment.score;
  }

  if (riskState === "BLOCKED") {
    return <PublicFrame><div className="public-status"><span className="status-icon">!</span><span className="eyebrow">SECURITY BLOCK</span><h1>Liên kết đã bị chặn</h1><p>Hệ thống phát hiện website đích có tín hiệu liên quan tới phishing, malware hoặc nội dung nguy hiểm. SHARE LINK sẽ không chuyển tiếp liên kết này.</p><a className="btn btn-secondary" href="/report">Báo cáo / yêu cầu xem xét</a></div></PublicFrame>;
  }

  if (riskState === "SAFE") {
    redirect(`/go/${link.slug}`);
  }

  let destinationHost=link.destination_url; try{destinationHost=new URL(link.destination_url).hostname}catch{}
  return <PublicFrame><div className="public-card"><span className="eyebrow">KIỂM TRA AN TOÀN</span><h1>Link này cần bạn kiểm tra thêm</h1><p>SHARE LINK phát hiện một số tín hiệu bất thường ở URL đích. Điều này không đồng nghĩa website chắc chắn độc hại.</p><div className="destination"><small>Website đích</small><strong>{destinationHost}</strong></div><ExternalLinkGate destinationUrl={`/go/${link.slug}`} destinationHost={destinationHost}/><div className="public-visits">Risk score: <strong>{riskScore}/100</strong> · <a href="/report">Báo cáo link</a></div></div></PublicFrame>;
}
function PublicFrame({children}:{children:React.ReactNode}){return <div className="public-page"><div className="public-top"><Logo/></div>{children}<small className="public-footer">Được bảo vệ bởi SHARE LINK · <a href="/report">Báo cáo liên kết</a></small></div>}
