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

function isAutomatedUserAgent(ua: string) {
  return /bot|crawler|spider|preview|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|google-inspectiontool|bingpreview|zalo/i.test(ua);
}

function hashVisitorValue(value: string) {
  const secret = process.env.ANALYTICS_HASH_SECRET;
  return secret
    ? createHmac("sha256", secret).update(value).digest("hex")
    : createHash("sha256").update(value).digest("hex");
}

function resolveVisitor(input: { visitorId?: string | null; ip: string; userAgent: string }) {
  if (input.visitorId) {
    return {
      hash: hashVisitorValue(`cookie:${input.visitorId}`),
      source: "COOKIE" as const
    };
  }
  return {
    hash: hashVisitorValue(`fingerprint:${input.ip}|${input.userAgent}`),
    source: "FINGERPRINT" as const
  };
}

export async function recordValidVisit(input: {
  linkId: string;
  ip: string;
  userAgent: string;
  visitorId?: string | null;
  country?: string | null;
  referrer?: string | null;
}) {
  if (!input.userAgent || isAutomatedUserAgent(input.userAgent)) return false;

  const visitor = resolveVisitor(input);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))`,
      [input.linkId, visitor.hash]
    );
    const history = await client.query<{ seen_before: boolean; seen_recently: boolean }>(
      `SELECT
         EXISTS(SELECT 1 FROM visits WHERE link_id=$1 AND visitor_hash=$2) AS seen_before,
         EXISTS(SELECT 1 FROM visits WHERE link_id=$1 AND visitor_hash=$2 AND created_at > NOW() - INTERVAL '60 seconds') AS seen_recently`,
      [input.linkId, visitor.hash]
    );
    const seenBefore = Boolean(history.rows[0]?.seen_before);
    const seenRecently = Boolean(history.rows[0]?.seen_recently);

    if (seenRecently) {
      await client.query("COMMIT");
      return false;
    }

    await client.query(
      `INSERT INTO visits (link_id, visitor_hash, visitor_source, is_returning, user_agent, device, browser, os, country, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        input.linkId,
        visitor.hash,
        visitor.source,
        seenBefore,
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
