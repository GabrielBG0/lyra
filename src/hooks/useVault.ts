// Vault-level operations: loading the song list and reacting to file-watcher events.

import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { tauriApi } from '../lib/tauri'
import type { SongIndexEntry } from '../lib/types'
import { useSongStore } from '../stores/songStore'

export function useVault() {
  const { setSongs, upsertSong, removeSong } = useSongStore()

  const loadSongs = async () => {
    const songs = await tauriApi.vault.listSongs()
    setSongs(songs)
  }

  // React to filesystem changes emitted by the Rust file watcher.
  useEffect(() => {
    const unlisten1 = listen<SongIndexEntry>('vault:song-updated', (e) =>
      upsertSong(e.payload),
    )
    const unlisten2 = listen<string>('vault:song-removed', (e) =>
      removeSong(e.payload),
    )

    return () => {
      unlisten1.then((f) => f())
      unlisten2.then((f) => f())
    }
  }, [upsertSong, removeSong])

  return { loadSongs }
}
