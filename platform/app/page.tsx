import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const OFFERS = [
  { n: "01", title: "AI readiness", body: "Use ChatGPT, Claude, and Copilot productively without exposing client or company data.", href: "/ai-readiness", tone: "offer-cyan" },
  { n: "02", title: "Cyber-insurance readiness", body: "A fixed-price review of MFA, backups, endpoints, email, and the questionnaire in front of you.", href: "/cyber-insurance", tone: "offer-steel" },
  { n: "03", title: "Fractional IT", body: "Your first IT department for a 5–30-person firm, without adding a full-time hire.", href: "/fractional-it", tone: "offer-line" },
];

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="hero-panel">
          <div className="hero-image" aria-hidden="true" />
          <div className="fl-container hero-content">
            <div className="hero-copy">
              <div className="flex items-center gap-2"><span className="pulse-dot" aria-hidden /><span className="eyebrow">Local IT // Newport Beach + South Bay</span></div>
              <h1 className="mt-5 max-w-3xl font-semibold tracking-tight text-balance">Secure IT for firms that handle <span className="text-[var(--primary-container)] glow-text">confidential work.</span></h1>
              <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-[var(--on-surface-variant)]">FinishLine is the practical IT partner for 5–30-person professional-services firms. Microsoft 365, security, AI adoption, and support, owned by one team.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4"><Link href="/contact" className="mono cta-button" style={{ background: "var(--primary-container)" }}>Start with a review</Link><Link href="/fractional-it" className="mono secondary-link">See fractional IT <span aria-hidden>→</span></Link></div>
            </div>
          </div>
        </section>

        <section className="fl-container py-20" id="offers">
          <div className="max-w-2xl"><h2 className="text-[32px] font-semibold leading-tight md:text-[42px]">Start with the problem in front of you.</h2><p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-[var(--on-surface-variant)]">A clear first engagement, then a long-term IT partner if the fit is right.</p></div>
          <div className="offer-grid mt-10">{OFFERS.map((offer) => <Link key={offer.n} href={offer.href} className={`offer-card ${offer.tone}`}><span className="mono text-[12px] text-[var(--primary-container)]">{offer.n}</span><h3 className="mt-16 text-[24px] font-semibold text-[var(--on-surface)]">{offer.title}</h3><p className="mt-3 text-[15px] leading-relaxed text-[var(--on-surface-variant)]">{offer.body}</p><span className="mono mt-7 inline-block text-[12px] uppercase tracking-[0.04em] text-[var(--primary-container)]">Explore offer <span aria-hidden>→</span></span></Link>)}</div>
        </section>

        <section className="fl-container pb-20"><div className="proof-strip"><div><strong>5–30</strong><span>person firms</span></div><div><strong>Local</strong><span>owner-level support</span></div><div><strong>One team</strong><span>security + systems + people</span></div><div><strong>Plain English</strong><span>no fear-based sales pitch</span></div></div></section>

        <section className="fl-container pb-20"><div className="callout-panel"><div><span className="eyebrow">A better first step</span><h2 className="mt-3 max-w-2xl text-[30px] font-semibold leading-tight md:text-[38px]">Know what is exposed before it becomes urgent.</h2><p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--on-surface-variant)]">Book a working session. We will map your highest-risk gap, the next practical fix, and whether FinishLine should own it.</p></div><Link href="/contact" className="mono cta-button shrink-0" style={{ background: "var(--primary-container)" }}>Start with a review</Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
