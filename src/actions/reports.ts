"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { applyReportSignal, scanAndPersistLinkRisk } from "@/lib/risk";
import { cleanText } from "@/lib/validation";

const ALLOWED_REASONS = new Set(["PHISHING", "MALWARE", "SCAM", "SPAM", "ILLEGAL", "OTHER"]);

type ReportableLink = {
  id: string;
  slug: string;
  destination_url: string;
  status: string;
};

function fail(message: string): never {
  redirect(`/report?error=${encodeURIComponent(message)}`);
}

function extractSlug(value: string) {
  const input = value.trim();
  if (!input) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const match = url.pathname.match(/^\/s\/([a-z0-9-]{3,64})(?:\/|$)/i);
    if (match) return match[1].toLowerCase();
  } catch {}

  const direct = input.replace(/^\/?s\//i, "").replace(/^\//, "").trim().toLowerCase();
  return /^[a-z0-9-]{3,64}$/.test(direct) ? direct : "";
}

async function resolveLink(slug: string) {
  const result = await query<ReportableLink>(
    `SELECT id,slug,destination_url,status
     FROM share_links
     WHERE status<>'DELETED' AND (slug=$1 OR slug LIKE $2)
     ORDER BY CASE WHEN slug=$1 THEN 0 ELSE 1 END
     LIMIT 2`,
    [slug, `${slug}-%`]
  );
  const exact = result.rows.find((row) => row.slug === slug);
  if (exact) return exact;
  return result.rows.length === 1 ? result.rows[0] : null;
}

export async function reportLinkAction(formData: FormData) {
  const slug = extractSlug(cleanText(formData.get("link"), 300));
  const reason = cleanText(formData.get("reason"), 32).toUpperCase();
  const details = cleanText(formData.get("details"), 500);

  if (!slug) fail("Hãy nhập một SHARE LINK hợp lệ.");
  if (!ALLOWED_REASONS.has(reason)) fail("Lý do báo cáo không hợp lệ.");

  const link = await resolveLink(slug);
  if (!link) fail("Không tìm thấy link này hoặc alias không đủ duy nhất.");

  const h = await headers();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown").split(",")[0].trim();
  const userAgent = h.get("user-agent") || "unknown";
  const secret = process.env.ANALYTICS_HASH_SECRET || "share-link-report";
  const reporterHash = createHash("sha256").update(`${secret}|${ip}|${userAgent}`).digest("hex");

  const duplicate = await query(
    `SELECT 1 FROM link_reports
     WHERE link_id=$1 AND reporter_hash=$2 AND created_at > NOW() - INTERVAL '1 hour'
     LIMIT 1`,
    [link.id, reporterHash]
  );
  if (duplicate.rowCount) {
    redirect(`/report?success=${encodeURIComponent("Báo cáo của bạn đã được ghi nhận trước đó. Hệ thống đang theo dõi link này.")}`);
  }

  const assessment = await scanAndPersistLinkRisk(link.id, link.destination_url, "REPORT");
  await query(
    `INSERT INTO link_reports (link_id,reporter_hash,reason,details,auto_state,auto_score)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [link.id, reporterHash, reason, details || null, assessment.state, assessment.score]
  );

  const reports = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT reporter_hash)::text count
     FROM link_reports
     WHERE link_id=$1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [link.id]
  );
  const uniqueReporters = Number(reports.rows[0]?.count || 0);
  await applyReportSignal(link.id, uniqueReporters);

  redirect(`/report?success=${encodeURIComponent("Đã nhận báo cáo. SHARE LINK vừa tự động quét lại website đích.")}`);
}
