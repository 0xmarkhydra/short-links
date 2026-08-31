"use client";

import { useFormStatus } from "react-dom";

export function CreateLinkSubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary quick-create-button" type="submit" disabled={pending} aria-disabled={pending}>
    {pending ? <><span className="button-spinner" aria-hidden="true"/>Đang đọc website…</> : "Tạo link"}
  </button>;
}
