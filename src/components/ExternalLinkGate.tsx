"use client";

import { useEffect, useRef, useState } from "react";

export function ExternalLinkGate({ destinationUrl, destinationHost }: { destinationUrl: string; destinationHost: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
  }

  function continueToDestination() {
    window.location.assign(destinationUrl);
  }

  return <>
    <button className="btn btn-primary btn-wide btn-lg" type="button" onClick={() => setOpen(true)}>
      TRUY CẬP LINK →
    </button>
    <dialog
      ref={dialogRef}
      className="external-gate"
      aria-labelledby="external-gate-title"
      aria-describedby="external-gate-description"
      onClose={() => setOpen(false)}
      onCancel={(event) => { event.preventDefault(); close(); }}
    >
      <div className="external-gate-head">
        <span className="external-gate-icon" aria-hidden="true">↗</span>
        <div><small>BẠN SẮP RỜI SHARE LINK</small><h2 id="external-gate-title">Tiếp tục đến website đích?</h2></div>
      </div>
      <div className="external-gate-host"><small>Website đích</small><strong>{destinationHost}</strong></div>
      <p id="external-gate-description">
        SHARE LINK chỉ cung cấp liên kết trung gian và không kiểm soát nội dung, sản phẩm, giao dịch hay chính sách của website bên ngoài.
        Khi tiếp tục, bạn xác nhận đã tự kiểm tra website đích và <strong>tự chịu trách nhiệm đối với mọi quyết định, giao dịch và rủi ro phát sinh sau khi rời SHARE LINK.</strong>
      </p>
      <div className="external-gate-actions">
        <button className="btn btn-secondary" type="button" onClick={close}>Quay lại</button>
        <button className="btn btn-primary" type="button" onClick={continueToDestination}>Tôi hiểu, tiếp tục →</button>
      </div>
    </dialog>
  </>;
}
