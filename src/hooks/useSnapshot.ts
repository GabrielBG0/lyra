// Snapshot operations: create, load, restore, cherry-pick.

import { tauriApi } from '../lib/tauri'
import { useEditorStore } from '../stores/editorStore'

export function useSnapshot() {
  const {
    filePath,
    sections,
    addSnapshotHeader,
    cacheSnapshot,
    loadedSnapshots,
    loadSong,
    metadata,
    snapshotHeaders,
  } = useEditorStore()

  const createSnapshot = async (note: string | null = null) => {
    if (!filePath) return

    const header = await tauriApi.snapshot.create(filePath, sections, note)
    addSnapshotHeader(header)
    return header
  }

  const loadSnapshot = async (snapshotId: string) => {
    if (!filePath) return

    // Return from cache if already fetched.
    if (loadedSnapshots[snapshotId]) return loadedSnapshots[snapshotId]

    const snapshot = await tauriApi.snapshot.load(filePath, snapshotId)
    cacheSnapshot(snapshotId, snapshot)
    return snapshot
  }

  const restoreSnapshot = async (snapshotId: string) => {
    if (!filePath || !metadata) return

    const restoredSections = await tauriApi.snapshot.restore(filePath, snapshotId)
    // Replace working sections with the restored ones.
    loadSong({
      metadata,
      sections: restoredSections,
      snapshot_headers: snapshotHeaders,
      file_path: filePath,
    })
    return restoredSections
  }

  const cherryPickSection = async (snapshotId: string, sectionId: string) => {
    if (!filePath) return

    const section = await tauriApi.snapshot.cherryPick(filePath, snapshotId, sectionId)
    useEditorStore.getState().updateSection(section.id, section.content)
    return section
  }

  return { createSnapshot, loadSnapshot, restoreSnapshot, cherryPickSection }
}
