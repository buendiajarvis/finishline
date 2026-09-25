import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Start with a review",
  description: "Talk with FinishLine about AI readiness, cyber-insurance readiness, or fractional IT for your firm.",
};

export default function ContactPage() {
  return (
    <>
      <SiteNav cta={{ href: "/signals", label: "Read Signals" }} />
      <main className="pt-14">
        <section className="fl-container grid gap-10 pt-16 pb-24 md:grid-cols-[1fr_1.1fr]">
          <div>
            <span className="eyebrow">Start with a review</span>
            <h1 className="mt-4 font-semibold tracking-tight" style={{ fontSize: "clamp(30px,4.5vw,44px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Know what your firm needs next.
            </h1>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--on-surface-variant)]">
              Bring the problem that is costing your team time or creating risk. We will help you define the next practical move:
            </p>
            <ul className="mt-4 grid gap-3 text-[15px] text-[var(--on-surface-variant)]">
              {[
                "An honest read on the highest-risk gap",
                "A prioritized plan for AI, security, or support",
                "A clear next step your team can execute",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 inline-block h-[6px] w-[6px] shrink-0" style={{ background: "var(--primary-container)" }} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mono mt-8 text-[12px] text-[var(--on-surface-variant)]">
              Built for 5–30-person professional-services firms in Newport Beach and the South Bay.
            </p>
          </div>
          <ContactForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
