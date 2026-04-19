import SongList from "../sidebar/SongList";
import EditorPanel from "./EditorPanel";
import LyraLogo from "../ui/LyraLogo";
import { Icons } from "../ui/Icon";
import { useSong } from "../../hooks/useSong";
import SidebarErrorBoundary from "./SidebarErrorBoundary";
import { useUIStore } from "../../stores/uiStore";
import { useState } from "react";
import MenuBar from "../shell/MenuBar";
import NewSongModal from "../ui/NewSongModal";
import SnapshotModal from "../ui/SnapshotModal";

interface AppShellProps {
  vaultPath: string;
}

export default function AppShell({ vaultPath }: AppShellProps) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    newSongModalOpen,
    openNewSongModal,
    closeNewSongModal,
    snapshotModalOpen,
    snapshotModalOnSubmit,
    closeSnapshotModal,
  } = useUIStore();
  const [lyricFont] = useState<string>("Newsreader, Georgia, serif");
  const { createSong } = useSong();

  const handleNewSong = () => openNewSongModal();

  return (
    <div className="h-full flex flex-col bg-bg text-primary font-ui overflow-hidden">
      <MenuBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewSong={handleNewSong}
      />
      <div className="flex flex-1 min-h-0">
        {/* Collapsed sidebar strip */}
        {sidebarCollapsed ? (
          <aside className="w-12 shrink-0 bg-panel border-r border-border-soft flex flex-col items-center py-2.5 gap-2">
            <div
              className="mb-1 text-accent text-xl leading-none select-none"
              title="Lyra"
            >
              𝄞
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
              <Icons.PanelLeftOpen size={16} />
            </button>
          </aside>
        ) : (
          <div className="relative shrink-0 h-full">
            <SidebarErrorBoundary>
              <SongList vaultPath={vaultPath} onCreateSong={handleNewSong} />
            </SidebarErrorBoundary>
            <button
              className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded text-secondary hover:bg-elev hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
              title="Collapse sidebar"
              onClick={() => setSidebarCollapsed(true)}
            >
              <Icons.PanelLeftClose size={15} />
            </button>
          </div>
        )}

        <EditorPanel lyricFont={lyricFont} onNewSong={handleNewSong} />
      </div>

      <NewSongModal
        open={newSongModalOpen}
        onClose={closeNewSongModal}
        onCreate={createSong}
      />
      <SnapshotModal
        open={snapshotModalOpen}
        onClose={closeSnapshotModal}
        onSubmit={snapshotModalOnSubmit ?? (() => {})}
      />
    </div>
  );
}
