import { useEffect, useState } from "react";
import { useGame } from "../state/store";
import type { WikiSectionId } from "../types";

interface MemoryStats {
  ok: boolean;
  ready: boolean;
  ingested: number;
  bytes: number;
  last_error: string | null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const ORDER: WikiSectionId[] = [
  "company-profile",
  "canon-timeline",
  "decision-log",
  "assumptions",
  "competitors",
  "risks",
  "lint-report",
];

export function LivingWikiDrawer({ sectionId }: { sectionId: WikiSectionId }) {
  const wiki = useGame((s) => s.wiki);
  const openWikiSection = useGame((s) => s.openWikiSection);
  const worldReactions = useGame((s) => s.worldReactions);
  const decisionCount = useGame((s) => s.decisionLog.length);

  const section = wiki[sectionId];
  const [memory, setMemory] = useState<MemoryStats | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") openWikiSection(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openWikiSection]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/memory-stats");
        if (!res.ok) return;
        const data = (await res.json()) as MemoryStats;
        if (!cancelled) setMemory(data);
      } catch {
        // sidecar offline — leave memory as null
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [decisionCount, sectionId]);

  return (
    <div className="drawer-overlay" onClick={() => openWikiSection(null)}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <div className="drawer-eyebrow">Living Wiki</div>
            <h2 className="drawer-title">{section.title}</h2>
            <div className="drawer-updated">Updated {new Date(section.updatedAt).toLocaleString()}</div>
          </div>
          <button className="icon-btn" onClick={() => openWikiSection(null)} aria-label="Close">×</button>
        </header>
        <nav className="drawer-nav">
          {ORDER.map((id) => (
            <button
              key={id}
              className={"drawer-nav-item" + (id === sectionId ? " is-active" : "")}
              onClick={() => openWikiSection(id)}
            >
              {wiki[id].title}
            </button>
          ))}
        </nav>
        <div className="drawer-body">
          <Markdown body={section.body} />
          {sectionId === "decision-log" && worldReactions.length > 0 && (
            <>
              <h4>Latest world reaction</h4>
              <ReactionCard r={worldReactions[worldReactions.length - 1]} />
            </>
          )}
        </div>
        <footer className="drawer-foot">
          <MemoryBadge stats={memory} />
        </footer>
      </aside>
    </div>
  );
}

function MemoryBadge({ stats }: { stats: MemoryStats | null }) {
  if (!stats || !stats.ok) {
    return (
      <span className="memory-badge memory-badge--offline" title="cognee sidecar is not reachable">
        ● Memory Graph · offline
      </span>
    );
  }
  if (!stats.ready) {
    return (
      <span className="memory-badge memory-badge--warming" title={stats.last_error ?? "warming up"}>
        ● Memory Graph · warming
      </span>
    );
  }
  return (
    <span className="memory-badge memory-badge--ready" title="cognee-backed knowledge graph">
      ● Memory Graph · {stats.ingested} round{stats.ingested === 1 ? "" : "s"} ingested · {formatBytes(stats.bytes)}
    </span>
  );
}

function ReactionCard({ r }: { r: ReturnType<typeof useGame.getState>["worldReactions"][number] }) {
  return (
    <div className="reaction-card">
      <div className="reaction-headline">{r.headline}</div>
      <div className="reaction-grid">
        <div><b>Customers.</b> {r.customers}</div>
        <div><b>Investors.</b> {r.investors}</div>
        <div><b>Regulators.</b> {r.regulators}</div>
        <div><b>Competitors.</b> {r.competitors}</div>
        <div><b>Employees.</b> {r.employees}</div>
      </div>
      {r.chaos && (
        <div className="reaction-chaos">
          <span className="chaos-label">CHAOS · {r.chaos.title}</span>
          <span>{r.chaos.detail}</span>
        </div>
      )}
    </div>
  );
}

function Markdown({ body }: { body: string }) {
  // Tiny inline markdown renderer (bold + headings + list + italics + paragraphs).
  // Good enough for the demo — we control the input.
  const html = renderMarkdown(body);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = escapeHtml(raw);
    if (line.startsWith("# ")) {
      flushList();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      flushList();
      out.push("");
    } else {
      flushList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return out.join("\n");

  function flushList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}
