import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StoryCard } from "@/components/story-card";
import { getIssue, listIssues, withLayout, formatIssueDate } from "@/lib/signals";
import { SIGNALS_BRAND } from "@/lib/site";

export function generateStaticParams() {
  return listIssues().map((i) => ({ date: i.date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const issue = getIssue(date);
  if (!issue) return { title: "AI Signals" };
  return {
    title: issue.title,
    description: issue.dek || issue.headline,
    openGraph: { title: issue.title, description: issue.dek || issue.headline },
  };
}

export default async function SignalIssuePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const issue = getIssue(date);
  if (!issue) notFound();
  const stories = withLayout(issue.stories);

  return (
    <>
      <SiteNav />
      <main className="pt-14">
        {/* Hero */}
        <section className="fl-container pt-16 pb-10">
          <div className="flex items-center gap-2">
            <span className="pulse-dot" aria-hidden />
            <span className="eyebrow">Inbound Signal{issue.reviewedAt ? ` // Reviewed ${issue.reviewedAt}` : ""}</span>
          </div>
          <h1
            className="mt-5 max-w-3xl font-semibold tracking-tight text-balance"
            style={{ fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
          >
            {issue.headline}
          </h1>
          {issue.dek && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--on-surface-variant)]">{issue.dek}</p>}

          <div className="mono mt-8 flex flex-wrap gap-x-8 gap-y-2 text-[12px] text-[var(--on-surface-variant)]">
            <span><span className="text-[var(--primary-container)]">DATE</span> &nbsp;{formatIssueDate(issue.date)}</span>
            {issue.sources.length > 0 && (
              <span><span className="text-[var(--primary-container)]">SOURCES</span> &nbsp;{issue.sources.join(", ")}</span>
            )}
            <span><span className="text-[var(--primary-container)]">READ</span> &nbsp;{issue.readingTime}</span>
          </div>
        </section>

        {/* Context bar */}
        <section className="fl-container">
          <div className="fl-card flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-[14px] text-[var(--on-surface)]">
              These are decisions your competitors are making this week.
            </p>
            <div className="mono flex items-center gap-4 text-[11px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">
              <span className="flex items-center gap-2"><span className="pulse-dot" aria-hidden /> Live feed</span>
              <span>{stories.length} stories</span>
            </div>
          </div>
        </section>

        {/* Story grid */}
        <section className="fl-container py-10">
          <div className="fl-grid-12">
            {stories.map((s, i) => (
              <StoryCard key={i} story={s} />
            ))}
          </div>
        </section>

        {/* Next step CTA */}
        <section className="fl-container pb-20">
          <div className="fl-card p-8 md:p-10">
            <span className="eyebrow">Next Step</span>
            <h2 className="mt-3 max-w-2xl text-[26px] font-semibold leading-tight md:text-[30px]">
              Stop decoding the headlines on your own.
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--on-surface-variant)]">
              A 60-minute AI opportunity review: a ranked list of where AI moves your bottom line,
              a vendor-agnostic architecture read, and an ROI model for your highest-impact use case.
              You leave with the plan whether or not we work together.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="mono rounded-sm px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] transition hover:opacity-90"
                style={{ background: "var(--primary-container)" }}
              >
                Request a briefing
              </Link>
              <span className="mono text-[12px] text-[var(--on-surface-variant)]">
                Typical engagement 4–6 weeks · the first one pays for itself.
              </span>
            </div>
          </div>
          <p className="mono mt-6 text-center text-[11px] text-[var(--on-surface-variant)]">
            {SIGNALS_BRAND} — compiled from public sources. Not financial advice.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
