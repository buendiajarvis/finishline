import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="pt-14">
        <section className="fl-container flex min-h-[60vh] flex-col items-start justify-center py-20">
          <span className="eyebrow">404 // Signal lost</span>
          <h1 className="mt-4 text-[40px] font-semibold tracking-tight">That page isn&apos;t here.</h1>
          <p className="mt-3 max-w-md text-[16px] text-[var(--on-surface-variant)]">
            The link may be old or the briefing may not exist yet.
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/" className="mono text-[13px] uppercase tracking-[0.04em] text-[var(--primary-container)] hover:underline">← Home</Link>
            <Link href="/signals" className="mono text-[13px] uppercase tracking-[0.04em] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">Latest signals →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
