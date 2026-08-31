import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { createLinkAction } from "@/actions/links";
import { Message } from "@/components/Message";
import { CopyButton } from "@/components/CopyButton";
import { CreateLinkSubmitButton } from "@/components/CreateLinkSubmitButton";

export default async function CreateLinkPage({ searchParams }: { searchParams: Promise<{error?:string;created?:string}> }) {
  const user = await requireUser();
  const { error, created } = await searchParams;
  const createdLink = created ? await query<{id:string;name:string;destination_url:string;slug:string;status:string;created_at:Date}>(
    `SELECT id,name,destination_url,slug,status,created_at FROM share_links WHERE id=$1 AND user_id=$2 AND status <> 'DELETED' LIMIT 1`, [created,user.id]
  ) : null;
  const link = createdLink?.rows[0];

  return <>
    <div className="page-heading"><div><span className="eyebrow">TẠO MỚI</span><h1>Dán link là xong</h1><p>SHARE LINK tự lấy tiêu đề, mô tả và tạo đường dẫn ngắn cho bạn.</p></div></div>
    <Message error={error} success={link ? "Tạo Share Link thành công!" : undefined}/>
    {link && <div className="success-card"><div><small>SHARE LINK ĐÃ SẴN SÀNG</small><h2>{link.name}</h2><p className="mono">/s/{link.slug}</p></div><CopyButton value={`/s/${link.slug}`}/><dl><div><dt>URL đích</dt><dd>{link.destination_url}</dd></div><div><dt>Ngày tạo</dt><dd>{new Date(link.created_at).toLocaleString("vi-VN")}</dd></div><div><dt>Trạng thái</dt><dd><span className="badge badge-active">{link.status}</span></dd></div></dl></div>}

    <section className="panel form-panel quick-create-panel">
      <form action={createLinkAction} className="form-stack quick-create-form">
        <label className="quick-url-label">
          Link cần chia sẻ
          <div className="quick-url-row">
            <input name="destinationUrl" type="text" required autoFocus inputMode="url" autoComplete="url" spellCheck={false} placeholder="example.com/bai-viet" />
            <CreateLinkSubmitButton />
          </div>
          <small>Chỉ cần dán link. Hệ thống tự thêm https:// nếu thiếu và tự lấy tiêu đề, mô tả, slug.</small>
        </label>

        <details className="advanced-fields">
          <summary>Tuỳ chỉnh nâng cao</summary>
          <div className="advanced-fields-body">
            <label>Tên hiển thị <small>(không bắt buộc)</small><input name="name" maxLength={120} placeholder="Tự lấy từ website đích"/></label>
            <label>Mô tả <small>(không bắt buộc)</small><textarea name="description" maxLength={500} rows={3} placeholder="Tự lấy từ website đích"/></label>
            <label>Slug <small>(không bắt buộc)</small><div className="slug-input"><span>/s/</span><input name="slug" maxLength={64} placeholder="Tự tạo"/></div></label>
          </div>
        </details>
      </form>
    </section>
  </>;
}
