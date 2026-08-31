import type { Metadata } from "next";
import Link from "next/link";
import { reportLinkAction } from "@/actions/reports";
import { Logo } from "@/components/Logo";
import { Message } from "@/components/Message";

export const metadata: Metadata = {
  title: "Báo cáo liên kết",
  description: "Báo cáo SHARE LINK có dấu hiệu phishing, malware, scam, spam hoặc nội dung vi phạm.",
  robots: { index: false, follow: false }
};

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-page">
      <main className="auth-card" style={{ width: "min(100%, 560px)" }}>
        <Logo href="/" />
        <div className="auth-heading">
          <span className="eyebrow">ABUSE REPORT</span>
          <h1>Báo cáo liên kết</h1>
          <p>Mỗi báo cáo sẽ kích hoạt quét tự động lại website đích. Một báo cáo đơn lẻ không tự khóa link để tránh bị lợi dụng.</p>
        </div>
        <Message error={params.error} success={params.success} />
        <form className="form-stack" action={reportLinkAction}>
          <label>
            SHARE LINK cần báo cáo
            <input name="link" required placeholder="sharelink.codelocal.cloud/s/a8K2xQ" autoCapitalize="none" autoCorrect="off" />
          </label>
          <label>
            Lý do
            <select name="reason" defaultValue="PHISHING" style={{ width: "100%", padding: "12px 13px", borderRadius: 11, background: "#0c0f13", color: "#fff", border: "1px solid #2a303a" }}>
              <option value="PHISHING">Phishing / giả mạo đăng nhập</option>
              <option value="MALWARE">Malware / file độc hại</option>
              <option value="SCAM">Lừa đảo / scam</option>
              <option value="SPAM">Spam</option>
              <option value="ILLEGAL">Nội dung có dấu hiệu vi phạm pháp luật</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>
          <label>
            Chi tiết <small>Không bắt buộc</small>
            <textarea name="details" maxLength={500} rows={4} placeholder="Mô tả ngắn điều bạn phát hiện..." />
          </label>
          <button className="btn btn-primary btn-wide" type="submit">Báo cáo & quét lại</button>
        </form>
        <p className="auth-switch"><Link href="/">← Quay lại SHARE LINK</Link></p>
      </main>
    </div>
  );
}
