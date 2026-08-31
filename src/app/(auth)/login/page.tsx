import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Message } from "@/components/Message";
import { loginAction, redirectAuthenticatedUser } from "@/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{error?: string; success?: string}> }) {
  await redirectAuthenticatedUser();
  const { error, success } = await searchParams;
  return <div className="auth-page"><div className="auth-card"><Logo/><div className="auth-heading"><h1>Chào mừng trở lại</h1><p>Đăng nhập để quản lý Share Link của bạn.</p></div><Message error={error} success={success}/><form action={loginAction} className="form-stack"><label>Username hoặc Email<input name="identifier" autoComplete="username" required placeholder="mmon hoặc you@email.com"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="••••••••"/></label><div className="form-row"><label className="check"><input type="checkbox" name="remember"/> Ghi nhớ đăng nhập</label><Link href="/forgot-password">Quên mật khẩu?</Link></div><button className="btn btn-primary btn-wide" type="submit">Đăng nhập</button></form><p className="auth-switch">Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link></p></div></div>;
}
