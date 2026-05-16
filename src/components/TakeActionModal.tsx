import { useEffect, useState } from "react";
import clsx from "clsx";
import { useGame, selectCurrentEventId, selectCurrentRound } from "../state/store";
import { getActionOptions, getCanonEvent } from "../data/canon";
import { fmtMoneyDelta, fmtPct } from "../lib/format";
import type { ActionOption, CompanyProfile } from "../types";

const POSTURES: { id: CompanyProfile["posture"]; label: string; hint: string }[] = [
  { id: "defensive", label: "Defensive", hint: "Protect downside. Slower, safer." },
  { id: "balanced", label: "Balanced", hint: "Hedge. Default lane." },
  { id: "aggressive", label: "Aggressive", hint: "Lean into risk. Faster, louder." },
];

export function TakeActionModal() {
  const eventId = useGame(selectCurrentEventId);
  const event = getCanonEvent(eventId);
  const options = getActionOptions(eventId);
  const close = useGame((s) => s.closeActionModal);
  const resolveRound = useGame((s) => s.resolveRound);
  const askWiki = useGame((s) => s.askWiki);
  const asking = useGame((s) => s.askingWiki);
  const resolving = useGame((s) => s.resolvingRound);
  const round = useGame(selectCurrentRound);
  const advisor = round?.advisor;
  const companyPosture = useGame((s) => s.company.posture);

  const [selectedId, setSelectedId] = useState<string | undefined>(options[0]?.id);
  const [customMove, setCustomMove] = useState("");
  const [posture, setPosture] = useState<CompanyProfile["posture"]>(companyPosture);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  function onResolve() {
    void resolveRound({
      actionId: customMove.trim() ? undefined : selectedId,
      customMove: customMove.trim() || undefined,
      posture,
    });
  }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">{event.date} · {event.title}</div>
            <h2 className="modal-title">Take Action</h2>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <p className="modal-blurb">{event.blurb}</p>

        <div className="modal-section">
          <div className="modal-section-label">Response cards</div>
          <div className="modal-options">
            {options.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={selectedId === o.id && !customMove.trim()}
                recommended={advisor?.recommendedActionId === o.id}
                estimatedSuccess={advisor?.perOption.find((p) => p.actionId === o.id)?.estimatedSuccess}
                onSelect={() => {
                  setSelectedId(o.id);
                  setCustomMove("");
                }}
              />
            ))}
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-section-label">Custom move</div>
          <textarea
            className="custom-move"
            placeholder="Or write your own move — e.g. 'Hire ex-Stripe head of risk to lead a regulated-AI working group.'"
            value={customMove}
            onChange={(e) => setCustomMove(e.target.value)}
            rows={2}
          />
        </div>

        <div className="modal-section modal-section-row">
          <div className="posture-block">
            <div className="modal-section-label">Posture</div>
            <div className="posture-row">
              {POSTURES.map((p) => (
                <button
                  key={p.id}
                  className={clsx("posture-pill", { "is-active": posture === p.id })}
                  onClick={() => setPosture(p.id)}
                  title={p.hint}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="advisor-block">
            <div className="modal-section-label">Advisor</div>
            <button className="ghost-btn full-width" onClick={() => askWiki()} disabled={asking}>
              <BookSmall />
              {asking ? "Querying wiki…" : advisor ? "Re-ask Company Wiki" : "Ask Company Wiki"}
            </button>
            {advisor && (
              <div className="advisor-summary">
                Recommended: <strong>{options.find((o) => o.id === advisor.recommendedActionId)?.label}</strong>
                {" "}· {fmtPct(advisor.estimatedSuccess)}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="ghost-btn" onClick={close}>Cancel</button>
          <button
            className="primary-btn"
            onClick={onResolve}
            disabled={resolving || (!selectedId && !customMove.trim())}
          >
            {resolving ? "Resolving round…" : "Resolve round →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  recommended,
  estimatedSuccess,
  onSelect,
}: {
  option: ActionOption;
  selected: boolean;
  recommended?: boolean;
  estimatedSuccess?: number;
  onSelect: () => void;
}) {
  return (
    <button
      className={clsx("option-card", {
        "is-selected": selected,
        "is-recommended": recommended,
      })}
      onClick={onSelect}
    >
      <div className="option-card-head">
        <div className="option-card-title">{option.label}</div>
        {recommended && <span className="reco-pill">RECO</span>}
      </div>
      <div className="option-card-line">{option.oneLiner}</div>
      <div className="option-card-meta">
        <span className={`posture-tag posture-${option.posture}`}>{option.posture}</span>
        <span className="meta-chip">Burn {fmtMoneyDelta(option.burnDelta)}</span>
        <span className="meta-chip">Funding {fmtMoneyDelta(option.fundingDelta)}</span>
        {typeof estimatedSuccess === "number" && (
          <span className="meta-chip success">Est. {fmtPct(estimatedSuccess)}</span>
        )}
      </div>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BookSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5H10C11.1 5 12 5.9 12 7V20C12 19 11.1 18 10 18H4V5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 5H14C12.9 5 12 5.9 12 7V20C12 19 12.9 18 14 18H20V5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
