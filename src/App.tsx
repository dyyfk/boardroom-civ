import { useEffect, useRef } from "react";
import { useGame } from "./state/store";
import { TopBar } from "./components/TopBar";
import { TimelineMap } from "./components/TimelineMap";
import { RightRail } from "./components/RightRail";
import { TakeActionModal } from "./components/TakeActionModal";
import { LivingWikiDrawer } from "./components/LivingWikiDrawer";
import { WorldReactionModal } from "./components/WorldReactionModal";
import { GameOverModal } from "./components/GameOverModal";

export function App() {
  const actionModalOpen = useGame((s) => s.actionModalOpen);
  const reactionModalOpen = useGame((s) => s.reactionModalOpen);
  const gameOverModalOpen = useGame((s) => s.gameOverModalOpen);
  const livingWikiOpenSection = useGame((s) => s.livingWikiOpenSection);
  const decisionLogLength = useGame((s) => s.decisionLog.length);
  const gameStatus = useGame((s) => s.gameStatus);
  const openActionModal = useGame((s) => s.openActionModal);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (gameStatus !== "alive") {
      promptedRef.current = true;
      // Game is over — surface the GameOverModal if nothing else is in the
      // way. Handles the case where the user reloads mid-post-mortem.
      if (!actionModalOpen && !reactionModalOpen && !gameOverModalOpen) {
        useGame.setState({ gameOverModalOpen: true });
      }
      return;
    }
    if (decisionLogLength > 0) {
      promptedRef.current = true;
      return;
    }
    if (promptedRef.current) return;
    if (actionModalOpen || reactionModalOpen || gameOverModalOpen) return;
    const t = setTimeout(() => {
      promptedRef.current = true;
      openActionModal();
    }, 400);
    return () => clearTimeout(t);
  }, [
    decisionLogLength,
    actionModalOpen,
    reactionModalOpen,
    gameOverModalOpen,
    gameStatus,
    openActionModal,
  ]);

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <main className="timeline-pane">
          <TimelineMap />
        </main>
        <aside className="rail-pane">
          <RightRail />
        </aside>
      </div>
      {actionModalOpen && <TakeActionModal />}
      {reactionModalOpen && <WorldReactionModal />}
      {gameOverModalOpen && <GameOverModal />}
      {livingWikiOpenSection && <LivingWikiDrawer sectionId={livingWikiOpenSection} />}
    </div>
  );
}
