import { useState, useEffect, useRef } from "react";
import type { SongStatus } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import { useSong } from "../../hooks/useSong";
import { useSnapshot } from "../../hooks/useSnapshot";
import { Icons } from "../ui/Icon";

const STATUS_DOT: Record<SongStatus, string> = {
  idea: "bg-status-idea",
  draft: "bg-status-draft",
  demo: "bg-status-demo",
  finished: "bg-status-finished",
};

const STATUS_LABELS: SongStatus[] = ["idea", "draft", "demo", "finished"];

export default function MetadataBar() {
  const { metadata, isDirty, updateMetadata } = useEditorStore();
  const { saveSong } = useSong();
  const { createSnapshot } = useSnapshot();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savedBlink, setSavedBlink] = useState(false);
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

  const handleSave = async () => {
    await saveSong();
    setSavedBlink(true);
    setTimeout(() => setSavedBlink(false), 1500);
  };

  const handleSnapshot = async () => {
    const note = window.prompt("Snapshot note (optional):");
    await createSnapshot(note ?? null);
  };

  return (
    <div
      className="px-7 pt-5 pb-4 border-b border-border-soft shrink-0"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.175 0.010 60), transparent)",
      }}
    >
      {/* Title row */}
      <div className="flex items-center gap-3.5 mb-3">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
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
              <div className="absolute top-full left-0 mt-1 bg-elev border border-border rounded-lg p-1 z-10 shadow-xl min-w-30">
                {STATUS_LABELS.map((s) => (
                  <button
                    key={s}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-primary hover:bg-accent-soft rounded text-xs cursor-pointer border-none bg-transparent transition-colors"
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
          {savedBlink && (
            <span className="text-xs text-accent px-2 py-0.5 bg-accent-soft rounded-full font-medium">
              Saved
            </span>
          )}
          <button
            className="relative w-7.5 h-7.5 flex items-center justify-center rounded text-secondary hover:bg-elev hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            title={`Save (⌘S)${isDirty ? " · unsaved changes" : ""}`}
            onClick={handleSave}
          >
            <Icons.Save size={15} />
            {isDirty && (
              <span
                className="absolute top-1.25 right-1.25 w-1.25 h-1.25 rounded-full bg-accent"
                style={{ boxShadow: "0 0 6px oklch(0.72 0.10 55)" }}
              />
            )}
          </button>
          <button
            className="w-7.5 h-7.5 flex items-center justify-center rounded text-secondary hover:bg-elev hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            title="Save version (⇧⌘S)"
            onClick={handleSnapshot}
          >
            <Icons.Camera size={15} />
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
        <MetaField
          label="Capo"
          value={(metadata.musical.capo ?? 0).toString()}
          onCommit={(v) => {
            const parsed = Number(v.trim());
            updateMetadata({
              musical: {
                ...metadata.musical,
                capo: Number.isNaN(parsed) ? null : parsed,
              },
            });
          }}
        />
        <MetaField
          label="Tuning"
          value={metadata.musical.tuning ?? "Standard"}
          width={92}
          onCommit={(v) =>
            updateMetadata({
              musical: { ...metadata.musical, tuning: v || null },
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
