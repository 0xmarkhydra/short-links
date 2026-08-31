"use client";

import { useState } from "react";

export function CopyButton({ value, compact = false }: { value: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const finalValue = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    await navigator.clipboard.writeText(finalValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" className={compact ? "btn btn-ghost btn-sm" : "btn btn-primary"} onClick={copy}>
      {copied ? "Đã sao chép ✓" : compact ? "Copy" : "COPY LINK"}
    </button>
  );
}
