import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ask } from '@tauri-apps/plugin-dialog'
import { tauriApi } from './lib/tauri'
import type { SongIndexEntry } from './lib/types'
import { useVault } from './hooks/useVault'
import { useAutosave } from './hooks/useAutosave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useEditorStore } from './stores/editorStore'
import { useSongStore } from './stores/songStore'
import { useUIStore } from './stores/uiStore'
import { useTourStore } from './stores/tourStore'
import AppShell from './components/layout/AppShell'
import VaultSetup from './components/vault/VaultSetup'
import TourOverlay from './components/tour/TourOverlay'

async function startTour(songs: SongIndexEntry[]) {
  console.log('[Tour] startTour called, songs:', songs.length)
  if (songs.length === 0) {
    const payload = await tauriApi.song.create('Welcome to Lyra')
    useEditorStore.getState().loadSong(payload)
    useSongStore.getState().selectSong(payload.file_path)
    const all = await tauriApi.vault.listSongs()
    const entry = all.find(s => s.file_path === payload.file_path)
    if (entry) useSongStore.getState().upsertSong(entry)
  } else {
    const payload = await tauriApi.song.open(songs[0].file_path)
    useEditorStore.getState().loadSong(payload)
    useSongStore.getState().selectSong(songs[0].file_path)
  }
  useTourStore.getState().start()
}

export default function App() {
  const [vaultPath, setVaultPath] = useState<string | null | undefined>(undefined)
  const [pendingTour, setPendingTour] = useState(false)
  const { loadSongs } = useVault()
  useAutosave()

  const { toggleSidebar, toggleHistoryBar, openNewSongModal, openSnapshotModal, openPreferencesModal, setNudgeDismissed, openFindPanel, toggleFindReplace } = useUIStore()
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
    'preferences': () => openPreferencesModal(),
    'find': () => {
      const { filePath } = useEditorStore.getState()
      if (!filePath) return
      if (useUIStore.getState().findPanelOpen) {
        window.dispatchEvent(new Event('find-panel:focus-input'))
      } else {
        openFindPanel()
      }
    },
    'find-next': () => {
      if (useUIStore.getState().findPanelOpen) useEditorStore.getState().findNext()
    },
    'find-prev': () => {
      if (useUIStore.getState().findPanelOpen) useEditorStore.getState().findPrev()
    },
    'toggle-find-replace': () => toggleFindReplace(),
  })

  useEffect(() => {
    async function init() {
      try {
        const cfg = await tauriApi.config.get()
        console.log('[Tour] init: tutorial_completed=', cfg.tutorial_completed, 'vault_path=', cfg.vault_path)
        setVaultPath(cfg.vault_path ?? null)
        setNudgeDismissed(cfg.nudge_dismissed)
        if (cfg.vault_path) {
          await loadSongs()
          if (!cfg.tutorial_completed) setPendingTour(true)
        }
      } catch {
        setVaultPath(null)
      }
    }
    init()
  }, [])

  useEffect(() => {
    console.log('[Tour] pendingTour effect: vaultPath=', vaultPath, 'pendingTour=', pendingTour)
    if (!vaultPath || !pendingTour) return
    setPendingTour(false)
    startTour(useSongStore.getState().songs).catch(err => console.error('[Tour] startTour failed:', err))
  }, [vaultPath, pendingTour])

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
  }, [toggleSidebar, setSongs, openSnapshotModal, openPreferencesModal])

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
        onDone={async (path) => {
          try {
            const current = await tauriApi.config.get()
            await tauriApi.config.set({ ...current, vault_path: path, last_opened_song: null })
            await loadSongs()
            setVaultPath(path)
            if (!current.tutorial_completed) setPendingTour(true)
          } catch (err) {
            console.error('Failed to save config:', err)
          }
        }}
      />
    )
  }

  return (
    <>
      <AppShell vaultPath={vaultPath} />
      <TourOverlay />
    </>
  )
}
