import { useMemo, useState, useRef, useEffect } from "react";
import type { SongIndexEntry } from "../../lib/types";
import SongEntry from "./SongEntry";
import SongSearch from "./SongSearch";
import LyraLogo from "../ui/LyraLogo";
import { Icons } from "../ui/Icon";
import { useSongStore } from "../../stores/songStore";
import { useEditorStore } from "../../stores/editorStore";
import { useSong } from "../../hooks/useSong";
import { useUIStore } from "../../stores/uiStore";

type SortKey = "updated" | "az" | "za" | "status";

const SORT_LABELS: Record<SortKey, string> = {
  updated: "Newest updated",
  az: "Title A–Z",
  za: "Title Z–A",
  status: "By status",
};

function sortSongs(songs: SongIndexEntry[], sort: SortKey): SongIndexEntry[] {
  return [...songs].sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "za") return b.title.localeCompare(a.title);
    if (sort === "status") return a.status.localeCompare(b.status);
    return b.updated_at.localeCompare(a.updated_at);
  });
}

interface SongListProps {
  vaultPath: string;
  onCreateSong: () => void;
}

export default function SongList({ vaultPath, onCreateSong }: SongListProps) {
  const { songs, selectedSongPath } = useSongStore();
  const { isDirty, filePath: openPath } = useEditorStore();
  const { openSong } = useSong();
  const { openDeleteSongModal } = useUIStore();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? songs.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.genre.some((g) => g.toLowerCase().includes(q)) ||
            s.mood.some((m) => m.toLowerCase().includes(q)) ||
            s.language.some((l) => l.toLowerCase().includes(q)),
        )
      : songs;
    return sortSongs(list, sort);
  }, [songs, query, sort]);

  const handleSelect = (path: string) => {
    if (path !== selectedSongPath) openSong(path);
  };

  return (
    <aside data-tour="sidebar" className="w-65 shrink-0 bg-panel border-r border-border-soft flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col px-3.5 pt-3.5 pb-2.5 pr-11">
        <div className="font-semibold text-primary text-[13px] tracking-wide leading-tight mb-1">
          My Songs
        </div>
        <div
          className="text-faint leading-tight font-ui"
          style={{ fontSize: 10.5 }}
        >
          {vaultPath.replace(/\\/g, "/").split("/").slice(-2).join("/")}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 px-3 pb-2.5">
        <SongSearch value={query} onChange={setQuery} />
        <div className="flex items-center gap-1.5">
          <div ref={sortRef} className="relative flex-1">
            <button
              className="flex items-center justify-between w-full bg-bg border border-border-soft text-secondary px-2 py-1.5 rounded text-[11.5px] font-ui cursor-pointer hover:border-border hover:text-primary transition-colors"
              onClick={() => setSortOpen((o) => !o)}
            >
              <span>{SORT_LABELS[sort]}</span>
              <Icons.ChevronDown size={11} className="text-faint shrink-0 ml-1" />
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 menu-popover">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    className="menu-item w-full text-left px-2.5 py-1.5 rounded text-[11.5px] cursor-pointer border-none bg-transparent hover:bg-panel text-secondary hover:text-primary"
                    onClick={() => { setSort(key); setSortOpen(false); }}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            data-tour="new-song-button"
            className="flex items-center gap-1 px-2 py-1.5 bg-transparent border border-border-soft rounded text-secondary hover:bg-elev transition-colors font-ui text-[12px] cursor-pointer"
            title="New song (⌘N)"
            onClick={onCreateSong}
          >
            <Icons.Plus size={13} />
            New
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-5 flex flex-col gap-px">
        {filtered.map((song) => (
          <SongEntry
            key={song.file_path}
            song={song}
            selected={song.file_path === selectedSongPath}
            isDirty={isDirty && song.file_path === openPath}
            onClick={() => handleSelect(song.file_path)}
            onDelete={() => openDeleteSongModal(song.file_path, song.title)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-faint text-xs px-3">
            {query ? (
              `No songs match "${query}"`
            ) : (
              <div className="flex flex-col items-center gap-3">
                <LyraLogo size={36} dim />
                <span>No songs yet. Create one to begin.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-1.5 px-4 py-2.5 border-t border-border-soft text-faint"
        style={{ fontSize: 10.5 }}
      >
        <span>
          {songs.length} song{songs.length !== 1 ? "s" : ""}
        </span>
        <span className="opacity-50">·</span>
        <span>vault synced</span>
      </div>
    </aside>
  );
}
