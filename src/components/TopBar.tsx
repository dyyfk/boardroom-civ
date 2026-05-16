import { useGame } from "../state/store";

export function TopBar() {
  const scenario = useGame((s) => s.scenario);
  const stage = useGame((s) => s.stage);
  const currentRoundIndex = useGame((s) => s.currentRoundIndex);
  const rounds = useGame((s) => s.rounds);
  const rewind = useGame((s) => s.rewind);
  const runLint = useGame((s) => s.runLint);
  const reset = useGame((s) => s.reset);

  const currentDate = (() => {
    const round = rounds[currentRoundIndex];
    if (!round) return "—";
    return round.eventId === "scene-1" ? "Scene 1" : labelForEvent(round.eventId);
  })();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <LogoMark />
          <span>Boardroom Civ</span>
        </div>
        <Pill label="Scenario" value={scenario} />
        <Pill label="Stage" value={stage} />
        <Pill label="Round" value={currentDate} icon={<CalendarIcon />} />
      </div>
      <div className="topbar-right">
        <button className="ghost-btn" onClick={() => rewind()} title="Rewind one round">
          <RewindIcon /> Rewind
        </button>
        <button className="ghost-btn" onClick={() => reset()} title="Reset to Scene 1">
          <ResetIcon /> Reset
        </button>
        <button className="ghost-btn">
          <CompareIcon /> Compare Branches
        </button>
        <button className="ghost-btn" onClick={() => useGame.getState().openWikiSection("company-profile")}>
          <BookIcon /> Ask Company Wiki
        </button>
        <button className="ghost-btn" onClick={() => runLint()}>
          <LintIcon /> Run Lint
        </button>
        <button className="icon-btn" aria-label="Settings">
          <GearIcon />
        </button>
      </div>
    </header>
  );
}

function Pill({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="pill">
      {icon}
      <span className="pill-label">{label}</span>
      <span className="pill-value">{value}</span>
      <ChevronIcon />
    </div>
  );
}

function labelForEvent(id: string): string {
  switch (id) {
    case "scene-1":
      return "Scene 1";
    case "gpt-45-launch":
      return "Mar 2025";
    case "us-export-controls":
      return "May 2025";
    case "rival-open-weight":
      return "May 2026";
    case "eu-ai-act":
      return "Aug 2026";
    case "enterprise-ai-spend":
      return "Nov 2026";
    default:
      return id;
  }
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="#0F2F4F" strokeWidth="1.5" strokeLinejoin="round" fill="#0F2F4F" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 3V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RewindIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11 5L4 12L11 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 5L13 12L20 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 4V9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7H17M17 7L13 3M17 7L13 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17H7M7 17L11 13M7 17L11 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 4H10C11.1 4 12 4.9 12 6V20C12 18.9 11.1 18 10 18H4V4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 4H14C12.9 4 12 4.9 12 6V20C12 18.9 12.9 18 14 18H20V4Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LintIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
