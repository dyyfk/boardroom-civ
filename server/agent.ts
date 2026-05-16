import Anthropic from "@anthropic-ai/sdk";
import { fallbackAdvisor, fallbackLint, fallbackResolve } from "./fallback";
import {
  auditMemory,
  ingestRound,
  queryMemory,
} from "./cognee";
import type {
  ActionOption,
  AdvisorRecommendation,
  AssumptionEntry,
  CanonEvent,
  CompanyProfile,
  LintFinding,
  WikiSection,
  WikiSectionId,
  WorldReaction,
} from "./types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

export function isLive(): boolean {
  return client !== null;
}

const SYS_PROMPT = `You are the world-simulation agent for "Boardroom Civ", a turn-based startup strategy game.

Your job is to maintain a living wiki of an imaginary AI startup (Northstar Labs) and the world around it. When the player makes a decision, you:
  - simulate plausible consequences across customers, investors, regulators, competitors, and employees
  - update structured wiki pages (Company Profile, Decision Log, Assumptions, Competitors, Risks)
  - sometimes inject a chaos event the player could not have predicted

You must always respond with strict JSON matching the requested schema. No prose outside the JSON.
Keep narrative writing crisp: short sentences, specific verbs, no marketing fluff.`;

interface ResolveInput {
  event: CanonEvent;
  action: ActionOption | null;
  customMove?: string;
  posture: CompanyProfile["posture"];
  company: CompanyProfile;
  assumptions: AssumptionEntry[];
  decisionLog: { round: number; eventTitle: string; actionLabel: string; posture: string }[];
  wiki: Record<string, WikiSection>;
}

export async function agentResolve(input: ResolveInput): Promise<ResolveOutput> {
  const result = await resolveWithClient(input);
  // Fire-and-forget: ingest this round into the cognee graph so the advisor
  // and lint endpoints can recall it on later turns. The sidecar handles its
  // own errors; this never blocks the response.
  const actionLabel =
    input.action?.label ?? (input.customMove ? `Custom move: ${input.customMove}` : "—");
  ingestRound({
    round: (input.decisionLog?.length ?? 0) + 1,
    event_title: input.event.title,
    event_date: input.event.date,
    event_blurb: input.event.blurb,
    action_label: actionLabel,
    posture: input.posture,
    company_name: input.company.name,
    world_reaction: result.worldReaction,
    new_assumptions: result.newAssumptions,
    wiki_patches: result.wikiPatches,
  });
  return result;
}

interface ResolveOutput {
  worldReaction: WorldReaction;
  branchOutcomes: { id: string; label: string; status: string; detail?: string }[];
  newAssumptions: AssumptionEntry[];
  updatedAssumptionIds: { id: string; status: AssumptionEntry["status"] }[];
  wikiPatches: { id: WikiSectionId; appendBody: string }[];
}

async function resolveWithClient(input: ResolveInput): Promise<ResolveOutput> {
  if (!client) return fallbackResolve(input) as ResolveOutput;
  try {
    const user = `Round: "${input.event.title}" (${input.event.date}).
Event blurb: ${input.event.blurb}
Player chose: ${input.action ? input.action.label + " — " + input.action.oneLiner : `custom move: ${input.customMove}`}
Posture: ${input.posture}
Company snapshot: ${JSON.stringify(input.company)}
Active assumptions: ${JSON.stringify(input.assumptions)}
Prior decisions: ${JSON.stringify(input.decisionLog)}

Return JSON with shape:
{
  "worldReaction": {
    "round": 0,
    "headline": "string, one sentence",
    "customers": "string, 1-2 sentences",
    "investors": "string, 1-2 sentences",
    "regulators": "string, 1-2 sentences",
    "competitors": "string, 1-2 sentences",
    "employees": "string, 1-2 sentences",
    "chaos": null | { "id": "string", "title": "string", "detail": "string", "capitalDelta": number | undefined }
  },
  "branchOutcomes": [{ "id": "string", "label": "string", "status": "completed"|"locked"|"warning"|"chaos", "detail": "string|undefined" }],
  "newAssumptions": [{ "id": "string", "text": "string", "confidence": "high"|"medium"|"low", "source": "string", "status": "active"|"shaky"|"broken" }],
  "updatedAssumptionIds": [{ "id": "string", "status": "active"|"shaky"|"broken" }],
  "wikiPatches": [{ "id": "competitors"|"risks"|"company-profile"|"assumptions"|"canon-timeline", "appendBody": "string" }]
}
Inject chaos ~30% of the time. Keep wikiPatches short — 1-2 sentences each.`;

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYS_PROMPT,
      messages: [{ role: "user", content: user }],
    });
    return (parseJson<ResolveOutput>(res) ?? (fallbackResolve(input) as ResolveOutput));
  } catch (err) {
    console.error("agentResolve fell back:", err);
    return fallbackResolve(input) as ResolveOutput;
  }
}

interface AdvisorInput {
  event: CanonEvent;
  options: ActionOption[];
  company: CompanyProfile;
  assumptions: AssumptionEntry[];
  decisionLog: { round: number; eventTitle: string; actionLabel: string; posture: string }[];
  wiki: Record<string, WikiSection>;
}

export async function agentAdvisor(input: AdvisorInput): Promise<{ recommendation: AdvisorRecommendation }> {
  if (!client) return fallbackAdvisor(input);
  // Pull graph-grounded excerpts from cognee before asking Claude. Soft-fails
  // to an empty list if the sidecar is unavailable — the advisor still works.
  const recallQuery = `${input.event.title} — relevant prior decisions, assumptions, and consequences for ${input.company.name}`;
  const memoryExcerpts = await queryMemory(recallQuery, 5);
  const memorySection =
    memoryExcerpts.length > 0
      ? `\nCognee graph excerpts (cite when relevant):\n${memoryExcerpts.map((s, i) => `[mem${i + 1}] ${s}`).join("\n")}\n`
      : "";
  try {
    const user = `You are the "Ask Company Wiki" advisor. You see only known wiki state — never chaos events.

Event: ${input.event.title} (${input.event.date}) — ${input.event.blurb}
Options:
${input.options.map((o) => `- ${o.id}: ${o.label} (${o.posture}, base ${Math.round(o.baseSuccess * 100)}%) — ${o.rationale}`).join("\n")}
Company: ${JSON.stringify(input.company)}
Assumptions: ${JSON.stringify(input.assumptions)}
${memorySection}
Return JSON:
{ "recommendation": {
  "recommendedActionId": "string (one of the option ids)",
  "estimatedSuccess": number (0..1),
  "perOption": [{ "actionId": "string", "estimatedSuccess": number }],
  "rationale": "string, 2-3 sentences citing the wiki state that drove the rank (cite [memN] when you used a graph excerpt)",
  "blindSpot": "string, one sentence reminding the player chaos is not modeled"
}}`;

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYS_PROMPT,
      messages: [{ role: "user", content: user }],
    });
    return parseJson(res) ?? fallbackAdvisor(input);
  } catch (err) {
    console.error("agentAdvisor fell back:", err);
    return fallbackAdvisor(input);
  }
}

interface LintInput {
  company: CompanyProfile;
  assumptions: AssumptionEntry[];
  decisionLog: { round: number; eventTitle: string; actionLabel: string; posture: string }[];
  worldReactions: WorldReaction[];
  wiki: Record<string, WikiSection>;
}

export async function agentLint(input: LintInput): Promise<{ findings: LintFinding[]; wikiPatches: { id: string; body: string }[] }> {
  if (!client) return fallbackLint(input);
  // Cognee runs a graph-level audit pass. Empty if sidecar is offline or has
  // no rounds yet — lint still works from the Markdown wiki in that case.
  const graphFindings = await auditMemory();
  const graphSection =
    graphFindings.length > 0
      ? `\nCognee graph audit findings (treat as evidence, not the final list):\n${graphFindings.map((s, i) => `[g${i + 1}] ${s}`).join("\n")}\n`
      : "";
  try {
    const wikiSummary = Object.values(input.wiki)
      .map((s) => `### ${s.title}\n${s.body}`)
      .join("\n\n");
    const user = `Lint the wiki for contradictions, stale facts, unsupported claims, and missing links between sections.

Company snapshot: ${JSON.stringify(input.company)}
Assumptions: ${JSON.stringify(input.assumptions)}
Decision log: ${JSON.stringify(input.decisionLog)}
Recent reactions: ${JSON.stringify(input.worldReactions.slice(-3))}

Current wiki:
${wikiSummary}
${graphSection}
Return JSON:
{
  "findings": [{
    "id": "string",
    "severity": "info"|"warn"|"error",
    "section": "company-profile"|"canon-timeline"|"decision-log"|"assumptions"|"competitors"|"risks"|"lint-report",
    "message": "what's wrong, one sentence (cite [gN] when a graph finding drove this)",
    "suggestion": "what to fix, one sentence"
  }],
  "wikiPatches": []
}
Return at most 5 findings. Prefer specific over generic.`;

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: SYS_PROMPT,
      messages: [{ role: "user", content: user }],
    });
    return parseJson(res) ?? fallbackLint(input);
  } catch (err) {
    console.error("agentLint fell back:", err);
    return fallbackLint(input);
  }
}

function parseJson<T>(res: Anthropic.Message): T | null {
  for (const block of res.content) {
    if (block.type === "text") {
      const text = block.text.trim();
      const m = text.match(/\{[\s\S]*\}$/);
      const candidate = m ? m[0] : text;
      try {
        return JSON.parse(candidate) as T;
      } catch {
        continue;
      }
    }
  }
  return null;
}
