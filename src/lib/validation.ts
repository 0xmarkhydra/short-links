import { randomBytes } from "node:crypto";

const RESERVED_SLUGS = new Set([
  "admin", "api", "login", "register", "dashboard", "analytics", "profile",
  "settings", "create-link", "my-links", "terms", "privacy", "s"
]);

export function cleanText(value: FormDataEntryValue | null, max = 500) {
  return String(value ?? "").trim().replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max);
}

export function validateUsername(username: string) {
  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    return "Username phải từ 3–32 ký tự và chỉ gồm chữ, số, _, . hoặc -.";
  }
  return null;
}

export function validateEmail(email: string) {
  if (!email) return null;
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ.";
  return null;
}

export function validatePassword(password: string) {
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (password.length > 128) return "Mật khẩu quá dài.";
  return null;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function normalizeSlug(input: string) {
  const slug = slugify(input);
  if (slug.length < 3 || slug.length > 64) return { slug, error: "Slug phải từ 3–64 ký tự." };
  if (RESERVED_SLUGS.has(slug)) return { slug, error: "Slug này được hệ thống dành riêng." };
  return { slug, error: null };
}

export function randomSlugSuffix() {
  return randomBytes(3).toString("hex");
}

export function validateDestinationUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "URL chỉ được dùng http hoặc https.";
    if (url.username || url.password) return "URL không được chứa thông tin đăng nhập.";
    return null;
  } catch {
    return "URL đích không hợp lệ.";
  }
}
