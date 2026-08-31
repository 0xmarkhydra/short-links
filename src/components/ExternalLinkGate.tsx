export function ExternalLinkGate({ destinationUrl, destinationHost }: { destinationUrl: string; destinationHost: string }) {
  return <>
    <a className="btn btn-primary btn-wide btn-lg" href="#external-link-warning" role="button">
      TRUY CẬP LINK →
    </a>

    <div
      id="external-link-warning"
      className="external-gate-native"
      role="dialog"
      aria-modal="true"
      aria-labelledby="external-gate-title"
      aria-describedby="external-gate-description"
    >
      <a className="external-gate-backdrop" href="#" aria-label="Đóng cảnh báo" />
      <section className="external-gate-sheet">
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
          <a className="btn btn-secondary" href="#">Quay lại</a>
          <a className="btn btn-primary" href={destinationUrl}>Tôi hiểu, tiếp tục →</a>
        </div>
      </section>
    </div>

    <style>{`
      .external-gate-native {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .external-gate-native:target { display: flex; }
      .external-gate-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.72);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
      }
      .external-gate-sheet {
        position: relative;
        z-index: 1;
        width: min(100%, 520px);
        max-height: calc(100vh - 32px);
        max-height: calc(100dvh - 32px);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 22px;
        padding-bottom: calc(22px + env(safe-area-inset-bottom));
        border: 1px solid #2a303a;
        border-radius: 18px;
        background: #111419;
        color: #f5f7fb;
        box-shadow: 0 24px 80px rgba(0,0,0,.5);
      }
      @media (max-width: 520px) {
        .external-gate-native { align-items: flex-end; padding: 10px; }
        .external-gate-sheet { width: 100%; border-radius: 16px; padding: 18px; padding-bottom: calc(18px + env(safe-area-inset-bottom)); }
        .external-gate-actions { display: grid; grid-template-columns: 1fr; }
      }
    `}</style>
  </>;
}
