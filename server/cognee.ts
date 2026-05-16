// Thin client for the cognee_sidecar FastAPI service. Every call has a short
// timeout and a soft failure mode: if the sidecar is down, unreachable, or
// still warming up, we log once and return null/empty so the caller can fall
// back to the existing prompt-only behavior. The game never breaks because
// cognee is offline.

import type {
  AssumptionEntry,
  WikiSectionId,
  WorldReaction,
} from "./types";

const SIDECAR_URL =
  process.env.COGNEE_SIDECAR_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:5182";

const DEFAULT_TIMEOUT_MS = 6000;
const INGEST_TIMEOUT_MS = 45000; // first cognify call can be slow on cold cache

let lastWarnAt = 0;

function softWarn(label: string, err: unknown): void {
  const now = Date.now();
  if (now - lastWarnAt < 30_000) return;
  lastWarnAt = now;
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[cognee] ${label}: ${msg.slice(0, 160)}`);
}

async function call<T>(
  path: string,
  body: unknown | undefined,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SIDECAR_URL}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      softWarn(`${path} ${res.status}`, await res.text().catch(() => ""));
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    softWarn(path, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface IngestPayload {
  round: number;
  event_title: string;
  event_date: string;
  event_blurb?: string;
  action_label: string;
  posture: string;
  company_name?: string;
  world_reaction: WorldReaction;
  new_assumptions?: AssumptionEntry[];
  wiki_patches?: { id: WikiSectionId; appendBody: string }[];
  game_id?: number;
  custom_move?: string;
}

// Fire-and-forget — never blocks the resolve response.
export function ingestRound(payload: IngestPayload): void {
  void call<{ ok: boolean; ingested: number }>(
    "/memory/ingest",
    payload,
    INGEST_TIMEOUT_MS,
  );
}

export interface PostMortemPayload {
  game_id: number;
  outcome: "dead" | "won";
  rounds_survived: number;
  headline: string;
  root_cause_chain: string[];
  what_killed_us?: string;
  what_saved_us?: string;
  key_lessons: string[];
  compounds_that_would_have_worked: { move: string; why: string }[];
  final_cash: number;
  final_runway: number;
  company_name?: string;
}

export async function ingestPostMortem(
  payload: PostMortemPayload,
): Promise<boolean> {
  const out = await call<{ ok: boolean }>(
    "/memory/postmortem",
    payload,
    INGEST_TIMEOUT_MS,
  );
  return out?.ok === true;
}

export async function queryMemory(
  query: string,
  limit = 5,
): Promise<string[]> {
  const out = await call<{ ok: boolean; results: string[] }>("/memory/query", {
    query,
    limit,
  });
  return out?.results ?? [];
}

export async function auditMemory(): Promise<string[]> {
  const out = await call<{ ok: boolean; findings: string[] }>(
    "/memory/audit",
    {},
  );
  return out?.findings ?? [];
}

export interface MemoryStats {
  ok: boolean;
  ready: boolean;
  ingested: number;
  bytes: number;
  last_error: string | null;
}

export async function memoryStats(): Promise<MemoryStats | null> {
  return call<MemoryStats>("/memory/stats", undefined);
}

export async function resetMemory(): Promise<boolean> {
  const out = await call<{ ok: boolean }>("/memory/reset", {});
  return out?.ok === true;
}
