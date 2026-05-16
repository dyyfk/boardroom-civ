import clsx from "clsx";
import { useGame, selectCurrentEventId, selectCurrentRound } from "../state/store";
import { getActionOptions, getCanonEvent } from "../data/canon";
import { fmtMoney, fmtMonths, fmtPct } from "../lib/format";
import type { WikiSectionId } from "../types";

export function RightRail() {
  return (
    <div className="rail">
      <ThisRoundPanel />
      <AskWikiPanel />
      <CapitalPanel />
      <LivingWikiPanel />
    </div>
  );
}

function ThisRoundPanel() {
  const eventId = useGame(selectCurrentEventId);
  const event = getCanonEvent(eventId);
  const options = getActionOptions(eventId);
  const openModal = useGame((s) => s.openActionModal);
  const round = useGame(selectCurrentRound);
  const advisor = round?.advisor;
  const resolving = useGame((s) => s.resolvingRound);

  return (
    <section className="panel panel-round">
      <div className="panel-head">
        <h3>This Round</h3>
        <button className="icon-btn" aria-label="More" title="More">
          <DotsIcon />
        </button>
      </div>
      <p className="panel-prompt">
        {eventId === "scene-1"
          ? "Northstar exists on paper. What's the founding move?"
          : `${event.blurb} What should Northstar do?`}
      </p>
      <div className="option-list">
        {options.map((o, i) => {
          const isRecommended = advisor?.recommendedActionId === o.id;
          return (
            <button
              key={o.id}
              className={clsx("option-btn", {
                "is-primary": i === 0,
                "is-recommended": isRecommended,
              })}
              onClick={openModal}
              disabled={resolving}
            >
              <span className="option-icon">{iconFor(o.id)}</span>
              <span className="option-text">{o.label}</span>
              {isRecommended && <span className="reco-pill">RECO</span>}
              <ChevronIcon />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AskWikiPanel() {
  const askWiki = useGame((s) => s.askWiki);
  const asking = useGame((s) => s.askingWiki);
  const round = useGame(selectCurrentRound);
  const eventId = useGame(selectCurrentEventId);
  const advisor = round?.advisor;
  const options = getActionOptions(eventId);

  return (
    <section className="panel panel-advisor">
      <div className="panel-head">
        <div className="panel-head-left">
          <BookSmall />
          <h3>Ask Company Wiki</h3>
        </div>
        <span className="advisor-tag">Advisor</span>
      </div>

      {!advisor && (
        <button className="primary-btn full-width" onClick={() => askWiki()} disabled={asking}>
          {asking ? "Querying wiki…" : "Ask the wiki for a recommendation"}
        </button>
      )}

      {advisor && (
        <>
          <div className="advisor-reco">
            <CheckCircle /> <span>Recommended: <strong>{labelOf(options, advisor.recommendedActionId)}</strong></span>
          </div>
          <div className="advisor-success">
            <span>Est. success:</span>
            <span className="advisor-pct">{fmtPct(advisor.estimatedSuccess)}</span>
          </div>
          <div className="advisor-bars">
            {advisor.perOption.map((p) => (
              <div key={p.actionId} className="bar-row">
                <span className="bar-label">{labelOf(options, p.actionId)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.round(p.estimatedSuccess * 100)}%` }} />
                </div>
                <span className="bar-pct">{fmtPct(p.estimatedSuccess)}</span>
              </div>
            ))}
          </div>
          <p className="advisor-rationale">{advisor.rationale}</p>
          <p className="advisor-blindspot">
            <InfoSmall /> {advisor.blindSpot}
          </p>
          <button className="ghost-btn small" onClick={() => askWiki()}>
            Re-query
          </button>
        </>
      )}
    </section>
  );
}

function CapitalPanel() {
  const c = useGame((s) => s.company);
  return (
    <section className="panel panel-capital">
      <div className="panel-head">
        <h3>Capital</h3>
      </div>
      <div className="capital-grid">
        <CapitalStat icon={<CashIcon />} label="Cash" value={fmtMoney(c.cash)} />
        <CapitalStat icon={<HourglassIcon />} label="Runway" value={fmtMonths(c.runwayMonths)} />
        <CapitalStat icon={<TrendIcon />} label="Raise readiness" value={fmtPct(c.raiseReadiness)} />
      </div>
      <button className="ghost-btn full-width">View details</button>
    </section>
  );
}

function CapitalStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="capital-stat">
      <div className="capital-icon">{icon}</div>
      <div className="capital-value">{value}</div>
      <div className="capital-label">{label}</div>
    </div>
  );
}

function LivingWikiPanel() {
  const openWikiSection = useGame((s) => s.openWikiSection);
  const wiki = useGame((s) => s.wiki);
  const lintFindings = useGame((s) => s.lintFindings);
  const sections: { id: WikiSectionId; label: string }[] = [
    { id: "company-profile", label: "Company Profile" },
    { id: "canon-timeline", label: "Canon Timelines" },
    { id: "decision-log", label: "Decision Log" },
    { id: "assumptions", label: "Assumptions" },
    { id: "lint-report", label: `Lint Report${lintFindings.length ? ` (${lintFindings.length})` : ""}` },
  ];
  return (
    <section className="panel panel-wiki">
      <div className="panel-head">
        <div className="panel-head-left">
          <BookSmall />
          <h3>Living Wiki</h3>
        </div>
      </div>
      <ul className="wiki-list">
        {sections.map((s) => (
          <li key={s.id}>
            <button className="wiki-row" onClick={() => openWikiSection(s.id)}>
              <span className="wiki-row-icon">
                {s.id === "lint-report" ? <LintBolt /> : <WikiDoc />}
              </span>
              <span className="wiki-row-label">{s.label}</span>
              <ChevronIcon />
            </button>
          </li>
        ))}
      </ul>
      <div className="wiki-meta">
        Last updated · {new Date(wiki["company-profile"].updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </section>
  );
}

function labelOf(options: { id: string; label: string }[], id: string): string {
  return options.find((o) => o.id === id)?.label ?? id;
}

function iconFor(actionId: string): React.ReactNode {
  switch (actionId) {
    case "enterprise-moat":
      return <ShieldIcon />;
    case "open-source-core":
      return <CodeIcon />;
    case "partner-fast":
      return <HandshakeIcon />;
    default:
      return <DotIcon />;
  }
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L4 6V12C4 17 7.5 20.5 12 22C16.5 20.5 20 17 20 12V6L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 7L4 12L9 17M15 7L20 12L15 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HandshakeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12L8 7L13 12L11 14L13 16L18 11L21 14M3 12L7 16L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
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
function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#E7F5EC" stroke="#3CC383" strokeWidth="1.6" />
      <path d="M7 12L11 16L17 9" stroke="#2E9466" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InfoSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8.5V8.5M12 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function CashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function HourglassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3H18V7L12 12L6 7V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 21H18V17L12 12L6 17V21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7H15M21 7V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function WikiDoc() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3H14L18 7V21H6V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 3V7H18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 12H15M9 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function LintBolt() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
