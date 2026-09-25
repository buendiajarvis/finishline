"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SCOPES = [
  { value: "", label: "What do you need? (optional)" },
  { value: "ai_readiness", label: "AI readiness" },
  { value: "cyber_insurance", label: "Cyber-insurance readiness" },
  { value: "fractional_it", label: "Fractional IT" },
  { value: "support", label: "Something is broken now" },
];

const TIMELINES = [
  { value: "", label: "Timeline (optional)" },
  { value: "immediate", label: "Immediate" },
  { value: "this_quarter", label: "This quarter" },
  { value: "next_quarter", label: "Next quarter" },
  { value: "exploring", label: "Just exploring" },
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-[var(--surface-container-low)] px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "contact" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Something went wrong (${res.status})`);
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send. Email phil@finishlinemsp.com.");
    }
  }

  if (status === "sent") {
    return (
      <div className="fl-card p-8">
        <span className="eyebrow">Received</span>
        <h2 className="mt-3 text-[24px] font-semibold text-[var(--on-surface)]">Briefing request received.</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--on-surface-variant)]">
          Phil will reply from phil@finishlinemsp.com within one business day to schedule your
          60-minute AI opportunity review. No prep needed — just bring your biggest operational headache.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="fl-card grid gap-4 p-8">
      {/* Honeypot: hidden from humans, bots fill it. */}
      <input type="text" name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work email *</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" placeholder="Company name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="title">Role</Label>
          <Input id="title" name="title" placeholder="CEO, Owner, COO…" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" placeholder="e.g. logistics, dental, legal" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="scope">Scope</Label>
          <select id="scope" name="scope" className={selectClass} defaultValue="">
            {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="timeline">Timeline</Label>
        <select id="timeline" name="timeline" className={selectClass} defaultValue="">
          {TIMELINES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="message">What should we help you solve?</Label>
        <Textarea id="message" name="message" rows={4} placeholder="A sentence or two is plenty." />
      </div>

      {error && <p className="text-[13px] text-[var(--error,#ffb4ab)]">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mono w-fit rounded-sm px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--primary-container)" }}
      >
        {status === "sending" ? "Sending…" : "Request briefing"}
      </button>
    </form>
  );
}
