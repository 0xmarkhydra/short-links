"use client";

import { useEffect, useState } from "react";

export function ExternalLinkGate({ destinationUrl, destinationHost }: { destinationUrl: string; destinationHost: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return <>
    <button className="btn btn-primary btn-wide btn-lg" type="button" onClick={() => setOpen(true)}>
      TRUY CẬP LINK →
    </button>

    {open && (
      <div
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "rgba(0,0,0,.72)",
          WebkitBackdropFilter: "blur(10px)",
          backdropFilter: "blur(10px)",
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="external-gate-title"
          aria-describedby="external-gate-description"
          style={{
            width: "min(100%, 520px)",
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "22px",
            paddingBottom: "calc(22px + env(safe-area-inset-bottom))",
            border: "1px solid #2a303a",
            borderRadius: "18px",
            background: "#111419",
            color: "#f5f7fb",
            boxShadow: "0 24px 80px rgba(0,0,0,.5)",
          }}
        >
          <div className="external-gate-head">
            <span className="external-gate-icon" aria-hidden="true">↗</span>
            <div>
              <small>BẠN SẮP RỜI SHARE LINK</small>
              <h2 id="external-gate-title">Tiếp tục đến website đích?</h2>
            </div>
          </div>

          <div className="external-gate-host">
            <small>Website đích</small>
            <strong>{destinationHost}</strong>
          </div>

          <p id="external-gate-description">
            SHARE LINK chỉ cung cấp liên kết trung gian và không kiểm soát nội dung, sản phẩm, giao dịch hay chính sách của website bên ngoài.
            Khi tiếp tục, bạn xác nhận đã tự kiểm tra website đích và <strong>tự chịu trách nhiệm đối với mọi quyết định, giao dịch và rủi ro phát sinh sau khi rời SHARE LINK.</strong>
          </p>

          <div className="external-gate-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>Quay lại</button>
            <a className="btn btn-primary" href={destinationUrl}>Tôi hiểu, tiếp tục →</a>
          </div>
        </section>
      </div>
    )}
  </>;
}
