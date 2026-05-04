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
import type { EditorCommand } from '../lib/commands'

// Internal type for updateSection commands — enables command merging during typing
interface UpdateSectionCommand extends EditorCommand {
  _kind: 'updateSection'
  _sectionId: string
  _pushedAt: number
  _before: string
  _after: string
}

const MAX_HISTORY = 100

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
  past: EditorCommand[]
  future: EditorCommand[]
  focusedSectionId: string | null

  // Actions
  loadSong: (payload: SongPayload) => void
  closeSong: () => void
  updateSection: (id: string, content: string) => void
  updateMetadata: (partial: Partial<SongMetadata>) => void
  reorderSections: (orderedIds: string[]) => void
  addSection: (section: Section, insertAt?: number) => void
  removeSection: (id: string) => void
  markClean: () => void
  addSnapshotHeader: (header: SnapshotHeader) => void
  cacheSnapshot: (id: string, snapshot: Snapshot) => void
  setDiff: (result: SectionDiff[], a: string, b: string) => void
  clearDiff: () => void
  enterPreview: (snapshotId: string) => void
  exitPreview: () => void
  execute: (cmd: EditorCommand) => void
  undo: () => void
  redo: () => void
  setFocusedSection: (id: string | null) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
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
  past: [],
  future: [],
  focusedSectionId: null,

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
      past: [],
      future: [],
    }),

  closeSong: () =>
    set({
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
    }),

  execute: (cmd) => {
    cmd.apply()
    set((state) => {
      const past = [...state.past]
      if (past.length >= MAX_HISTORY) past.shift()
      past.push(cmd)
      return { past, future: [] }
    })
  },

  undo: () => {
    const state = get()
    if (state.past.length === 0) return
    const past = [...state.past]
    const cmd = past.pop()!
    cmd.undo()
    set((s) => ({ past, future: [...s.future, cmd] }))
  },

  redo: () => {
    const state = get()
    if (state.future.length === 0) return
    const future = [...state.future]
    const cmd = future.pop()!
    cmd.apply()
    set((s) => ({ future, past: [...s.past, cmd] }))
  },

  setFocusedSection: (id) => set({ focusedSectionId: id }),

  updateSection: (id, content) => {
    const state = get()
    const section = state.sections.find(s => s.id === id)
    if (!section) return

    // Merge with the top command if it's for the same section within 2 seconds
    const top = state.past.length > 0 ? state.past[state.past.length - 1] : null
    if (
      top !== null &&
      '_kind' in top &&
      (top as UpdateSectionCommand)._kind === 'updateSection' &&
      (top as UpdateSectionCommand)._sectionId === id &&
      Date.now() - (top as UpdateSectionCommand)._pushedAt < 2000
    ) {
      const existing = top as UpdateSectionCommand
      existing._after = content
      existing._pushedAt = Date.now()
      set((s) => ({
        sections: s.sections.map(sec => sec.id === id ? { ...sec, content } : sec),
        isDirty: true,
      }))
      return
    }

    const before = section.content
    const cmd: UpdateSectionCommand = {
      _kind: 'updateSection',
      _sectionId: id,
      _pushedAt: Date.now(),
      _before: before,
      _after: content,
      description: `Edit ${section.name}`,
      apply() {
        set((s) => ({
          sections: s.sections.map(sec => sec.id === id ? { ...sec, content: cmd._after } : sec),
          isDirty: true,
        }))
      },
      undo() {
        set((s) => ({
          sections: s.sections.map(sec => sec.id === id ? { ...sec, content: cmd._before } : sec),
          isDirty: true,
        }))
      },
    }

    get().execute(cmd)
  },

  updateMetadata: (partial) => {
    const state = get()
    if (!state.metadata) return
    const beforeMeta = state.metadata
    const cmd: EditorCommand = {
      description: 'Update metadata',
      apply() {
        set((s) => ({
          metadata: s.metadata ? { ...s.metadata, ...partial } : s.metadata,
          isDirty: true,
        }))
      },
      undo() {
        set({ metadata: beforeMeta, isDirty: true })
      },
    }
    get().execute(cmd)
  },

  reorderSections: (orderedIds) => {
    const state = get()
    const beforeSections = [...state.sections]
    const byId = new Map(state.sections.map(s => [s.id, s]))
    const afterSections = orderedIds
      .map((id, i) => {
        const s = byId.get(id)
        return s ? { ...s, order: i + 1 } : null
      })
      .filter((s): s is Section => s !== null)

    const cmd: EditorCommand = {
      description: 'Reorder sections',
      apply() {
        set({ sections: afterSections })
      },
      undo() {
        set({ sections: beforeSections })
      },
    }
    get().execute(cmd)
  },

  addSection: (section, insertAt) => {
    const state = get()
    const insertIdx = insertAt !== undefined ? insertAt : state.sections.length
    const cmd: EditorCommand = {
      description: `Add ${section.name}`,
      apply() {
        set((s) => {
          const arr = [...s.sections]
          arr.splice(insertIdx, 0, section)
          return { sections: arr, isDirty: true, focusedSectionId: section.id }
        })
      },
      undo() {
        set((s) => ({
          sections: s.sections.filter(sec => sec.id !== section.id),
          isDirty: true,
        }))
      },
    }
    get().execute(cmd)
  },

  removeSection: (id) => {
    const state = get()
    const originalIndex = state.sections.findIndex(s => s.id === id)
    if (originalIndex === -1) return
    const sectionToRemove = state.sections[originalIndex]

    const cmd: EditorCommand = {
      description: `Delete ${sectionToRemove.name}`,
      apply() {
        set((s) => ({
          sections: s.sections.filter(sec => sec.id !== id),
          isDirty: true,
          focusedSectionId: s.focusedSectionId === id ? null : s.focusedSectionId,
        }))
      },
      undo() {
        set((s) => {
          const arr = [...s.sections]
          arr.splice(originalIndex, 0, sectionToRemove)
          return { sections: arr, isDirty: true }
        })
      },
    }
    get().execute(cmd)
  },

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
