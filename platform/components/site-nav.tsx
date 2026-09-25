import Link from "next/link";

/** Fixed mission-control nav shared by marketing and support pages. */
export function SiteNav({ cta = { href: "/contact", label: "Start with a review" } }: { cta?: { href: string; label: string } }) {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--outline-variant)] backdrop-blur-md"
      style={{ background: "rgba(12,19,36,0.85)" }}
    >
      <div className="fl-container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span
            className="h-2 w-2"
            style={{ background: "var(--primary-container)", boxShadow: "0 0 8px rgba(0,240,255,0.6)" }}
            aria-hidden
          />
          <span className="mono text-[14px] font-medium uppercase tracking-[0.05em] text-[var(--on-surface)]">
            FinishLine
          </span>
        </Link>
        <div className="flex items-center gap-7">
          <Link href="/signals" className="mono hidden text-[13px] uppercase tracking-[0.04em] text-[var(--on-surface-variant)] transition hover:text-[var(--on-surface)] sm:inline">
            Signals
          </Link>
          <Link href="/msp" className="mono hidden text-[13px] uppercase tracking-[0.04em] text-[var(--on-surface-variant)] transition hover:text-[var(--on-surface)] lg:inline">
            Support
          </Link>
          <Link href="/#approach" className="mono hidden text-[13px] uppercase tracking-[0.04em] text-[var(--on-surface-variant)] transition hover:text-[var(--on-surface)] md:inline">
            Approach
          </Link>
          <Link
            href={cta.href}
            className="mono rounded-sm px-3 py-1.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] transition hover:opacity-90"
            style={{ background: "var(--primary-container)" }}
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </nav>
  );
}
