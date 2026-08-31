import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Message } from "@/components/Message";
import { registerAction, redirectAuthenticatedUser } from "@/actions/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{error?: string}> }) {
  await redirectAuthenticatedUser();
  const { error } = await searchParams;
  return <div className="auth-page"><div className="auth-card"><Logo/><div className="auth-heading"><h1>Tạo tài khoản</h1><p>Bắt đầu quản lý và theo dõi link của bạn.</p></div><Message error={error}/><form action={registerAction} className="form-stack"><label>Username<input name="username" minLength={3} maxLength={32} required placeholder="username" autoComplete="username"/></label><label>Email <small>(tùy chọn)</small><input name="email" type="email" placeholder="you@email.com" autoComplete="email"/></label><label>Password<input name="password" type="password" minLength={8} required placeholder="Tối thiểu 8 ký tự" autoComplete="new-password"/></label><label>Nhập lại Password<input name="confirmPassword" type="password" minLength={8} required placeholder="Nhập lại mật khẩu" autoComplete="new-password"/></label><button className="btn btn-primary btn-wide" type="submit">Đăng ký</button></form><p className="auth-switch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p></div></div>;
}
