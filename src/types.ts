export type ActorId = "openai" | "meta" | "google" | "nvidia";

export interface ActorReaction {
  actor: ActorId;
  headline: string;
}

export interface CanonEvent {
  id: string;
  date: string;
  title: string;
  blurb: string;
  imageHint: string;
  reactions: ActorReaction[];
}

export interface ActionOption {
  id: string;
  label: string;
  oneLiner: string;
  posture: "defensive" | "balanced" | "aggressive";
  baseSuccess: number;
  burnDelta: number;
  fundingDelta: number;
  rationale: string;
}

export interface BranchNode {
  id: string;
  date: string;
  title: string;
  status: "completed" | "current" | "upcoming" | "locked" | "chaos";
  blurb?: string;
  chosenActionId?: string;
  outcomes?: BranchOutcome[];
}

export interface BranchOutcome {
  id: string;
  label: string;
  status: "completed" | "locked" | "chaos" | "warning";
  detail?: string;
}

export interface CompanyProfile {
  name: string;
  stage: string;
  cash: number;
  burnPerMonth: number;
  runwayMonths: number;
  raiseReadiness: number;
  headcount: number;
  thesis: string;
  posture: "defensive" | "balanced" | "aggressive";
}

export type WikiSectionId =
  | "company-profile"
  | "canon-timeline"
  | "decision-log"
  | "assumptions"
  | "competitors"
  | "risks"
  | "lint-report";

export interface WikiSection {
  id: WikiSectionId;
  title: string;
  updatedAt: string;
  body: string;
}

export interface DecisionLogEntry {
  round: number;
  eventId: string;
  eventTitle: string;
  actionLabel: string;
  posture: string;
  consequence: string;
  capitalAfter: number;
  runwayAfter: number;
  timestamp: string;
}

export interface AssumptionEntry {
  id: string;
  text: string;
  confidence: "high" | "medium" | "low";
  source: string;
  status: "active" | "shaky" | "broken";
}

export interface LintFinding {
  id: string;
  severity: "info" | "warn" | "error";
  section: WikiSectionId;
  message: string;
  suggestion: string;
}

export interface WorldReaction {
  round: number;
  headline: string;
  customers: string;
  investors: string;
  regulators: string;
  competitors: string;
  employees: string;
  chaos?: ChaosEvent;
}

export type ChaosKind =
  | "shock"
  | "acquisition-offer"
  | "merger-offer"
  | "ipo-window";

export type GameEnding = "acquired" | "merged" | "ipo";

export interface ChaosEvent {
  id: string;
  title: string;
  detail: string;
  capitalDelta?: number;
  runwayDelta?: number;
  // Kind defaults to "shock" (the historical chaos behavior). When set to
  // an ending-tier kind, endsGameAs may also be set — if so, the game ends
  // with that status after the round resolves.
  kind?: ChaosKind;
  endsGameAs?: GameEnding;
}

export interface AdvisorRecommendation {
  recommendedActionId: string;
  estimatedSuccess: number;
  perOption: { actionId: string; estimatedSuccess: number }[];
  rationale: string;
  blindSpot: string;
  playbook?: CompoundPlaybook;
}

export interface CompoundPlaybook {
  primary: { actionId: string; why: string };
  combineWith: { move: string; why: string }[];
  hedge: string;
  pivotTriggers: string[];
  lessonsCited: { ref: string; text: string }[];
}

export interface PostMortem {
  outcome: "dead" | "won" | "ongoing" | GameEnding;
  gameId: number;
  roundsSurvived: number;
  headline: string;
  rootCauseChain: string[];
  whatKilledUs?: string;
  whatSavedUs?: string;
  keyLessons: string[];
  compoundsThatWouldHaveWorked: { move: string; why: string }[];
  generatedAt: string;
}

export interface RoundState {
  index: number;
  eventId: string;
  resolved: boolean;
  chosenActionId?: string;
  customMove?: string;
  worldReaction?: WorldReaction;
  advisor?: AdvisorRecommendation;
}

export interface GameState {
  scenario: string;
  stage: string;
  currentRoundIndex: number;
  company: CompanyProfile;
  rounds: RoundState[];
  branch: BranchNode[];
  wiki: Record<WikiSectionId, WikiSection>;
  decisionLog: DecisionLogEntry[];
  assumptions: AssumptionEntry[];
  lintFindings: LintFinding[];
  worldReactions: WorldReaction[];
  lastUpdatedAt: string;
  gameId: number;
  // "won" is preserved for backward-compat with persisted v2 stores; new games
  // surface end states as "ongoing" (reached the final round alive),
  // "acquired" / "merged" / "ipo" (ending-tier chaos triggered), or "dead".
  gameStatus: "alive" | "dead" | "won" | "ongoing" | GameEnding;
  deathReason?: string;
  postMortem?: PostMortem;
}
