import SongList from "../sidebar/SongList";
import EditorPanel from "./EditorPanel";
import { Icons } from "../ui/Icon";
import { useSong } from "../../hooks/useSong";
import { useEditorStore } from "../../stores/editorStore";
import { useSongStore } from "../../stores/songStore";
import SidebarErrorBoundary from "./SidebarErrorBoundary";
import { useUIStore } from "../../stores/uiStore";
import { useState } from "react";
import MenuBar from "../shell/MenuBar";
import NewSongModal from "../ui/NewSongModal";
import SnapshotModal from "../ui/SnapshotModal";
import KeyboardShortcutsModal from "../ui/KeyboardShortcutsModal";
import AboutModal from "../ui/AboutModal";
import DeleteSongModal from "../ui/DeleteSongModal";
import { useCloseGuard } from "../../hooks/useCloseGuard";

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
    shortcutsModalOpen,
    openShortcutsModal,
    closeShortcutsModal,
    deleteSongModal,
    closeDeleteSongModal,
    aboutModalOpen,
    openAboutModal,
    closeAboutModal,
  } = useUIStore();
  const [lyricFont] = useState<string>('"Noto Serif", "Noto Serif JP", "Noto Serif KR", Georgia, serif');
  const { createSong, deleteSong } = useSong();
  const { selectSong } = useSongStore();
  const { closeSong } = useEditorStore();

  const handleCloseSong = () => {
    closeSong();
    selectSong(null);
  };
  useCloseGuard();

  const handleNewSong = () => openNewSongModal();

  return (
    <div className="h-full flex flex-col bg-bg text-primary font-ui overflow-hidden">
      <MenuBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewSong={handleNewSong}
        onShowShortcuts={openShortcutsModal}
        onCloseSong={handleCloseSong}
        onShowAbout={openAboutModal}
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
      <KeyboardShortcutsModal
        open={shortcutsModalOpen}
        onClose={closeShortcutsModal}
      />
      <AboutModal
        open={aboutModalOpen}
        onClose={closeAboutModal}
      />
      <DeleteSongModal
        open={deleteSongModal !== null}
        songTitle={deleteSongModal?.title ?? ''}
        onClose={closeDeleteSongModal}
        onConfirm={async () => {
          if (deleteSongModal) {
            await deleteSong(deleteSongModal.path)
            closeDeleteSongModal()
          }
        }}
      />
    </div>
  );
}
