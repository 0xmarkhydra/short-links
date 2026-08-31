"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/dashboard", "Dashboard"],
  ["/create-link", "Tạo Share Link"],
  ["/my-links", "Link của tôi"],
  ["/analytics", "Thống kê"],
  ["/profile", "Hồ sơ"],
  ["/settings", "Cài đặt"]
] as const;

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={mobile ? "mobile-nav-items" : "side-nav"} aria-label="Điều hướng tài khoản">
      {links.map(([href, label]) => {
        const active = pathname === href || (href === "/my-links" && pathname.startsWith("/my-links/"));
        return <Link key={href} href={href} className={active ? "nav-link active" : "nav-link"}>{label}</Link>;
      })}
    </nav>
  );
}
