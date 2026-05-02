import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ask } from '@tauri-apps/plugin-dialog'
import { tauriApi } from './lib/tauri'
import { useVault } from './hooks/useVault'
import { useAutosave } from './hooks/useAutosave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useEditorStore } from './stores/editorStore'
import { useSongStore } from './stores/songStore'
import { useUIStore } from './stores/uiStore'
import AppShell from './components/layout/AppShell'
import VaultSetup from './components/vault/VaultSetup'

export default function App() {
  const [vaultPath, setVaultPath] = useState<string | null | undefined>(undefined)
  const { loadSongs } = useVault()
  useAutosave()

  const { toggleSidebar, toggleHistoryBar, openNewSongModal, openSnapshotModal } = useUIStore()
  const { setSongs } = useSongStore()

  useKeyboardShortcuts({
    'save': async () => {
      const { isDirty, filePath, metadata, sections, markClean } = useEditorStore.getState()
      if (!isDirty || !filePath || !metadata) return
      await tauriApi.song.save(filePath, metadata, sections)
      markClean()
      const songs = await tauriApi.vault.listSongs()
      const updated = songs.find(s => s.file_path === filePath)
      if (updated) useSongStore.getState().upsertSong(updated)
    },
    'save-version': () => {
      const { filePath, sections } = useEditorStore.getState()
      if (!filePath) return
      openSnapshotModal(async (note) => {
        const header = await tauriApi.snapshot.create(filePath, sections, note)
        useEditorStore.getState().addSnapshotHeader(header)
      })
    },
    'new-song': () => openNewSongModal(),
    'toggle-sidebar': () => toggleSidebar(),
    'toggle-history': () => toggleHistoryBar(),
    'close-song': () => {
      useEditorStore.getState().closeSong()
      useSongStore.getState().selectSong(null)
    },
  })

  useEffect(() => {
    tauriApi.config.get().then(cfg => {
      setVaultPath(cfg.vault_path)
      if (cfg.vault_path) loadSongs()
    }).catch(() => setVaultPath(null))
  }, [])

  useEffect(() => {
    const unlisteners = [
      listen('new-song', () => openNewSongModal()),
      listen('save', async () => {
        const { isDirty, filePath, metadata, sections, markClean } = useEditorStore.getState()
        if (!isDirty || !filePath || !metadata) return
        await tauriApi.song.save(filePath, metadata, sections)
        markClean()
        const songs = await tauriApi.vault.listSongs()
        const updated = songs.find(s => s.file_path === filePath)
        if (updated) useSongStore.getState().upsertSong(updated)
      }),
      listen('save-version', () => {
        const { filePath, sections } = useEditorStore.getState()
        if (!filePath) return
        openSnapshotModal(async (note) => {
          const header = await tauriApi.snapshot.create(filePath, sections, note)
          useEditorStore.getState().addSnapshotHeader(header)
        })
      }),
      listen('toggle-sidebar', () => toggleSidebar()),
      listen('export-txt', async () => {
        const { filePath } = useEditorStore.getState()
        if (filePath) await tauriApi.export.plainText(filePath, false)
      }),
      listen('export-pdf', async () => {
        const { filePath } = useEditorStore.getState()
        if (filePath) await tauriApi.export.pdf(filePath, false)
      }),
      listen('delete-song', async () => {
        const { filePath } = useEditorStore.getState()
        if (!filePath) return
        await tauriApi.song.delete(filePath)
        useSongStore.getState().removeSong(filePath)
        useSongStore.getState().selectSong(null)
      }),
      listen('rebuild-index', async () => {
        const songs = await tauriApi.vault.rebuildIndex()
        setSongs(songs)
      }),
      listen('window:close-requested', async () => {
        const { isDirty } = useEditorStore.getState()
        if (!isDirty) {
          await getCurrentWindow().destroy()
          return
        }
        const confirmed = await ask(
          'You have unsaved changes. Close without saving?',
          { title: 'Unsaved changes', kind: 'warning' }
        )
        if (confirmed) await getCurrentWindow().destroy()
      }),
    ]

    return () => { unlisteners.forEach(p => p.then(f => f())) }
  }, [toggleSidebar, setSongs, openSnapshotModal])

  if (vaultPath === undefined) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="text-faint text-sm">Loading…</div>
      </div>
    )
  }

  if (!vaultPath) {
    return (
      <VaultSetup
        onDone={(path) => {
          tauriApi.config.set({ vault_path: path, last_opened_song: null })
            .then(() => {
              setVaultPath(path)
              loadSongs()
            })
            .catch((err) => console.error('Failed to save config:', err))
        }}
      />
    )
  }

  return <AppShell vaultPath={vaultPath} />
}
