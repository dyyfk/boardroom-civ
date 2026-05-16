import { useGame } from "../state/store";
import { fmtMoney, fmtMonths, fmtPct } from "../lib/format";

export function FrontPage({ onStart }: { onStart: () => void }) {
  const company = useGame((s) => s.company);
  const scenario = useGame((s) => s.scenario);
  const stage = useGame((s) => s.stage);

  return (
    <main className="front-page">
      <div className="front-bg" aria-hidden>
        <span className="front-plane front-plane-a" />
        <span className="front-plane front-plane-b" />
        <span className="front-plane front-plane-c" />
        <span className="front-data front-data-left" />
        <span className="front-data front-data-right" />
      </div>

      <header className="front-nav">
        <div className="front-logo">
          <NorthstarMark />
          <span>Boardroom Civ</span>
        </div>
        <div className="front-nav-meta">
          <span>{scenario}</span>
          <span>{stage}</span>
        </div>
      </header>

      <section className="front-hero">
        <div className="front-copy">
          <div className="front-kicker">LLM Knowledge Wiki Simulation</div>
          <h1>Northstar Labs</h1>
          <p>
            Run a fictional AI company through real market shocks. Every move changes
            capital, stakeholders, and the living company wiki.
          </p>
          <div className="front-actions">
            <button className="primary-btn front-start" onClick={onStart}>
              Enter boardroom
            </button>
            <span className="front-note">JAN 2025 briefing is ready</span>
          </div>
        </div>

        <div className="front-orbit" aria-label="Company readiness display">
          <div className="orbit-ring">
            <span className="orbit-segment orbit-segment-a" />
            <span className="orbit-segment orbit-segment-b" />
            <span className="orbit-segment orbit-segment-c" />
            <span className="orbit-segment orbit-segment-d" />
            <div className="orbit-core">
              <span>GRID INDEX</span>
              <strong>{fmtPct(company.raiseReadiness)}</strong>
            </div>
          </div>
          <div className="front-loading">READY</div>
        </div>

        <div className="front-dossier">
          <div className="front-dossier-head">Opening Position</div>
          <div className="front-metrics">
            <Metric label="Cash" value={fmtMoney(company.cash)} />
            <Metric label="Runway" value={fmtMonths(company.runwayMonths)} />
            <Metric label="Burn" value={fmtMoney(company.burnPerMonth)} />
          </div>
          <div className="front-brief">
            <span>01</span>
            <p>Pre-seed company selling certainty into regulated enterprise AI.</p>
          </div>
          <div className="front-brief">
            <span>02</span>
            <p>Canon timeline tracks OpenAI, Meta, Google, and Nvidia signals.</p>
          </div>
          <div className="front-brief">
            <span>03</span>
            <p>Each choice updates assumptions, risk, decision history, and lint findings.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="front-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NorthstarMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="currentColor"
      />
    </svg>
  );
}
