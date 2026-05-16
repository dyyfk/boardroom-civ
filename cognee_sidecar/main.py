"""FastAPI sidecar that wraps cognee for Boardroom Civ.

Reads the project-root .env, reuses ANTHROPIC_API_KEY for cognee's LLM,
and uses local fastembed embeddings so no second key is required.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

anthropic_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
if anthropic_key:
    os.environ.setdefault("LLM_PROVIDER", "anthropic")
    os.environ.setdefault(
        "LLM_MODEL",
        os.getenv("COGNEE_LLM_MODEL", "claude-haiku-4-5-20251001"),
    )
    os.environ.setdefault("LLM_API_KEY", anthropic_key)

os.environ.setdefault("EMBEDDING_PROVIDER", "fastembed")
os.environ.setdefault("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
os.environ.setdefault("EMBEDDING_DIMENSIONS", "384")

DATA_DIR = Path(
    os.getenv("COGNEE_DATA_DIR")
    or str(PROJECT_ROOT / "cognee_sidecar" / ".data")
)
SYS_DIR = Path(
    os.getenv("COGNEE_SYS_DIR")
    or str(PROJECT_ROOT / "cognee_sidecar" / ".system")
)
DATA_DIR.mkdir(parents=True, exist_ok=True)
SYS_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("DATA_ROOT_DIRECTORY", str(DATA_DIR))
os.environ.setdefault("SYSTEM_ROOT_DIRECTORY", str(SYS_DIR))

from fastapi import FastAPI, HTTPException  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

try:
    import cognee  # noqa: E402
    _import_error: str | None = None
except Exception as e:  # noqa: BLE001
    cognee = None  # type: ignore[assignment]
    _import_error = f"{type(e).__name__}: {e}"

logging.basicConfig(level=logging.INFO, format="[cognee-sidecar] %(message)s")
log = logging.getLogger("cognee_sidecar")

if _import_error:
    log.warning("cognee import failed: %s", _import_error)
elif not anthropic_key:
    log.warning("ANTHROPIC_API_KEY is empty — sidecar will 503 on memory routes")
else:
    log.info(
        "cognee ready · llm=%s · embedder=%s",
        os.environ.get("LLM_MODEL", "?"),
        os.environ.get("EMBEDDING_MODEL", "?"),
    )

_ready: bool = bool(anthropic_key) and cognee is not None
_lock = asyncio.Lock()
_ingest_count = 0
_last_error: str | None = _import_error


class WorldReaction(BaseModel):
    headline: str = ""
    customers: str = ""
    investors: str = ""
    regulators: str = ""
    competitors: str = ""
    employees: str = ""
    chaos: dict[str, Any] | None = None


class WikiPatch(BaseModel):
    id: str
    appendBody: str = ""


class Assumption(BaseModel):
    id: str
    text: str
    confidence: str = "medium"
    source: str = ""
    status: str = "active"


class IngestPayload(BaseModel):
    round: int
    event_title: str
    event_date: str
    event_blurb: str = ""
    action_label: str
    posture: str
    company_name: str = "Northstar Labs"
    world_reaction: WorldReaction
    new_assumptions: list[Assumption] = Field(default_factory=list)
    wiki_patches: list[WikiPatch] = Field(default_factory=list)
    game_id: int = 1
    custom_move: str = ""


class QueryPayload(BaseModel):
    query: str
    limit: int = 5


class PostMortemPayload(BaseModel):
    game_id: int
    outcome: str  # "dead" | "won"
    rounds_survived: int
    headline: str
    root_cause_chain: list[str] = Field(default_factory=list)
    what_killed_us: str = ""
    what_saved_us: str = ""
    key_lessons: list[str] = Field(default_factory=list)
    compounds_that_would_have_worked: list[dict[str, str]] = Field(default_factory=list)
    final_cash: float = 0.0
    final_runway: float = 0.0
    company_name: str = "Northstar Labs"


def _payload_to_document(p: IngestPayload) -> str:
    lines: list[str] = [
        f"# Game {p.game_id} · Round {p.round} — {p.event_title} ({p.event_date})",
        f"Event: {p.event_blurb}".rstrip(),
        f"{p.company_name} chose: {p.action_label} (posture: {p.posture}).",
    ]
    if p.custom_move:
        lines.append(f"Compound / custom move: {p.custom_move}")
    lines += [
        "",
        f"Headline: {p.world_reaction.headline}",
        "World reaction:",
        f"  - Customers: {p.world_reaction.customers}",
        f"  - Investors: {p.world_reaction.investors}",
        f"  - Regulators: {p.world_reaction.regulators}",
        f"  - Competitors: {p.world_reaction.competitors}",
        f"  - Employees: {p.world_reaction.employees}",
    ]
    chaos = p.world_reaction.chaos
    if chaos:
        title = chaos.get("title", "")
        detail = chaos.get("detail", "")
        lines.append(f"  - Chaos: {title} — {detail}")
    if p.new_assumptions:
        lines.append("")
        lines.append("New assumptions:")
        for a in p.new_assumptions:
            tag = f"[{a.confidence}|{a.status}]"
            lines.append(f"  - {tag} {a.text} ({a.source})")
    if p.wiki_patches:
        lines.append("")
        lines.append("Wiki patches:")
        for w in p.wiki_patches:
            if w.appendBody:
                lines.append(f"  - [{w.id}] {w.appendBody}")
    return "\n".join(lines)


def _postmortem_to_document(p: PostMortemPayload) -> str:
    """Synthesize a Karpathy-style entity page for a finished game.

    Header is tagged [POST-MORTEM · Game N] so cross-game queries can recall it
    distinctly from per-round entries.
    """
    lines: list[str] = [
        f"# [POST-MORTEM · Game {p.game_id}] {p.company_name} — {p.outcome.upper()} after {p.rounds_survived} rounds",
        f"Headline: {p.headline}",
        f"Final state: cash ${p.final_cash:,.0f} · runway {p.final_runway:.1f} mo",
        "",
    ]
    if p.what_killed_us:
        lines.append(f"What killed us: {p.what_killed_us}")
    if p.what_saved_us:
        lines.append(f"What saved us: {p.what_saved_us}")
    if p.root_cause_chain:
        lines.append("")
        lines.append("Root-cause chain (ordered):")
        for i, step in enumerate(p.root_cause_chain, 1):
            lines.append(f"  {i}. {step}")
    if p.key_lessons:
        lines.append("")
        lines.append("Key lessons for future games:")
        for lesson in p.key_lessons:
            lines.append(f"  - {lesson}")
    if p.compounds_that_would_have_worked:
        lines.append("")
        lines.append("Compound strategies that would have worked (in hindsight):")
        for combo in p.compounds_that_would_have_worked:
            move = combo.get("move", "")
            why = combo.get("why", "")
            lines.append(f"  - {move} — {why}")
    return "\n".join(lines)


def _coerce_results(results: Any, limit: int) -> list[str]:
    items: list[str] = []
    if not results:
        return items
    iterable: Any
    iterable = results if isinstance(results, (list, tuple)) else [results]
    for r in iterable:
        if isinstance(r, str):
            items.append(r)
        elif isinstance(r, dict):
            text = r.get("text") or r.get("content") or r.get("answer")
            items.append(text if isinstance(text, str) and text else str(r))
        else:
            items.append(str(r))
        if len(items) >= limit:
            break
    return items


def _disk_bytes() -> int:
    total = 0
    for f in DATA_DIR.rglob("*"):
        try:
            if f.is_file():
                total += f.stat().st_size
        except OSError:
            continue
    return total


app = FastAPI(title="boardroom-civ cognee sidecar")


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "ready": _ready,
        "ingested": _ingest_count,
        "last_error": _last_error,
        "llm_model": os.environ.get("LLM_MODEL", ""),
        "embedding_model": os.environ.get("EMBEDDING_MODEL", ""),
    }


@app.post("/memory/ingest")
async def ingest(payload: IngestPayload) -> dict[str, Any]:
    global _ingest_count, _last_error
    if not _ready:
        raise HTTPException(503, _last_error or "sidecar not ready (no LLM_API_KEY)")
    doc = _payload_to_document(payload)
    try:
        async with _lock:
            await cognee.remember(doc)  # type: ignore[union-attr]
            _ingest_count += 1
        _last_error = None
        return {"ok": True, "ingested": _ingest_count, "chars": len(doc)}
    except Exception as e:  # noqa: BLE001
        log.exception("ingest failed")
        _last_error = f"{type(e).__name__}: {e}"
        raise HTTPException(500, _last_error)


@app.post("/memory/query")
async def query(payload: QueryPayload) -> dict[str, Any]:
    global _last_error
    if not _ready:
        raise HTTPException(503, _last_error or "sidecar not ready")
    try:
        results = await cognee.recall(payload.query)  # type: ignore[union-attr]
        items = _coerce_results(results, payload.limit)
        return {"ok": True, "results": items}
    except Exception as e:  # noqa: BLE001
        log.exception("query failed")
        _last_error = f"{type(e).__name__}: {e}"
        raise HTTPException(500, _last_error)


@app.post("/memory/audit")
async def audit() -> dict[str, Any]:
    global _last_error
    if not _ready:
        raise HTTPException(503, _last_error or "sidecar not ready")
    if _ingest_count == 0:
        return {"ok": True, "findings": []}
    audit_query = (
        "Examine the Northstar Labs decision graph. List up to five specific "
        "contradictions, stale facts, or orphan entities. For each, cite the "
        "round number it came from. If the graph is internally consistent, "
        "return that explicitly."
    )
    try:
        results = await cognee.recall(audit_query)  # type: ignore[union-attr]
        return {"ok": True, "findings": _coerce_results(results, 5)}
    except Exception as e:  # noqa: BLE001
        log.exception("audit failed")
        _last_error = f"{type(e).__name__}: {e}"
        raise HTTPException(500, _last_error)


@app.get("/memory/stats")
async def stats() -> dict[str, Any]:
    return {
        "ok": True,
        "ready": _ready,
        "ingested": _ingest_count,
        "bytes": _disk_bytes(),
        "last_error": _last_error,
    }


@app.post("/memory/reset")
async def reset() -> dict[str, Any]:
    global _ingest_count, _last_error
    if cognee is None:
        raise HTTPException(503, _last_error or "cognee not importable")
    try:
        async with _lock:
            await cognee.forget(everything=True)  # type: ignore[union-attr]
            _ingest_count = 0
        _last_error = None
        return {"ok": True}
    except Exception as e:  # noqa: BLE001
        log.exception("reset failed")
        _last_error = f"{type(e).__name__}: {e}"
        raise HTTPException(500, _last_error)


@app.post("/memory/postmortem")
async def postmortem(payload: PostMortemPayload) -> dict[str, Any]:
    """Ingest a structured post-mortem at end of game so future games can recall it."""
    global _ingest_count, _last_error
    if not _ready:
        raise HTTPException(503, _last_error or "sidecar not ready (no LLM_API_KEY)")
    doc = _postmortem_to_document(payload)
    try:
        async with _lock:
            await cognee.remember(doc)  # type: ignore[union-attr]
            _ingest_count += 1
        _last_error = None
        return {"ok": True, "ingested": _ingest_count, "chars": len(doc)}
    except Exception as e:  # noqa: BLE001
        log.exception("postmortem ingest failed")
        _last_error = f"{type(e).__name__}: {e}"
        raise HTTPException(500, _last_error)


def main() -> None:
    import uvicorn

    port = int(os.getenv("COGNEE_SIDECAR_PORT", "5182"))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")


if __name__ == "__main__":
    main()
    sys.exit(0)
