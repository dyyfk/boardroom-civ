import express from "express";
import { agentAdvisor, agentLint, agentResolve, isLive } from "./agent";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, live: isLive() });
});

app.post("/api/resolve", async (req, res) => {
  try {
    const out = await agentResolve(req.body);
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/advisor", async (req, res) => {
  try {
    const out = await agentAdvisor(req.body);
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/lint", async (req, res) => {
  try {
    const out = await agentLint(req.body);
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = Number(process.env.BOARDROOM_API_PORT ?? 5181);
app.listen(port, () => {
  console.log(`[boardroom-civ] server on :${port} — ${isLive() ? "LIVE (Anthropic API)" : "OFFLINE (deterministic fallback)"}`);
});
