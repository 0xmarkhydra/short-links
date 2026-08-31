import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — quản lý và chia sẻ liên kết`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        color: "#f7f8fb",
        background: "linear-gradient(135deg,#090a0d 0%,#10141a 58%,#1c1014 100%)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#ff3147,#ff6b79)",
            fontSize: 34,
            fontWeight: 900
          }}
        >
          ↗
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1.2 }}>{SITE_NAME}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 950 }}>
        <div style={{ color: "#ff5b6c", fontSize: 22, fontWeight: 800, letterSpacing: 2.4, marginBottom: 20 }}>
          SHARE • MANAGE • ANALYZE
        </div>
        <div style={{ fontSize: 70, lineHeight: 1.03, letterSpacing: -3.5, fontWeight: 900, marginBottom: 24 }}>
          Chia sẻ link gọn. Quản lý tập trung.
        </div>
        <div style={{ color: "#a9b1bd", fontSize: 29, lineHeight: 1.45, maxWidth: 900 }}>{SITE_DESCRIPTION}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#818b99", fontSize: 22 }}>
        <div>sharelink.codelocal.cloud</div>
        <div style={{ color: "#d8dde5" }}>Mobile-first • Analytics thật</div>
      </div>
    </div>,
    size
  );
}
