export const SITE_NAME = "SHARE LINK";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sharelink.codelocal.cloud").replace(/\/$/, "");
export const SITE_DESCRIPTION = "Tạo Share Link gọn, quản lý liên kết tập trung và theo dõi lượt truy cập thật trên mọi thiết bị.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
