import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [summary, days, devices, browsers, perLink] = await Promise.all([
    query<{total:string;unique_visitors:string;returning_visitors:string;top_name:string|null;top_visits:string|null;low_name:string|null;low_visits:string|null}>(
      `WITH owned AS (SELECT id,name,visit_count FROM share_links WHERE user_id=$1 AND status <> 'DELETED'),
            owned_visits AS (SELECT v.* FROM visits v JOIN owned o ON o.id=v.link_id)
       SELECT (SELECT COUNT(*)::text FROM owned_visits) AS total,
       (SELECT COUNT(DISTINCT visitor_hash)::text FROM owned_visits) AS unique_visitors,
       (SELECT COUNT(DISTINCT visitor_hash)::text FROM owned_visits WHERE is_returning=TRUE) AS returning_visitors,
       (SELECT name FROM owned ORDER BY visit_count DESC, name ASC LIMIT 1) AS top_name,
       (SELECT visit_count::text FROM owned ORDER BY visit_count DESC, name ASC LIMIT 1) AS top_visits,
       (SELECT name FROM owned ORDER BY visit_count ASC, name ASC LIMIT 1) AS low_name,
       (SELECT visit_count::text FROM owned ORDER BY visit_count ASC, name ASC LIMIT 1) AS low_visits`, [user.id]),
    query<{day:string;count:string}>(
      `SELECT TO_CHAR(d.day,'YYYY-MM-DD') AS day, COALESCE(COUNT(v.id),0)::text AS count
       FROM generate_series(CURRENT_DATE-INTERVAL '29 day',CURRENT_DATE,INTERVAL '1 day') d(day)
       LEFT JOIN share_links l ON l.user_id=$1 AND l.status <> 'DELETED'
       LEFT JOIN visits v ON v.link_id=l.id AND v.created_at>=d.day AND v.created_at<d.day+INTERVAL '1 day'
       GROUP BY d.day ORDER BY d.day`, [user.id]),
    query<{label:string;count:string}>(`SELECT COALESCE(v.device,'Unknown') label,COUNT(*)::text count FROM visits v JOIN share_links l ON l.id=v.link_id WHERE l.user_id=$1 GROUP BY v.device ORDER BY COUNT(*) DESC LIMIT 6`,[user.id]),
    query<{label:string;count:string}>(`SELECT COALESCE(v.browser,'Unknown') label,COUNT(*)::text count FROM visits v JOIN share_links l ON l.id=v.link_id WHERE l.user_id=$1 GROUP BY v.browser ORDER BY COUNT(*) DESC LIMIT 6`,[user.id]),
    query<{name:string;slug:string;total:string;unique_visitors:string;returning_visitors:string}>(
      `SELECT l.name,l.slug,l.visit_count::text AS total,
              COUNT(DISTINCT v.visitor_hash)::text AS unique_visitors,
              COUNT(DISTINCT v.visitor_hash) FILTER (WHERE v.is_returning=TRUE)::text AS returning_visitors
       FROM share_links l
       LEFT JOIN visits v ON v.link_id=l.id
       WHERE l.user_id=$1 AND l.status<>'DELETED'
       GROUP BY l.id,l.name,l.slug,l.visit_count
       ORDER BY l.visit_count DESC,l.created_at DESC
       LIMIT 20`, [user.id])
  ]);
  const s=summary.rows[0]??{total:"0",unique_visitors:"0",returning_visitors:"0",top_name:null,top_visits:null,low_name:null,low_visits:null};
  const unique=Number(s.unique_visitors||0);
  const returning=Number(s.returning_visitors||0);
  const newVisitors=Math.max(0,unique-returning);
  const returnRate=unique ? Math.round(returning/unique*100) : 0;
  const max=Math.max(1,...days.rows.map(d=>Number(d.count)));
  const today=days.rows.at(-1)?.count ?? "0";
  const seven=days.rows.slice(-7).reduce((a,d)=>a+Number(d.count),0);
  const thirty=days.rows.reduce((a,d)=>a+Number(d.count),0);
  return <><div className="page-heading"><div><span className="eyebrow">ANALYTICS</span><h1>Thống kê truy cập</h1><p>Visit, khách duy nhất và khách quay lại đều được tính từ dữ liệu thật trong database.</p></div></div>
    <div className="stats-grid"><Stat label="Hôm nay" value={Number(today).toLocaleString("vi-VN")}/><Stat label="7 ngày" value={seven.toLocaleString("vi-VN")}/><Stat label="30 ngày" value={thirty.toLocaleString("vi-VN")}/><Stat label="Tổng truy cập" value={Number(s.total).toLocaleString("vi-VN")}/></div>
    <div className="stats-grid"><Stat label="Khách duy nhất" value={unique.toLocaleString("vi-VN")} detail="anonymous visitor"/><Stat label="Khách mới" value={newVisitors.toLocaleString("vi-VN")} detail="chưa quay lại"/><Stat label="Khách quay lại" value={returning.toLocaleString("vi-VN")} detail="đã mở lại cùng link"/><Stat label="Tỷ lệ quay lại" value={`${returnRate}%`} detail="trên khách duy nhất"/></div>
    {Number(s.total)===0 ? <section className="panel empty-state"><strong>Chưa có dữ liệu thống kê.</strong><p>Analytics sẽ xuất hiện khi Share Link có lượt truy cập hợp lệ.</p></section> : <>
      <section className="panel"><div className="panel-head"><div><h2>30 ngày gần nhất</h2><p>Lượt truy cập hợp lệ theo ngày.</p></div></div><div className="chart" aria-label="Biểu đồ lượt truy cập 30 ngày">{days.rows.map((d,i)=><div className="bar-col" key={d.day} title={`${d.day}: ${d.count}`}><i style={{height:`${Math.max(3,Number(d.count)/max*100)}%`}}/><small>{i%5===0?d.day.slice(5):""}</small></div>)}</div></section>
      <section className="panel"><div className="panel-head"><div><h2>Unique & Returning theo link</h2><p>Biết một anonymous visitor đã từng mở chính link đó trước đây hay chưa.</p></div></div><div className="table-wrap"><table><thead><tr><th>Link</th><th>Tổng visit</th><th>Unique</th><th>Returning</th></tr></thead><tbody>{perLink.rows.map(row=><tr key={row.slug}><td><strong>{row.name}</strong><small className="cell-sub">/s/{row.slug}</small></td><td>{Number(row.total).toLocaleString("vi-VN")}</td><td>{Number(row.unique_visitors).toLocaleString("vi-VN")}</td><td>{Number(row.returning_visitors).toLocaleString("vi-VN")}</td></tr>)}</tbody></table></div></section>
      <div className="two-col"><section className="panel"><h2>Link hiệu suất</h2><dl className="detail-list"><div><dt>Truy cập nhiều nhất</dt><dd>{s.top_name} · {Number(s.top_visits||0).toLocaleString("vi-VN")}</dd></div><div><dt>Truy cập ít nhất</dt><dd>{s.low_name} · {Number(s.low_visits||0).toLocaleString("vi-VN")}</dd></div></dl></section><Breakdown title="Thiết bị" rows={devices.rows}/><Breakdown title="Trình duyệt" rows={browsers.rows}/></div>
    </>}
  </>;
}
function Stat({label,value,detail="visit hợp lệ"}:{label:string;value:string;detail?:string}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}
function Breakdown({title,rows}:{title:string;rows:{label:string;count:string}[]}){const max=Math.max(1,...rows.map(r=>Number(r.count)));return <section className="panel"><h2>{title}</h2><div className="breakdown">{rows.map(r=><div key={r.label}><span>{r.label}</span><div><i style={{width:`${Number(r.count)/max*100}%`}}/></div><strong>{r.count}</strong></div>)}</div></section>}
