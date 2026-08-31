import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { bootstrapAdminAction } from "@/actions/auth";
import { Logo } from "@/components/Logo";
import { Message } from "@/components/Message";

export const dynamic="force-dynamic";
export default async function AdminSetupPage({searchParams}:{searchParams:Promise<{error?:string}>}){
  const current=await getCurrentUser(); if(current?.role==='ADMIN') redirect('/admin');
  const exists=await query(`SELECT 1 FROM users WHERE role='ADMIN' LIMIT 1`); const {error}=await searchParams;
  if(exists.rowCount)return <div className="auth-page"><div className="auth-card"><Logo/><div className="auth-heading"><h1>Bootstrap đã khóa</h1><p>Hệ thống đã có Admin. Hãy đăng nhập bằng tài khoản Admin hiện có.</p></div><a className="btn btn-primary btn-wide" href="/login">Đăng nhập</a></div></div>;
  return <div className="auth-page"><div className="auth-card"><Logo/><div className="auth-heading"><h1>Tạo Admin đầu tiên</h1><p>Mã bootstrap chỉ được kiểm tra ở server và chỉ dùng được trước khi có Admin.</p></div><Message error={error}/><form action={bootstrapAdminAction} className="form-stack"><label>Mã Admin<input name="code" type="password" required/></label><label>Username<input name="username" minLength={3} required/></label><label>Email<input name="email" type="email"/></label><label>Password<input name="password" type="password" minLength={8} required/></label><button className="btn btn-primary btn-wide">Khởi tạo Admin</button></form></div></div>;
}
