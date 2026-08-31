"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { createSession, destroyCurrentSession, getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { cleanText, validateEmail, validatePassword, validateUsername } from "@/lib/validation";

function go(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  const username = cleanText(formData.get("username"), 32);
  const email = cleanText(formData.get("email"), 255).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const usernameError = validateUsername(username);
  if (usernameError) go("/register", "error", usernameError);
  const emailError = validateEmail(email);
  if (emailError) go("/register", "error", emailError);
  const passwordError = validatePassword(password);
  if (passwordError) go("/register", "error", passwordError);
  if (password !== confirm) go("/register", "error", "Mật khẩu nhập lại không khớp.");

  const duplicate = await query(
    `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) OR ($2 <> '' AND LOWER(email) = LOWER($2)) LIMIT 1`,
    [username, email]
  );
  if (duplicate.rowCount) go("/register", "error", "Username hoặc email đã được sử dụng.");

  await query(
    `INSERT INTO users (id, username, email, password_hash) VALUES ($1,$2,$3,$4)`,
    [randomUUID(), username, email || null, await hashPassword(password)]
  );
  go("/login", "success", "Đăng ký tài khoản thành công! Hãy đăng nhập.");
}

export async function loginAction(formData: FormData) {
  const identifier = cleanText(formData.get("identifier"), 255);
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!identifier || !password) go("/login", "error", "Vui lòng nhập đầy đủ thông tin.");

  const result = await query<{
    id: string; password_hash: string; status: "ACTIVE" | "LOCKED";
  }>(
    `SELECT id, password_hash, status FROM users
     WHERE LOWER(username) = LOWER($1) OR LOWER(COALESCE(email, '')) = LOWER($1)
     LIMIT 1`,
    [identifier]
  );
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    go("/login", "error", "Tên đăng nhập hoặc mật khẩu không chính xác.");
  }
  if (user.status === "LOCKED") go("/login", "error", "Tài khoản này đang bị khóa.");
  await createSession(user.id, remember);
  redirect("/dashboard?success=Đăng+nhập+thành+công!");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login?success=Đã+đăng+xuất.");
}

export async function forgotPasswordAction(formData: FormData) {
  const identifier = cleanText(formData.get("identifier"), 255);
  if (identifier) {
    const user = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(COALESCE(email,'')) = LOWER($1) LIMIT 1`,
      [identifier]
    );
    if (user.rows[0]) {
      await query(`INSERT INTO password_reset_requests (id, user_id) VALUES ($1,$2)`, [randomUUID(), user.rows[0].id]);
    }
  }
  go("/forgot-password", "success", "Nếu tài khoản tồn tại, yêu cầu khôi phục đã được ghi nhận.");
}

export async function bootstrapAdminAction(formData: FormData) {
  const existing = await query(`SELECT 1 FROM users WHERE role = 'ADMIN' LIMIT 1`);
  if (existing.rowCount) go("/admin/setup", "error", "Admin đầu tiên đã được tạo. Chức năng bootstrap đã khóa.");

  const code = cleanText(formData.get("code"), 100);
  const expected = process.env.ADMIN_BOOTSTRAP_CODE ?? (process.env.NODE_ENV === "production" ? "" : "2012");
  if (!expected || code !== expected) go("/admin/setup", "error", "Mã Admin không chính xác.");

  const username = cleanText(formData.get("username"), 32);
  const email = cleanText(formData.get("email"), 255).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const usernameError = validateUsername(username);
  if (usernameError) go("/admin/setup", "error", usernameError);
  const emailError = validateEmail(email);
  if (emailError) go("/admin/setup", "error", emailError);
  const passwordError = validatePassword(password);
  if (passwordError) go("/admin/setup", "error", passwordError);

  const id = randomUUID();
  await query(
    `INSERT INTO users (id, username, email, password_hash, role) VALUES ($1,$2,$3,$4,'ADMIN')`,
    [id, username, email || null, await hashPassword(password)]
  );
  await createSession(id, true);
  redirect("/admin?success=Admin+đầu+tiên+đã+được+tạo.");
}

export async function redirectAuthenticatedUser() {
  if (await getCurrentUser()) redirect("/dashboard");
}
