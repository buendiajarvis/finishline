/**
 * Daily content engine — read layer + types.
 *
 * Each "AI Signals" issue is a curated briefing for CEOs & business owners:
 * ~6 AI-adoption news items, each summarized neutrally and then translated into
 * a bottom-line implication ("why this moves your P&L"). Issues are stored as
 * JSON at content/signals/<date>.json, written by scripts/generate-signals.mjs.
 *
 * The Next app only READS issues here; generation is an operator/cron action.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type StorySize = "primary" | "secondary" | "standard";

export type Story = {
  /** Category tag: Regulation | Models | Agents | Security | Hardware | Infrastructure | ... */
  tag: string;
  /** Attribution, e.g. "The Verge — Microsoft Build". */
  source: string;
  title: string;
  /** 1–2 sentence neutral summary. */
  excerpt: string;
  /** External link to the full story. */
  url: string;
  /** The business / ROI implication — the FinishLine translation layer. */
  why: string;
  size?: StorySize;
};

export type Issue = {
  /** YYYY-MM-DD */
  date: string;
  /** Display title, e.g. "AI Signals | June 2, 2026". */
  title: string;
  /** Hero headline (one or two punchy lines). */
  headline: string;
  /** Executive-framed subtitle/dek. */
  dek: string;
  /** When the issue was compiled, e.g. "08:47 PT". */
  reviewedAt?: string;
  sources: string[];
  /** e.g. "4 min". */
  readingTime: string;
  stories: Story[];
};

const ROOT = join(process.cwd(), "content", "signals");

function coerceIssue(raw: unknown, fallbackDate: string): Issue | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const stories = Array.isArray(o.stories)
    ? (o.stories as unknown[]).map((s) => {
        const st = (s ?? {}) as Record<string, unknown>;
        return {
          tag: String(st.tag ?? "Signal"),
          source: String(st.source ?? ""),
          title: String(st.title ?? "Untitled"),
          excerpt: String(st.excerpt ?? ""),
          url: String(st.url ?? "#"),
          why: String(st.why ?? ""),
          size: (st.size as StorySize | undefined) ?? undefined,
        } satisfies Story;
      })
    : [];
  // Trust a valid YYYY-MM-DD in the file; otherwise fall back to the filename
  // date so a malformed in-file date can't poison links or the RSS pubDate.
  const rawDate = String(o.date ?? fallbackDate);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : fallbackDate;
  return {
    date,
    title: String(o.title ?? `AI Signals | ${date}`),
    headline: String(o.headline ?? ""),
    dek: String(o.dek ?? ""),
    reviewedAt: o.reviewedAt ? String(o.reviewedAt) : undefined,
    sources: Array.isArray(o.sources) ? (o.sources as unknown[]).map(String) : [],
    readingTime: String(o.readingTime ?? `${Math.max(2, Math.round(stories.length * 0.7))} min`),
    stories,
  };
}

export function listIssues(): Issue[] {
  let files: string[] = [];
  try {
    files = readdirSync(ROOT).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files
    .map((f) => {
      try {
        const raw = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
        return coerceIssue(raw, f.replace(/\.json$/, ""));
      } catch {
        return null;
      }
    })
    .filter((x): x is Issue => x !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getIssue(date: string): Issue | null {
  return listIssues().find((i) => i.date === date) ?? null;
}

export function latestIssue(): Issue | null {
  return listIssues()[0] ?? null;
}

/** Assign card sizes when an issue doesn't specify them: first = primary,
 *  second = secondary, rest = standard. Matches the marketing-page layout. */
export function withLayout(stories: Story[]): Story[] {
  return stories.map((s, i) => ({
    ...s,
    size: s.size ?? (i === 0 ? "primary" : i === 1 ? "secondary" : "standard"),
  }));
}

export function spanClass(size: StorySize | undefined): string {
  if (size === "primary") return "span-8";
  if (size === "secondary") return "span-4";
  return "span-6";
}

export function formatIssueDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
