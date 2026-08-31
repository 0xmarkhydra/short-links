"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/dashboard", "Dashboard", "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"],
  ["/create-link", "Tạo link", "M12 5v14M5 12h14"],
  ["/my-links", "Links", "M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15"],
  ["/analytics", "Thống kê", "M5 20V10M12 20V4M19 20v-7"],
  ["/profile", "Hồ sơ", "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  ["/settings", "Cài đặt", "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 3.67-.08-.02a1.7 1.7 0 0 0-1.8.54l-.08.04-2.12-1.22-.01-.1a1.7 1.7 0 0 0-1.47-1.34h-.1l-2.12 1.22-.08-.04a1.7 1.7 0 0 0-1.8-.54l-.08.02-2.12-3.67.06-.06A1.7 1.7 0 0 0 4.6 15v-.1a1.7 1.7 0 0 0 0-1.8V13a1.7 1.7 0 0 0 1.26-1.94l-.06-.06 2.12-3.67.08.02a1.7 1.7 0 0 0 1.8-.54l.08-.04L12 8l.01.1a1.7 1.7 0 0 0 1.47 1.34h.1l2.12-1.22.08.04a1.7 1.7 0 0 0 1.8.54l.08-.02 2.12 3.67-.06.06A1.7 1.7 0 0 0 19.4 13v.1a1.7 1.7 0 0 0 0 1.8v.1Z"]
] as const;

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const visibleLinks = mobile ? links.filter(([href]) => href !== "/settings") : links;

  return (
    <nav className={mobile ? "mobile-nav-items" : "side-nav"} aria-label="Điều hướng tài khoản">
      {visibleLinks.map(([href, label, icon]) => {
        const active = pathname === href || (href === "/my-links" && pathname.startsWith("/my-links/"));
        return (
          <Link key={href} href={href} className={active ? "nav-link active" : "nav-link"}>
            <NavIcon path={icon} />
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
