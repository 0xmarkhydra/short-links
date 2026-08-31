"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { scanAndPersistLinkRisk } from "@/lib/risk";
import { cleanText } from "@/lib/validation";

function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

async function audit(adminId: string, action: string, targetType: string, targetId: string, metadata?: object) {
  await query(
    `INSERT INTO audit_logs (admin_user_id,action,target_type,target_id,metadata) VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [adminId, action, targetType, targetId, JSON.stringify(metadata ?? {})]
  );
}

export async function setUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = cleanText(formData.get("userId"), 100);
  const status = cleanText(formData.get("status"), 20);
  if (!["ACTIVE","LOCKED"].includes(status)) fail("Trạng thái không hợp lệ.");
  if (userId === admin.id && status === "LOCKED") fail("Bạn không thể tự khóa tài khoản Admin.");
  await query(`UPDATE users SET status=$1,updated_at=NOW() WHERE id=$2`, [status, userId]);
  if (status === "LOCKED") await query(`DELETE FROM sessions WHERE user_id=$1`, [userId]);
  await audit(admin.id, "USER_STATUS_UPDATED", "USER", userId, { status });
  revalidatePath("/admin");
}

export async function setLinkStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const linkId = cleanText(formData.get("linkId"), 100);
  const status = cleanText(formData.get("status"), 20);
  if (!["ACTIVE","LOCKED"].includes(status)) fail("Trạng thái không hợp lệ.");
  await query(`UPDATE share_links SET status=$1,updated_at=NOW() WHERE id=$2 AND status <> 'DELETED'`, [status, linkId]);
  await audit(admin.id, "LINK_STATUS_UPDATED", "SHARE_LINK", linkId, { status });
  revalidatePath("/admin");
}

export async function rescanLinkRiskAction(formData: FormData) {
  const admin = await requireAdmin();
  const linkId = cleanText(formData.get("linkId"), 100);
  const found = await query<{ destination_url: string }>(
    `SELECT destination_url FROM share_links WHERE id=$1 AND status<>'DELETED' LIMIT 1`,
    [linkId]
  );
  const link = found.rows[0];
  if (!link) fail("Không tìm thấy Share Link.");
  const assessment = await scanAndPersistLinkRisk(linkId, link.destination_url, "MANUAL");
  await audit(admin.id, "LINK_RISK_RESCANNED", "SHARE_LINK", linkId, assessment);
  revalidatePath("/admin");
}

export async function deleteAnyLinkAction(formData: FormData) {
  const admin = await requireAdmin();
  const linkId = cleanText(formData.get("linkId"), 100);
  await query(`UPDATE share_links SET status='DELETED',deleted_at=NOW(),updated_at=NOW() WHERE id=$1`, [linkId]);
  await audit(admin.id, "LINK_DELETED", "SHARE_LINK", linkId);
  revalidatePath("/admin");
}
