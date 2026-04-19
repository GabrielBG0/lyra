// Active song state: working copy, snapshots, diff result.
// All mutations go through these actions; components read slices via selectors.

import { create } from 'zustand'
import type {
  Section,
  SectionDiff,
  Snapshot,
  SnapshotHeader,
  SongMetadata,
  SongPayload,
} from '../lib/types'

interface EditorStore {
  filePath: string | null
  metadata: SongMetadata | null
  sections: Section[]
  isDirty: boolean
  snapshotHeaders: SnapshotHeader[]
  loadedSnapshots: Record<string, Snapshot>
  diffResult: SectionDiff[] | null
  diffTargetA: string | null // snapshot id or 'now'
  diffTargetB: string | null
  previewSnapshotId: string | null

  // Actions
  loadSong: (payload: SongPayload) => void
  updateSection: (id: string, content: string) => void
  updateMetadata: (partial: Partial<SongMetadata>) => void
  reorderSections: (orderedIds: string[]) => void
  addSection: (section: Section) => void
  removeSection: (id: string) => void
  markClean: () => void
  addSnapshotHeader: (header: SnapshotHeader) => void
  cacheSnapshot: (id: string, snapshot: Snapshot) => void
  setDiff: (result: SectionDiff[], a: string, b: string) => void
  clearDiff: () => void
  enterPreview: (snapshotId: string) => void
  exitPreview: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  filePath: null,
  metadata: null,
  sections: [],
  isDirty: false,
  snapshotHeaders: [],
  loadedSnapshots: {},
  diffResult: null,
  diffTargetA: null,
  diffTargetB: null,
  previewSnapshotId: null,

  loadSong: (payload) =>
    set({
      filePath: payload.file_path,
      metadata: payload.metadata,
      sections: payload.sections,
      snapshotHeaders: payload.snapshot_headers,
      isDirty: false,
      loadedSnapshots: {},
      diffResult: null,
      diffTargetA: null,
      diffTargetB: null,
      previewSnapshotId: null,
    }),

  updateSection: (id, content) =>
    set((state) => ({
      sections: state.sections.map((s) => (s.id === id ? { ...s, content } : s)),
      isDirty: true,
    })),

  updateMetadata: (partial) =>
    set((state) => ({
      metadata: state.metadata ? { ...state.metadata, ...partial } : state.metadata,
      isDirty: true,
    })),

  reorderSections: (orderedIds) =>
    set((state) => {
      const byId = new Map(state.sections.map((s) => [s.id, s]))
      const reordered = orderedIds
        .map((id, i) => {
          const s = byId.get(id)
          return s ? { ...s, order: i + 1 } : null
        })
        .filter((s): s is Section => s !== null)
      return { sections: reordered }
    }),

  addSection: (section) =>
    set((state) => ({
      sections: [...state.sections, section],
      isDirty: true,
    })),

  removeSection: (id) =>
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== id),
      isDirty: true,
    })),

  markClean: () => set({ isDirty: false }),

  addSnapshotHeader: (header) =>
    set((state) => ({
      snapshotHeaders: [header, ...state.snapshotHeaders],
    })),

  cacheSnapshot: (id, snapshot) =>
    set((state) => ({
      loadedSnapshots: { ...state.loadedSnapshots, [id]: snapshot },
    })),

  setDiff: (result, a, b) =>
    set({ diffResult: result, diffTargetA: a, diffTargetB: b }),

  clearDiff: () =>
    set({ diffResult: null, diffTargetA: null, diffTargetB: null }),

  enterPreview: (snapshotId) => set({ previewSnapshotId: snapshotId }),
  exitPreview: () => set({ previewSnapshotId: null }),
}))
