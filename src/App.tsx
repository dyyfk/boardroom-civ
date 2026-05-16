import { useEffect, useRef, useState } from "react";
import { useGame } from "./state/store";
import { TopBar } from "./components/TopBar";
import { TimelineMap } from "./components/TimelineMap";
import { RightRail } from "./components/RightRail";
import { TakeActionModal } from "./components/TakeActionModal";
import { LivingWikiDrawer } from "./components/LivingWikiDrawer";
import { WorldReactionModal } from "./components/WorldReactionModal";
import { FrontPage } from "./components/FrontPage";

export function App() {
  const actionModalOpen = useGame((s) => s.actionModalOpen);
  const reactionModalOpen = useGame((s) => s.reactionModalOpen);
  const livingWikiOpenSection = useGame((s) => s.livingWikiOpenSection);
  const decisionLogLength = useGame((s) => s.decisionLog.length);
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
    if (showFrontPage) return;
    if (decisionLogLength > 0) {
      promptedRef.current = true;
      setShowGuide(false);
      return;
    }
    if (promptedRef.current) return;
    if (actionModalOpen || reactionModalOpen) return;
    const t = setTimeout(() => {
      promptedRef.current = true;
      openActionModal();
    }, 800);
    return () => clearTimeout(t);
  }, [decisionLogLength, actionModalOpen, reactionModalOpen, openActionModal, showFrontPage]);

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
      {livingWikiOpenSection && <LivingWikiDrawer sectionId={livingWikiOpenSection} />}
    </div>
  );
}
