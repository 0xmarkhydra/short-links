import { createHash, createHmac } from "node:crypto";
import { db, query } from "@/lib/db";

function detectDevice(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function detectBrowser(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "Safari";
  return "Other";
}

function detectOs(ua: string) {
  if (/iphone|ipad|ios/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function visitorHash(ip: string, ua: string) {
  const raw = `${ip}|${ua}`;
  const secret = process.env.ANALYTICS_HASH_SECRET;
  return secret
    ? createHmac("sha256", secret).update(raw).digest("hex")
    : createHash("sha256").update(raw).digest("hex");
}

export async function recordValidVisit(input: {
  linkId: string;
  ip: string;
  userAgent: string;
  country?: string | null;
  referrer?: string | null;
}) {
  const fingerprint = visitorHash(input.ip, input.userAgent);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const recent = await client.query(
      `SELECT 1 FROM visits
       WHERE link_id = $1 AND visitor_hash = $2 AND created_at > NOW() - INTERVAL '60 seconds'
       LIMIT 1`,
      [input.linkId, fingerprint]
    );
    if (recent.rowCount) {
      await client.query("COMMIT");
      return false;
    }
    await client.query(
      `INSERT INTO visits (link_id, visitor_hash, user_agent, device, browser, os, country, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        input.linkId,
        fingerprint,
        input.userAgent.slice(0, 1000),
        detectDevice(input.userAgent),
        detectBrowser(input.userAgent),
        detectOs(input.userAgent),
        input.country?.slice(0, 8) || null,
        input.referrer?.slice(0, 500) || null
      ]
    );
    await client.query(`UPDATE share_links SET visit_count = visit_count + 1 WHERE id = $1`, [input.linkId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to record visit", error instanceof Error ? error.message : "unknown error");
    return false;
  } finally {
    client.release();
  }
}

export async function cleanupExpiredSessions() {
  await query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
}
