import SongList from "../sidebar/SongList";
import EditorPanel from "./EditorPanel";
import LyraLogo from "../ui/LyraLogo";
import { Icons } from "../ui/Icon";
import { useSong } from "../../hooks/useSong";
import SidebarErrorBoundary from "./SidebarErrorBoundary";
import { useUIStore } from "../../stores/uiStore";
import { useState } from "react";

interface AppShellProps {
  vaultPath: string;
}

export default function AppShell({ vaultPath }: AppShellProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [lyricFont] = useState<string>("Newsreader, Georgia, serif");
  const { createSong } = useSong();

  const handleNewSong = async () => {
    const title = window.prompt("Song title:");
    if (title?.trim()) await createSong(title.trim());
  };

  return (
    <div className="h-full flex flex-col bg-bg text-primary font-ui overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Collapsed sidebar strip */}
        {sidebarCollapsed ? (
          <aside className="w-12 shrink-0 bg-panel border-r border-border-soft flex flex-col items-center py-2.5 gap-2">
            <div className="mb-1">
              <LyraLogo size={22} />
            </div>
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:bg-elev hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
              title="New song"
              onClick={handleNewSong}
            >
              <Icons.Plus size={16} />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:bg-elev hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
              title="Expand sidebar"
              onClick={() => setSidebarCollapsed(false)}
            >
              <Icons.ChevronRight size={16} />
            </button>
          </aside>
        ) : (
          <div className="relative shrink-0">
            <SidebarErrorBoundary>
              <SongList vaultPath={vaultPath} onCreateSong={handleNewSong} />
            </SidebarErrorBoundary>
            <button
              className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded text-secondary hover:bg-elev hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
              title="Collapse sidebar"
              onClick={() => setSidebarCollapsed(true)}
            >
              <Icons.PanelLeft size={15} />
            </button>
          </div>
        )}

        <EditorPanel lyricFont={lyricFont} onNewSong={handleNewSong} />
      </div>
    </div>
  );
}
