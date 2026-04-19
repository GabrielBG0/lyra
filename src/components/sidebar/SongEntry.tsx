import type { SongIndexEntry, SongStatus } from "../../lib/types";

interface SongEntryProps {
  song: SongIndexEntry;
  selected: boolean;
  isDirty: boolean;
  onClick: () => void;
}

const STATUS_PILL: Record<SongStatus, string> = {
  idea:     "text-status-idea     bg-status-idea/10     border-status-idea/20",
  draft:    "text-status-draft    bg-status-draft/10    border-status-draft/20",
  demo:     "text-status-demo     bg-status-demo/10     border-status-demo/20",
  finished: "text-status-finished bg-status-finished/10 border-status-finished/20",
};

export default function SongEntry({
  song,
  selected,
  isDirty,
  onClick,
}: SongEntryProps) {
  return (
    <button
      className={`relative flex items-start px-2.5 py-2.5 rounded-lg w-full text-left border-none cursor-pointer font-ui transition-colors ${
        selected
          ? "bg-accent-soft text-primary song-entry-selected"
          : "bg-transparent text-secondary hover:bg-elev"
      }`}
      onClick={onClick}
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
          <span className={`px-1.5 py-px rounded-full border text-2xs font-semibold uppercase tracking-wide ${STATUS_PILL[song.status]}`}>
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
        {song.genre.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {song.genre.slice(0, 2).map((g) => (
              <span
                key={g}
                className="px-1.5 py-px bg-elev border border-border-soft text-faint rounded-full text-2xs font-medium"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
