import { useState, useEffect } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { tauriApi } from "../../lib/tauri";
import { Icons } from "./Icon";

interface VaultOptionsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VaultOptionsModal({
  open,
  onClose,
}: VaultOptionsModalProps) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      tauriApi.vault.getVaultPath().then(setCurrentPath);
      setNewPath(null);
    }
  }, [open]);

  const handleBrowse = async () => {
    const selected = await openDialog({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) return;
    setNewPath(selected);
  };

  const handleApply = async () => {
    if (!newPath) return;
    setLoading(true);
    try {
      await tauriApi.vault.setVaultPath(newPath);
      await tauriApi.config.set({ vault_path: newPath, last_opened_song: null });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const displayPath = newPath ?? currentPath;
  const hasChange = newPath !== null && newPath !== currentPath;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "oklch(0.08 0.006 60 / 0.75)",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full mx-4 rounded-xl border border-border overflow-hidden"
        style={{
          maxWidth: "26rem",
          background: "oklch(0.205 0.012 60)",
          boxShadow:
            "0 24px 64px oklch(0.06 0.005 60 / 0.8), 0 0 0 1px oklch(0.32 0.012 60 / 0.4)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.72 0.10 55 / 0.6), transparent)",
          }}
        />

        <button
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded flex items-center justify-center text-faint hover:text-secondary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <Icons.X size={15} />
        </button>

        <div className="px-6 pt-6 pb-6">
          <h2
            className="text-primary font-semibold mb-1"
            style={{ fontSize: 15, letterSpacing: "-0.01em" }}
          >
            Vault Options
          </h2>
          <p
            className="text-secondary mb-5"
            style={{ fontSize: 12.5, lineHeight: 1.5 }}
          >
            This is the folder where all your songs live.
          </p>

          <div className="mb-4">
            <label
              className="block text-muted mb-1.5 font-medium uppercase tracking-wide"
              style={{ fontSize: 10.5 }}
            >
              Vault folder
            </label>
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-bg"
            >
              <Icons.Folder size={14} className="text-accent shrink-0" />
              <span
                className="flex-1 text-secondary truncate font-mono"
                style={{ fontSize: 11.5 }}
                title={displayPath ?? undefined}
              >
                {displayPath ?? "No vault selected"}
              </span>
              <button
                className="shrink-0 px-2.5 py-1 rounded text-secondary bg-elev hover:bg-border hover:text-primary transition-colors border-none cursor-pointer"
                style={{ fontSize: 11.5 }}
                onClick={handleBrowse}
              >
                Browse…
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              className="px-3.5 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer"
              style={{ fontSize: 13 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-3.5 py-1.5 rounded-lg bg-accent text-bg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              style={{ fontSize: 13 }}
              disabled={!hasChange || loading}
              onClick={handleApply}
            >
              {loading ? "Changing…" : "Change vault"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
