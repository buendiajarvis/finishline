"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STAGES = ["new", "contacted", "replied", "call_booked", "proposal", "won", "lost"] as const;
type Stage = (typeof STAGES)[number];
const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  call_booked: "Call booked",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

type Source = "outbound" | "inbound_assessment" | "inbound_contact";
const SOURCE_LABELS: Record<Source, string> = {
  outbound: "Outbound",
  inbound_assessment: "Inbound · Assessment",
  inbound_contact: "Inbound · Contact",
};

type Activity = { at: string; kind: string; detail: string };
type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  industry: string | null;
  website: string | null;
  source: Source;
  stage: Stage;
  score: number | null;
  signals: string[];
  aiOpportunity: string | null;
  notes: string;
  draft: { subject: string; body: string; generatedAt: string } | null;
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
};
type Stats = { total: number; byStage: Record<Stage, number>; bySource: Record<Source, number> };

const TOKEN_KEY = "finishline_crm_token";

export function CrmClient() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsToken, setNeedsToken] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [emailEdit, setEmailEdit] = useState("");
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addCompany, setAddCompany] = useState("");
  // Lead-gen agent panel
  const [genOpen, setGenOpen] = useState(false);
  const [segment, setSegment] = useState("");
  const [genLocation, setGenLocation] = useState("");
  const [genCount, setGenCount] = useState(8);

  // localStorage isn't available during SSR, so the token must be hydrated in a
  // mount effect (lazy useState init can't read it). This is a legitimate
  // external-system sync, not a render-driven setState.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setToken(localStorage.getItem(TOKEN_KEY) ?? ""); }, []);

  const authHeaders = useCallback((): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm", { headers: authHeaders() });
      if (res.status === 401 || res.status === 503) {
        const body = await res.json().catch(() => ({}));
        setNeedsToken(true);
        setError(body?.error ?? "Authorization required");
        setContacts([]); setStats(null);
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setNeedsToken(false);
      setContacts(data.contacts);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // Fetch the CRM on mount (and when the auth token changes). Canonical
  // data-fetch effect; the setState happens inside the async load().
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function saveToken() {
    localStorage.setItem(TOKEN_KEY, tokenInput.trim());
    setToken(tokenInput.trim());
  }

  async function post(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body?.error as string) ?? `Request failed (${res.status})`);
    return body;
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Update failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function generateDraft(id: string) {
    setBusy(true); setError(null);
    try { await post({ action: "draft", id }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Draft failed"); }
    finally { setBusy(false); }
  }

  async function addContact() {
    if (!addName.trim()) return;
    setBusy(true); setError(null);
    try {
      const body = await post({ action: "add_contact", name: addName.trim(), email: addEmail.trim() || undefined, company: addCompany.trim() || undefined });
      setAddName(""); setAddEmail(""); setAddCompany(""); setAdding(false);
      await load();
      const contact = body.contact as Contact | undefined;
      if (contact?.id) { setSelectedId(contact.id); setEmailEdit(contact.email ?? ""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Add failed"); }
    finally { setBusy(false); }
  }

  async function sendOne(contact: Contact) {
    if (!contact.email || !contact.draft) return;
    if (!confirm(`Send this cold email to ${contact.email}?`)) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const body = await post({ action: "send", id: contact.id, dryRun: false });
      const r = (body.results as Array<{ ok: boolean; messageId?: string; error?: string }>)?.[0];
      setMsg(r?.ok ? `Sent to ${contact.email} (id ${r.messageId ?? "—"})` : `Send failed: ${r?.error ?? "unknown"}`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Send failed"); }
    finally { setBusy(false); }
  }

  async function generateAllDrafts() {
    if (!confirm('Generate cold-email drafts for un-drafted contacts in stage "new"? (one AI call each)')) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const body = await post({ action: "draft_all", stage: "new" });
      setMsg(body.candidates === 0 ? (body.message as string) ?? "No candidates." : `Drafted ${body.drafted} of ${body.candidates}${body.failed ? `, ${body.failed} failed` : ""}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Bulk draft failed"); }
    finally { setBusy(false); }
  }

  async function sendBatch() {
    setBusy(true); setError(null); setMsg(null);
    try {
      const dry = await post({ action: "send", stage: "new", dryRun: true });
      if (!confirm(`Send cold emails to ${dry.count} contact(s) in stage "new" (with email + draft)?`)) { setBusy(false); return; }
      const body = await post({ action: "send", stage: "new", dryRun: false });
      setMsg(`Sent ${body.sent}, failed ${body.failed}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Batch send failed"); }
    finally { setBusy(false); }
  }

  async function exportSendList() {
    setBusy(true); setMsg(null);
    try {
      const body = await post({ action: "export_send_list" });
      setMsg(`Wrote ${body.count} contact(s) to send-list.md (${body.skipped} skipped). Preview: npm run send-emails`);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Export failed"); }
    finally { setBusy(false); }
  }

  async function importProspects(csv?: string) {
    setBusy(true); setMsg(null);
    try {
      const body = await post({ action: "import_prospects", ...(csv ? { csv } : {}) });
      setMsg(`Imported ${body.imported} of ${body.rows} rows`);
      await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Import failed"); }
    finally { setBusy(false); }
  }

  async function onCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      if (!text.trim()) { setMsg("That CSV looks empty."); return; }
      await importProspects(text);
    } catch { setMsg("Couldn't read that file."); }
  }

  async function runLeadGen() {
    if (!segment.trim()) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/leadgen", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ segment: segment.trim(), location: genLocation.trim() || undefined, count: genCount, ingest: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Lead-gen failed (${res.status})`);
      setMsg(
        body.note
          ? String(body.note)
          : `Agent (${body.model}) found ${body.found} leads, added ${body.ingested} to the pipeline from ${(body.sources ?? []).length} sources.`,
      );
      setGenOpen(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Lead-gen failed"); }
    finally { setBusy(false); }
  }

  const filtered = useMemo(
    () => contacts.filter((c) => (stageFilter === "all" || c.stage === stageFilter) && (sourceFilter === "all" || c.source === sourceFilter)),
    [contacts, stageFilter, sourceFilter],
  );
  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  if (needsToken) {
    return (
      <div style={{ maxWidth: 420, margin: "120px auto", padding: 24 }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>FinishLine CRM</h1>
        <p style={{ color: MUT, fontSize: 14, marginBottom: 16 }}>{error ?? "This CRM requires an access token."}</p>
        <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="CRM access token" style={inputStyle} />
        <button onClick={saveToken} style={{ ...btnStyle, marginTop: 12, width: "100%" }}>Unlock</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1320, margin: "0 auto", color: FG }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>FinishLine CRM</h1>
          <p style={{ color: MUT, fontSize: 13, margin: "4px 0 0" }}>
            {stats ? `${stats.total} contacts · ${stats.bySource.outbound} outbound · ${stats.bySource.inbound_assessment + stats.bySource.inbound_contact} inbound` : "—"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="/compose" style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center" }} title="Open the voice/chat email composer">✉ Compose</a>
          <button onClick={() => setGenOpen((v) => !v)} style={btnStyle} disabled={busy} title="Run the managed-agent lead-gen engine">✦ Find leads</button>
          <button onClick={() => setAdding((v) => !v)} style={btnGhost} disabled={busy}>+ Add contact</button>
          <button onClick={load} style={btnGhost} disabled={busy || loading}>Refresh</button>
          <label style={{ ...btnGhost, display: "inline-flex", alignItems: "center", cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1 }} title="Import a prospects.csv">
            Import CSV
            <input type="file" accept=".csv,text/csv" onChange={onCsvFile} disabled={busy} style={{ display: "none" }} />
          </label>
          <button onClick={exportSendList} style={btnGhost} disabled={busy}>Export send list</button>
          <button onClick={generateAllDrafts} style={btnGhost} disabled={busy} title='Generate drafts for un-drafted contacts in stage "new"'>Generate drafts</button>
          <button onClick={sendBatch} style={btnStyle} disabled={busy} title='Send drafted emails to contacts in stage "new"'>Send drafted</button>
        </div>
      </div>

      {genOpen && (
        <div style={{ marginTop: 14, padding: 16, border: `1px solid ${CYAN}55`, borderRadius: 8, background: "rgba(0,240,255,0.04)" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: CYAN, marginBottom: 10 }}>Managed-agent lead-gen — finds businesses ripe for AI transformation</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
            <div><div style={miniLabel}>Segment / industry *</div><input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="e.g. dental practices, regional law firms" style={{ ...inputStyle, width: 260 }} /></div>
            <div><div style={miniLabel}>Location</div><input value={genLocation} onChange={(e) => setGenLocation(e.target.value)} placeholder="Austin, TX" style={{ ...inputStyle, width: 160 }} /></div>
            <div><div style={miniLabel}>Count</div><input type="number" min={1} max={25} value={genCount} onChange={(e) => setGenCount(Math.max(1, Math.min(25, Number(e.target.value) || 8)))} style={{ ...inputStyle, width: 80 }} /></div>
            <button onClick={runLeadGen} style={btnStyle} disabled={busy || !segment.trim()}>{busy ? "Running agent…" : "Run agent →"}</button>
            <button onClick={() => setGenOpen(false)} style={btnGhost} disabled={busy}>Cancel</button>
          </div>
          <div style={{ fontSize: 11, color: MUT, marginTop: 8 }}>The agent searches the web, scores AI-readiness, and adds the leads straight into the pipeline as outbound. May take a minute.</div>
        </div>
      )}

      {adding && (
        <div style={{ marginTop: 14, padding: 14, border: `1px solid ${BORDER}`, borderRadius: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
          <div><div style={miniLabel}>Name *</div><input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Full name" style={{ ...inputStyle, width: 180 }} /></div>
          <div><div style={miniLabel}>Email</div><input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="name@company.com" style={{ ...inputStyle, width: 220 }} /></div>
          <div><div style={miniLabel}>Company</div><input value={addCompany} onChange={(e) => setAddCompany(e.target.value)} placeholder="Company" style={{ ...inputStyle, width: 180 }} /></div>
          <button onClick={addContact} style={btnStyle} disabled={busy || !addName.trim()}>Add</button>
          <button onClick={() => setAdding(false)} style={btnGhost} disabled={busy}>Cancel</button>
        </div>
      )}

      {msg && <div style={noticeStyle}>{msg}</div>}
      {error && !needsToken && <div style={{ ...noticeStyle, background: "rgba(255,180,171,0.1)", color: "#ffb4ab", borderColor: "#ffb4ab55" }}>{error}</div>}

      {/* Stage filter chips */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap", alignItems: "center" }}>
        <Chip active={stageFilter === "all"} onClick={() => setStageFilter("all")} label={`All ${stats?.total ?? 0}`} />
        {STAGES.map((s) => <Chip key={s} active={stageFilter === s} onClick={() => setStageFilter(s)} label={`${STAGE_LABELS[s]} ${stats?.byStage[s] ?? 0}`} />)}
        <span style={{ flex: 1 }} />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as Source | "all")} style={selectStyle}>
          <option value="all">All sources</option>
          <option value="outbound">Outbound</option>
          <option value="inbound_assessment">Inbound · Assessment</option>
          <option value="inbound_contact">Inbound · Contact</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20 }}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: CARD, textAlign: "left" }}>
                <th style={th}>Name</th><th style={th}>Source</th><th style={th}>Company</th><th style={th}>Readiness</th><th style={th}>Stage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={td} colSpan={5}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td style={td} colSpan={5}>No contacts. Run the lead-gen agent, import a CSV, or wait for inbound leads.</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} onClick={() => { setSelectedId(c.id); setNote(""); setEmailEdit(c.email ?? ""); }} style={{ cursor: "pointer", background: c.id === selectedId ? "rgba(0,240,255,0.06)" : "transparent", borderTop: `1px solid ${BORDER}` }}>
                    <td style={td}><strong>{c.name}</strong>{c.email ? <div style={{ color: MUT, fontSize: 11 }}>{c.email}</div> : null}</td>
                    <td style={td}><span style={badge(c.source)}>{SOURCE_LABELS[c.source]}</span></td>
                    <td style={td}>{c.company ?? "—"}</td>
                    <td style={td}>{c.score != null ? `${c.score}/100` : "—"}</td>
                    <td style={td} onClick={(e) => e.stopPropagation()}>
                      <select value={c.stage} disabled={busy} onChange={(e) => patch(c.id, { stage: e.target.value as Stage })} style={selectStyle}>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18, height: "fit-content", position: "sticky", top: 20, background: CARD }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <h2 style={{ fontSize: 17, margin: 0 }}>{selected.name}</h2>
              <button onClick={() => setSelectedId(null)} style={{ ...btnGhost, padding: "2px 8px" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: MUT, marginTop: 6 }}>{SOURCE_LABELS[selected.source]}{selected.company ? ` · ${selected.company}` : ""}</div>

            <div style={{ margin: "14px 0" }}>
              <div style={miniLabel}>Email {selected.email ? "" : "(needed to send)"}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="email" value={emailEdit} onChange={(e) => setEmailEdit(e.target.value)} placeholder="name@company.com" style={{ ...inputStyle, flex: 1 }} />
                <button disabled={busy || emailEdit.trim() === (selected.email ?? "")} onClick={() => patch(selected.id, { email: emailEdit.trim() })} style={btnStyle}>Save</button>
              </div>
            </div>

            <dl style={{ fontSize: 13, margin: "10px 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 10px" }}>
              {selected.title && (<><dt style={dt}>Role</dt><dd style={dd}>{selected.title}</dd></>)}
              {selected.website && (<><dt style={dt}>Site</dt><dd style={dd}><a href={selected.website.startsWith("http") ? selected.website : `https://${selected.website}`} target="_blank" rel="noopener noreferrer" style={{ color: CYAN }}>{selected.website}</a></dd></>)}
              {selected.location && (<><dt style={dt}>Location</dt><dd style={dd}>{selected.location}</dd></>)}
              {selected.industry && (<><dt style={dt}>Industry</dt><dd style={dd}>{selected.industry}</dd></>)}
              {selected.score != null && (<><dt style={dt}>Readiness</dt><dd style={dd}>{selected.score}/100</dd></>)}
            </dl>

            {selected.aiOpportunity && (
              <div style={{ margin: "12px 0", padding: 10, border: `1px solid ${CYAN}33`, borderRadius: 6, background: "rgba(0,240,255,0.04)" }}>
                <div style={{ ...miniLabel, color: CYAN }}>AI opportunity</div>
                <div style={{ fontSize: 13, color: FG }}>{selected.aiOpportunity}</div>
              </div>
            )}
            {selected.signals.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={miniLabel}>Readiness signals</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selected.signals.map((s, i) => <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: SC, color: MUT }}>{s}</span>)}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={miniLabel}>Stage</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STAGES.map((s) => <button key={s} disabled={busy || s === selected.stage} onClick={() => patch(selected.id, { stage: s })} style={s === selected.stage ? btnStyle : btnGhost}>{STAGE_LABELS[s]}</button>)}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={miniLabel}>Cold email draft</span>
                <button disabled={busy} onClick={() => generateDraft(selected.id)} style={btnGhost}>{selected.draft ? "Regenerate" : "Generate draft"}</button>
              </div>
              {selected.draft ? (
                <>
                  <div style={{ background: SC, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{selected.draft.subject}</div>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: 0, fontFamily: "inherit", color: MUT }}>{selected.draft.body}</pre>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {selected.email ? <button onClick={() => sendOne(selected)} style={btnStyle} disabled={busy}>Send email →</button> : <span style={{ fontSize: 12, color: "#f5c97d" }}>Add an email above to enable sending.</span>}
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: MUT }}>No draft yet. Generate one, add an email, then send.</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={miniLabel}>Notes</div>
              {selected.notes ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: SC, padding: 10, borderRadius: 6, margin: 0, color: MUT }}>{selected.notes}</pre> : <div style={{ fontSize: 12, color: MUT }}>No notes yet.</div>}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={2} style={{ ...inputStyle, marginTop: 8, resize: "vertical" }} />
              <button disabled={busy || !note.trim()} onClick={async () => { await patch(selected.id, { note }); setNote(""); }} style={{ ...btnStyle, marginTop: 6 }}>Save note</button>
            </div>

            <div>
              <div style={miniLabel}>Activity</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
                {[...selected.activity].reverse().slice(0, 8).map((a, i) => (
                  <li key={i} style={{ padding: "4px 0", borderTop: i ? `1px solid ${BORDER}` : "none", color: MUT }}>
                    <span style={{ color: "#6b7793" }}>{new Date(a.at).toLocaleString()}</span> — {a.detail}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active ? `1px solid ${CYAN}` : `1px solid ${BORDER}`, background: active ? CYAN : "transparent", color: active ? "#00282b" : MUT }}>{label}</button>
  );
}

// ── Dark theme palette (matches FinishLine tokens) ──
const FG = "#dce1fb";
const MUT = "#b9cacb";
const CARD = "#151b2d";
const SC = "#191f31";
const BORDER = "#3b494b";
const CYAN = "#00f0ff";

const th: React.CSSProperties = { padding: "10px 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: MUT, fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const dt: React.CSSProperties = { color: MUT };
const dd: React.CSSProperties = { margin: 0 };
const miniLabel: React.CSSProperties = { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: MUT, marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", background: "#0c1324", color: FG };
const selectStyle: React.CSSProperties = { padding: "5px 8px", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 12, background: "#0c1324", color: FG };
const btnStyle: React.CSSProperties = { padding: "6px 12px", background: CYAN, color: "#00282b", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 };
const btnGhost: React.CSSProperties = { padding: "6px 12px", background: "transparent", color: FG, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 12, cursor: "pointer" };
const noticeStyle: React.CSSProperties = { marginTop: 14, padding: "8px 12px", background: "rgba(0,240,255,0.08)", color: "#7df4ff", border: `1px solid ${CYAN}33`, borderRadius: 6, fontSize: 13 };

function badge(source: Source): React.CSSProperties {
  const map: Record<Source, string> = { outbound: "#00f0ff", inbound_assessment: "#b7c8e1", inbound_contact: "#7df4ff" };
  return { fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${map[source]}22`, color: map[source], whiteSpace: "nowrap" };
}
