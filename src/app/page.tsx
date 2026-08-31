import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tạo & quản lý Share Link",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: `${SITE_NAME} — Tạo & quản lý Share Link`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — quản lý và chia sẻ liên kết` }]
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Tạo & quản lý Share Link`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"]
  }
};

const features = [
  ["01", "Tạo Share Link", "Biến URL dài thành liên kết gọn, dễ nhớ và dễ chia sẻ."],
  ["02", "Quản lý liên kết", "Chỉnh sửa, sao chép, xem trạng thái và quản lý link trong một nơi."],
  ["03", "Theo dõi truy cập", "Thống kê visit thật theo ngày, thiết bị, trình duyệt và nguồn truy cập."],
  ["04", "Hệ thống tài khoản", "Tài khoản riêng với session an toàn và dữ liệu được phân tách theo User."],
  ["05", "Quản lý Admin", "Admin kiểm soát User, trạng thái link và lịch sử thao tác từ backend."],
  ["06", "Bảo mật dữ liệu", "Mật khẩu hash, cookie HttpOnly, truy vấn tham số và kiểm tra quyền server-side."]
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "vi-VN"
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript and a modern web browser",
      inLanguage: "vi-VN"
    }
  ]
};

export default function LandingPage() {
  return (
    <div className="landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="landing-header container">
        <Logo />
        <nav className="landing-nav">
          <a href="#home">Trang chủ</a><a href="#about">Giới thiệu</a>
          <Link href="/login">Đăng nhập</Link><Link className="btn btn-primary btn-sm" href="/register">Đăng ký</Link>
        </nav>
      </header>
      <main>
        <section className="hero container" id="home">
          <div className="hero-copy">
            <span className="eyebrow">QUẢN LÝ LIÊN KẾT THÔNG MINH</span>
            <h1>CHIA SẺ LINK<br/><span>NHANH CHÓNG</span></h1>
            <p>Tạo và quản lý các liên kết của bạn trong một giao diện đơn giản, nhanh chóng và chuyên nghiệp.</p>
            <div className="hero-actions"><Link className="btn btn-primary" href="/register">Bắt đầu ngay</Link><Link className="btn btn-secondary" href="/login">Đăng nhập</Link></div>
            <div className="trust-row"><span>✓ Dữ liệu thật</span><span>✓ Không fake analytics</span><span>✓ Mobile-first</span></div>
          </div>
          <div className="hero-preview" aria-hidden="true">
            <div className="preview-glow"/>
            <div className="preview-window">
              <div className="preview-top"><i/><i/><i/></div>
              <div className="preview-stat-grid"><div><small>Tổng Link</small><strong>24</strong></div><div><small>Truy cập</small><strong>8.4K</strong></div></div>
              <div className="preview-line"><span/><b>sharelink.codelocal.cloud/s/cloud-phone</b></div>
              <div className="preview-chart">{[28,44,34,62,50,72,84].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div>
            </div>
          </div>
        </section>
        <section className="feature-section container" id="about">
          <div className="section-heading"><span className="eyebrow">MỌI THỨ BẠN CẦN</span><h2>Một hệ thống link. Đầy đủ công cụ.</h2><p>Thiết kế để dùng nhanh trên điện thoại nhưng vẫn mạnh khi quản trị trên desktop.</p></div>
          <div className="feature-grid">{features.map(([n,title,desc])=><article className="feature-card" key={n}><span>{n}</span><h3>{title}</h3><p>{desc}</p></article>)}</div>
        </section>
      </main>
      <footer className="footer"><div className="container footer-inner"><Logo/><div><Link href="/terms">Điều khoản sử dụng</Link><Link href="/privacy">Chính sách bảo mật</Link><a href="mailto:support@example.com">Liên hệ</a></div><small>© {new Date().getFullYear()} SHARE LINK.</small></div></footer>
    </div>
  );
}
