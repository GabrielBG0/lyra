// Song list and selection state.
// Populated by useVault on startup and kept live by file-watcher events.

import { create } from "zustand";
import type { SongIndexEntry } from "../lib/types";

interface SongStore {
  songs: SongIndexEntry[];
  selectedSongPath: string | null;

  setSongs: (songs: SongIndexEntry[]) => void;
  upsertSong: (entry: SongIndexEntry) => void;
  removeSong: (filePath: string) => void;
  selectSong: (path: string | null) => void;
}

export const useSongStore = create<SongStore>((set) => ({
  songs: [],
  selectedSongPath: null,

  setSongs: (songs) => set({ songs }),

  upsertSong: (entry) =>
    set((state) => {
      const exists = state.songs.some((s) => s.file_path === entry.file_path);
      if (exists) {
        return {
          songs: state.songs.map((s) =>
            s.file_path === entry.file_path ? entry : s,
          ),
        };
      }
      return { songs: [...state.songs, entry] };
    }),

  removeSong: (filePath) =>
    set((state) => ({
      songs: state.songs.filter((s) => s.file_path !== filePath),
      selectedSongPath:
        state.selectedSongPath === filePath ? null : state.selectedSongPath,
    })),

  selectSong: (path) => set({ selectedSongPath: path }),
}));
