import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type DestinationMetadata = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  finalUrl: string;
};

type CacheEntry = { expiresAt: number; value: DestinationMetadata | null };

const metadataCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_HTML_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 4500;
const MAX_REDIRECTS = 4;

function isUnsafeIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isUnsafeIpv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("ff")) return true;
  if (normalized.startsWith("2001:db8")) return true;
  if (normalized.startsWith("::ffff:")) return true;
  return false;
}

function isUnsafeIp(address: string) {
  const family = isIP(address);
  if (family === 4) return isUnsafeIpv4(address);
  if (family === 6) return isUnsafeIpv6(address);
  return true;
}

async function assertPublicHttpUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
  if (url.username || url.password) throw new Error("Credentials in URL are not allowed");

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private hostname is not allowed");
  }

  if (isIP(hostname)) {
    if (isUnsafeIp(hostname)) throw new Error("Private IP is not allowed");
    return url;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isUnsafeIp(address))) {
    throw new Error("Destination did not resolve to a public IP");
  }
  return url;
}

function decodeHtml(value: string | undefined | null) {
  if (!value) return null;
  const decoded = value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
  return decoded || null;
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(tag))) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function parseMetadata(html: string, finalUrl: string): DestinationMetadata {
  const metas = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    if (key && attrs.content && !metas.has(key)) metas.set(key, attrs.content);
  }

  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const title = decodeHtml(metas.get("og:title") || metas.get("twitter:title") || titleTag);
  const description = decodeHtml(
    metas.get("og:description") || metas.get("twitter:description") || metas.get("description")
  );
  const siteName = decodeHtml(metas.get("og:site_name"));
  const rawImage = decodeHtml(
    metas.get("og:image:secure_url") || metas.get("og:image") || metas.get("twitter:image") || metas.get("twitter:image:src")
  );

  let image: string | null = null;
  if (rawImage) {
    try {
      const imageUrl = new URL(rawImage, finalUrl);
      if (imageUrl.protocol === "http:" || imageUrl.protocol === "https:") image = imageUrl.toString();
    } catch {}
  }

  return { title, description, image, siteName, finalUrl };
}

async function readLimitedHtml(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let html = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      break;
    }
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

async function fetchDestinationMetadata(destinationUrl: string): Promise<DestinationMetadata | null> {
  let current = destinationUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const safeUrl = await assertPublicHttpUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(safeUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "ShareLink-MetadataBot/1.0 (+https://sharelink.codelocal.cloud)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1"
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        current = new URL(location, safeUrl).toString();
        continue;
      }

      if (!response.ok) return null;
      const contentType = response.headers.get("content-type")?.toLowerCase() || "";
      if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        return null;
      }

      const length = Number(response.headers.get("content-length") || 0);
      if (length > MAX_HTML_BYTES * 2) return null;

      const html = await readLimitedHtml(response);
      return parseMetadata(html, safeUrl.toString());
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

export async function getDestinationMetadata(destinationUrl: string) {
  const cached = metadataCache.get(destinationUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const value = await fetchDestinationMetadata(destinationUrl);
    metadataCache.set(destinationUrl, {
      value,
      expiresAt: Date.now() + (value ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS)
    });
    if (metadataCache.size > 500) metadataCache.delete(metadataCache.keys().next().value as string);
    return value;
  } catch {
    metadataCache.set(destinationUrl, { value: null, expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS });
    return null;
  }
}
