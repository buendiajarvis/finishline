"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TOKEN_KEY = "finishline_crm_token";
const FROM_KEY = "finishline_from_first";

type Draft = { to: string; subject: string; body: string };
type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; draft: Draft; grounded: boolean; sentId?: string | null }
  | { id: string; role: "system"; tone: "info" | "error"; text: string };

function genId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Mirror of lib/compose.fromFirstNameToAddress slug logic (client preview only). */
function slugFirst(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, "").replace(/^\.+|\.+$/g, "");
}

// ── Minimal Web Speech API typings (non-standard; not in lib.dom) ──
type SRAlt = { transcript: string };
type SRResult = ArrayLike<SRAlt>;
type SREvent = { results: ArrayLike<SRResult> };
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};
type SRCtor = new () => SR;

function getSRCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ComposeClient() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [needsToken, setNeedsToken] = useState(false);
  const [fromFirst, setFromFirst] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  // The draft card the user most recently created or edited — the target a
  // "refine" instruction revises (falls back to the latest draft).
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const recogRef = useRef<SR | null>(null);
  const voiceBaseRef = useRef("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Hydrate from localStorage + detect voice support (client-only).
    setToken(localStorage.getItem(TOKEN_KEY) ?? "");
    setFromFirst(localStorage.getItem(FROM_KEY) ?? "");
    setVoiceSupported(getSRCtor() !== null);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Release the microphone if the user navigates away mid-dictation.
  useEffect(
    () => () => {
      try {
        recogRef.current?.stop();
      } catch {
        /* already stopped */
      }
      recogRef.current = null;
    },
    [],
  );

  const authHeaders = useCallback(
    (): HeadersInit => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token],
  );

  const fromAddr = useMemo(() => {
    const slug = slugFirst(fromFirst);
    return slug ? `${slug}@finishlinemsp.com` : null;
  }, [fromFirst]);

  function saveToken() {
    localStorage.setItem(TOKEN_KEY, tokenInput.trim());
    setToken(tokenInput.trim());
    setNeedsToken(false);
  }

  function onFromChange(v: string) {
    setFromFirst(v);
    localStorage.setItem(FROM_KEY, v);
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setActiveDraftId(id); // edits target this card for the next refine
    setMessages((prev) => prev.map((m) => (m.id === id && m.role === "assistant" ? { ...m, draft: { ...m.draft, ...patch } } : m)));
  }

  function lastDraft(): Draft | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") return m.draft;
    }
    return null;
  }

  async function submitPrompt() {
    const prompt = input.trim();
    if (!prompt || busy) return;
    if (!fromFirst.trim()) {
      setError("Enter your first name in the From field first.");
      return;
    }
    setError(null);
    setBusy(true);
    const userMsgId = genId();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text: prompt }]);
    setInput("");
    // Refine the card the user last created/edited; otherwise the latest draft.
    const active = activeDraftId ? messages.find((m) => m.id === activeDraftId && m.role === "assistant") : null;
    const current = active && active.role === "assistant" ? active.draft : lastDraft();
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "draft", prompt, fromFirstName: fromFirst.trim(), ...(current ? { current } : {}) }),
      });
      if (res.status === 401 || res.status === 503) {
        setNeedsToken(true);
        const b = await res.json().catch(() => ({}));
        setError(b?.error ?? "Authorization required");
        setInput(prompt); // restore the typed prompt so it isn't lost behind the gate
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId)); // drop the orphan bubble
        return;
      }
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? `Draft failed (${res.status})`);
      const draftId = genId();
      setMessages((prev) => [...prev, { id: draftId, role: "assistant", draft: b.draft as Draft, grounded: Boolean(b.grounded), sentId: null }]);
      setActiveDraftId(draftId);
    } catch (e) {
      setMessages((prev) => [...prev, { id: genId(), role: "system", tone: "error", text: e instanceof Error ? e.message : "Draft failed" }]);
    } finally {
      setBusy(false);
    }
  }

  async function sendDraft(id: string) {
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.role !== "assistant") return;
    const { to, subject, body } = msg.draft;
    if (!to.trim() || !/.+@.+\..+/.test(to)) {
      setError("Add a valid recipient email before sending.");
      return;
    }
    if (!confirm(`Send this email from ${fromAddr} to ${to}?`)) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "send", to: to.trim(), subject, body, fromFirstName: fromFirst.trim() }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? `Send failed (${res.status})`);
      setMessages((prev) =>
        prev.map((m) => (m.id === id && m.role === "assistant" ? { ...m, sentId: (b.id as string) ?? "sent" } : m)).concat({
          id: genId(),
          role: "system",
          tone: "info",
          text: `Sent to ${to} from ${b.from ?? fromAddr} (id ${b.id ?? "—"}).`,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleVoice() {
    if (listening) {
      try {
        recogRef.current?.stop();
      } catch {
        /* already stopped */
      }
      recogRef.current = null;
      setListening(false);
      return;
    }
    const Ctor = getSRCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    voiceBaseRef.current = input ? input + " " : "";
    r.onresult = (e: SREvent) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0]?.transcript ?? "";
      setInput(voiceBaseRef.current + transcript);
    };
    r.onerror = () => {
      setListening(false);
      recogRef.current = null;
    };
    r.onend = () => {
      setListening(false);
      recogRef.current = null;
    };
    recogRef.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      setListening(false);
    }
  }

  if (needsToken) {
    return (
      <div className="mx-auto mt-32 max-w-sm px-6">
        <h1 className="text-[20px] font-semibold">FinishLine Composer</h1>
        <p className="mt-2 text-[14px] text-[var(--on-surface-variant)]">{error ?? "This tool requires an access token."}</p>
        <Input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="CRM access token" className="mt-4" />
        <button onClick={saveToken} className="mono mt-3 w-full rounded-sm px-4 py-2 text-[13px] font-medium uppercase text-[var(--on-primary)]" style={{ background: "var(--primary-container)" }}>
          Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 pt-6 pb-4">
      {/* Header + From */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--outline-variant)] pb-4">
        <div>
          <h1 className="text-[20px] font-semibold">Composer</h1>
          <p className="mono mt-1 text-[11px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">
            Speak or type your intent · the agent drafts · you send
          </p>
        </div>
        <Link href="/crm" className="mono text-[12px] uppercase tracking-[0.04em] text-[var(--primary-container)] hover:underline">
          → CRM
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="mono text-[11px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">From</label>
        <Input value={fromFirst} onChange={(e) => onFromChange(e.target.value)} placeholder="First name" className="h-9 w-40" />
        <span className="mono text-[13px] text-[var(--on-surface-variant)]">
          {fromAddr ? <>→ <span className="text-[var(--primary-container)]">{fromAddr}</span></> : "→ name@finishlinemsp.com"}
        </span>
      </div>

      {/* Transcript */}
      <div className="mt-5 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="fl-card p-6 text-[14px] leading-relaxed text-[var(--on-surface-variant)]">
            <div className="eyebrow mb-2">Try</div>
            “Email jordan@northwind.co — follow up on our demo last week, ask if Tuesday or Thursday works for a 30-minute call, keep it short.”
            <div className="mt-3 text-[12px]">The agent extracts the recipient, drafts the email (grounded in their website when it can), and you review &amp; send.</div>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-md bg-[var(--surface-container-high)] px-4 py-2.5 text-[14px] text-[var(--on-surface)]">{m.text}</div>
            </div>
          ) : m.role === "system" ? (
            <div
              key={m.id}
              className="mono rounded-sm border px-3 py-2 text-[12px]"
              style={
                m.tone === "error"
                  ? { borderColor: "#ffb4ab55", background: "rgba(255,180,171,0.08)", color: "#ffb4ab" }
                  : { borderColor: "#00f0ff33", background: "rgba(0,240,255,0.06)", color: "#7df4ff" }
              }
            >
              {m.text}
            </div>
          ) : (
            <DraftCard key={m.id} msg={m} fromAddr={fromAddr} busy={busy} onChange={(p) => updateDraft(m.id, p)} onSend={() => sendDraft(m.id)} />
          ),
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="mono mt-2 text-[12px]" style={{ color: "#ffb4ab" }}>{error}</div>}

      {/* Composer */}
      <div className="mt-3 flex items-end gap-2 border-t border-[var(--outline-variant)] pt-3">
        {voiceSupported && (
          <button
            onClick={toggleVoice}
            disabled={busy}
            aria-label={listening ? "Stop dictation" : "Start dictation"}
            title={listening ? "Stop dictation" : "Dictate"}
            aria-pressed={listening}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-[16px]"
            style={listening ? { borderColor: "#00f0ff", background: "rgba(0,240,255,0.12)", color: "#00f0ff" } : { borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
          >
            <span aria-hidden="true">{listening ? "■" : "🎤"}</span>
          </button>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitPrompt();
            }
          }}
          placeholder={listening ? "Listening… speak your intent" : "Tell the agent who to email and why (⌘/Ctrl+Enter to send)"}
          rows={2}
          className="flex-1 resize-none"
        />
        <button
          onClick={submitPrompt}
          disabled={busy || !input.trim()}
          className="mono h-10 shrink-0 rounded-md px-4 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] disabled:opacity-50"
          style={{ background: "var(--primary-container)" }}
        >
          {busy ? "…" : "Draft"}
        </button>
      </div>
    </div>
  );
}

function DraftCard({
  msg,
  fromAddr,
  busy,
  onChange,
  onSend,
}: {
  msg: Extract<Msg, { role: "assistant" }>;
  fromAddr: string | null;
  busy: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onSend: () => void;
}) {
  const sent = Boolean(msg.sentId);
  return (
    <div className="fl-card p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{sent ? "Sent" : "Draft"}{msg.grounded ? " · website-grounded" : ""}</span>
        <span className="mono text-[11px] text-[var(--on-surface-variant)]">from {fromAddr ?? "—"}</span>
      </div>
      <div className="mt-3 grid gap-2">
        <label className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">To</label>
        <Input value={msg.draft.to} onChange={(e) => onChange({ to: e.target.value })} placeholder="recipient@company.com" disabled={sent} />
        <label className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">Subject</label>
        <Input value={msg.draft.subject} onChange={(e) => onChange({ subject: e.target.value })} disabled={sent} />
        <label className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">Body</label>
        <Textarea value={msg.draft.body} onChange={(e) => onChange({ body: e.target.value })} rows={9} disabled={sent} className="resize-y" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        {sent ? (
          <span className="mono text-[12px]" style={{ color: "#7df4ff" }}>✓ Sent (id {msg.sentId})</span>
        ) : (
          <button
            onClick={onSend}
            disabled={busy}
            className="mono rounded-sm px-4 py-2 text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--on-primary)] disabled:opacity-50"
            style={{ background: "var(--primary-container)" }}
          >
            Send email →
          </button>
        )}
        {!sent && <span className="mono text-[11px] text-[var(--on-surface-variant)]">Edit any field, or refine by typing another instruction below.</span>}
      </div>
    </div>
  );
}
