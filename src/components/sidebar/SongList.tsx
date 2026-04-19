import { useMemo, useState } from "react";
import type { SongIndexEntry } from "../../lib/types";
import SongEntry from "./SongEntry";
import SongSearch from "./SongSearch";
import LyraLogo from "../ui/LyraLogo";
import { Icons } from "../ui/Icon";
import { useSongStore } from "../../stores/songStore";
import { useEditorStore } from "../../stores/editorStore";
import { useSong } from "../../hooks/useSong";

type SortKey = "updated" | "az" | "za" | "status";

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

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

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
    <aside className="w-65 shrink-0 bg-panel border-r border-border-soft flex flex-col h-full">
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
          <select
            className="flex-1 bg-bg border border-border-soft text-secondary px-2 py-1.5 rounded text-[11.5px] font-ui outline-none cursor-pointer appearance-none"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="updated">Newest updated</option>
            <option value="az">Title A–Z</option>
            <option value="za">Title Z–A</option>
            <option value="status">By status</option>
          </select>
          <button
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
