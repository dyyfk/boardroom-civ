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

## MVP Demo Flow

The 3-minute demo should make the memory loop visible:

1. Show the fictional company dashboard.
2. Ingest a major event: "A competitor open-sources a strong AI model."
3. Show the generated wiki pages for the event, competitor, market pressure, and company risks.
4. User chooses a response: "Launch our own open model, but reserve enterprise features."
5. Agent simulates the world reaction.
6. Wiki updates: strategy changes, competitor page changes, timeline entry appears, risk register changes.
7. User asks: "Why did investor confidence fall?"
8. Agent answers from the wiki.
9. Run lint.
10. Lint catches a missing assumption or contradiction and updates the wiki.

## Suggested UI

- **Event Feed:** major world events presented as news cards.
- **Leadership Console:** action cards plus custom prompt input.
- **Company Dashboard:** cash, reputation, talent, market share, product velocity, legal risk, customer trust, and compute capacity.
- **World Reaction Panel:** simulated consequences after each decision.
- **Wiki Sidebar:** persistent pages for company state, timeline, competitors, assumptions, risks, and decision log.
- **Lint Panel:** visible checks showing how the agent improves the wiki.

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
