import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listIssues, formatIssueDate } from "@/lib/signals";

export const metadata: Metadata = {
  title: "AI Signals",
  description:
    "FinishLine Intelligence — a running briefing on AI adoption and what each headline means for your bottom line. Built for CEOs and business owners.",
};

export default function SignalsIndexPage() {
  const issues = listIssues();
  return (
    <>
      <SiteNav />
      <main className="pt-14">
        <section className="fl-container pt-16 pb-8">
          <span className="eyebrow">FinishLine Intelligence</span>
          <h1 className="mt-4 max-w-3xl font-semibold tracking-tight" style={{ fontSize: "clamp(32px,5vw,48px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            AI Signals
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--on-surface-variant)]">
            The AI headlines that matter, translated into bottom-line decisions. Curated from public
            sources, written for executives who need to know whether to act, wait, or ignore.
          </p>
        </section>

        <section className="fl-container pb-20">
          {issues.length === 0 ? (
            <div className="fl-card p-8 text-[15px] text-[var(--on-surface-variant)]">
              No issues published yet. Generate the first one with{" "}
              <code className="mono rounded bg-[var(--surface-container)] px-1.5 py-0.5 text-[13px]">npm run signals</code>.
            </div>
          ) : (
            <div className="grid gap-4">
              {issues.map((issue) => (
                <Link key={issue.date} href={`/signals/${issue.date}`} className="fl-card block p-6 no-underline">
                  <div className="mono flex items-center gap-3 text-[11px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">
                    <span className="text-[var(--primary-container)]">{formatIssueDate(issue.date)}</span>
                    <span>·</span>
                    <span>{issue.stories.length} stories</span>
                    <span>·</span>
                    <span>{issue.readingTime}</span>
                  </div>
                  <h2 className="mt-3 text-[22px] font-semibold leading-snug text-[var(--on-surface)]">{issue.headline}</h2>
                  {issue.dek && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--on-surface-variant)]">{issue.dek}</p>}
                  <span className="mono mt-4 inline-block text-[12px] text-[var(--primary-container)]">Read the briefing →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
