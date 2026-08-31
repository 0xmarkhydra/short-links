import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteLinkAction } from "@/actions/links";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Message } from "@/components/Message";

function riskBadge(state:string){
  if(state==="SAFE")return "badge-active";
  if(state==="BLOCKED")return "badge-deleted";
  return "badge-locked";
}

export default async function MyLinksPage({ searchParams }: { searchParams: Promise<{q?:string;page?:string;success?:string}> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = (params.q || "").trim().slice(0,100);
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20; const offset = (page-1)*limit;
  const links = await query<{id:string;name:string;destination_url:string;slug:string;visit_count:string;status:string;created_at:Date;risk_state:string;risk_score:number}>(
    `SELECT id,name,destination_url,slug,visit_count::text,status,created_at,risk_state,risk_score FROM share_links
     WHERE user_id=$1 AND status <> 'DELETED' AND ($2='' OR name ILIKE '%'||$2||'%' OR slug ILIKE '%'||$2||'%')
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [user.id,q,limit,offset]
  );
  return <>
    <div className="page-heading"><div><span className="eyebrow">THƯ VIỆN</span><h1>Link của tôi</h1><p>SHARE LINK tự kiểm tra độ an toàn của URL khi tạo, chỉnh sửa và khi kết quả quét đã cũ.</p></div><Link className="btn btn-primary" href="/create-link">+ Tạo Link</Link></div>
    <Message success={params.success}/>
    <section className="panel links-panel"><form className="search-bar"><input name="q" defaultValue={q} placeholder="Tìm theo tên hoặc slug..."/><button className="btn btn-secondary btn-sm">Tìm kiếm</button></form>
    {links.rowCount ? <div className="table-wrap"><table><thead><tr><th>Tên</th><th>Share Link</th><th>Truy cập</th><th>Độ an toàn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{links.rows.map(link=><tr key={link.id}><td><strong>{link.name}</strong><small className="cell-sub">{link.destination_url}</small></td><td className="mono">/s/{link.slug}</td><td>{Number(link.visit_count).toLocaleString("vi-VN")}</td><td><span className={`badge ${riskBadge(link.risk_state)}`}>{link.risk_state}</span><small className="cell-sub">score {Number(link.risk_score)||0}/100</small></td><td><span className={`badge badge-${link.status.toLowerCase()}`}>{link.status}</span></td><td><div className="actions"><CopyButton compact value={`/s/${link.slug}`}/><Link className="btn btn-ghost btn-sm" href={`/s/${link.slug}`} target="_blank">Mở</Link><Link className="btn btn-ghost btn-sm" href={`/my-links/${link.id}/edit`}>Sửa</Link><form action={deleteLinkAction}><input type="hidden" name="id" value={link.id}/><ConfirmSubmit message="Bạn có chắc chắn muốn xóa Share Link này?">Xóa</ConfirmSubmit></form></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>Không có Share Link phù hợp</strong><p>Hãy tạo link mới hoặc thử từ khóa khác.</p></div>}
    {links.rowCount === limit && <div className="pagination"><Link className="btn btn-secondary btn-sm" href={`/my-links?q=${encodeURIComponent(q)}&page=${page+1}`}>Trang tiếp →</Link></div>}</section>
  </>;
}
