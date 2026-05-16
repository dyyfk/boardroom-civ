import { useGame } from "./state/store";
import { TopBar } from "./components/TopBar";
import { TimelineMap } from "./components/TimelineMap";
import { RightRail } from "./components/RightRail";
import { TakeActionModal } from "./components/TakeActionModal";
import { LivingWikiDrawer } from "./components/LivingWikiDrawer";

export function App() {
  const actionModalOpen = useGame((s) => s.actionModalOpen);
  const livingWikiOpenSection = useGame((s) => s.livingWikiOpenSection);

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
      {livingWikiOpenSection && <LivingWikiDrawer sectionId={livingWikiOpenSection} />}
    </div>
  );
}
