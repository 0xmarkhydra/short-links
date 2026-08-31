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
  const links = await query<{id:string;name:string;destination_url:string;slug:string;visit_count:string;status:string;created_at:Date;risk_state:string;risk_score:number;unique_visitors:string;returning_visitors:string}>(
    `SELECT l.id,l.name,l.destination_url,l.slug,l.visit_count::text,l.status,l.created_at,l.risk_state,l.risk_score,
            COUNT(DISTINCT v.visitor_hash)::text AS unique_visitors,
            COUNT(DISTINCT v.visitor_hash) FILTER (WHERE v.is_returning=TRUE)::text AS returning_visitors
     FROM share_links l
     LEFT JOIN visits v ON v.link_id=l.id
     WHERE l.user_id=$1 AND l.status <> 'DELETED' AND ($2='' OR l.name ILIKE '%'||$2||'%' OR l.slug ILIKE '%'||$2||'%')
     GROUP BY l.id
     ORDER BY l.created_at DESC LIMIT $3 OFFSET $4`, [user.id,q,limit,offset]
  );
  return <>
    <div className="page-heading"><div><span className="eyebrow">THƯ VIỆN</span><h1>Link của tôi</h1><p>SHARE LINK tự kiểm tra độ an toàn của URL và theo dõi anonymous visitor mới / quay lại.</p></div><Link className="btn btn-primary" href="/create-link">+ Tạo Link</Link></div>
    <Message success={params.success}/>
    <section className="panel links-panel"><form className="search-bar"><input name="q" defaultValue={q} placeholder="Tìm theo tên hoặc slug..."/><button className="btn btn-secondary btn-sm">Tìm kiếm</button></form>
    {links.rowCount ? <div className="table-wrap"><table><thead><tr><th>Tên</th><th>Share Link</th><th>Truy cập</th><th>Độ an toàn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{links.rows.map(link=><tr key={link.id}><td><strong>{link.name}</strong><small className="cell-sub">{link.destination_url}</small></td><td className="mono">/s/{link.slug}</td><td><strong>{Number(link.visit_count).toLocaleString("vi-VN")}</strong><small className="cell-sub">{Number(link.unique_visitors).toLocaleString("vi-VN")} unique · {Number(link.returning_visitors).toLocaleString("vi-VN")} returning</small></td><td><span className={`badge ${riskBadge(link.risk_state)}`}>{link.risk_state}</span><small className="cell-sub">score {Number(link.risk_score)||0}/100</small></td><td><span className={`badge badge-${link.status.toLowerCase()}`}>{link.status}</span></td><td><div className="actions"><CopyButton compact value={`/s/${link.slug}`}/><Link className="btn btn-ghost btn-sm" href={`/s/${link.slug}`} target="_blank">Mở</Link><Link className="btn btn-ghost btn-sm" href={`/my-links/${link.id}/edit`}>Sửa</Link><form action={deleteLinkAction}><input type="hidden" name="id" value={link.id}/><ConfirmSubmit message="Bạn có chắc chắn muốn xóa Share Link này?">Xóa</ConfirmSubmit></form></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>Không có Share Link phù hợp</strong><p>Hãy tạo link mới hoặc thử từ khóa khác.</p></div>}
    {links.rowCount === limit && <div className="pagination"><Link className="btn btn-secondary btn-sm" href={`/my-links?q=${encodeURIComponent(q)}&page=${page+1}`}>Trang tiếp →</Link></div>}</section>
  </>;
}
