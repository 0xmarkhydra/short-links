import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordValidVisit } from "@/lib/visits";
import { riskNeedsRefresh, scanAndPersistLinkRisk, type RiskState } from "@/lib/risk";

type GoLink = {
  id: string;
  slug: string;
  destination_url: string;
  status: string;
  risk_state: RiskState;
  risk_checked_at: Date | null;
};

function resolveAnonymousVisitorId(request: NextRequest) {
  const existing = request.cookies.get("sl_vid")?.value || "";
  if (/^[A-Za-z0-9_-]{16,80}$/.test(existing)) {
    return { id: existing, isNew: false };
  }
  return { id: randomUUID(), isNew: true };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,64}$/.test(slug)) return NextResponse.redirect(new URL("/", request.url));

  const result = await query<GoLink>(
    `SELECT id,slug,destination_url,status,risk_state,risk_checked_at
     FROM share_links WHERE slug=$1 AND status<>'DELETED' LIMIT 1`,
    [slug]
  );
  const link = result.rows[0];
  if (!link || link.status !== "ACTIVE") return NextResponse.redirect(new URL(`/s/${slug}`, request.url));

  let riskState = link.risk_state;
  if (riskNeedsRefresh(link.risk_checked_at)) {
    const assessment = await scanAndPersistLinkRisk(link.id, link.destination_url, "ACCESS");
    riskState = assessment.state;
  }

  if (riskState === "BLOCKED" || riskState === "UNKNOWN") {
    return NextResponse.redirect(new URL(`/s/${slug}`, request.url));
  }

  const visitor = resolveAnonymousVisitorId(request);
  const ip = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
  await recordValidVisit({
    linkId: link.id,
    ip,
    visitorId: visitor.id,
    userAgent: request.headers.get("user-agent") || "",
    country: request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry"),
    referrer: request.headers.get("referer")
  });

  const response = NextResponse.redirect(link.destination_url, 307);
  if (visitor.isNew) {
    response.cookies.set("sl_vid", visitor.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}
