import { useState } from "react";
import type { SongIndexEntry, SongStatus } from "../../lib/types";
import { Icons } from "../ui/Icon";

interface SongEntryProps {
  song: SongIndexEntry;
  selected: boolean;
  isDirty: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const STATUS_PILL: Record<SongStatus, string> = {
  idea: "text-status-idea     bg-status-idea/10     border-status-idea/20",
  draft: "text-status-draft    bg-status-draft/10    border-status-draft/20",
  demo: "text-status-demo     bg-status-demo/10     border-status-demo/20",
  finished:
    "text-status-finished bg-status-finished/10 border-status-finished/20",
};

export default function SongEntry({
  song,
  selected,
  isDirty,
  onClick,
  onDelete,
}: SongEntryProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative flex items-start px-2.5 py-2.5 rounded-lg w-full text-left border-none cursor-pointer font-ui transition-colors ${
        selected
          ? "bg-accent-soft text-primary song-entry-selected"
          : "bg-transparent text-secondary hover:bg-elev"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="font-medium text-primary overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1"
            style={{ fontSize: 13 }}
          >
            {song.title}
          </span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          )}
        </div>
        <div
          className="flex items-center gap-1.5 mt-0.5 flex-wrap"
          style={{ fontSize: 11 }}
        >
          <span
            className={`px-1.5 py-px rounded-full border text-2xs font-semibold uppercase tracking-wide ${STATUS_PILL[song.status]}`}
          >
            {song.status}
          </span>
          {song.key && <span className="text-faint">{song.key}</span>}
          {song.bpm && (
            <>
              <span className="text-faint opacity-60">·</span>
              <span className="text-faint">{song.bpm}</span>
            </>
          )}
        </div>
        {(song.genre.length > 0 ||
          song.mood.length > 0 ||
          song.language.length > 0) && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {[song.genre[0], song.mood[0], song.language[0]]
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-px bg-elev border border-border-soft text-faint rounded-full text-2xs font-medium"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>

      {hovered && (
        <button
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-faint hover:text-red-400 hover:bg-red-400/10 transition-colors border-none bg-transparent cursor-pointer shrink-0"
          title="Delete song"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete song"
        >
          <Icons.Trash size={13} />
        </button>
      )}
    </div>
  );
}
