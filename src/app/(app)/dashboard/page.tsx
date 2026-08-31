import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { Message } from "@/components/Message";
import { CopyButton } from "@/components/CopyButton";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{error?: string; success?: string}> }) {
  const user = await requireUser();
  const { error, success } = await searchParams;
  const stats = await query<{total_links: string; total_visits: string; unique_visitors:string; returning_visitors:string}>(
    `WITH owned AS (SELECT id,visit_count FROM share_links WHERE user_id=$1 AND status <> 'DELETED'),
          owned_visits AS (SELECT v.* FROM visits v JOIN owned o ON o.id=v.link_id)
     SELECT (SELECT COUNT(*)::text FROM owned) AS total_links,
            (SELECT COALESCE(SUM(visit_count),0)::text FROM owned) AS total_visits,
            (SELECT COUNT(DISTINCT visitor_hash)::text FROM owned_visits) AS unique_visitors,
            (SELECT COUNT(DISTINCT visitor_hash)::text FROM owned_visits WHERE is_returning=TRUE) AS returning_visitors`, [user.id]
  );
  const recent = await query<{id:string;name:string;slug:string;visit_count:string;status:string;created_at:Date}>(
    `SELECT id,name,slug,visit_count::text,status,created_at FROM share_links WHERE user_id=$1 AND status <> 'DELETED' ORDER BY created_at DESC LIMIT 5`, [user.id]
  );
  const s = stats.rows[0] ?? {total_links:"0", total_visits:"0", unique_visitors:"0", returning_visitors:"0"};
  return <>
    <div className="page-heading"><div><span className="eyebrow">TỔNG QUAN</span><h1>Xin chào, {user.display_name || user.username}</h1><p>Đây là tình hình Share Link của bạn hôm nay.</p></div><Link className="btn btn-primary" href="/create-link">+ Tạo Share Link</Link></div>
    <Message error={error} success={success}/>
    <div className="stats-grid"><Stat label="Tổng Link" value={s.total_links}/><Stat label="Tổng lượt truy cập" value={Number(s.total_visits).toLocaleString("vi-VN")}/><Stat label="Khách duy nhất" value={Number(s.unique_visitors).toLocaleString("vi-VN")}/><Stat label="Khách quay lại" value={Number(s.returning_visitors).toLocaleString("vi-VN")}/></div>
    <section className="panel"><div className="panel-head"><div><h2>Link gần đây</h2><p>Các liên kết bạn tạo mới nhất.</p></div><Link href="/my-links">Xem tất cả →</Link></div>
      {recent.rowCount ? <div className="link-list">{recent.rows.map(link=><div className="link-row" key={link.id}><div className="link-main"><strong>{link.name}</strong><span>/s/{link.slug}</span></div><div className="link-metric">{Number(link.visit_count).toLocaleString("vi-VN")} visit</div><span className={`badge badge-${link.status.toLowerCase()}`}>{link.status}</span><CopyButton compact value={`/s/${link.slug}`}/></div>)}</div> : <Empty/>}
    </section>
  </>;
}

function Stat({label,value}:{label:string;value:string}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>Dữ liệu thực tế</small></div>}
function Empty(){return <div className="empty-state"><strong>Chưa có Share Link</strong><p>Tạo link đầu tiên để bắt đầu theo dõi lượt truy cập.</p><Link className="btn btn-secondary btn-sm" href="/create-link">Tạo link đầu tiên</Link></div>}
