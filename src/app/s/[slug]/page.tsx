import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { recordValidVisit } from "@/lib/visits";
import { Logo } from "@/components/Logo";
import { SITE_NAME } from "@/lib/site";

export const dynamic="force-dynamic";

type PublicLink = {
  id:string;
  name:string;
  destination_url:string;
  description:string|null;
  slug:string;
  status:string;
  visit_count:string;
};

const getPublicLink = cache(async (slug:string) => {
  const result=await query<PublicLink>(`SELECT id,name,destination_url,description,slug,status,visit_count::text FROM share_links WHERE slug=$1 AND status<>'DELETED' LIMIT 1`,[slug]);
  return result.rows[0] ?? null;
});

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const link=await getPublicLink(slug);
  if(!link){
    return { title:"Share Link không tồn tại", robots:{index:false,follow:false} };
  }
  const description=(link.description?.trim() || `Truy cập ${link.name} an toàn qua ${SITE_NAME}.`).slice(0,160);
  const image=`/s/${encodeURIComponent(slug)}/opengraph-image`;
  return {
    title:link.name,
    description,
    alternates:{canonical:`/s/${slug}`},
    robots:{index:false,follow:link.status==='ACTIVE'},
    openGraph:{
      type:"website",
      url:`/s/${slug}`,
      title:link.name,
      description,
      siteName:SITE_NAME,
      locale:"vi_VN",
      images:[{url:image,width:1200,height:630,alt:`${link.name} — ${SITE_NAME}`}]
    },
    twitter:{card:"summary_large_image",title:link.name,description,images:[image]}
  };
}

export default async function PublicSharePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const link=await getPublicLink(slug); if(!link) notFound();
  if(link.status==='LOCKED')return <PublicFrame><div className="public-status"><span className="status-icon">!</span><h1>Share Link tạm thời bị khóa</h1><p>Liên kết này hiện không khả dụng. Vui lòng liên hệ người chia sẻ.</p></div></PublicFrame>;
  const h=await headers(); const ua=h.get('user-agent')||''; const ip=(h.get('x-forwarded-for')||h.get('x-real-ip')||'unknown').split(',')[0].trim();
  await recordValidVisit({linkId:link.id,ip,userAgent:ua,country:h.get('x-vercel-ip-country')||h.get('cf-ipcountry'),referrer:h.get('referer')});
  const refreshed=await query<{visit_count:string}>(`SELECT visit_count::text FROM share_links WHERE id=$1`,[link.id]);
  const count=refreshed.rows[0]?.visit_count??link.visit_count;
  let destinationHost=link.destination_url; try{destinationHost=new URL(link.destination_url).hostname}catch{}
  return <PublicFrame><div className="public-card"><span className="eyebrow">SHARE LINK</span><h1>{link.name}</h1>{link.description&&<p>{link.description}</p>}<div className="destination"><small>Website đích</small><strong>{destinationHost}</strong></div><a className="btn btn-primary btn-wide btn-lg" href={link.destination_url} target="_blank" rel="noopener noreferrer nofollow">TRUY CẬP LINK →</a><div className="public-visits">Lượt truy cập: <strong>{Number(count).toLocaleString('vi-VN')}</strong></div></div></PublicFrame>;
}
function PublicFrame({children}:{children:React.ReactNode}){return <div className="public-page"><div className="public-top"><Logo/></div>{children}<small className="public-footer">Được bảo vệ bởi SHARE LINK</small></div>}
