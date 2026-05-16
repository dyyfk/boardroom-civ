import { useEffect } from "react";
import { useGame } from "../state/store";
import { fmtMoney, fmtMonths } from "../lib/format";

export function GameOverModal() {
  const gameStatus = useGame((s) => s.gameStatus);
  const gameId = useGame((s) => s.gameId);
  const deathReason = useGame((s) => s.deathReason);
  const postMortem = useGame((s) => s.postMortem);
  const company = useGame((s) => s.company);
  const decisionLog = useGame((s) => s.decisionLog);
  const generating = useGame((s) => s.generatingPostMortem);
  const newGame = useGame((s) => s.newGame);
  const dismiss = useGame((s) => s.dismissGameOver);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  const died = gameStatus === "dead";

  return (
    <div className="modal-overlay" onClick={dismiss}>
      <div
        className="modal gameover-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="gameover-head">
          <div className={`gameover-eyebrow gameover-eyebrow--${gameStatus}`}>
            {died ? "● GAME OVER" : "● SURVIVED"} · Game {gameId}
          </div>
          <h2 className="gameover-title">
            {died
              ? `Northstar Labs died in round ${decisionLog.length}.`
              : `Northstar Labs survived ${decisionLog.length} rounds.`}
          </h2>
          {deathReason && (
            <div className="gameover-reason">{deathReason}</div>
          )}
          <div className="gameover-final-state">
            <span>Final cash · <strong>{fmtMoney(company.cash)}</strong></span>
            <span>Final runway · <strong>{fmtMonths(company.runwayMonths)}</strong></span>
          </div>
        </div>

        <div className="gameover-pm-section">
          <div className="gameover-pm-eyebrow">
            POST-MORTEM · ingested to cognee brain
          </div>
          {generating && !postMortem && (
            <div className="gameover-pm-loading">
              <span className="pm-spinner" aria-hidden /> Agent is writing the post-mortem and storing it in the cognee graph…
            </div>
          )}
          {!generating && !postMortem && (
            <div className="gameover-pm-loading">
              Post-mortem unavailable — playing the next game without prior-game lessons.
            </div>
          )}
          {postMortem && (
            <>
              <div className="gameover-pm-headline">{postMortem.headline}</div>

              {died && postMortem.whatKilledUs && (
                <div className="gameover-pm-block">
                  <div className="gameover-pm-label">What killed us</div>
                  <div className="gameover-pm-body">{postMortem.whatKilledUs}</div>
                </div>
              )}
              {!died && postMortem.whatSavedUs && (
                <div className="gameover-pm-block">
                  <div className="gameover-pm-label">What saved us</div>
                  <div className="gameover-pm-body">{postMortem.whatSavedUs}</div>
                </div>
              )}

              {postMortem.rootCauseChain.length > 0 && (
                <div className="gameover-pm-block">
                  <div className="gameover-pm-label">Root-cause chain</div>
                  <ol className="gameover-pm-list">
                    {postMortem.rootCauseChain.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {postMortem.keyLessons.length > 0 && (
                <div className="gameover-pm-block">
                  <div className="gameover-pm-label">Key lessons for Game {gameId + 1}</div>
                  <ul className="gameover-pm-list">
                    {postMortem.keyLessons.map((lesson, i) => (
                      <li key={i}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              )}

              {postMortem.compoundsThatWouldHaveWorked.length > 0 && (
                <div className="gameover-pm-block">
                  <div className="gameover-pm-label">
                    Compound strategies that would have worked
                  </div>
                  <ul className="gameover-pm-list gameover-pm-list--combos">
                    {postMortem.compoundsThatWouldHaveWorked.map((c, i) => (
                      <li key={i}>
                        <strong>{c.move}</strong> — <span>{c.why}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="gameover-footer">
          <button className="ghost-btn" onClick={dismiss}>
            Stay and review
          </button>
          <button
            className="primary-btn"
            onClick={() => newGame()}
            disabled={generating}
          >
            Play Game {gameId + 1} — keep brain →
          </button>
        </div>
      </div>
    </div>
  );
}
