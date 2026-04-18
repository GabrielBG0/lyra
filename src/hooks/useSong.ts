// Song CRUD: open, save, create, delete.

import { tauriApi } from '../lib/tauri'
import type { Section, SongMetadata } from '../lib/types'
import { useEditorStore } from '../stores/editorStore'
import { useSongStore } from '../stores/songStore'

export function useSong() {
  const { loadSong, markClean, filePath, metadata, sections } = useEditorStore()
  const { upsertSong, removeSong, selectSong } = useSongStore()

  const openSong = async (path: string) => {
    const payload = await tauriApi.song.open(path)
    loadSong(payload)
    selectSong(path)
  }

  const saveSong = async (
    overridePath?: string,
    overrideMetadata?: SongMetadata,
    overrideSections?: Section[],
  ) => {
    const path = overridePath ?? filePath
    const meta = overrideMetadata ?? metadata
    const sects = overrideSections ?? sections

    if (!path || !meta) return

    await tauriApi.song.save(path, meta, sects)
    markClean()

    // Keep the sidebar index entry current.
    const songs = await tauriApi.vault.listSongs()
    const updated = songs.find((s) => s.file_path === path)
    if (updated) upsertSong(updated)
  }

  const createSong = async (title: string) => {
    const payload = await tauriApi.song.create(title)
    loadSong(payload)
    selectSong(payload.file_path)

    const songs = await tauriApi.vault.listSongs()
    const entry = songs.find((s) => s.file_path === payload.file_path)
    if (entry) upsertSong(entry)

    return payload
  }

  const deleteSong = async (path: string) => {
    await tauriApi.song.delete(path)
    removeSong(path)

    // Clear the editor if the deleted song was open.
    if (filePath === path) {
      useEditorStore.getState().loadSong({
        metadata: useEditorStore.getState().metadata!,
        sections: [],
        snapshot_headers: [],
        file_path: '',
      })
      selectSong(null)
    }
  }

  return { openSong, saveSong, createSong, deleteSong }
}
