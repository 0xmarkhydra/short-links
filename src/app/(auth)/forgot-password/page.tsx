import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Message } from "@/components/Message";
import { forgotPasswordAction } from "@/actions/auth";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{success?: string}> }) {
  const { success } = await searchParams;
  return <div className="auth-page"><div className="auth-card"><Logo/><div className="auth-heading"><h1>Quên mật khẩu?</h1><p>Nhập username hoặc email. Hệ thống không tiết lộ tài khoản có tồn tại hay không.</p></div><Message success={success}/><form action={forgotPasswordAction} className="form-stack"><label>Username hoặc Email<input name="identifier" required/></label><button className="btn btn-primary btn-wide" type="submit">Gửi yêu cầu khôi phục</button></form><p className="auth-switch"><Link href="/login">← Quay lại đăng nhập</Link></p></div></div>;
}
