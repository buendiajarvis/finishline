/**
 * Central AI configuration. One required key (ANTHROPIC_API_KEY) powers the
 * content engine, the lead-gen agent, and cold-email drafting. Model IDs are
 * env-overridable so they can be retuned without code changes.
 *
 * Every AI feature has a deterministic fallback when no key is present, so the
 * platform stays usable without provider credentials.
 */

export function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Sonnet — reasoning + web search, used by the content engine + lead-gen agent. */
export function signalsModelId(): string {
  return process.env.SIGNALS_MODEL || "claude-sonnet-4-6";
}

export function leadgenModelId(): string {
  return process.env.LEADGEN_MODEL || "claude-sonnet-4-6";
}

/** Haiku — cheap, structured cold-email drafting. */
export function draftModelId(): string {
  return process.env.DRAFT_MODEL || "claude-haiku-4-5";
}
