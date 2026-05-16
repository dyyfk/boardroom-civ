import { useEffect, useRef, useState } from "react";
import { useGame } from "./state/store";
import { TopBar } from "./components/TopBar";
import { TimelineMap } from "./components/TimelineMap";
import { RightRail } from "./components/RightRail";
import { TakeActionModal } from "./components/TakeActionModal";
import { LivingWikiDrawer } from "./components/LivingWikiDrawer";
import { WorldReactionModal } from "./components/WorldReactionModal";
import { GameOverModal } from "./components/GameOverModal";
import { FrontPage } from "./components/FrontPage";

export function App() {
  const actionModalOpen = useGame((s) => s.actionModalOpen);
  const reactionModalOpen = useGame((s) => s.reactionModalOpen);
  const gameOverModalOpen = useGame((s) => s.gameOverModalOpen);
  const livingWikiOpenSection = useGame((s) => s.livingWikiOpenSection);
  const decisionLogLength = useGame((s) => s.decisionLog.length);
  const gameStatus = useGame((s) => s.gameStatus);
  const openActionModal = useGame((s) => s.openActionModal);
  const promptedRef = useRef(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showFrontPage, setShowFrontPage] = useState(() => {
    try {
      return sessionStorage.getItem("boardroom-civ:entered") !== "true";
    } catch {
      return true;
    }
  });

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
    if (showFrontPage) return;
    if (decisionLogLength > 0) {
      promptedRef.current = true;
      setShowGuide(false);
      return;
    }
    if (promptedRef.current) return;
    if (actionModalOpen || reactionModalOpen || gameOverModalOpen) return;
    const t = setTimeout(() => {
      promptedRef.current = true;
      openActionModal();
    }, 800);
    return () => clearTimeout(t);
  }, [
    decisionLogLength,
    actionModalOpen,
    reactionModalOpen,
    gameOverModalOpen,
    gameStatus,
    openActionModal,
    showFrontPage,
  ]);

  useEffect(() => {
    if (decisionLogLength > 0 && showFrontPage) {
      setShowFrontPage(false);
    }
  }, [decisionLogLength, showFrontPage]);

  function enterBoardroom() {
    try {
      sessionStorage.setItem("boardroom-civ:entered", "true");
    } catch {
      // session storage is optional UI state
    }
    promptedRef.current = true;
    setShowFrontPage(false);
    setShowGuide(true);
    window.setTimeout(() => openActionModal(), 260);
  }

  if (showFrontPage && decisionLogLength === 0) {
    return <FrontPage onStart={enterBoardroom} />;
  }

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <main className="timeline-pane">
          <TimelineMap />
          {showGuide && decisionLogLength === 0 && !actionModalOpen && (
            <div className="onboard-guide" onClick={openActionModal}>
              <span>Click "Take Action" to make your first strategic decision</span>
              <span style={{ opacity: 0.5 }}>→</span>
            </div>
          )}
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
