# Boardroom Civ

**Civilization meets Silicon Valley, powered by an agent-maintained LLM Wiki.**

Boardroom Civ is a turn-based company strategy simulator for hackathon demos. The user plays as the leadership team of an imaginary startup and reacts to major world, market, regulatory, and technology events. Every decision changes the hypothetical world, and the agent records those changes in a persistent wiki.

The key idea is not just to make a branching story game. The game state is an evolving LLM Knowledge Wiki: the agent ingests events, writes and updates structured pages, answers strategic questions from the wiki, and lints its own world model for contradictions, stale assumptions, and missing context.

## Concept

The player acts as a high-level company leader: CEO, board member, strategy chief, or crisis lead. The app presents major events that could affect the company, such as:

- A competitor open-sources a powerful model.
- A regulator announces a new compliance framework.
- A cloud provider raises compute prices.
- A viral safety incident damages public trust.
- A large enterprise customer demands an on-prem deployment.
- A rival startup launches a suspiciously similar product.

At each event, the player chooses how to respond. They can pick from strategic action cards or write a custom prompt to the agent.

The hypothetical world then reacts. The agent updates the company wiki, including strategy, timeline, competitors, assumptions, risks, decision history, and consequences.

## Why It Fits The Hackathon

The host brief asks for an LLM Knowledge Wiki project with three core operations: **Ingest**, **Query + Self-improve**, and **Lint**. Boardroom Civ turns those requirements into a playable product.

### Ingest

The system ingests event material and builds wiki pages for:

- World events
- Companies and competitors
- Market forces
- Regulations
- Technical constraints
- Strategic risks
- Causal relationships

### Query + Self-improve

The player can ask questions like:

- "Why did our reputation drop?"
- "What assumptions led to this forecast?"
- "What should we do next?"
- "Which competitor is most dangerous now?"
- "What did our last decision change?"

After each turn, the agent improves the wiki by adding missing pages, updating stale strategy notes, logging new assumptions, and connecting related concepts.

### Lint

The agent runs a wiki lint pass to detect:

- Contradictions between company state and narrative outcomes
- Unsupported claims
- Missing actor, event, or assumption pages
- Orphaned pages
- Stale facts
- Impossible causal jumps
- Strategy changes that were not reflected in the company profile

The lint results become part of the demo: users can see the agent improve its own memory instead of simply generating one-off text.

## Product Loop

1. **Start with a fictional company.**
   The player leads an imaginary startup operating in a chaotic tech market.

2. **Ingest a major event.**
   The app shows a news-style event card with relevant context.

3. **Choose a leadership response.**
   The player chooses an action card or writes a custom response.

4. **Simulate consequences.**
   The agent projects how customers, regulators, competitors, investors, employees, and the market react.

5. **Update the wiki.**
   The system writes changes into persistent pages such as `Company Strategy`, `Timeline`, `Competitors`, `Risks`, `Assumptions`, and `Decision Log`.

6. **Query the world.**
   The player can ask the agent to explain the current state or recommend a next move.

7. **Lint and self-improve.**
   The agent checks the wiki and patches weak spots before the next turn.

## Quickstart

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:5180/>.

The dev script runs both servers concurrently:

| service       | port | role                                                  |
| ------------- | ---: | ----------------------------------------------------- |
| Vite (web)    | 5180 | React app                                             |
| Express (api) | 5181 | Agent endpoints (`/api/resolve`, `/advisor`, `/lint`) |

### Going live with Claude

Copy `.env.example` → `.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-7
```

Restart `npm run dev`. The server log will switch from `OFFLINE (deterministic fallback)` to `LIVE (Anthropic API)`. Every action resolution, advisor query, and lint pass will be a real LLM call.

If a call fails for any reason the server falls back per-request, so the demo never breaks mid-show.

## MVP Demo Flow (3 minutes)

1. **Scene 1 — Idea phase.** Right rail shows three founding moves. Open **Take Action**, pick *Raise pre-seed*, posture *Balanced*, **Resolve round**.
2. **GPT-4.5 launch.** Top bar now reads *Mar 2025*. Hit **Ask Company Wiki** — the advisor returns a ranked recommendation with success bars and a *blind-spot* warning that chaos events are not modeled.
3. **Resolve a few rounds.** Watch the branch fill in. Capital, runway, and raise readiness all move with each decision. A chaos event will fire on roughly one in three rounds.
4. **Open the Living Wiki.** Click any section — *Company Profile*, *Decision Log*, *Assumptions*. Each page was rewritten by the agent in response to the rounds you played.
5. **Run Lint** in the top bar. The agent inspects its own wiki and surfaces findings (e.g. *runway snapshot stale*, *shaky assumption not linked*).
6. **Reset** returns the world to Scene 1 — no branch history, fresh wiki.

## UI

- **Timeline Map:** large expandable branching map with canon reality and Northstar's branch.
- **Current Moment Panel:** compact summary of the current scene or canon event.
- **Take Action Modal:** the only place where the user chooses a response, posture, advisor query, and round resolution.
- **Capital Panel:** cash, burn, runway, and raise readiness.
- **Living Wiki Panel:** company profile, canon timelines, decision log, assumptions, and lint.
- **World Reaction Panel:** latest simulated consequences and chaos events (rendered inside the Decision Log section of the wiki drawer).

## Architecture

- **State** lives in a Zustand store (`src/state/store.ts`). The store is persisted to `localStorage` under `boardroom-civ:v1`, so a refresh keeps your branch.
- **Round resolution** is a single `POST /api/resolve` call. The server returns: a `worldReaction` (customers / investors / regulators / competitors / employees / optional chaos), `branchOutcomes`, `newAssumptions`, `updatedAssumptionIds`, and `wikiPatches`. The store applies them atomically and rerenders the timeline, capital, and wiki.
- **Wiki sections** are kept as Markdown strings on `state.wiki`. The drawer renders them via a small inline Markdown renderer. The *Decision Log*, *Assumptions*, and *Company Profile* sections are re-derived from structured state every round. Other sections (*Competitors*, *Risks*) are append-only and patched by the agent.
- **The advisor never sees chaos.** Server-side, the advisor endpoint only receives wiki state — no chaos seed. That's deliberate: the demo makes the point that wiki-based reasoning has known limits.

## Repository Layout

```
.
├── index.html
├── package.json
├── vite.config.ts
├── server/
│   ├── index.ts        # Express, three routes, port 5181
│   ├── agent.ts        # Anthropic SDK calls + JSON parse
│   ├── fallback.ts     # deterministic offline simulator
│   └── types.ts        # re-exports of src/types.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types.ts
    ├── data/
    │   ├── canon.ts    # 6 canon events + action templates
    │   └── seed.ts     # Northstar Labs profile + seeded wiki
    ├── state/store.ts  # Zustand store, persist, reducers
    ├── lib/format.ts
    ├── components/
    │   ├── TopBar.tsx
    │   ├── TimelineMap.tsx
    │   ├── RightRail.tsx
    │   ├── TakeActionModal.tsx
    │   └── LivingWikiDrawer.tsx
    └── styles/globals.css
```

## Known Limits

- One company (Northstar Labs) and one scenario (AI Platform Wars). The canon timeline is fixed; you can extend `CANON_TIMELINE` in `src/data/canon.ts`.
- The timeline alignment treats Scene 1 as a virtual prelude that lives in the right rail, not on the map. Once the player resolves Scene 1, the branch row aligns with the canon row column-by-column.
- The minimap and zoom controls in the timeline footer are visual only — hooking up pan/zoom is left for later.

## Working Title Options

- Boardroom Civ
- Startup Civilization
- Counterfactual CEO
- Founder Mode
- Pivot Valley
- What If, Inc.

## Positioning

Boardroom Civ is a playable agent memory demo. It uses the fun of a strategy game to show the serious value of an LLM-maintained wiki: decisions compound, state persists, contradictions can be audited, and the agent gets smarter as the world evolves.

For the live pitch:

> "Think Civilization meets Silicon Valley. You play the leadership team of a fictional startup, and every decision rewrites the company wiki."

## Reference Inspiration

- [Karpathy's LLM Wiki idea](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Hackathon event brief](https://luma.com/uhda61yp)
