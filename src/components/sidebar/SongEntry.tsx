import type { SongIndexEntry, SongStatus } from "../../lib/types";

interface SongEntryProps {
  song: SongIndexEntry;
  selected: boolean;
  isDirty: boolean;
  onClick: () => void;
}

const STATUS_DOT: Record<SongStatus, string> = {
  idea: "bg-status-idea",
  draft: "bg-status-draft",
  demo: "bg-status-demo",
  finished: "bg-status-finished",
};

export default function SongEntry({
  song,
  selected,
  isDirty,
  onClick,
}: SongEntryProps) {
  return (
    <button
      className={`relative flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg w-full text-left border-none cursor-pointer font-ui transition-colors ${
        selected
          ? "bg-accent-soft text-primary song-entry-selected"
          : "bg-transparent text-secondary hover:bg-elev"
      }`}
      onClick={onClick}
    >
      <span
        className={`w-2 h-2 rounded-full mt-1.25 shrink-0 ${STATUS_DOT[song.status]}`}
      />
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
          className="flex items-center gap-1 mt-0.5 text-faint"
          style={{ fontSize: 11 }}
        >
          {song.key && <span>{song.key}</span>}
          {song.bpm && (
            <>
              <span className="opacity-60">·</span>
              <span>{song.bpm}</span>
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
