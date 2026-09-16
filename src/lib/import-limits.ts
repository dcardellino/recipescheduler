import { NextResponse } from "next/server";

/**
 * Limits shared by both import routes (URL and pasted text) so a household
 * can't sidestep the AI budget by switching tabs.
 */

export const AI_IMPORT_MONTHLY_LIMIT = 40;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// In-memory and therefore per-instance: a coarse abuse guard, not a hard
// quota. The monthly AI counter in Postgres is the one that has to be exact.
const hits = new Map<string, number[]>();

export function importRateLimitOk(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const prev = hits.get(userId) ?? [];
  const recent = prev.filter((t) => t > windowStart);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Versuch's in einer Minute erneut." },
    { status: 429 },
  );
}

export function aiLimitResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "KI-Import-Limit für diesen Monat erreicht. Bitte trage das Rezept manuell ein.",
      code: "ai_limit_reached",
    },
    { status: 429 },
  );
}
