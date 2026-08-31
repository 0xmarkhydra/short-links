import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { createLinkAction } from "@/actions/links";
import { Message } from "@/components/Message";
import { CopyButton } from "@/components/CopyButton";

export default async function CreateLinkPage({ searchParams }: { searchParams: Promise<{error?:string;created?:string}> }) {
  const user = await requireUser();
  const { error, created } = await searchParams;
  const createdLink = created ? await query<{id:string;name:string;destination_url:string;slug:string;status:string;created_at:Date}>(
    `SELECT id,name,destination_url,slug,status,created_at FROM share_links WHERE id=$1 AND user_id=$2 AND status <> 'DELETED' LIMIT 1`, [created,user.id]
  ) : null;
  const link = createdLink?.rows[0];
  return <>
    <div className="page-heading"><div><span className="eyebrow">TẠO MỚI</span><h1>Tạo Share Link</h1><p>Tạo một liên kết dễ nhớ và bắt đầu theo dõi truy cập thật.</p></div></div>
    <Message error={error} success={link ? "Tạo Share Link thành công!" : undefined}/>
    {link && <div className="success-card"><div><small>SHARE LINK ĐÃ SẴN SÀNG</small><h2>{link.name}</h2><p className="mono">/s/{link.slug}</p></div><CopyButton value={`/s/${link.slug}`}/><dl><div><dt>URL đích</dt><dd>{link.destination_url}</dd></div><div><dt>Ngày tạo</dt><dd>{new Date(link.created_at).toLocaleString("vi-VN")}</dd></div><div><dt>Trạng thái</dt><dd><span className="badge badge-active">{link.status}</span></dd></div></dl></div>}
    <section className="panel form-panel"><form action={createLinkAction} className="form-stack"><label>Tên Link<input name="name" required maxLength={120} placeholder="Cloud Phone"/></label><label>URL đích<input name="destinationUrl" type="url" required placeholder="https://example.com"/></label><label>Mô tả<textarea name="description" maxLength={500} rows={4} placeholder="Truy cập dịch vụ Cloud Phone."/></label><label>Slug <small>(để trống để hệ thống tự tạo)</small><div className="slug-input"><span>/s/</span><input name="slug" maxLength={64} placeholder="cloud-phone"/></div></label><button className="btn btn-primary" type="submit">Tạo Share Link</button></form></section>
  </>;
}
