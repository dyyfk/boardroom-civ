import { useEffect } from "react";
import clsx from "clsx";
import { useGame } from "../state/store";
import { getActionOptions, getCanonEvent } from "../data/canon";
import { fmtMoney, fmtMonths, fmtPct } from "../lib/format";
import type { WorldReaction } from "../types";

export function WorldReactionModal() {
  const dismiss = useGame((s) => s.dismissReaction);
  const reaction = useGame((s) =>
    s.worldReactions.length > 0 ? s.worldReactions[s.worldReactions.length - 1] : undefined,
  );
  const lastDecision = useGame((s) =>
    s.decisionLog.length > 0 ? s.decisionLog[s.decisionLog.length - 1] : undefined,
  );
  const prevDecision = useGame((s) =>
    s.decisionLog.length > 1 ? s.decisionLog[s.decisionLog.length - 2] : undefined,
  );
  const company = useGame((s) => s.company);
  const currentRoundIndex = useGame((s) => s.currentRoundIndex);
  const rounds = useGame((s) => s.rounds);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  if (!reaction || !lastDecision) return null;

  const resolvedEvent = getCanonEvent(lastDecision.eventId);
  const chosenAction = getActionOptions(lastDecision.eventId).find(
    (a) => a.id === rounds[currentRoundIndex - 1]?.chosenActionId,
  );

  const cashBefore = prevDecision?.capitalAfter ?? 2_400_000;
  const cashDelta = company.cash - cashBefore;
  const runwayBefore = prevDecision?.runwayAfter ?? 7.5;
  const runwayDelta = company.runwayMonths - runwayBefore;

  const nextEventId = rounds[currentRoundIndex]?.eventId;
  const nextEvent = nextEventId ? getCanonEvent(nextEventId) : null;
  const isFinalRound = !nextEvent || nextEvent.id === lastDecision.eventId;

  return (
    <div className="modal-overlay" onClick={dismiss}>
      <div
        className="modal reaction-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="reaction-head">
          <div className="reaction-eyebrow">
            <PulseDot /> WORLD REACTION · {resolvedEvent.date}
          </div>
          <h2 className="reaction-headline-title">{reaction.headline}</h2>
          {chosenAction && (
            <div className="reaction-decision-recap">
              Your move: <strong>{chosenAction.label}</strong> ·{" "}
              <span className={`posture-tag posture-${lastDecision.posture}`}>
                {lastDecision.posture}
              </span>
            </div>
          )}
        </div>

        {reaction.chaos && (
          <div className="chaos-banner">
            <div className="chaos-banner-icon">
              <WarnIcon />
            </div>
            <div className="chaos-banner-body">
              <div className="chaos-banner-tag">CHAOS EVENT</div>
              <div className="chaos-banner-title">{reaction.chaos.title}</div>
              <div className="chaos-banner-detail">{reaction.chaos.detail}</div>
            </div>
            {typeof reaction.chaos.capitalDelta === "number" && (
              <div className="chaos-banner-delta">
                {reaction.chaos.capitalDelta > 0 ? "+" : ""}
                {fmtMoney(reaction.chaos.capitalDelta)}
                <span className="chaos-banner-delta-label">cash</span>
              </div>
            )}
          </div>
        )}

        <div className="reaction-section">
          <div className="reaction-section-label">Stakeholder impact</div>
          <div className="stakeholder-stack">
            <StakeholderImpact
              icon={<UsersIcon />}
              label="Customers"
              cue="Procurement"
              body={reaction.customers}
            />
            <StakeholderImpact
              icon={<MoneyIcon />}
              label="Investors"
              cue="Capital"
              body={reaction.investors}
            />
            <StakeholderImpact
              icon={<GavelIcon />}
              label="Regulators"
              cue="Compliance"
              body={reaction.regulators}
            />
            <StakeholderImpact
              icon={<SwordsIcon />}
              label="Competitors"
              cue="Market"
              body={reaction.competitors}
            />
            <StakeholderImpact
              icon={<TeamIcon />}
              label="Employees"
              cue="Org"
              body={reaction.employees}
            />
          </div>
        </div>

        <div className="reaction-section">
          <div className="reaction-section-label">
            Meanwhile in canon · what real companies did this round
          </div>
          <div className="canon-reactions canon-reactions-reaction">
            {resolvedEvent.reactions.map((r) => (
              <div key={r.actor} className="reaction-row">
                <span className={clsx("actor-tag", `actor-${r.actor}`)}>
                  <span className="actor-icon">{actorMonogram(r.actor)}</span>
                  {actorName(r.actor)}
                </span>
                <span className="reaction-text">{r.headline}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reaction-section">
          <div className="reaction-section-label">Capital after this round</div>
          <div className="capital-deltas">
            <CapitalDelta label="Cash" value={fmtMoney(company.cash)} delta={cashDelta} format="money" />
            <CapitalDelta
              label="Runway"
              value={fmtMonths(company.runwayMonths)}
              delta={runwayDelta}
              format="months"
            />
            <CapitalDelta
              label="Raise readiness"
              value={fmtPct(company.raiseReadiness)}
              delta={0}
              format="pct"
              hideDelta
            />
          </div>
        </div>

        <div className="reaction-footer">
          <button className="ghost-btn" onClick={dismiss}>
            Stay on the map
          </button>
          {!isFinalRound && nextEvent ? (
            <button className="primary-btn" onClick={dismiss}>
              Continue to {nextEvent.date} — {nextEvent.title} →
            </button>
          ) : (
            <button className="primary-btn" onClick={dismiss}>
              Close — final round resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StakeholderImpact({
  icon,
  label,
  cue,
  body,
}: {
  icon: React.ReactNode;
  label: string;
  cue: string;
  body: string;
}) {
  const tone = impactTone(body);
  return (
    <div className={clsx("stakeholder-row", `tone-${tone}`)}>
      <div className="stakeholder-mark">{icon}</div>
      <div className="stakeholder-copy">
        <div className="stakeholder-head">
          <span className="stakeholder-label">{label}</span>
          <span className="stakeholder-cue">{cue}</span>
        </div>
        <div className="stakeholder-body">{body}</div>
      </div>
      <span className="stakeholder-signal">{tone}</span>
    </div>
  );
}

function impactTone(body: string): "watch" | "gain" | "steady" {
  const b = body.toLowerCase();
  if (b.includes("no new") || b.includes("did not") || b.includes("no attrition")) return "steady";
  if (b.includes("faster") || b.includes("committed") || b.includes("aligned")) return "gain";
  return "watch";
}

function CapitalDelta({
  label,
  value,
  delta,
  format,
  hideDelta,
}: {
  label: string;
  value: string;
  delta: number;
  format: "money" | "months" | "pct";
  hideDelta?: boolean;
}) {
  let deltaStr = "—";
  let tone: "up" | "down" | "flat" = "flat";
  if (!hideDelta && delta !== 0) {
    tone = delta > 0 ? "up" : "down";
    if (format === "money") {
      deltaStr = `${delta > 0 ? "+" : ""}${fmtMoney(delta)}`;
    } else if (format === "months") {
      deltaStr = `${delta > 0 ? "+" : ""}${delta.toFixed(1)} mo`;
    } else {
      deltaStr = `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`;
    }
  }
  return (
    <div className={clsx("capital-delta", `tone-${tone}`)}>
      <div className="capital-delta-label">{label}</div>
      <div className="capital-delta-value">{value}</div>
      {!hideDelta && <div className="capital-delta-arrow">{deltaStr}</div>}
    </div>
  );
}

function actorName(actor: string): string {
  return { openai: "OpenAI", meta: "Meta", google: "Google", nvidia: "Nvidia" }[actor] ?? actor;
}
function actorMonogram(actor: string): string {
  return { openai: "Ⓞ", meta: "∞", google: "G", nvidia: "▼" }[actor] ?? "•";
}

function PulseDot() {
  return <span className="pulse-dot" aria-hidden />;
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 14.2c1-.5 2.1-.7 3.2-.7 2.9 0 5.3 1.9 5.3 4.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function MoneyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function GavelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 4L20 10M10 8L16 14M7 11L13 17M3 21L8 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function SwordsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 4L11 11M20 4L13 11M11 11L4 18M13 11L20 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="13" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="15" y="13" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9" y="3" width="6" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L22 20H2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}
