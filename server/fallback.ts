// Deterministic offline simulator so the demo runs even without an API key.
// Keeps the LLM agent contract identical to what the server returns when
// ANTHROPIC_API_KEY is set.

import type {
  ActionOption,
  AdvisorRecommendation,
  AssumptionEntry,
  BranchOutcome,
  CanonEvent,
  ChaosEvent,
  CompanyProfile,
  LintFinding,
  WorldReaction,
} from "./types";

interface ResolveInput {
  event: CanonEvent;
  action: ActionOption | null;
  customMove?: string;
  posture: CompanyProfile["posture"];
  company: CompanyProfile;
  assumptions: AssumptionEntry[];
  decisionLog: { round: number; eventTitle: string; actionLabel: string }[];
}

const CHAOS_EVENTS: ChaosEvent[] = [
  {
    id: "chaos-engineer-poach",
    title: "Senior engineer poached",
    detail: "A FAANG recruiter walked off with one of the inference leads. 90-day backfill at best.",
    capitalDelta: -60_000,
  },
  {
    id: "chaos-press-leak",
    title: "TechCrunch leak",
    detail: "An unflattering Slack screenshot is going around about Northstar's open-weight stance.",
  },
  {
    id: "chaos-design-partner-churn",
    title: "Design partner pause",
    detail: "Procurement at the largest design partner froze AI spend pending an internal audit.",
    capitalDelta: -120_000,
  },
  {
    id: "chaos-bridge-offer",
    title: "Unsolicited bridge offer",
    detail: "A new fund offered a $1.5M bridge at a flat valuation. 7 days to decide.",
    capitalDelta: 1_500_000,
  },
];

function pickChaos(seedKey: string): ChaosEvent | undefined {
  const hash = simpleHash(seedKey);
  if (hash % 3 === 0) return undefined;
  return CHAOS_EVENTS[hash % CHAOS_EVENTS.length];
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function fallbackResolve(input: ResolveInput) {
  const { event, action, customMove, company, posture } = input;
  const label = action?.label ?? (customMove ? "Custom move" : "—");
  const chaos = pickChaos(`${event.id}-${label}-${company.cash}`);

  const headline = action
    ? `${event.title}: Northstar plays "${action.label}".`
    : `${event.title}: Northstar improvises — "${customMove ?? "no move"}".`;

  const reaction: WorldReaction = {
    round: 0,
    headline,
    customers: action
      ? customersFor(event.id, action.id, posture)
      : "Mixed signals — some buyers wait to see whether the move ships.",
    investors: investorsFor(action, company, posture),
    regulators: regulatorsFor(event.id, action?.id),
    competitors: competitorsFor(event.id, action?.id),
    employees: employeesFor(action, posture),
    chaos,
  };

  const branchOutcomes: BranchOutcome[] = action
    ? outcomesForAction(event.id, action)
    : [
        {
          id: "custom-followup",
          label: "Custom move follow-up",
          status: "locked",
          detail: customMove ?? "",
        },
      ];

  const newAssumptions: AssumptionEntry[] = [
    {
      id: `assum-${event.id}-${action?.id ?? "custom"}`,
      text: action
        ? `${action.label} reads as a ${posture} move to buyers in this segment.`
        : `Custom move "${customMove}" creates new narrative pressure to follow through.`,
      confidence: posture === "aggressive" ? "low" : "medium",
      source: `Round resolution: ${event.title}`,
      status: "active",
    },
  ];

  const updatedAssumptionIds = action?.id === "open-source-core"
    ? [{ id: "a-1", status: "shaky" as const }]
    : [];

  const wikiPatches = [
    {
      id: "competitors" as const,
      appendBody: `_${event.date}:_ ${competitorsFor(event.id, action?.id)}`,
    },
    {
      id: "risks" as const,
      appendBody: chaos
        ? `_${event.date}:_ Chaos — ${chaos.title}. ${chaos.detail}`
        : `_${event.date}:_ Post-event risk re-rank around "${event.title}".`,
    },
  ];

  return {
    worldReaction: reaction,
    branchOutcomes,
    newAssumptions,
    updatedAssumptionIds,
    wikiPatches,
  };
}

function customersFor(eventId: string, actionId: string, posture: string): string {
  if (eventId === "rival-open-weight" && actionId === "enterprise-moat") {
    return "Two of three design partners signed annual contracts. Procurement framed open-weights as 'not a buying lane' for regulated workloads.";
  }
  if (eventId === "rival-open-weight" && actionId === "open-source-core") {
    return "Devs cheered on HN. Enterprise buyers paused, asking if Northstar is now a community project or a vendor.";
  }
  if (eventId === "rival-open-weight" && actionId === "partner-fast") {
    return "Cloud partner co-marketed at their summit. Mid-market pipeline +40% in two weeks; F500 still wants direct contracts.";
  }
  return `Customers read this as a ${posture} bet and updated their procurement timeline accordingly.`;
}

function investorsFor(action: ActionOption | null, company: CompanyProfile, posture: string): string {
  if (!action) return "Existing investors asked for a written update before week's end.";
  if (action.fundingDelta > 0) {
    return `Term sheet movement — ${(action.fundingDelta / 1_000_000).toFixed(1)}M committed. Lead expects a faster fundraise next round.`;
  }
  if (action.burnDelta > 50_000) {
    return `Board flagged the burn delta. Asked for a 90-day re-forecast at the next sync.`;
  }
  return `Investors updated their notes: "${company.name} is leaning ${posture}; runway holds for now."`;
}

function regulatorsFor(eventId: string, actionId?: string): string {
  if (eventId === "eu-ai-act" && actionId === "publish-training-summary") {
    return "EU regulators publicly noted Northstar as an early-compliant lab. Sales used it as a trust signal.";
  }
  if (eventId === "eu-ai-act" && actionId === "challenge-via-lobby") {
    return "EU enforcement team flagged the filing. Expect a slower, more skeptical first audit.";
  }
  return "No new regulatory action triggered this round.";
}

function competitorsFor(eventId: string, actionId?: string): string {
  if (eventId === "rival-open-weight" && actionId === "enterprise-moat") {
    return "Rival doubled down on community PR, but lost two enterprise demos to Northstar's procurement playbook.";
  }
  if (eventId === "rival-open-weight" && actionId === "open-source-core") {
    return "Rival's lead engineers reposted the announcement. Expect a forked release within a month.";
  }
  return "Competitors did not visibly react this round.";
}

function employeesFor(action: ActionOption | null, posture: string): string {
  if (!action) return "Team waited for the all-hands. Slack was quieter than usual.";
  if (action.burnDelta > 50_000) {
    return "Hiring excitement on the engineering side. Finance and ops asked when budget freezes thaw.";
  }
  if (action.burnDelta < 0) {
    return "A pulse check showed mild morale dip. Two ICs asked about Q3 plans privately.";
  }
  return `Team aligned around the ${posture} call. No attrition this round.`;
}

function outcomesForAction(eventId: string, action: ActionOption): BranchOutcome[] {
  const base: BranchOutcome[] = [];
  if (eventId === "rival-open-weight") {
    if (action.id === "enterprise-moat") {
      base.push(
        { id: "stronger-positioning", label: "Stronger positioning", status: "completed" },
        { id: "soc2-track", label: "SOC2 fast-track started", status: "locked", detail: "8-week glidepath" },
      );
    } else if (action.id === "open-source-core") {
      base.push(
        { id: "community-growth", label: "Community growth", status: "completed" },
        { id: "down-round-risk", label: "Down round risk", status: "warning", detail: "Investors flagged dilution path" },
      );
    } else if (action.id === "partner-fast") {
      base.push(
        { id: "strategic-partnership", label: "Strategic partnership", status: "completed" },
        { id: "channel-dependency", label: "Channel dependency", status: "warning", detail: "70% of new pipeline = one partner" },
      );
    }
  } else {
    base.push({ id: `${action.id}-locked`, label: `${action.label} follow-up`, status: "locked" });
  }
  return base;
}

export function fallbackAdvisor(input: {
  event: CanonEvent;
  options: ActionOption[];
  company: CompanyProfile;
  assumptions: AssumptionEntry[];
}): { recommendation: AdvisorRecommendation } {
  const { options, company, assumptions } = input;
  const postureBias =
    company.posture === "defensive" ? -0.04 : company.posture === "aggressive" ? 0.04 : 0;
  const shakyPenalty = assumptions.some((a) => a.status === "shaky") ? -0.03 : 0;

  const perOption = options.map((o) => {
    const postureMatch =
      o.posture === company.posture ? 0.06 : o.posture === "balanced" ? 0.02 : 0;
    const runwayPenalty = o.burnDelta > 50_000 && company.runwayMonths < 8 ? -0.08 : 0;
    const fundingBonus = o.fundingDelta > 0 ? 0.04 : 0;
    const estimatedSuccess = clamp(
      o.baseSuccess + postureMatch + runwayPenalty + fundingBonus + postureBias + shakyPenalty,
      0.1,
      0.92,
    );
    return { actionId: o.id, estimatedSuccess };
  });

  const sorted = [...perOption].sort((a, b) => b.estimatedSuccess - a.estimatedSuccess);
  const best = sorted[0];
  const winner = options.find((o) => o.id === best.actionId)!;

  return {
    recommendation: {
      recommendedActionId: winner.id,
      estimatedSuccess: best.estimatedSuccess,
      perOption,
      rationale: `Based on known wiki state — your ${company.posture} posture, ${company.runwayMonths.toFixed(1)} mo runway, and active assumptions — "${winner.label}" has the highest expected success at ${Math.round(best.estimatedSuccess * 100)}%. ${winner.rationale}`,
      blindSpot: "Advisor cannot see chaos events. A senior engineer poach, a leaked memo, or a sudden bridge offer would change this rank order.",
    },
  };
}

export function fallbackLint(input: {
  assumptions: AssumptionEntry[];
  company: CompanyProfile;
  decisionLog: { round: number; eventTitle: string; actionLabel: string; posture: string }[];
}): { findings: LintFinding[]; wikiPatches: { id: "company-profile" | "assumptions"; body: string }[] } {
  const findings: LintFinding[] = [];

  if (input.company.runwayMonths < 6) {
    findings.push({
      id: "lint-runway",
      severity: "warn",
      section: "risks",
      message: `Runway is ${input.company.runwayMonths.toFixed(1)} mo — Risks page still lists 7.5 mo as the baseline.`,
      suggestion: "Refresh Risks #4 with the current runway figure and add a bridge plan.",
    });
  }

  const shaky = input.assumptions.filter((a) => a.status === "shaky");
  if (shaky.length > 0) {
    findings.push({
      id: "lint-shaky-assumption",
      severity: "info",
      section: "assumptions",
      message: `${shaky.length} assumption(s) marked shaky but not updated in Company Profile.`,
      suggestion: "Link shaky assumptions back to the thesis line they invalidate.",
    });
  }

  const postureChange = input.decisionLog.length >= 2 &&
    input.decisionLog[input.decisionLog.length - 1].posture !==
      input.decisionLog[input.decisionLog.length - 2].posture;
  if (postureChange) {
    findings.push({
      id: "lint-posture",
      severity: "info",
      section: "company-profile",
      message: "Posture changed between rounds without a Decision Log note explaining the shift.",
      suggestion: "Add a one-line rationale to the latest Decision Log entry.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "lint-clean",
      severity: "info",
      section: "lint-report",
      message: "Wiki internally consistent across decisions, assumptions, and capital.",
      suggestion: "No action required.",
    });
  }

  return { findings, wikiPatches: [] };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
