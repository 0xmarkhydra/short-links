import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { updateProfileAction, changePasswordAction, logoutAllDevicesAction } from "@/actions/profile";
import { Message } from "@/components/Message";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

export default async function ProfilePage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}){
  const user=await requireUser(); const messages=await searchParams;
  const stats=await query<{links:string;visits:string}>(`SELECT COUNT(*) FILTER(WHERE status<>'DELETED')::text links,COALESCE(SUM(visit_count) FILTER(WHERE status<>'DELETED'),0)::text visits FROM share_links WHERE user_id=$1`,[user.id]);
  const s=stats.rows[0]??{links:"0",visits:"0"};
  return <><div className="page-heading"><div><span className="eyebrow">TÀI KHOẢN</span><h1>Hồ sơ</h1><p>Quản lý thông tin cá nhân và bảo mật tài khoản.</p></div></div><Message error={messages.error} success={messages.success}/>
    <div className="profile-summary"><div className="avatar avatar-lg">{(user.display_name||user.username)[0].toUpperCase()}</div><div><h2>{user.display_name||user.username}</h2><p>@{user.username} · Tham gia {new Date(user.created_at).toLocaleDateString("vi-VN")}</p></div><div className="profile-numbers"><span><strong>{s.links}</strong> link</span><span><strong>{Number(s.visits).toLocaleString("vi-VN")}</strong> visit</span></div></div>
    <div className="two-col"><section className="panel form-panel"><h2>Thông tin hồ sơ</h2><form action={updateProfileAction} className="form-stack"><label>Username<input value={user.username} disabled/></label><label>Tên hiển thị<input name="displayName" maxLength={80} defaultValue={user.display_name||""}/></label><label>Email<input name="email" type="email" defaultValue={user.email||""}/></label><button className="btn btn-primary" type="submit">Lưu hồ sơ</button></form></section>
    <section className="panel form-panel"><h2>Đổi mật khẩu</h2><form action={changePasswordAction} className="form-stack"><label>Mật khẩu hiện tại<input type="password" name="currentPassword" required/></label><label>Mật khẩu mới<input type="password" name="newPassword" minLength={8} required/></label><label>Nhập lại mật khẩu mới<input type="password" name="confirmPassword" minLength={8} required/></label><button className="btn btn-secondary" type="submit">Đổi mật khẩu</button></form></section></div>
    <section className="panel danger-zone"><div><h2>Phiên đăng nhập</h2><p>Đăng xuất tài khoản khỏi tất cả thiết bị đang đăng nhập.</p></div><form action={logoutAllDevicesAction}><ConfirmSubmit className="btn btn-danger" message="Đăng xuất khỏi tất cả thiết bị?">Đăng xuất tất cả thiết bị</ConfirmSubmit></form></section>
  </>;
}
