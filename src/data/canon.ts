import type { ActionOption, CanonEvent } from "../types";

export const CANON_TIMELINE: CanonEvent[] = [
  {
    id: "scene-1",
    date: "JAN 2025",
    title: "Idea phase",
    blurb:
      "Northstar's three founders write the first deck on a kitchen table. No product, no funding, no enemies — yet.",
    imageHint: "kitchen-table",
    reactions: [
      { actor: "openai", headline: "Roadmap leak hints GPT-4.5" },
      { actor: "meta", headline: "Llama 4 prep" },
      { actor: "google", headline: "Gemini 2.0 rollout" },
      { actor: "nvidia", headline: "Blackwell GA" },
    ],
  },
  {
    id: "gpt-45-launch",
    date: "MAR 2025",
    title: "GPT-4.5 launch",
    blurb:
      "OpenAI ships GPT-4.5 with a 60% drop in hallucination on reasoning evals. Pricing doubles. Devs scramble to re-benchmark.",
    imageHint: "model-launch",
    reactions: [
      { actor: "openai", headline: "Launch" },
      { actor: "meta", headline: "Llama 4 prep" },
      { actor: "google", headline: "Gemini 2.0" },
      { actor: "nvidia", headline: "Blackwell GA" },
    ],
  },
  {
    id: "us-export-controls",
    date: "MAY 2025",
    title: "US export controls expand",
    blurb:
      "Treasury widens chip export controls to include H200s and tightens 'US-person' rules for AI labs. Compliance teams freeze hiring.",
    imageHint: "export-controls",
    reactions: [
      { actor: "openai", headline: "Compliance update" },
      { actor: "meta", headline: "Lobbying push" },
      { actor: "google", headline: "TPU access review" },
      { actor: "nvidia", headline: "China chip limits" },
    ],
  },
  {
    id: "rival-open-weight",
    date: "MAY 2026",
    title: "Rival releases open-weight model",
    blurb:
      "A well-funded rival drops an Apache-2 licensed 70B model that matches GPT-4 on coding tasks. Enterprise pipelines tilt overnight.",
    imageHint: "open-weight",
    reactions: [
      { actor: "openai", headline: "No open-weight release" },
      { actor: "meta", headline: "Llama 4 release" },
      { actor: "google", headline: "Gemma 3 release" },
      { actor: "nvidia", headline: "Price cut on H200" },
    ],
  },
  {
    id: "eu-ai-act",
    date: "AUG 2026",
    title: "EU AI Act (phase 1) enforced",
    blurb:
      "First wave of EU AI Act obligations turn on. Foundation model providers must publish training data summaries and red-team reports.",
    imageHint: "eu-flag",
    reactions: [
      { actor: "openai", headline: "EU data controls" },
      { actor: "meta", headline: "EU transparency" },
      { actor: "google", headline: "Compliance suite" },
      { actor: "nvidia", headline: "Export variance" },
    ],
  },
  {
    id: "enterprise-ai-spend",
    date: "NOV 2026",
    title: "Enterprise AI spend surges",
    blurb:
      "F500 CFOs publish 2027 budgets. AI line items jump 3.4x YoY. Procurement teams demand SOC2, on-prem, and EU residency in the same RFP.",
    imageHint: "spend-chart",
    reactions: [
      { actor: "openai", headline: "Enterprise bundle" },
      { actor: "meta", headline: "Ads AI rollout" },
      { actor: "google", headline: "Workspace AI push" },
      { actor: "nvidia", headline: "Datacenter demand up" },
    ],
  },
];

export const ACTION_OPTIONS_BY_EVENT: Record<string, ActionOption[]> = {
  "scene-1": [
    {
      id: "find-wedge",
      label: "Find market wedge",
      oneLiner: "Spend 3 weeks interviewing 30 design partners before writing a line of code.",
      posture: "defensive",
      baseSuccess: 0.62,
      burnDelta: 0,
      fundingDelta: 0,
      rationale: "Slow start, but the wedge survives contact with real buyers.",
    },
    {
      id: "build-prototype",
      label: "Build prototype",
      oneLiner: "Three engineers, four weeks, one demoable thing. Ship before the next news cycle.",
      posture: "aggressive",
      baseSuccess: 0.55,
      burnDelta: 25_000,
      fundingDelta: 0,
      rationale: "Fastest path to investor proof — but the wedge is still a guess.",
    },
    {
      id: "raise-pre-seed",
      label: "Raise pre-seed",
      oneLiner: "Take a $2.4M SAFE on the deck. Buy 12 months of runway and credibility.",
      posture: "balanced",
      baseSuccess: 0.68,
      burnDelta: 0,
      fundingDelta: 2_400_000,
      rationale: "Cash unlocks parallel bets; dilution today is cheaper than a down round later.",
    },
  ],
  "gpt-45-launch": [
    {
      id: "rebench-evals",
      label: "Rebench on GPT-4.5",
      oneLiner: "Burn a week re-running internal evals. Don't ship until the demo holds up.",
      posture: "defensive",
      baseSuccess: 0.6,
      burnDelta: 5_000,
      fundingDelta: 0,
      rationale: "Buyers will ask. Better to know the answer than dodge.",
    },
    {
      id: "ride-the-wave",
      label: "Ride the wave",
      oneLiner: "Pitch every fund that funded GPT-4.5 reactions. Hot deck, hot week.",
      posture: "aggressive",
      baseSuccess: 0.7,
      burnDelta: 0,
      fundingDelta: 1_200_000,
      rationale: "FOMO is a fundraising primitive. Use it before it cools.",
    },
    {
      id: "double-down-niche",
      label: "Double down on niche",
      oneLiner: "Ignore the launch. Tell every customer Northstar is the boring one.",
      posture: "balanced",
      baseSuccess: 0.58,
      burnDelta: 0,
      fundingDelta: 0,
      rationale: "Frontier model news is noise for vertical buyers.",
    },
  ],
  "us-export-controls": [
    {
      id: "pivot-dev-tools",
      label: "Pivot to developer tools",
      oneLiner: "Move up the stack. Sell to devs who already have model access.",
      posture: "balanced",
      baseSuccess: 0.66,
      burnDelta: 0,
      fundingDelta: 0,
      rationale: "Avoids the export-controlled middle of the stack.",
    },
    {
      id: "lock-compute",
      label: "Lock long-term compute",
      oneLiner: "Sign a 24-month H100 reservation now. Pay through the nose for certainty.",
      posture: "defensive",
      baseSuccess: 0.55,
      burnDelta: 60_000,
      fundingDelta: 0,
      rationale: "Compute scarcity is the next bottleneck. Insurance.",
    },
    {
      id: "build-eu-presence",
      label: "Stand up EU entity",
      oneLiner: "Incorporate in Dublin. Tell EU buyers the data never crosses the Atlantic.",
      posture: "aggressive",
      baseSuccess: 0.5,
      burnDelta: 35_000,
      fundingDelta: 0,
      rationale: "Compliance becomes a moat for regulated buyers.",
    },
  ],
  "rival-open-weight": [
    {
      id: "enterprise-moat",
      label: "Enterprise moat",
      oneLiner: "Lock in 3 design partners on annual contracts. SOC2 fast-track. On-prem path.",
      posture: "defensive",
      baseSuccess: 0.64,
      burnDelta: 60_000,
      fundingDelta: 0,
      rationale: "Open weights don't ship procurement, audits, or SLAs.",
    },
    {
      id: "open-source-core",
      label: "Open-source core",
      oneLiner: "Ship our reasoning layer under Apache-2 and bet that distribution beats secrecy.",
      posture: "aggressive",
      baseSuccess: 0.51,
      burnDelta: 25_000,
      fundingDelta: 0,
      rationale: "If you can't beat the open release, distribute on top of it.",
    },
    {
      id: "partner-fast",
      label: "Partner fast",
      oneLiner: "Strike a co-development deal with a cloud provider for distribution + GPUs.",
      posture: "balanced",
      baseSuccess: 0.58,
      burnDelta: 0,
      fundingDelta: 800_000,
      rationale: "Cloud distribution + GPU credits is the cheapest way to scale.",
    },
  ],
  "eu-ai-act": [
    {
      id: "publish-training-summary",
      label: "Publish training summary",
      oneLiner: "Beat the deadline. Ship a clean, public training-data overview.",
      posture: "balanced",
      baseSuccess: 0.7,
      burnDelta: 20_000,
      fundingDelta: 0,
      rationale: "Transparency becomes a sales asset, not a tax.",
    },
    {
      id: "geo-fence-eu",
      label: "Geo-fence EU users",
      oneLiner: "Pause EU signups. Re-open only with full compliance package.",
      posture: "defensive",
      baseSuccess: 0.45,
      burnDelta: -10_000,
      fundingDelta: 0,
      rationale: "Cheapest legally, expensive strategically.",
    },
    {
      id: "challenge-via-lobby",
      label: "Challenge via industry lobby",
      oneLiner: "Sign onto the joint amicus brief. Push back on training-data summaries.",
      posture: "aggressive",
      baseSuccess: 0.38,
      burnDelta: 15_000,
      fundingDelta: 0,
      rationale: "Long odds, but a win changes the cost basis for years.",
    },
  ],
  "enterprise-ai-spend": [
    {
      id: "win-rfp-cycle",
      label: "Win the RFP cycle",
      oneLiner: "Forward-deploy 2 SEs into 3 F500 RFPs. SOC2, on-prem, EU residency.",
      posture: "aggressive",
      baseSuccess: 0.62,
      burnDelta: 90_000,
      fundingDelta: 0,
      rationale: "These deals set the 2027 reference accounts.",
    },
    {
      id: "raise-series-a",
      label: "Raise Series A",
      oneLiner: "Take the upmarket valuation while procurement is bullish.",
      posture: "balanced",
      baseSuccess: 0.66,
      burnDelta: 0,
      fundingDelta: 15_000_000,
      rationale: "Capital + signal beats organic growth in a land-grab.",
    },
    {
      id: "stay-lean",
      label: "Stay lean",
      oneLiner: "Cap headcount. Ride the runway and pick spots.",
      posture: "defensive",
      baseSuccess: 0.5,
      burnDelta: -20_000,
      fundingDelta: 0,
      rationale: "Discipline wins when the music stops.",
    },
  ],
};

export const ROUND_ORDER: string[] = [
  "scene-1",
  "gpt-45-launch",
  "us-export-controls",
  "rival-open-weight",
  "eu-ai-act",
  "enterprise-ai-spend",
];

export function getCanonEvent(id: string): CanonEvent {
  const event = CANON_TIMELINE.find((e) => e.id === id);
  if (!event) throw new Error(`unknown canon event: ${id}`);
  return event;
}

export function getActionOptions(eventId: string) {
  return ACTION_OPTIONS_BY_EVENT[eventId] ?? [];
}
