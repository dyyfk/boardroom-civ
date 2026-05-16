import { useMemo } from "react";
import clsx from "clsx";
import { useGame, selectCurrentEventId } from "../state/store";
import { CANON_TIMELINE, ROUND_ORDER, getActionOptions, getCanonEvent } from "../data/canon";
import type { BranchNode, BranchOutcome } from "../types";

const ACTOR_LABELS: Record<string, string> = {
  openai: "OpenAI",
  meta: "Meta",
  google: "Google",
  nvidia: "Nvidia",
};

export function TimelineMap() {
  const currentEventId = useGame(selectCurrentEventId);
  const branch = useGame((s) => s.branch);
  const rounds = useGame((s) => s.rounds);
  const openModal = useGame((s) => s.openActionModal);
  const resolvedCount = rounds.filter((r) => r.resolved).length;
  const completionPct = Math.round((resolvedCount / rounds.length) * 100);

  const branchByEvent = useMemo(() => {
    const m = new Map<string, BranchNode>();
    for (const node of branch) m.set(node.id, node);
    return m;
  }, [branch]);

  const currentIndex = ROUND_ORDER.indexOf(currentEventId);

  const currentEvent = getCanonEvent(currentEventId);
  const currentRoundResolved = rounds[ROUND_ORDER.indexOf(currentEventId)]?.resolved;

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <h2>Timeline Map</h2>
        <div className="timeline-meta">
          <span>Branch completion</span>
          <span className="meta-value">{completionPct}%</span>
          <InfoDot />
        </div>
      </div>

      {!currentRoundResolved && (
        <div className="round-banner">
          <div className="round-banner-left">
            <span className="round-banner-pulse" aria-hidden />
            <div>
              <div className="round-banner-eyebrow">
                Round {ROUND_ORDER.indexOf(currentEventId) + 1} · {currentEvent.date}
              </div>
              <div className="round-banner-title">{currentEvent.title}</div>
              <div className="round-banner-blurb">{currentEvent.blurb}</div>
            </div>
          </div>
          <button className="primary-btn round-banner-btn" onClick={openModal}>
            Take Action →
          </button>
        </div>
      )}

      <div className="timeline-body">
        <TrackHeader label="Canon Reality" sublabel="What really happened" icon={<GlobeIcon />} />
        <CanonTrack currentEventId={currentEventId} />

        <TrackHeader
          label="Your Branch:"
          sublabel="Northstar Labs"
          subsublabel="Your choices shape this timeline"
          icon={<NorthstarIcon />}
        />
        <BranchTrack
          branchByEvent={branchByEvent}
          currentIndex={currentIndex}
          onOpenModal={openModal}
        />
      </div>

      <div className="timeline-footer">
        <div className="minimap" aria-hidden>
          <MiniMap currentIndex={currentIndex} />
        </div>
        <div className="zoom-controls">
          <button className="icon-btn" aria-label="Pan">
            <PanIcon />
          </button>
          <button className="icon-btn" aria-label="Fit">
            <FitIcon />
          </button>
          <div className="zoom-spacer" />
          <button className="icon-btn">−</button>
          <span className="zoom-pct">42%</span>
          <button className="icon-btn">+</button>
        </div>
        <Legend />
      </div>
    </div>
  );
}

function TrackHeader({
  label,
  sublabel,
  subsublabel,
  icon,
}: {
  label: string;
  sublabel: string;
  subsublabel?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="track-header">
      <div className="track-icon">{icon}</div>
      <div className="track-label">
        <div className="track-title">{label}</div>
        <div className="track-sublabel">{sublabel}</div>
        {subsublabel && <div className="track-subsublabel">{subsublabel}</div>}
      </div>
    </div>
  );
}

function CanonTrack({ currentEventId }: { currentEventId: string }) {
  return (
    <div className="canon-track">
      <div className="track-rail track-rail-canon" />
      <div className="nodes">
        {CANON_TIMELINE.filter((e) => e.id !== "scene-1").map((event, i) => {
          const isCurrent = event.id === currentEventId;
          return (
            <div
              key={event.id}
              className={clsx("canon-node-wrapper", { "is-current": isCurrent })}
            >
              <div className={clsx("canon-card", { "is-current": isCurrent })}>
                <div className="canon-date">{event.date}</div>
                <div className="canon-title">{event.title}</div>
                <div className={clsx("canon-thumb", `thumb-${event.imageHint}`)}>
                  <Thumb event={event.id} />
                </div>
              </div>
              <div className="canon-reactions">
                {event.reactions.map((r) => (
                  <div key={r.actor} className="reaction-row">
                    <span className={clsx("actor-tag", `actor-${r.actor}`)}>
                      <ActorIcon actor={r.actor} /> {ACTOR_LABELS[r.actor]}
                    </span>
                    <span className="reaction-text">{r.headline}</span>
                  </div>
                ))}
              </div>
              <div className="node-dot canon-dot" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BranchTrack({
  branchByEvent,
  currentIndex,
  onOpenModal,
}: {
  branchByEvent: Map<string, BranchNode>;
  currentIndex: number;
  onOpenModal: () => void;
}) {
  const allEvents = CANON_TIMELINE.filter((e) => e.id !== "scene-1");
  return (
    <div className="branch-track">
      <div className="track-rail track-rail-branch" />
      <div className="nodes">
        {allEvents.map((event, i) => {
          const eventIdx = ROUND_ORDER.indexOf(event.id);
          const node = branchByEvent.get(event.id);
          const isCurrent = eventIdx === currentIndex;
          const isPast = eventIdx < currentIndex;
          const isFuture = eventIdx > currentIndex;

          if (isPast && node) {
            return (
              <div key={event.id} className="branch-node-wrapper is-completed">
                <CompletedBranchCard node={node} />
                {node.outcomes && <OutcomeRow outcomes={node.outcomes} />}
                <div className="node-dot branch-dot branch-dot-completed">
                  <CheckMark />
                </div>
              </div>
            );
          }
          if (isCurrent) {
            return (
              <div key={event.id} className="branch-node-wrapper is-current">
                <CurrentBranchCard event={event.id} onOpenModal={onOpenModal} />
                <ChaosLane />
                <div className="node-dot branch-dot branch-dot-current" />
              </div>
            );
          }
          // future
          return (
            <div key={event.id} className="branch-node-wrapper is-upcoming">
              <FutureBranchCard event={event.id} />
              <div className="node-dot branch-dot branch-dot-upcoming" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompletedBranchCard({ node }: { node: BranchNode }) {
  const action = node.chosenActionId
    ? getActionOptions(node.id).find((a) => a.id === node.chosenActionId)
    : null;
  return (
    <div className="branch-card branch-card-completed">
      <div className="branch-date">{node.date}</div>
      <div className="branch-title">{node.title}</div>
      <div className="branch-thumb thumb-completed">
        <Thumb event={node.id} muted />
      </div>
      <div className="branch-chosen">
        <CheckMark /> {action ? action.label : "Resolved"}
      </div>
    </div>
  );
}

function CurrentBranchCard({
  event,
  onOpenModal,
}: {
  event: string;
  onOpenModal: () => void;
}) {
  const ev = getCanonEvent(event);
  const opts = getActionOptions(event);
  return (
    <div className="branch-card branch-card-current">
      <div className="branch-date">{ev.date}</div>
      <div className="branch-title">{ev.title}</div>
      <div className="branch-thumb">
        <Thumb event={event} />
      </div>
      <div className="branch-your-decision">Your decision</div>
      <div className="branch-options">
        {opts.map((o, i) => (
          <button
            key={o.id}
            className={clsx("branch-option", { "is-primary": i === 0 })}
            onClick={onOpenModal}
          >
            <span className="opt-label">{o.label}</span>
            <ChevronIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

function FutureBranchCard({ event }: { event: string }) {
  const ev = getCanonEvent(event);
  return (
    <div className="branch-card branch-card-future">
      <div className="branch-date muted">{ev.date}</div>
      <div className="branch-title muted">{ev.title}</div>
      <div className="branch-locked">
        <LockIcon /> Build community
        <span className="muted-sub">UNKNOWN OUTCOME</span>
      </div>
    </div>
  );
}

function OutcomeRow({ outcomes }: { outcomes: BranchOutcome[] }) {
  return (
    <div className="outcome-row">
      {outcomes.map((o) => (
        <div
          key={o.id}
          className={clsx("outcome-pill", `outcome-${o.status}`)}
        >
          <span className="outcome-icon">
            {o.status === "completed" && <MonitorIcon />}
            {o.status === "warning" && <WarnIcon />}
            {o.status === "locked" && <LockIcon />}
            {o.status === "chaos" && <WarnIcon />}
          </span>
          <span className="outcome-label">{o.label}</span>
          {o.detail && <span className="outcome-detail">{o.detail}</span>}
          {!o.detail && o.status === "locked" && <span className="outcome-detail">LOCKED</span>}
        </div>
      ))}
    </div>
  );
}

function ChaosLane() {
  // The chaos lane sits below the current node — burn, investor doubt, etc.
  return (
    <div className="chaos-lane">
      <div className="chaos-line" />
      <div className="chaos-row">
        <div className="chaos-chip chaos-chip-hired">
          <UsersIcon /> Hired engineers
        </div>
        <div className="chaos-chip chaos-chip-burn">
          <FireIcon /> Burn increased
          <span className="chaos-sub">-$180k/mo</span>
        </div>
        <div className="chaos-chip chaos-chip-warn">
          <WarnIcon /> Investor doubt
          <span className="chaos-sub">-12% confidence</span>
        </div>
        <div className="chaos-chip chaos-chip-locked">
          <LockIcon /> Down round risk
          <span className="chaos-sub">LOCKED</span>
        </div>
      </div>
    </div>
  );
}

function Thumb({ event, muted }: { event: string; muted?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 110"
      className={clsx("thumb-svg", { muted })}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bg-${event}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F2F4F" />
          <stop offset="1" stopColor="#1B4A7A" />
        </linearGradient>
        <radialGradient id={`glow-${event}`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#7FB6FF" stopOpacity="0.7" />
          <stop offset="1" stopColor="#7FB6FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="110" fill={`url(#bg-${event})`} />
      <circle cx="100" cy="55" r="46" fill={`url(#glow-${event})`} />
      <ThumbVariant event={event} />
    </svg>
  );
}

function ThumbVariant({ event }: { event: string }) {
  switch (event) {
    case "gpt-45-launch":
      return (
        <g stroke="#7FB6FF" strokeWidth="1.4" fill="none">
          <rect x="60" y="35" width="80" height="50" rx="6" />
          <text
            x="100"
            y="65"
            fill="#7FB6FF"
            fontFamily="JetBrains Mono"
            fontSize="14"
            textAnchor="middle"
          >
            GPT-4.5
          </text>
        </g>
      );
    case "us-export-controls":
      return (
        <g stroke="#7FB6FF" strokeWidth="1.4" fill="none">
          <rect x="50" y="35" width="100" height="50" rx="4" />
          <path d="M50 50 H150 M50 65 H150 M50 80 H150" />
          <text x="100" y="98" fill="#7FB6FF" fontSize="9" textAnchor="middle">EXPORT LICENSE</text>
        </g>
      );
    case "rival-open-weight":
      return (
        <g stroke="#7FB6FF" strokeWidth="1" fill="none">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return (
              <line
                key={i}
                x1="100"
                y1="55"
                x2={100 + Math.cos(a) * 35}
                y2={55 + Math.sin(a) * 35}
              />
            );
          })}
          <circle cx="100" cy="55" r="5" fill="#7FB6FF" />
        </g>
      );
    case "eu-ai-act":
      return (
        <g>
          <rect x="60" y="30" width="80" height="60" fill="#0F2F4F" stroke="#7FB6FF" strokeWidth="1.4" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <polygon
                key={i}
                points="0,-4 1.2,-1.2 4,-1.2 1.8,0.8 2.4,4 0,2 -2.4,4 -1.8,0.8 -4,-1.2 -1.2,-1.2"
                fill="#FFD24A"
                transform={`translate(${100 + Math.cos(a) * 24}, ${60 + Math.sin(a) * 22})`}
              />
            );
          })}
        </g>
      );
    case "enterprise-ai-spend":
      return (
        <g stroke="#3CC383" strokeWidth="1.8" fill="none">
          <polyline points="40,85 70,72 95,75 125,55 160,38" />
          <circle cx="160" cy="38" r="3" fill="#3CC383" />
        </g>
      );
    default:
      return null;
  }
}

function MiniMap({ currentIndex }: { currentIndex: number }) {
  return (
    <svg viewBox="0 0 220 90" className="minimap-svg" aria-hidden>
      <line x1="10" y1="25" x2="210" y2="25" stroke="#bcd0e6" strokeWidth="1" />
      <line x1="10" y1="65" x2="210" y2="65" stroke="#5594D6" strokeWidth="1" />
      {ROUND_ORDER.filter((id) => id !== "scene-1").map((id, i, arr) => {
        const x = 25 + i * ((210 - 25) / (arr.length - 1));
        return (
          <g key={id}>
            <circle cx={x} cy={25} r={3} fill="#bcd0e6" />
            <circle
              cx={x}
              cy={65}
              r={i === currentIndex - 1 ? 5 : 3}
              fill={i < currentIndex - 1 ? "#1E62A9" : i === currentIndex - 1 ? "#1E62A9" : "#bcd0e6"}
              stroke={i === currentIndex - 1 ? "#1E62A9" : "none"}
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
}

function Legend() {
  return (
    <div className="legend">
      <LegendItem icon={<CheckMark />} label="Completed" tone="completed" />
      <LegendItem icon={<DotIcon />} label="Current Decision" tone="current" />
      <LegendItem icon={<CircleIcon />} label="Upcoming" tone="upcoming" />
      <LegendItem icon={<LockIcon />} label="Unknown / Locked" tone="locked" />
      <LegendItem icon={<WarnIcon />} label="Chaos Event" tone="chaos" />
      <button className="ghost-btn legend-btn">
        <LegendIcon /> Legend
      </button>
    </div>
  );
}

function LegendItem({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: string }) {
  return (
    <div className={clsx("legend-item", `legend-${tone}`)}>
      <span className="legend-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// Icons
function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    </svg>
  );
}
function CircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L22 20H2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 14.2c1-.5 2.1-.7 3.2-.7 2.9 0 5.3 1.9 5.3 4.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function FireIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3s4 4 4 8a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-1.5 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-6-6-11-6-11z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function InfoDot() {
  return (
    <span className="info-dot" aria-hidden>
      i
    </span>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4L9 7M12 4L15 7M12 20L9 17M12 20L15 17M4 12L7 9M4 12L7 15M20 12L17 9M20 12L17 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function FitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9V4H9M20 9V4H15M4 15V20H9M20 15V20H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LegendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12H21" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3C15 6 16.5 9 16.5 12C16.5 15 15 18 12 21C9 18 7.5 15 7.5 12C7.5 9 9 6 12 3Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function NorthstarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke="#0F2F4F"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="#0F2F4F"
      />
    </svg>
  );
}
function ActorIcon({ actor }: { actor: string }) {
  // little 10px monogram
  const initials: Record<string, string> = {
    openai: "Ⓞ",
    meta: "∞",
    google: "G",
    nvidia: "▼",
  };
  return <span className="actor-icon">{initials[actor] ?? "•"}</span>;
}
