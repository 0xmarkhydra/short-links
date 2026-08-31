import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { logoutAction } from "@/actions/auth";

type User = { username: string; display_name: string | null; role: "USER" | "ADMIN" };

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const initial = (user.display_name || user.username).slice(0, 1).toUpperCase();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo href="/dashboard" />
        <NavLinks />
        <div className="sidebar-footer">
          {user.role === "ADMIN" && <Link className="nav-link admin-link" href="/admin">Admin Panel</Link>}
          <form action={logoutAction}><button className="nav-link nav-button" type="submit">Đăng xuất</button></form>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <Logo href="/dashboard" />
          <div className="header-actions">
            {user.role === "ADMIN" && <Link className="header-action" href="/admin" aria-label="Mở Admin Panel">Admin</Link>}
            <Link className="header-action" href="/settings" aria-label="Mở cài đặt">⚙</Link>
            <Link className="user-chip-link" href="/profile" aria-label="Mở hồ sơ">
              <span className="avatar">{initial}</span>
              <span className="user-meta"><strong>{user.display_name || user.username}</strong><small>{user.role === "ADMIN" ? "Administrator" : `@${user.username}`}</small></span>
            </Link>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      <div className="mobile-nav"><NavLinks mobile /></div>
    </div>
  );
}
