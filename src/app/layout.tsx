import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SHARE LINK", template: "%s | SHARE LINK" },
  description: "Tạo, quản lý và theo dõi các liên kết chia sẻ của bạn.",
  metadataBase: process.env.APP_BASE_URL ? new URL(process.env.APP_BASE_URL) : undefined
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-accent="red">
      <body>{children}</body>
    </html>
  );
}
