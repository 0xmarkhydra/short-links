import { ImageResponse } from "next/og";
import { query } from "@/lib/db";
import { SITE_NAME } from "@/lib/site";

export const alt = "SHARE LINK preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type PreviewLink = {name:string;description:string|null;destination_url:string;status:string;slug:string};

async function resolvePreviewLink(slug:string) {
  if (!/^[a-z0-9-]{3,64}$/.test(slug)) return null;
  const result=await query<PreviewLink>(
    `SELECT name,description,destination_url,status,slug
     FROM share_links
     WHERE status<>'DELETED' AND (slug=$1 OR slug LIKE $2)
     ORDER BY CASE WHEN slug=$1 THEN 0 ELSE 1 END
     LIMIT 2`,
    [slug,`${slug}-%`]
  );
  const exact=result.rows.find((row)=>row.slug===slug);
  if(exact)return exact;
  return result.rows.length===1 ? result.rows[0] : null;
}

export default async function ShareOpenGraphImage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const link=await resolvePreviewLink(slug);
  const name=link?.name || "Share Link";
  const description=(link?.description?.trim() || "Mở liên kết được chia sẻ qua SHARE LINK.").slice(0,180);
  let host="Liên kết chia sẻ";
  if(link?.destination_url){try{host=new URL(link.destination_url).hostname}catch{}}
  const locked=link?.status==='LOCKED';

  return new ImageResponse(
    <div
      style={{
        width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",
        padding:"60px 68px",color:"#f7f8fb",background:"linear-gradient(135deg,#090a0d 0%,#10141a 62%,#1d1014 100%)"
      }}
    >
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:58,height:58,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#ff3147,#ff6b79)",fontSize:30,fontWeight:900}}>↗</div>
          <div style={{fontSize:26,fontWeight:850,letterSpacing:1}}>{SITE_NAME}</div>
        </div>
        <div style={{display:"flex",padding:"9px 15px",borderRadius:999,border:"1px solid #343b46",color:locked?"#ffd16b":"#94e8b7",fontSize:18,fontWeight:800}}>
          {locked?"TẠM KHÓA":"LINK ĐÃ XÁC THỰC"}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",maxWidth:980}}>
        <div style={{color:"#ff5b6c",fontSize:20,fontWeight:800,letterSpacing:2.2,marginBottom:18}}>SHARED DESTINATION</div>
        <div style={{fontSize:68,lineHeight:1.04,letterSpacing:-3,fontWeight:900,marginBottom:22}}>{name}</div>
        <div style={{fontSize:27,lineHeight:1.45,color:"#aeb6c2",marginBottom:30}}>{description}</div>
        <div style={{display:"flex",alignItems:"center",gap:14,color:"#d7dce3",fontSize:22}}>
          <div style={{display:"flex",padding:"10px 15px",borderRadius:12,background:"#171b21",border:"1px solid #2a303a"}}>{host}</div>
          <div style={{color:"#747f8e"}}>→</div>
          <div style={{color:"#ff7180"}}>/s/{slug}</div>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",fontSize:20,color:"#7f8997"}}>
        <div>sharelink.codelocal.cloud</div>
        <div>Chia sẻ rõ ràng • Truy cập nhanh</div>
      </div>
    </div>,
    size
  );
}
