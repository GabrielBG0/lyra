import { useState, useEffect, useRef } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import LyraLogo from "../ui/LyraLogo";
import { useEditorStore } from "../../stores/editorStore";
import { useSong } from "../../hooks/useSong";
import { useSnapshot } from "../../hooks/useSnapshot";
import { useUIStore } from "../../stores/uiStore";
import { tauriApi } from "../../lib/tauri";

const isMac = navigator.platform.startsWith("Mac") || navigator.userAgent.includes("Mac");
const mod = isMac ? "⌘" : "Ctrl+";
const shift = isMac ? "⇧" : "Shift+";

const MENUS = {
  File: [
    `New Song\t${mod}N`,
    `Open Vault…\t${mod}O`,
    "—",
    "Export as Plain Text…",
    `Export as PDF…\t${mod}P`,
    "—",
    `Close Song\t${mod}W`,
  ],
  Edit: [
    // TODO: Undo/Redo require an undo history stack (not yet implemented)
    `Undo\t${mod}Z`,
    `Redo\t${shift}${mod}Z`,
    "—",
    // TODO: Cut/Copy/Paste menu items (native shortcuts still work in text fields)
    `Cut\t${mod}X`,
    `Copy\t${mod}C`,
    `Paste\t${mod}V`,
    "—",
    // TODO: In-editor find/replace
    `Find…\t${mod}F`,
  ],
  Song: [
    `Save\t${mod}S`,
    `Save Take…\t${shift}${mod}S`,
    "—",
    // TODO: Snapshot history timeline panel
    `Show History\t${mod}H`,
    // TODO: Diff view between working copy and a snapshot
    `Diff with Take…\t${mod}D`,
  ],
  View: [
    `Toggle Sidebar\t${mod}\\`,
    // TODO: Font size zoom
    `Zoom In\t${mod}+`,
    `Zoom Out\t${mod}-`,
  ],
  Help: [
    `Keyboard Shortcuts…\t${mod}?`,
    "About Lyra",
  ],
};

// Labels that are wired to an actual implementation.
const IMPLEMENTED = new Set([
  "New Song",
  "Open Vault…",
  "Export as Plain Text…",
  "Export as PDF…",
  "Close Song",
  "Save",
  "Save Take…",
  "Toggle Sidebar",
  "Keyboard Shortcuts…",
  "About Lyra",
]);

interface MenuBarProps {
  onToggleSidebar: () => void;
  onNewSong: () => void;
  onShowShortcuts: () => void;
  onCloseSong: () => void;
  onShowAbout: () => void;
}

export default function MenuBar({ onToggleSidebar, onNewSong, onShowShortcuts, onCloseSong, onShowAbout }: MenuBarProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const { metadata, isDirty, filePath } = useEditorStore();
  const { saveSong } = useSong();
  const { createSnapshot } = useSnapshot();
  const { openSnapshotModal } = useUIStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const win = getCurrentWindow();

  useEffect(() => {
    win.isMaximized().then(setMaximized);
    let unlisten: (() => void) | undefined;
    win.onResized(() => win.isMaximized().then(setMaximized)).then((fn) => { unlisten = fn; });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpenVault = async () => {
    const selected = await openDialog({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) return;
    await tauriApi.vault.setVaultPath(selected);
    await tauriApi.config.set({ vault_path: selected, last_opened_song: null });
    window.location.reload();
  };

  const handleExportText = async () => {
    if (!filePath) return;
    await tauriApi.export.plainText(filePath, false);
  };

  const handleExportPdf = async () => {
    if (!filePath) return;
    await tauriApi.export.pdf(filePath, false);
  };

  const handleItem = (_menu: string, item: string) => {
    const label = item.split("\t")[0];
    if (!IMPLEMENTED.has(label)) return;
    setOpen(null);
    if (label === "New Song") onNewSong();
    else if (label === "Open Vault…") handleOpenVault();
    else if (label === "Export as Plain Text…") handleExportText();
    else if (label === "Export as PDF…") handleExportPdf();
    else if (label === "Close Song") onCloseSong();
    else if (label === "Toggle Sidebar") onToggleSidebar();
    else if (label === "Save") saveSong();
    else if (label === "Save Take…") {
      openSnapshotModal((note) => createSnapshot(note));
    } else if (label === "Keyboard Shortcuts…") onShowShortcuts();
    else if (label === "About Lyra") onShowAbout();
  };

  return (
    <div
      ref={menuRef}
      data-tauri-drag-region
      className="h-8 flex items-center gap-0 bg-panel border-b border-border-soft text-secondary relative z-50 shrink-0"
      style={{ fontSize: 12.5, paddingLeft: isMac ? 76 : 10 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-1.5 px-2.5 font-semibold text-primary text-xs tracking-wide mr-1">
        <LyraLogo size={14} glow={false} />
        Lyra
      </div>

      {/* Menu items */}
      {Object.keys(MENUS).map((menu) => (
        <div key={menu} className="relative">
          <button
            className={`px-2.5 py-1 rounded text-[12.5px] cursor-pointer transition-colors select-none ${
              open === menu
                ? "bg-elev text-primary"
                : "text-secondary hover:bg-elev hover:text-primary"
            }`}
            onMouseEnter={() => open && setOpen(menu)}
            onClick={() => setOpen(open === menu ? null : menu)}
          >
            {menu}
          </button>
          {open === menu && (
            <div className="absolute top-full left-0 mt-0.5 min-w-55 bg-elev border border-border rounded-lg p-1 shadow-2xl z-50">
              {MENUS[menu as keyof typeof MENUS].map((item, i) => {
                if (item === "—") {
                  return (
                    <div key={i} className="h-px bg-border-soft my-1 mx-1.5" />
                  );
                }
                const [label, kbd] = item.split("\t");
                const implemented = IMPLEMENTED.has(label);
                return (
                  <button
                    key={i}
                    disabled={!implemented}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded text-[12.5px] transition-colors ${
                      implemented
                        ? "text-primary hover:bg-accent-soft hover:text-accent cursor-pointer"
                        : "text-muted cursor-not-allowed opacity-50"
                    }`}
                    onClick={() => handleItem(menu, item)}
                  >
                    <span>{label}</span>
                    <span className="flex items-center gap-1.5 ml-4">
                      {!implemented && (
                        <span className="text-[9px] font-mono uppercase tracking-widest text-faint border border-border rounded px-1 py-px">
                          TODO
                        </span>
                      )}
                      {kbd && (
                        <span className="text-muted text-[11px]">{kbd}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {metadata && (
        <div className="flex items-center gap-1.5 text-faint text-[11px]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
            style={{
              boxShadow: isDirty ? "0 0 6px oklch(0.72 0.10 55)" : "none",
            }}
          />
          {metadata.title}
          {isDirty ? " · unsaved" : ""}
        </div>
      )}

      {/* Window controls — hidden on macOS (traffic lights handle this) */}
      {!isMac && <div className="flex items-center ml-2">
        <button
          onClick={() => win.minimize()}
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary hover:bg-elev transition-colors"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={() => win.toggleMaximize()}
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary hover:bg-elev transition-colors"
          title={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2.5" y="0.5" width="7" height="7" />
              <polyline points="0.5,2.5 0.5,9.5 7.5,9.5" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button
          onClick={() => win.close()}
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-white hover:bg-red-600 transition-colors"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>}
    </div>
  );
}
