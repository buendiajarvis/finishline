import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { TicketForm } from "./ticket-form";

export const metadata: Metadata = {
  title: "Managed IT support — Submit a ticket",
  description:
    "FinishLine MSP — managed IT support for businesses. Submit a ticket and a real engineer contacts you within 15 minutes. 24/7 monitoring, security, and cloud, handled.",
};

const SERVICES = [
  { n: "01", title: "Helpdesk & support", body: "Real engineers, not a phone tree. Submit a ticket and get a human on it in minutes." },
  { n: "02", title: "Network & infrastructure", body: "Wired, wireless, firewalls, servers — monitored 24/7 and fixed before you notice." },
  { n: "03", title: "Security & backup", body: "Endpoint protection, patching, and tested backups so an incident is an inconvenience, not a crisis." },
  { n: "04", title: "Cloud & Microsoft 365", body: "Email, identity, and SaaS managed end to end — onboarding to offboarding, locked down." },
];

export default function MspPage() {
  return (
    <>
      <SiteNav cta={{ href: "#ticket", label: "Submit a ticket" }} />
      <main className="pt-14">
        {/* Hero */}
        <section className="fl-container pt-20 pb-14">
          <div className="flex items-center gap-2">
            <span className="pulse-dot" aria-hidden />
            <span className="eyebrow">Managed IT // Always On</span>
          </div>
          <h1
            className="mt-5 max-w-4xl font-semibold tracking-tight text-balance"
            style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Your IT, handled —{" "}
            <span className="text-[var(--primary-container)] glow-text">before it breaks.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-[var(--on-surface-variant)]">
            FinishLine is the managed IT partner for businesses that can&apos;t afford downtime. Monitoring,
            security, helpdesk, and cloud — one flat monthly fee, one team that owns the outcome. Something
            broken right now? Submit a ticket and a real engineer contacts you within 15 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="#ticket"
              className="mono rounded-sm px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] transition hover:opacity-90"
              style={{ background: "var(--primary-container)" }}
            >
              Submit a ticket
            </Link>
            <a
              href="mailto:phil@finishlinemsp.com"
              className="mono text-[13px] uppercase tracking-[0.04em] text-[var(--on-surface-variant)] transition hover:text-[var(--on-surface)]"
            >
              Or email support →
            </a>
          </div>

          {/* SLA / telemetry strip */}
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden border border-[var(--outline-variant)] md:grid-cols-4">
            {[
              ["15-min", "response, guaranteed"],
              ["24/7", "monitoring & alerting"],
              ["Onsite + remote", "wherever the problem is"],
              ["Flat monthly", "no surprise invoices"],
            ].map(([big, small]) => (
              <div key={big} className="bg-[var(--surface-container-low)] p-5">
                <div className="text-[20px] font-semibold text-[var(--on-surface)]">{big}</div>
                <div className="mono mt-1 text-[11px] uppercase tracking-[0.06em] text-[var(--on-surface-variant)]">{small}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="fl-container py-14">
          <span className="eyebrow">Section 01 // What we run for you</span>
          <h2 className="mt-3 max-w-2xl text-[28px] font-semibold leading-tight md:text-[34px]">
            One team for everything with a power cord.
          </h2>
          <div className="mt-10 fl-grid-12">
            {SERVICES.map((s) => (
              <div key={s.n} className="fl-card span-6 p-6 md:[grid-column:span_3]">
                <div className="mono text-[12px] text-[var(--primary-container)]">{s.n}</div>
                <h3 className="mt-2 text-[18px] font-semibold text-[var(--on-surface)]">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--on-surface-variant)]">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ticket section — the main CTA */}
        <section id="ticket" className="fl-container scroll-mt-20 py-14">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
            <div>
              <span className="eyebrow">Submit a ticket</span>
              <h2 className="mt-3 font-semibold tracking-tight" style={{ fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Something broken? Tell us what&apos;s wrong.
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-[var(--on-surface-variant)]">
                Fill this out and a FinishLine engineer contacts you{" "}
                <span className="text-[var(--primary-container)]">within 15 minutes</span>. No phone tree, no
                ticket purgatory — a real person who can actually fix it.
              </p>
              <ul className="mt-6 grid gap-3 text-[15px] text-[var(--on-surface-variant)]">
                {[
                  "A real engineer responds in under 15 minutes",
                  "We triage remotely first, dispatch onsite if needed",
                  "You get a direct line back to the person handling it",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 inline-block h-[6px] w-[6px] shrink-0" style={{ background: "var(--primary-container)" }} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <TicketForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
