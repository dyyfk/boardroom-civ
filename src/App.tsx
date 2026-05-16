import { useEffect, useRef } from "react";
import { useGame } from "./state/store";
import { TopBar } from "./components/TopBar";
import { TimelineMap } from "./components/TimelineMap";
import { RightRail } from "./components/RightRail";
import { TakeActionModal } from "./components/TakeActionModal";
import { LivingWikiDrawer } from "./components/LivingWikiDrawer";
import { WorldReactionModal } from "./components/WorldReactionModal";

export function App() {
  const actionModalOpen = useGame((s) => s.actionModalOpen);
  const reactionModalOpen = useGame((s) => s.reactionModalOpen);
  const livingWikiOpenSection = useGame((s) => s.livingWikiOpenSection);
  const decisionLogLength = useGame((s) => s.decisionLog.length);
  const openActionModal = useGame((s) => s.openActionModal);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (decisionLogLength > 0) {
      promptedRef.current = true;
      return;
    }
    if (promptedRef.current) return;
    if (actionModalOpen || reactionModalOpen) return;
    const t = setTimeout(() => {
      promptedRef.current = true;
      openActionModal();
    }, 400);
    return () => clearTimeout(t);
  }, [decisionLogLength, actionModalOpen, reactionModalOpen, openActionModal]);

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
      {livingWikiOpenSection && <LivingWikiDrawer sectionId={livingWikiOpenSection} />}
    </div>
  );
}
