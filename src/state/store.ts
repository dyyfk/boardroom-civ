import { create } from "zustand";
import type {
  ActionOption,
  AdvisorRecommendation,
  AssumptionEntry,
  BranchNode,
  ChaosEvent,
  DecisionLogEntry,
  GameState,
  LintFinding,
  RoundState,
  WikiSection,
  WikiSectionId,
  WorldReaction,
} from "../types";
import { ROUND_ORDER, getActionOptions, getCanonEvent } from "../data/canon";
import { buildInitialState } from "../data/seed";

const STORAGE_KEY = "boardroom-civ:v1";

interface UIState {
  actionModalOpen: boolean;
  reactionModalOpen: boolean;
  livingWikiOpenSection: WikiSectionId | null;
  resolvingRound: boolean;
  askingWiki: boolean;
  lastError: string | null;
}

interface Actions {
  openActionModal(): void;
  closeActionModal(): void;
  dismissReaction(): void;
  openWikiSection(id: WikiSectionId | null): void;

  resolveRound(input: { actionId?: string; customMove?: string; posture: GameState["company"]["posture"] }): Promise<void>;
  askWiki(): Promise<void>;
  runLint(): Promise<void>;

  reset(): void;
  rewind(): void;
}

type Store = GameState & UIState & Actions;

function loadPersisted(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.rounds)) return null;
    return parsed as GameState;
  } catch {
    return null;
  }
}

function persist(state: GameState) {
  try {
    const slim: GameState = {
      scenario: state.scenario,
      stage: state.stage,
      currentRoundIndex: state.currentRoundIndex,
      company: state.company,
      rounds: state.rounds,
      branch: state.branch,
      wiki: state.wiki,
      decisionLog: state.decisionLog,
      assumptions: state.assumptions,
      lintFindings: state.lintFindings,
      worldReactions: state.worldReactions,
      lastUpdatedAt: state.lastUpdatedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {
    // ignore
  }
}

function getCurrentEventId(state: GameState): string {
  const round = state.rounds[state.currentRoundIndex];
  return round?.eventId ?? ROUND_ORDER[0];
}

function getNextEventId(state: GameState): string | null {
  const next = state.rounds[state.currentRoundIndex + 1];
  return next?.eventId ?? null;
}

function findAction(eventId: string, actionId?: string): ActionOption | null {
  if (!actionId) return null;
  return getActionOptions(eventId).find((a) => a.id === actionId) ?? null;
}

async function callAgent<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`agent ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

interface ResolveResponse {
  worldReaction: WorldReaction;
  branchOutcomes: BranchNode["outcomes"];
  newAssumptions: AssumptionEntry[];
  updatedAssumptionIds: { id: string; status: AssumptionEntry["status"] }[];
  wikiPatches: { id: WikiSectionId; appendBody: string }[];
}

interface AdvisorResponse {
  recommendation: AdvisorRecommendation;
}

interface LintResponse {
  findings: LintFinding[];
  wikiPatches: { id: WikiSectionId; body: string }[];
}

function applyCapital(
  company: GameState["company"],
  burnDelta: number,
  fundingDelta: number,
  chaos?: ChaosEvent,
): GameState["company"] {
  const newBurn = Math.max(50_000, company.burnPerMonth + burnDelta);
  const chaosCash = chaos?.capitalDelta ?? 0;
  const newCash = Math.max(0, company.cash + fundingDelta + chaosCash);
  const runway = newCash / newBurn;
  const fundingBoost = fundingDelta > 0 ? 0.18 : 0;
  const burnPenalty = burnDelta > 0 ? -0.05 : 0;
  const raiseReadiness = clamp(
    company.raiseReadiness + fundingBoost + burnPenalty,
    0,
    1,
  );
  return {
    ...company,
    cash: newCash,
    burnPerMonth: newBurn,
    runwayMonths: Number(runway.toFixed(1)),
    raiseReadiness: Number(raiseReadiness.toFixed(2)),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function nowISO(): string {
  return new Date().toISOString();
}

function buildBranchNode(
  eventId: string,
  status: BranchNode["status"],
  chosenActionId?: string,
): BranchNode {
  const event = getCanonEvent(eventId);
  return {
    id: eventId,
    date: event.date,
    title: event.title,
    blurb: event.blurb,
    status,
    chosenActionId,
  };
}

export const useGame = create<Store>((set, get) => ({
  ...(loadPersisted() ?? buildInitialState()),
  actionModalOpen: false,
  reactionModalOpen: false,
  livingWikiOpenSection: null,
  resolvingRound: false,
  askingWiki: false,
  lastError: null,

  openActionModal: () => set({ actionModalOpen: true }),
  closeActionModal: () => set({ actionModalOpen: false }),
  dismissReaction: () => {
    set({ reactionModalOpen: false });
    const state = get();
    const next = state.rounds[state.currentRoundIndex];
    if (next && !next.resolved) {
      set({ actionModalOpen: true });
    }
  },
  openWikiSection: (id) => set({ livingWikiOpenSection: id }),

  async resolveRound({ actionId, customMove, posture }) {
    if (get().resolvingRound) return;
    set({ resolvingRound: true, lastError: null });

    try {
      const state = get();
      const eventId = getCurrentEventId(state);
      const event = getCanonEvent(eventId);
      const action = findAction(eventId, actionId);
      const actionLabel = action?.label ?? (customMove ? "Custom move" : "—");

      const resp = await callAgent<ResolveResponse>("resolve", {
        eventId,
        event,
        action,
        customMove,
        posture,
        company: state.company,
        assumptions: state.assumptions,
        decisionLog: state.decisionLog,
        wiki: state.wiki,
      });

      const burnDelta = action?.burnDelta ?? 0;
      const fundingDelta = action?.fundingDelta ?? 0;
      const newCompany = applyCapital(
        { ...state.company, posture },
        burnDelta,
        fundingDelta,
        resp.worldReaction.chaos,
      );

      const now = nowISO();

      const resolvedRound: RoundState = {
        ...state.rounds[state.currentRoundIndex],
        resolved: true,
        chosenActionId: actionId,
        customMove,
        worldReaction: resp.worldReaction,
      };
      const newRounds = state.rounds.map((r, i) =>
        i === state.currentRoundIndex ? resolvedRound : r,
      );

      const nextEventId = getNextEventId(state);
      const branchAdditions: BranchNode[] = [];
      const completedNode = buildBranchNode(eventId, "completed", actionId);
      completedNode.outcomes = resp.branchOutcomes ?? undefined;
      branchAdditions.push(completedNode);
      if (nextEventId) {
        branchAdditions.push(buildBranchNode(nextEventId, "current"));
      }

      const dedupedBranch: BranchNode[] = mergeBranch(state.branch, branchAdditions);

      const decisionEntry: DecisionLogEntry = {
        round: state.currentRoundIndex + 1,
        eventId,
        eventTitle: event.title,
        actionLabel,
        posture,
        consequence: resp.worldReaction.headline,
        capitalAfter: newCompany.cash,
        runwayAfter: newCompany.runwayMonths,
        timestamp: now,
      };
      const newDecisionLog = [...state.decisionLog, decisionEntry];

      const updatedAssumptionMap = new Map(
        state.assumptions.map((a) => [a.id, a]),
      );
      for (const u of resp.updatedAssumptionIds) {
        const existing = updatedAssumptionMap.get(u.id);
        if (existing) {
          updatedAssumptionMap.set(u.id, { ...existing, status: u.status });
        }
      }
      const newAssumptions: AssumptionEntry[] = [
        ...updatedAssumptionMap.values(),
        ...resp.newAssumptions,
      ];

      const wikiNext: Record<WikiSectionId, WikiSection> = { ...state.wiki };

      wikiNext["decision-log"] = {
        ...wikiNext["decision-log"],
        updatedAt: now,
        body: renderDecisionLog(newDecisionLog),
      };
      wikiNext.assumptions = {
        ...wikiNext.assumptions,
        updatedAt: now,
        body: renderAssumptions(newAssumptions),
      };
      wikiNext["company-profile"] = {
        ...wikiNext["company-profile"],
        updatedAt: now,
        body: renderCompanyProfile(newCompany),
      };

      for (const patch of resp.wikiPatches) {
        const existing = wikiNext[patch.id];
        if (!existing) continue;
        wikiNext[patch.id] = {
          ...existing,
          updatedAt: now,
          body: `${existing.body}\n\n${patch.appendBody}`.trim(),
        };
      }

      const newState: GameState = {
        ...state,
        company: newCompany,
        rounds: newRounds,
        currentRoundIndex: nextEventId
          ? state.currentRoundIndex + 1
          : state.currentRoundIndex,
        branch: dedupedBranch,
        decisionLog: newDecisionLog,
        assumptions: newAssumptions,
        worldReactions: [...state.worldReactions, resp.worldReaction],
        wiki: wikiNext,
        lastUpdatedAt: now,
      };

      persist(newState);
      set({
        ...newState,
        resolvingRound: false,
        actionModalOpen: false,
        reactionModalOpen: true,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ resolvingRound: false, lastError: message });
    }
  },

  async askWiki() {
    if (get().askingWiki) return;
    set({ askingWiki: true, lastError: null });
    try {
      const state = get();
      const eventId = getCurrentEventId(state);
      const event = getCanonEvent(eventId);
      const options = getActionOptions(eventId);
      const resp = await callAgent<AdvisorResponse>("advisor", {
        eventId,
        event,
        options,
        company: state.company,
        assumptions: state.assumptions,
        decisionLog: state.decisionLog,
        wiki: state.wiki,
      });

      const currentRound = state.rounds[state.currentRoundIndex];
      const newRounds = state.rounds.map((r, i) =>
        i === state.currentRoundIndex
          ? { ...currentRound, advisor: resp.recommendation }
          : r,
      );
      const newState = { ...state, rounds: newRounds, lastUpdatedAt: nowISO() };
      persist(newState);
      set({ ...newState, askingWiki: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ askingWiki: false, lastError: message });
    }
  },

  async runLint() {
    set({ lastError: null });
    try {
      const state = get();
      const resp = await callAgent<LintResponse>("lint", {
        company: state.company,
        assumptions: state.assumptions,
        decisionLog: state.decisionLog,
        worldReactions: state.worldReactions,
        wiki: state.wiki,
      });

      const now = nowISO();
      const wikiNext = { ...state.wiki };
      wikiNext["lint-report"] = {
        ...wikiNext["lint-report"],
        updatedAt: now,
        body: renderLintReport(resp.findings),
      };
      for (const patch of resp.wikiPatches) {
        const existing = wikiNext[patch.id];
        if (!existing) continue;
        wikiNext[patch.id] = {
          ...existing,
          updatedAt: now,
          body: patch.body,
        };
      }

      const newState: GameState = {
        ...state,
        wiki: wikiNext,
        lintFindings: resp.findings,
        lastUpdatedAt: now,
      };
      persist(newState);
      set(newState);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ lastError: message });
    }
  },

  reset() {
    const fresh = buildInitialState();
    persist(fresh);
    set({
      ...fresh,
      actionModalOpen: false,
      reactionModalOpen: false,
      livingWikiOpenSection: null,
      resolvingRound: false,
      askingWiki: false,
      lastError: null,
    });
    // Wipe the cognee graph too so the Memory Graph badge resets along with
    // the game state. Fire-and-forget — if the sidecar is offline, we don't
    // care; the graph was already empty from its perspective.
    fetch("/api/memory-reset", { method: "POST" }).catch(() => {});
  },

  rewind() {
    const state = get();
    if (state.decisionLog.length === 0) return;
    const lastIndex = state.currentRoundIndex - 1;
    if (lastIndex < 0) return;

    const newDecisionLog = state.decisionLog.slice(0, -1);
    const newReactions = state.worldReactions.slice(0, -1);
    const newRounds = state.rounds.map((r, i) =>
      i === lastIndex
        ? { ...r, resolved: false, chosenActionId: undefined, customMove: undefined, worldReaction: undefined }
        : r,
    );
    const newBranch = state.branch.filter((node) => {
      if (node.status === "current") return false;
      const eventIdsBefore = state.rounds
        .slice(0, lastIndex)
        .map((r) => r.eventId);
      return eventIdsBefore.includes(node.id);
    });
    if (lastIndex >= 0) {
      newBranch.push(buildBranchNode(state.rounds[lastIndex].eventId, "current"));
    }

    const now = nowISO();
    const newState: GameState = {
      ...state,
      currentRoundIndex: lastIndex,
      decisionLog: newDecisionLog,
      worldReactions: newReactions,
      rounds: newRounds,
      branch: newBranch,
      lastUpdatedAt: now,
    };
    persist(newState);
    set(newState);
  },
}));

function mergeBranch(prev: BranchNode[], additions: BranchNode[]): BranchNode[] {
  const map = new Map<string, BranchNode>();
  for (const node of prev) {
    map.set(node.id, node);
  }
  for (const node of additions) {
    map.set(node.id, node);
  }
  return Array.from(map.values()).sort((a, b) => {
    return ROUND_ORDER.indexOf(a.id) - ROUND_ORDER.indexOf(b.id);
  });
}

function renderDecisionLog(entries: DecisionLogEntry[]): string {
  if (entries.length === 0) return "_No decisions logged. Scene 1: Idea phase._";
  return entries
    .map(
      (e) =>
        `**Round ${e.round} — ${e.eventTitle}.** Chose _${e.actionLabel}_ (${e.posture}). ${e.consequence}\n  · Capital after: $${(e.capitalAfter / 1_000_000).toFixed(2)}M · Runway: ${e.runwayAfter.toFixed(1)} mo`,
    )
    .join("\n\n");
}

function renderAssumptions(entries: AssumptionEntry[]): string {
  return entries
    .map((a) => {
      const statusTag =
        a.status === "broken"
          ? " ⛔ BROKEN"
          : a.status === "shaky"
            ? " ⚠ SHAKY"
            : "";
      return `- **[${a.confidence.toUpperCase()}]${statusTag}** ${a.text}\n  _${a.source}_`;
    })
    .join("\n");
}

function renderCompanyProfile(c: GameState["company"]): string {
  return `# ${c.name}

**Stage:** ${c.stage} · **Cash:** $${(c.cash / 1_000_000).toFixed(2)}M · **Runway:** ${c.runwayMonths.toFixed(1)} mo · **Burn:** $${Math.round(c.burnPerMonth / 1_000)}k/mo · **Headcount:** ${c.headcount}

**Thesis.** ${c.thesis}

**Posture.** ${c.posture}.

**Why this exists.** Frontier model providers ship capability. Buyers in financial services, healthcare, and government keep saying "great, but can you sign a BAA and ship on-prem?" Northstar exists for that gap.`;
}

function renderLintReport(findings: LintFinding[]): string {
  if (findings.length === 0) {
    return "✓ No contradictions or stale facts detected this pass.";
  }
  return findings
    .map((f) => {
      const icon =
        f.severity === "error" ? "⛔" : f.severity === "warn" ? "⚠" : "ℹ";
      return `${icon} **[${f.section}]** ${f.message}\n  → ${f.suggestion}`;
    })
    .join("\n\n");
}

export function selectCurrentEventId(state: GameState): string {
  return getCurrentEventId(state);
}

export function selectCurrentRound(state: GameState): RoundState | undefined {
  return state.rounds[state.currentRoundIndex];
}
