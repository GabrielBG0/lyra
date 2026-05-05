import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { tauriApi } from "../../lib/tauri";
import LyraLogo from "../ui/LyraLogo";
import { Icons } from "../ui/Icon";

interface VaultSetupProps {
  onDone: (path: string) => void;
}

export default function VaultSetup({ onDone }: VaultSetupProps) {
  const [mode, setMode] = useState<"create" | "open" | null>(null);
  const [path, setPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!path.trim() || !mode) return;
    setLoading(true);
    setError(null);
    try {
      await tauriApi.vault.setVaultPath(path.trim());
      onDone(path.trim());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full grid grid-cols-2 items-center px-16 relative overflow-hidden bg-bg">
      {/* Starfield */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "radial-gradient(1.5px 1.5px at 10% 20%, rgba(255,230,200,0.7) 50%, transparent)",
            "radial-gradient(1px 1px at 25% 80%, rgba(255,230,200,0.5) 50%, transparent)",
            "radial-gradient(1px 1px at 45% 40%, rgba(255,230,200,0.4) 50%, transparent)",
            "radial-gradient(1.5px 1.5px at 60% 70%, rgba(255,230,200,0.6) 50%, transparent)",
            "radial-gradient(1px 1px at 85% 15%, rgba(255,230,200,0.5) 50%, transparent)",
            "radial-gradient(1px 1px at 90% 55%, rgba(255,230,200,0.4) 50%, transparent)",
          ].join(", "),
          opacity: 0.5,
        }}
      />

      {/* Card */}
      <div className="max-w-110 py-10 px-10 relative z-10">
        <div className="mb-6">
          <LyraLogo size={56} />
        </div>
        <h1 className="text-3xl font-semibold text-primary tracking-tight mb-2.5">
          Welcome to Lyra
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-7">
          Before you begin, point Lyra at a folder on your disk. This is your{" "}
          <span className="text-accent font-medium">vault</span>, where every
          song you write lives as a plain file.
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2">
          <button
            className={`flex items-center gap-4 px-4 py-3.5 rounded-lg border text-left transition-all font-ui text-sm cursor-pointer ${
              mode === "create"
                ? "border-accent bg-accent-soft"
                : "border-border-soft bg-surface hover:border-border hover:bg-elev"
            }`}
            onClick={() => {
              setMode("create");
              setPath("");
            }}
          >
            <div className="w-9.5 h-9.5 rounded-lg bg-elev flex items-center justify-center text-accent relative shrink-0">
              <Icons.Folder size={22} />
              <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center">
                <Icons.Plus size={9} strokeWidth={2.5} className="text-bg" />
              </span>
            </div>
            <div>
              <div className="font-semibold text-primary mb-0.5">
                Create a new vault
              </div>
              <div className="text-xs text-muted">
                Pick an empty folder. Lyra will make it yours.
              </div>
            </div>
          </button>

          <button
            className={`flex items-center gap-4 px-4 py-3.5 rounded-lg border text-left transition-all font-ui text-sm cursor-pointer ${
              mode === "open"
                ? "border-accent bg-accent-soft"
                : "border-border-soft bg-surface hover:border-border hover:bg-elev"
            }`}
            onClick={() => {
              setMode("open");
              setPath("");
            }}
          >
            <div className="w-9.5 h-9.5 rounded-lg bg-elev flex items-center justify-center text-accent shrink-0">
              <Icons.Folder size={22} />
            </div>
            <div>
              <div className="font-semibold text-primary mb-0.5">
                Open an existing vault
              </div>
              <div className="text-xs text-muted">
                Point to a folder that already has{" "}
                <code className="bg-elev text-secondary px-1 py-0.5 rounded text-xs">
                  .lyr
                </code>{" "}
                files.
              </div>
            </div>
          </button>
        </div>

        {mode && (
          <div className="mt-3.5">
            <div className="flex items-center gap-2 bg-bg border border-border-soft rounded overflow-hidden">
              <Icons.Folder size={13} className="text-faint shrink-0 ml-2.5" />
              <input
                className="flex-1 bg-transparent border-none outline-none text-primary text-xs py-2"
                placeholder={
                  mode === "create"
                    ? "~/Documents/New Lyra Vault"
                    : "~/Documents/Songs"
                }
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleContinue();
                }}
                autoFocus
              />
              <button
                className="shrink-0 px-2.5 py-2 text-xs text-secondary hover:text-primary hover:bg-elev transition-colors border-none border-l border-border-soft bg-transparent cursor-pointer"
                style={{ borderLeft: "1px solid var(--color-border-soft)" }}
                onClick={async () => {
                  const selected = await openDialog({
                    directory: true,
                    multiple: false,
                  });
                  if (selected && !Array.isArray(selected)) setPath(selected);
                }}
              >
                Browse…
              </button>
            </div>
            {error && <p className="text-xs text-brand-rose mt-1.5">{error}</p>}
          </div>
        )}

        <div className="flex items-center gap-4 mt-5">
          <button
            className="px-3 py-1.5 rounded-md bg-accent text-bg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            disabled={!mode || !path.trim() || loading}
            onClick={handleContinue}
          >
            {loading
              ? "Opening…"
              : mode === "create"
                ? "Create vault"
                : mode === "open"
                  ? "Open vault"
                  : "Continue"}
          </button>
          <p className="text-xs text-faint max-w-50 leading-snug">
            Nothing is uploaded. Your lyrics never leave this machine.
          </p>
        </div>
      </div>

      {/* Constellation side panel */}
      <div className="flex flex-col items-center gap-5 justify-self-center opacity-85">
        <LyraLogo size={160} dim />
        <p className="text-xs text-faint tracking-wide text-center max-w-55 leading-relaxed italic">
          Lyra, the lyre constellation. Home of Vega, the harp-star.
        </p>
      </div>
    </div>
  );
}
