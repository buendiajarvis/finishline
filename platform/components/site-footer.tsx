import Link from "next/link";
import { SIGNALS_BRAND } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--outline-variant)]">
      <div className="fl-container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2" style={{ background: "var(--primary-container)", boxShadow: "0 0 8px rgba(0,240,255,0.6)" }} aria-hidden />
            <span className="mono text-[14px] font-medium uppercase tracking-[0.05em]">FinishLine</span>
          </div>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--on-surface-variant)]">
            Practical IT for professional-services firms that handle confidential work.
            Security, Microsoft 365, AI adoption, and responsive support from one local team.
          </p>
        </div>
        <div className="text-[13px]">
          <div className="eyebrow mb-3">Intelligence</div>
          <ul className="space-y-2 text-[var(--on-surface-variant)]">
            <li><Link href="/signals" className="transition hover:text-[var(--on-surface)]">AI Signals</Link></li>
            <li><Link href="/feed.xml" className="transition hover:text-[var(--on-surface)]">RSS feed</Link></li>
          </ul>
        </div>
        <div className="text-[13px]">
          <div className="eyebrow mb-3">Company</div>
          <ul className="space-y-2 text-[var(--on-surface-variant)]">
            <li><Link href="/contact" className="transition hover:text-[var(--on-surface)]">Request a briefing</Link></li>
            <li><a href="mailto:phil@finishlinemsp.com" className="transition hover:text-[var(--on-surface)]">phil@finishlinemsp.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--outline-variant)]">
        <div className="fl-container flex items-center justify-between py-5 text-[11px] text-[var(--on-surface-variant)]">
          <span>© 2026 FinishLine. Curated from public sources. Not financial advice.</span>
          <span className="mono tracking-wider">{SIGNALS_BRAND}</span>
        </div>
      </div>
    </footer>
  );
}
