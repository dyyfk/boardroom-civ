import type {
  AssumptionEntry,
  CompanyProfile,
  GameState,
  WikiSection,
} from "../types";
import { ROUND_ORDER, getCanonEvent } from "./canon";

export const SEED_COMPANY: CompanyProfile = {
  name: "Northstar Labs",
  stage: "Seed",
  cash: 1_600_000,
  burnPerMonth: 400_000,
  runwayMonths: 4.0,
  raiseReadiness: 0.32,
  headcount: 11,
  thesis:
    "Boring, vertical AI for regulated enterprises. We sell certainty, not capability.",
  posture: "balanced",
};

export const SEED_ASSUMPTIONS: AssumptionEntry[] = [
  {
    id: "a-1",
    text: "Enterprise buyers will pay a premium for SOC2 + on-prem in 2026.",
    confidence: "high",
    source: "Design partner interviews, JAN 2025",
    status: "active",
  },
  {
    id: "a-2",
    text: "Open-weight 70B models will hit GPT-4 parity on coding by mid-2026.",
    confidence: "medium",
    source: "Internal evals + market trend lines",
    status: "active",
  },
  {
    id: "a-3",
    text: "EU AI Act enforcement timeline holds (AUG 2026 phase 1).",
    confidence: "medium",
    source: "EU Commission public roadmap",
    status: "active",
  },
  {
    id: "a-4",
    text: "Northstar can close 3 design partners before runway < 6 months.",
    confidence: "low",
    source: "Sales pipeline as of round start",
    status: "shaky",
  },
];

function seededWiki(now: string): Record<WikiSection["id"], WikiSection> {
  return {
    "company-profile": {
      id: "company-profile",
      title: "Company Profile",
      updatedAt: now,
      body: `# Northstar Labs

**Stage:** Seed · **Cash:** $1.6M · **Runway:** 4.0 mo · **Burn:** $400k/mo · **Headcount:** 11

**Thesis.** Boring, vertical AI for regulated enterprises. We sell certainty, not capability.

**Posture.** Balanced — happy to absorb burn for proof, unwilling to bet the company on hype cycles.

**Why this exists.** Frontier model providers ship capability. Buyers in financial services, healthcare, and government keep saying "great, but can you sign a BAA and ship on-prem?" Northstar exists for that gap.`,
    },
    "canon-timeline": {
      id: "canon-timeline",
      title: "Canon Timeline",
      updatedAt: now,
      body: ROUND_ORDER.map((id) => {
        const e = getCanonEvent(id);
        return `**${e.date} — ${e.title}.** ${e.blurb}`;
      }).join("\n\n"),
    },
    "decision-log": {
      id: "decision-log",
      title: "Decision Log",
      updatedAt: now,
      body: "_No decisions logged. Scene 1: Idea phase._",
    },
    assumptions: {
      id: "assumptions",
      title: "Assumptions",
      updatedAt: now,
      body: SEED_ASSUMPTIONS.map(
        (a) =>
          `- **[${a.confidence.toUpperCase()}]** ${a.text}\n  _${a.source}_`,
      ).join("\n"),
    },
    competitors: {
      id: "competitors",
      title: "Competitors",
      updatedAt: now,
      body: `**OpenAI** — frontier capability, enterprise bundle, weak vertical depth.

**Meta** — open-weight distribution, ads-driven, no enterprise muscle.

**Google** — Gemini + Workspace + GCP. Strongest distribution, slowest procurement.

**Nvidia** — compute monopoly. Indirect competitor via Inference Microservices.

**Mistral / DeepSeek / open-weight wave** — commoditize the model. We sell what's around the model.`,
    },
    risks: {
      id: "risks",
      title: "Risks",
      updatedAt: now,
      body: `1. **Open-weight commoditization** — pricing collapses faster than our wedge sets.
2. **Compute scarcity** — H100/H200 export controls tighten further; we get crowded out of capacity.
3. **EU AI Act compliance** — phase 1 hits AUG 2026. We are not yet SOC2.
4. **Runway** — 4.0 months. No bridge committed. A bad demo + a bad month = down-round.
5. **Talent** — two of three founders haven't shipped a regulated-enterprise product before.`,
    },
    "lint-report": {
      id: "lint-report",
      title: "Lint Report",
      updatedAt: now,
      body: "_Lint has not run for this round._",
    },
  };
}

export function buildInitialState(
  now = new Date().toISOString(),
  gameId = 1,
): GameState {
  return {
    scenario: "AI Platform Wars",
    stage: "Seed",
    currentRoundIndex: 0,
    company: { ...SEED_COMPANY },
    rounds: ROUND_ORDER.map((eventId, index) => ({
      index,
      eventId,
      resolved: false,
    })),
    branch: [],
    wiki: seededWiki(now),
    decisionLog: [],
    assumptions: [...SEED_ASSUMPTIONS],
    lintFindings: [],
    worldReactions: [],
    lastUpdatedAt: now,
    gameId,
    gameStatus: "alive",
  };
}
