import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { updateLinkAction } from "@/actions/links";
import { Message } from "@/components/Message";

export default async function EditLinkPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{error?:string;success?:string}> }) {
  const user = await requireUser(); const { id } = await params; const messages = await searchParams;
  const result = await query<{id:string;name:string;destination_url:string;description:string|null;slug:string;status:string}>(`SELECT id,name,destination_url,description,slug,status FROM share_links WHERE id=$1 AND user_id=$2 AND status <> 'DELETED' LIMIT 1`,[id,user.id]);
  const link = result.rows[0]; if(!link) notFound();
  return <><div className="page-heading"><div><span className="eyebrow">CHỈNH SỬA</span><h1>{link.name}</h1><p>Bạn không thể thay đổi chủ sở hữu, ID hệ thống hoặc quyền Admin.</p></div><Link className="btn btn-secondary" href="/my-links">← Quay lại</Link></div><Message error={messages.error} success={messages.success}/><section className="panel form-panel"><form action={updateLinkAction} className="form-stack"><input type="hidden" name="id" value={link.id}/><label>Tên Link<input name="name" required maxLength={120} defaultValue={link.name}/></label><label>URL đích<input name="destinationUrl" type="url" required defaultValue={link.destination_url}/></label><label>Mô tả<textarea name="description" rows={4} maxLength={500} defaultValue={link.description || ""}/></label><label>Slug<div className="slug-input"><span>/s/</span><input name="slug" required maxLength={64} defaultValue={link.slug}/></div></label>{link.status === "LOCKED" && <div className="message message-error">Link đang bị Admin khóa. Bạn có thể chỉnh nội dung nhưng link công khai vẫn không hoạt động.</div>}<button className="btn btn-primary" type="submit">Lưu thay đổi</button></form></section></>;
}
