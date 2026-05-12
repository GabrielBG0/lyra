import { useEditorStore } from "../../stores/editorStore";
import { useUIStore } from "../../stores/uiStore";
import { useSnapshot } from "../../hooks/useSnapshot";
import { Icons } from "../ui/Icon";

export default function ZenToolbar() {
  const { past, future, undo, redo, isDirty, metadata } = useEditorStore();
  const { exitZenMode, openSnapshotModal } = useUIStore();
  const { createSnapshot } = useSnapshot();

  const handleSaveTake = () =>
    openSnapshotModal((note) => createSnapshot(note));

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-panel border border-border-soft shadow-lg">
      <button
        className="w-7 h-7 flex items-center justify-center rounded text-faint hover:bg-elev hover:text-secondary transition-colors border-none bg-transparent cursor-pointer"
        title="Exit zen mode (F11)"
        onClick={exitZenMode}
      >
        <Icons.Minimize2 size={14} />
      </button>

      <div className="w-px h-4 bg-border-soft mx-1" />

      <button
        className="w-6.5 h-6.5 flex items-center justify-center rounded text-faint hover:bg-elev hover:text-secondary transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-faint"
        title={
          past.length > 0
            ? `Undo: ${past[past.length - 1].description}`
            : "Undo"
        }
        disabled={past.length === 0}
        onClick={undo}
      >
        <Icons.Undo size={13} />
      </button>
      <button
        className="w-6.5 h-6.5 flex items-center justify-center rounded text-faint hover:bg-elev hover:text-secondary transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-faint"
        title={
          future.length > 0
            ? `Redo: ${future[future.length - 1].description}`
            : "Redo"
        }
        disabled={future.length === 0}
        onClick={redo}
      >
        <Icons.Redo size={13} />
      </button>

      <div className="w-px h-4 bg-border-soft mx-1" />

      <button
        className="w-6.5 h-6.5 flex items-center justify-center rounded text-faint hover:bg-elev hover:text-secondary transition-colors border-none bg-transparent cursor-pointer"
        title="Save Take"
        onClick={handleSaveTake}
      >
        <Icons.Pin size={14} />
      </button>

      {metadata && (
        <>
          <div className="w-px h-4 bg-border-soft mx-1" />
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={
              isDirty
                ? {
                    background: "oklch(0.72 0.10 55)",
                    boxShadow: "0 0 6px oklch(0.72 0.10 55)",
                  }
                : {
                    background: "oklch(0.72 0.10 55 / 0.18)",
                    border: "1.5px solid oklch(0.72 0.10 55 / 0.45)",
                  }
            }
          />
        </>
      )}
    </div>
  );
}
