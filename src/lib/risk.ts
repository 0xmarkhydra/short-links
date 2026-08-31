import net from "node:net";
import { query } from "@/lib/db";

export type RiskState = "UNKNOWN" | "SAFE" | "SUSPICIOUS" | "BLOCKED";
export type RiskTrigger = "CREATE" | "UPDATE" | "ACCESS" | "REPORT" | "MANUAL" | "REPORT_SIGNAL";

export type RiskAssessment = {
  state: Exclude<RiskState, "UNKNOWN">;
  score: number;
  reasons: string[];
  provider: string;
};

const RISK_TTL_MS = 12 * 60 * 60 * 1000;
const GOOGLE_WEB_RISK_ENDPOINT = "https://webrisk.googleapis.com/v1/uris:search";

const SUSPICIOUS_TOKENS = [
  "verify", "verification", "secure", "security", "login", "signin", "account",
  "wallet", "seed", "recovery", "claim", "airdrop", "giveaway", "bonus",
  "banking", "password", "unlock", "confirm", "support", "update"
];

const KNOWN_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rebrand.ly", "shorturl.at", "rb.gy"
]);

function addReason(reasons: string[], reason: string) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function heuristicRisk(destinationUrl: string) {
  const reasons: string[] = [];
  let score = 0;
  let parsed: URL;

  try {
    parsed = new URL(destinationUrl);
  } catch {
    return { score: 100, reasons: ["URL không hợp lệ"] };
  }

  const host = parsed.hostname.toLowerCase();
  const full = `${host}${parsed.pathname}${parsed.search}`.toLowerCase();
  const labels = host.split(".").filter(Boolean);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    score += 100;
    addReason(reasons, "Giao thức URL không được hỗ trợ");
  }

  if (parsed.username || parsed.password) {
    score += 80;
    addReason(reasons, "URL chứa thông tin đăng nhập nhúng");
  }

  if (net.isIP(host)) {
    score += 25;
    addReason(reasons, "Website đích sử dụng địa chỉ IP thay vì tên miền");
  }

  if (host.includes("xn--")) {
    score += 25;
    addReason(reasons, "Tên miền dùng punycode và cần kiểm tra giả mạo ký tự");
  }

  if (labels.length >= 6) {
    score += 12;
    addReason(reasons, "Tên miền có quá nhiều tầng subdomain");
  }

  if (host.length > 55) {
    score += 10;
    addReason(reasons, "Tên miền dài bất thường");
  }

  const hyphenCount = (host.match(/-/g) || []).length;
  if (hyphenCount >= 4) {
    score += 10;
    addReason(reasons, "Tên miền chứa nhiều dấu gạch nối");
  }

  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    score += 12;
    addReason(reasons, "Website đích sử dụng cổng mạng không phổ biến");
  }

  if (parsed.pathname.length > 180) {
    score += 10;
    addReason(reasons, "Đường dẫn URL dài bất thường");
  }

  const queryCount = Array.from(parsed.searchParams.keys()).length;
  if (queryCount > 12) {
    score += 8;
    addReason(reasons, "URL chứa quá nhiều tham số truy vấn");
  }

  const matchedTokens = SUSPICIOUS_TOKENS.filter((token) => full.includes(token));
  if (matchedTokens.length >= 2) {
    score += Math.min(24, matchedTokens.length * 6);
    addReason(reasons, `URL chứa nhiều từ khóa nhạy cảm: ${matchedTokens.slice(0, 4).join(", ")}`);
  }

  if (KNOWN_SHORTENERS.has(host)) {
    score += 18;
    addReason(reasons, "URL đích tiếp tục đi qua một dịch vụ rút gọn khác");
  }

  const ownHost = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").hostname.toLowerCase(); }
    catch { return ""; }
  })();
  if (ownHost && host === ownHost && parsed.pathname.startsWith("/s/")) {
    score += 45;
    addReason(reasons, "Phát hiện chuỗi Share Link lồng nhau");
  }

  return { score: Math.min(score, 79), reasons };
}

async function googleWebRisk(destinationUrl: string) {
  const apiKey = process.env.GOOGLE_WEB_RISK_API_KEY?.trim();
  if (!apiKey) return { enabled: false, threats: [] as string[] };

  const params = new URLSearchParams();
  params.append("threatTypes", "MALWARE");
  params.append("threatTypes", "SOCIAL_ENGINEERING");
  params.append("threatTypes", "UNWANTED_SOFTWARE");
  params.set("uri", destinationUrl);
  params.set("key", apiKey);

  try {
    const response = await fetch(`${GOOGLE_WEB_RISK_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
      headers: { accept: "application/json" }
    });
    if (!response.ok) return { enabled: true, threats: [] as string[], unavailable: true };
    const body = await response.json() as { threat?: { threatTypes?: string[] } };
    return { enabled: true, threats: body.threat?.threatTypes ?? [] };
  } catch {
    return { enabled: true, threats: [] as string[], unavailable: true };
  }
}

export async function assessDestinationRisk(destinationUrl: string): Promise<RiskAssessment> {
  const heuristic = heuristicRisk(destinationUrl);
  const webRisk = await googleWebRisk(destinationUrl);
  const reasons = [...heuristic.reasons];

  if (webRisk.threats.length) {
    for (const threat of webRisk.threats) addReason(reasons, `Google Web Risk: ${threat}`);
    return {
      state: "BLOCKED",
      score: 100,
      reasons,
      provider: "heuristic+google-webrisk"
    };
  }

  if (webRisk.enabled && webRisk.unavailable) {
    addReason(reasons, "Google Web Risk tạm thời không phản hồi; giữ kết quả heuristic");
  }

  return {
    state: heuristic.score >= 35 ? "SUSPICIOUS" : "SAFE",
    score: heuristic.score,
    reasons,
    provider: webRisk.enabled ? "heuristic+google-webrisk" : "heuristic"
  };
}

export function riskNeedsRefresh(checkedAt: Date | string | null | undefined) {
  if (!checkedAt) return true;
  const time = new Date(checkedAt).getTime();
  return !Number.isFinite(time) || Date.now() - time > RISK_TTL_MS;
}

export async function persistRiskAssessment(
  linkId: string,
  assessment: RiskAssessment,
  trigger: RiskTrigger
) {
  await query(
    `UPDATE share_links
     SET risk_state=$1,risk_score=$2,risk_reasons=$3::jsonb,risk_provider=$4,risk_checked_at=NOW(),updated_at=NOW()
     WHERE id=$5 AND status<>'DELETED'`,
    [assessment.state, assessment.score, JSON.stringify(assessment.reasons), assessment.provider, linkId]
  );
  await query(
    `INSERT INTO link_risk_scans (link_id,trigger,state,score,reasons,provider)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
    [linkId, trigger, assessment.state, assessment.score, JSON.stringify(assessment.reasons), assessment.provider]
  );
}

export async function scanAndPersistLinkRisk(
  linkId: string,
  destinationUrl: string,
  trigger: RiskTrigger
) {
  const assessment = await assessDestinationRisk(destinationUrl);
  await persistRiskAssessment(linkId, assessment, trigger);
  return assessment;
}

export async function applyReportSignal(linkId: string, uniqueReporters24h: number) {
  if (uniqueReporters24h < 3) return null;

  const current = await query<{ risk_state: RiskState; risk_score: number; risk_reasons: string[] }>(
    `SELECT risk_state,risk_score,risk_reasons FROM share_links WHERE id=$1 AND status<>'DELETED'`,
    [linkId]
  );
  const row = current.rows[0];
  if (!row || row.risk_state === "BLOCKED") return null;

  const score = Math.max(Number(row.risk_score) || 0, Math.min(70, 35 + uniqueReporters24h * 3));
  const reasons = Array.isArray(row.risk_reasons) ? [...row.risk_reasons] : [];
  addReason(reasons, `${uniqueReporters24h} nguồn khác nhau đã báo cáo link trong 24 giờ`);
  const assessment: RiskAssessment = {
    state: "SUSPICIOUS",
    score,
    reasons,
    provider: "report-signal"
  };
  await persistRiskAssessment(linkId, assessment, "REPORT_SIGNAL");
  return assessment;
}
