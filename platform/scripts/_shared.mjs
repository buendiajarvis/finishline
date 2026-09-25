/**
 * Shared helpers for the standalone engine scripts (plain node, no Next runtime).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Load .env.local into process.env (without overriding already-set vars). */
export function loadEnv() {
  const envPath = join(appRoot, ".env.local");
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq < 0) out[a.slice(2)] = true;
    else out[a.slice(2, eq)] = a.slice(eq + 1);
  }
  return out;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function harvestSources(steps) {
  const urls = new Set();
  for (const step of steps ?? []) {
    for (const tr of step.toolResults ?? []) {
      const out = tr.output;
      if (!Array.isArray(out)) continue;
      for (const item of out) {
        if (item && typeof item.url === "string") urls.add(item.url);
      }
    }
  }
  return [...urls];
}
