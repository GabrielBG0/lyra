import { useState, useEffect, useRef } from "react";
import type { SongStatus } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import { useSnapshot } from "../../hooks/useSnapshot";
import { useUIStore } from "../../stores/uiStore";
import { Icons } from "../ui/Icon";

const STATUS_DOT: Record<SongStatus, string> = {
  idea: "bg-status-idea",
  draft: "bg-status-draft",
  demo: "bg-status-demo",
  finished: "bg-status-finished",
};

const STATUS_LABELS: SongStatus[] = ["idea", "draft", "demo", "finished"];

export default function MetadataBar() {
  const {
    metadata,
    snapshotHeaders,
    updateMetadata,
    past,
    future,
    undo,
    redo,
  } = useEditorStore();
  const { createSnapshot } = useSnapshot();
  const { openSnapshotModal } = useUIStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (metadata) setTitleDraft(metadata.title);
  }, [metadata?.title]);

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!statusRef.current) return;
      if (!statusRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  if (!metadata) return null;

  const commitTitle = () => {
    const t = titleDraft.trim();
    if (t && t !== metadata.title) updateMetadata({ title: t });
    setEditingTitle(false);
  };

  const handleSnapshot = () =>
    openSnapshotModal((note) => createSnapshot(note));

  return (
    <div
      data-tour="metadata-bar"
      className="px-7 pt-5 pb-4 border-b border-border-soft shrink-0"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.175 0.010 60), transparent)",
      }}
    >
      {/* Title row */}
      <div className="flex items-center gap-3.5 mb-3">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 shrink-0">
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
          </div>
          {editingTitle ? (
            <input
              className="text-title font-semibold bg-elev border border-accent text-primary outline-none rounded px-1 tracking-tight font-ui w-full"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
            />
          ) : (
            <h1
              className="text-title font-semibold text-primary tracking-tight cursor-text rounded px-0.5 hover:bg-elev transition-colors max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-ui group/title relative"
              onClick={() => setEditingTitle(true)}
            >
              {metadata.title}
              <span className="ml-2.5 text-[10.5px] font-normal text-faint opacity-0 group-hover/title:opacity-100 transition-opacity align-middle">
                click to rename
              </span>
            </h1>
          )}

          {/* Status pill */}
          <div ref={statusRef} className="relative shrink-0">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 bg-elev rounded-full text-primary font-medium hover:bg-panel transition-colors cursor-pointer border-none"
              style={{ fontSize: 11.5 }}
              onClick={() => setStatusOpen((o) => !o)}
            >
              <span
                className={`w-1.75 h-1.75 rounded-full ${STATUS_DOT[metadata.status]}`}
              />
              {metadata.status.charAt(0).toUpperCase() +
                metadata.status.slice(1)}
              <Icons.ChevronDown size={11} />
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 z-10 min-w-30 menu-popover">
                {STATUS_LABELS.map((s) => (
                  <button
                    key={s}
                    className="menu-item flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-secondary hover:text-primary hover:bg-panel rounded text-xs cursor-pointer border-none bg-transparent"
                    onClick={() => {
                      updateMetadata({ status: s });
                      setStatusOpen(false);
                    }}
                  >
                    <span
                      className={`w-1.75 h-1.75 rounded-full ${STATUS_DOT[s]}`}
                    />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            data-tour="snapshot-button"
            className={`h-7.5 flex flex-row-reverse items-center rounded cursor-pointer border-none bg-transparent group/pin transition-colors ${snapshotHeaders.length === 0 ? "text-accent hover:bg-elev hover:brightness-110" : "text-secondary hover:bg-elev hover:text-primary"}`}
            onClick={handleSnapshot}
          >
            <span className="w-7.5 shrink-0 flex items-center justify-center">
              <Icons.Pin size={snapshotHeaders.length === 0 ? 16 : 15} />
            </span>
            <span className="max-w-0 group-hover/pin:max-w-[6rem] overflow-hidden whitespace-nowrap transition-[max-width] duration-300 ease-out text-xs">
              <span className="pl-3 pr-1">Save a Take</span>
            </span>
          </button>
        </div>
      </div>

      {/* Fields row */}
      <div className="flex items-center gap-3.5 flex-wrap">
        <MetaField
          label="Key"
          value={metadata.musical.key ?? "—"}
          onCommit={(v) =>
            updateMetadata({ musical: { ...metadata.musical, key: v || null } })
          }
        />
        <MetaField
          label="BPM"
          value={metadata.musical.bpm?.toString() ?? "—"}
          onCommit={(v) =>
            updateMetadata({
              musical: { ...metadata.musical, bpm: Number(v) || null },
            })
          }
        />
        <div className="w-px h-5 bg-border-soft mx-0.5" />

        <ChipGroup
          label="Genre"
          items={metadata.tags.genre}
          onAdd={(v) =>
            updateMetadata({
              tags: { ...metadata.tags, genre: [...metadata.tags.genre, v] },
            })
          }
          onRemove={(v) =>
            updateMetadata({
              tags: {
                ...metadata.tags,
                genre: metadata.tags.genre.filter((g) => g !== v),
              },
            })
          }
        />
        <ChipGroup
          label="Mood"
          items={metadata.tags.mood}
          onAdd={(v) =>
            updateMetadata({
              tags: { ...metadata.tags, mood: [...metadata.tags.mood, v] },
            })
          }
          onRemove={(v) =>
            updateMetadata({
              tags: {
                ...metadata.tags,
                mood: metadata.tags.mood.filter((m) => m !== v),
              },
            })
          }
        />
        <ChipGroup
          label="Lang"
          items={metadata.tags.language}
          single
          onAdd={(v) =>
            updateMetadata({ tags: { ...metadata.tags, language: [v] } })
          }
          onRemove={() =>
            updateMetadata({ tags: { ...metadata.tags, language: [] } })
          }
        />
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  width,
  onCommit,
}: {
  label: string;
  value: string;
  width?: number;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelledRef = useRef(false);
  useEffect(() => setDraft(value), [value]);

  const handleBlur = () => {
    if (!cancelledRef.current) onCommit(draft);
    cancelledRef.current = false;
    setEditing(false);
  };

  return (
    <label className="flex flex-col gap-px cursor-text" style={{ width }}>
      <span
        className="text-faint font-semibold tracking-[0.08em] uppercase"
        style={{ fontSize: 9.5 }}
      >
        {label}
      </span>
      {editing ? (
        <input
          className="bg-transparent border-b border-accent outline-none text-primary font-ui tabular-nums"
          style={{ fontSize: 12.5, width: width ?? 52 }}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              cancelledRef.current = true;
              onCommit(draft);
              setEditing(false);
            }
            if (e.key === "Escape") {
              cancelledRef.current = true;
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          className="text-primary tabular-nums py-px"
          style={{ fontSize: 12.5 }}
          onClick={() => setEditing(true)}
        >
          {value}
        </span>
      )}
    </label>
  );
}

function ChipGroup({
  label,
  items,
  single,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  single?: boolean;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const cancelledRef = useRef(false);

  const commit = () => {
    if (draft.trim()) onAdd(draft.trim());
    setDraft("");
    setAdding(false);
  };

  const handleBlur = () => {
    if (!cancelledRef.current) commit();
    cancelledRef.current = false;
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-faint font-semibold tracking-[0.08em] uppercase"
        style={{ fontSize: 9.5 }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 px-1.5 py-px bg-elev border border-border-soft text-secondary rounded-full text-[11px] font-medium leading-snug"
          >
            {single ? item.toUpperCase() : item}
            <button
              className="text-faint hover:text-brand-rose border-none bg-transparent cursor-pointer flex p-0 ml-0.5"
              onClick={() => onRemove(item)}
            >
              <Icons.X size={9} />
            </button>
          </span>
        ))}
        {adding ? (
          <input
            className="bg-transparent border-b border-accent outline-none text-primary text-[11px] font-ui w-16"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                cancelledRef.current = true;
                commit();
              }
              if (e.key === "Escape") {
                cancelledRef.current = true;
                setAdding(false);
              }
            }}
          />
        ) : (
          <button
            className="flex items-center px-1.5 py-px bg-transparent border border-dashed border-border-soft text-muted hover:text-accent hover:border-accent rounded-full text-[11px] cursor-pointer transition-colors"
            onClick={() => {
              cancelledRef.current = false;
              setAdding(true);
            }}
          >
            <Icons.Plus size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
