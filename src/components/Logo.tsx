import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="SHARE LINK">
      <span className="brand-mark" aria-hidden="true">S</span>
      <span>SHARE <strong>LINK</strong></span>
    </Link>
  );
}
