"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TicketForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);

  // Move focus to the confirmation when it appears so keyboard/screen-reader
  // users get the "received / 15 minutes" feedback (the live region announces it).
  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? `Something went wrong (${res.status})`);
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not submit. Please email phil@finishlinemsp.com.");
    }
  }

  if (status === "sent") {
    return (
      <div className="fl-card p-8" role="status" aria-live="polite" tabIndex={-1} ref={successRef}>
        <div className="flex items-center gap-2">
          <span className="pulse-dot" aria-hidden />
          <span className="eyebrow">Ticket received</span>
        </div>
        <h2 className="mt-3 text-[24px] font-semibold text-[var(--on-surface)]">Thank you — we&apos;re on it.</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--on-surface-variant)]">
          A FinishLine engineer will contact you{" "}
          <strong className="text-[var(--primary-container)]">within 15 minutes</strong> at the email and phone number
          you provided. Keep an eye on your inbox and phone — if it&apos;s urgent, you can also reach us directly at{" "}
          <a href="mailto:phil@finishlinemsp.com" className="text-[var(--primary-container)] hover:underline">phil@finishlinemsp.com</a>.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mono mt-6 text-[12px] uppercase tracking-[0.04em] text-[var(--primary-container)] hover:underline"
        >
          Submit another ticket
        </button>
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
          <Input id="name" name="name" required placeholder="Your name" autoComplete="name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" autoComplete="email" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="(555) 123-4567" autoComplete="tel" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="problem">What&apos;s the problem? *</Label>
        <Textarea
          id="problem"
          name="problem"
          required
          rows={5}
          placeholder="Describe the issue — which systems are affected, when it started, and any error messages."
        />
      </div>

      {error && <p role="alert" className="text-[13px] text-[var(--destructive)]">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mono w-fit rounded-sm px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--primary-container)" }}
      >
        {status === "sending" ? "Submitting…" : "Submit ticket"}
      </button>
      <p className="mono text-[11px] text-[var(--on-surface-variant)]">Average response time: under 15 minutes.</p>
    </form>
  );
}
