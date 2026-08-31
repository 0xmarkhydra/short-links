"use server";

import { redirect } from "next/navigation";
import { requireUser, destroyAllSessions } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { cleanText, validateEmail, validatePassword } from "@/lib/validation";

function go(key: "error" | "success", message: string): never {
  redirect(`/profile?${key}=${encodeURIComponent(message)}`);
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const displayName = cleanText(formData.get("displayName"), 80);
  const email = cleanText(formData.get("email"), 255).toLowerCase();
  const emailError = validateEmail(email);
  if (emailError) go("error", emailError);
  if (email) {
    const duplicate = await query(`SELECT 1 FROM users WHERE LOWER(email)=LOWER($1) AND id <> $2 LIMIT 1`, [email, user.id]);
    if (duplicate.rowCount) go("error", "Email này đã được sử dụng.");
  }
  await query(`UPDATE users SET display_name=$1,email=$2,updated_at=NOW() WHERE id=$3`, [displayName || null, email || null, user.id]);
  go("success", "Cập nhật hồ sơ thành công!");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const result = await query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id=$1`, [user.id]);
  if (!result.rows[0] || !(await verifyPassword(current, result.rows[0].password_hash))) go("error", "Mật khẩu hiện tại không chính xác.");
  const error = validatePassword(next);
  if (error) go("error", error);
  if (next !== confirm) go("error", "Mật khẩu nhập lại không khớp.");
  await query(`UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2`, [await hashPassword(next), user.id]);
  await destroyAllSessions(user.id);
  redirect(`/login?success=${encodeURIComponent("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.")}`);
}

export async function logoutAllDevicesAction() {
  const user = await requireUser();
  await destroyAllSessions(user.id);
  redirect(`/login?success=${encodeURIComponent("Đã đăng xuất khỏi tất cả thiết bị.")}`);
}
