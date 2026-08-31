import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { query } from "@/lib/db";

const COOKIE_NAME = "sl_session";

type SessionUser = {
  id: string;
  username: string;
  email: string | null;
  display_name: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "LOCKED";
  created_at: Date;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function redirectMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function createSession(userId: string, remember = false) {
  const raw = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), userId, tokenHash, expiresAt]
  );
  const store = await cookies();
  store.set(COOKIE_NAME, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: remember ? expiresAt : undefined
  });
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const result = await query<SessionUser>(
    `SELECT u.id, u.username, u.email, u.display_name, u.role, u.status, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.status = 'ACTIVE'
     LIMIT 1`,
    [hashToken(raw)]
  );
  return result.rows[0] ?? null;
});

export async function destroyCurrentSession() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw) await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(raw)]);
  store.delete(COOKIE_NAME);
}

export async function destroyAllSessions(userId: string) {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  (await cookies()).delete(COOKIE_NAME);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirectMessage("/login", "error", "Vui lòng đăng nhập để tiếp tục.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirectMessage("/dashboard", "error", "Bạn không có quyền truy cập Admin.");
  return user;
}
