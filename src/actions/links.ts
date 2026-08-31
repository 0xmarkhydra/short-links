"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { cleanText, normalizeSlug, randomSlugSuffix, slugify, validateDestinationUrl } from "@/lib/validation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function availableSlug(base: string, currentId?: string) {
  const normalized = normalizeSlug(base);
  if (normalized.error) throw new Error(normalized.error);
  let candidate = normalized.slug;
  for (let i = 0; i < 6; i++) {
    const found = await query(
      `SELECT 1 FROM share_links WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2::uuid) LIMIT 1`,
      [candidate, currentId ?? null]
    );
    if (!found.rowCount) return candidate;
    candidate = `${normalized.slug.slice(0, 56)}-${randomSlugSuffix()}`;
  }
  throw new Error("Không thể tạo slug duy nhất. Vui lòng thử slug khác.");
}

export async function createLinkAction(formData: FormData) {
  const user = await requireUser();
  const name = cleanText(formData.get("name"), 120);
  const destinationUrl = cleanText(formData.get("destinationUrl"), 2000);
  const description = cleanText(formData.get("description"), 500);
  const requestedSlug = cleanText(formData.get("slug"), 64);
  if (!name) fail("/create-link", "Tên Link không được để trống.");
  const urlError = validateDestinationUrl(destinationUrl);
  if (urlError) fail("/create-link", urlError);

  const seed = requestedSlug || slugify(name) || `link-${randomSlugSuffix()}`;
  let slug: string;
  try {
    slug = requestedSlug ? normalizeSlug(seed).slug : await availableSlug(seed);
    const normalized = normalizeSlug(slug);
    if (normalized.error) fail("/create-link", normalized.error);
    if (requestedSlug) {
      const exists = await query(`SELECT 1 FROM share_links WHERE slug = $1 LIMIT 1`, [normalized.slug]);
      if (exists.rowCount) fail("/create-link", "Slug này đã được sử dụng. Vui lòng chọn slug khác.");
      slug = normalized.slug;
    }
  } catch (error) {
    fail("/create-link", error instanceof Error ? error.message : "Slug không hợp lệ.");
  }

  const id = randomUUID();
  await query(
    `INSERT INTO share_links (id,user_id,name,destination_url,description,slug)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, user.id, name, destinationUrl, description || null, slug!]
  );
  redirect(`/create-link?created=${id}`);
}

export async function updateLinkAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanText(formData.get("id"), 100);
  const name = cleanText(formData.get("name"), 120);
  const destinationUrl = cleanText(formData.get("destinationUrl"), 2000);
  const description = cleanText(formData.get("description"), 500);
  const rawSlug = cleanText(formData.get("slug"), 64);
  if (!name) fail(`/my-links/${id}/edit`, "Tên Link không được để trống.");
  const urlError = validateDestinationUrl(destinationUrl);
  if (urlError) fail(`/my-links/${id}/edit`, urlError);
  const normalized = normalizeSlug(rawSlug);
  if (normalized.error) fail(`/my-links/${id}/edit`, normalized.error);
  const duplicate = await query(`SELECT 1 FROM share_links WHERE slug = $1 AND id <> $2 AND status <> 'DELETED' LIMIT 1`, [normalized.slug, id]);
  if (duplicate.rowCount) fail(`/my-links/${id}/edit`, "Slug này đã được sử dụng. Vui lòng chọn slug khác.");
  const updated = await query(
    `UPDATE share_links SET name=$1,destination_url=$2,description=$3,slug=$4,updated_at=NOW()
     WHERE id=$5 AND user_id=$6 AND status <> 'DELETED' RETURNING id`,
    [name, destinationUrl, description || null, normalized.slug, id, user.id]
  );
  if (!updated.rowCount) fail("/my-links", "Không tìm thấy Share Link hoặc bạn không có quyền chỉnh sửa.");
  redirect(`/my-links/${id}/edit?success=${encodeURIComponent("Cập nhật Share Link thành công!")}`);
}

export async function deleteLinkAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanText(formData.get("id"), 100);
  await query(
    `UPDATE share_links SET status='DELETED',deleted_at=NOW(),updated_at=NOW()
     WHERE id=$1 AND user_id=$2 AND status <> 'DELETED'`,
    [id, user.id]
  );
  revalidatePath("/my-links");
  redirect(`/my-links?success=${encodeURIComponent("Đã xóa Share Link.")}`);
}
