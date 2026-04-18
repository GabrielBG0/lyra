// Typed wrappers around every Tauri invoke() call.
// One function per Rust command. All arg keys use camelCase —
// Tauri 2 maps them to snake_case on the Rust side automatically.

import { invoke } from '@tauri-apps/api/core'
import type {
  AppConfig,
  Comment,
  Section,
  SectionDiff,
  SectionType,
  Snapshot,
  SnapshotHeader,
  SongIndexEntry,
  SongMetadata,
  SongPayload,
} from './types'

export const tauriApi = {
  vault: {
    listSongs: () =>
      invoke<SongIndexEntry[]>('list_songs'),

    setVaultPath: (path: string) =>
      invoke<void>('set_vault_path', { path }),

    getVaultPath: () =>
      invoke<string | null>('get_vault_path'),

    rebuildIndex: () =>
      invoke<SongIndexEntry[]>('rebuild_index'),

    importSong: (externalPathStr: string) =>
      invoke<SongIndexEntry>('import_song', { externalPathStr }),
  },

  song: {
    open: (path: string) =>
      invoke<SongPayload>('open_song', { path }),

    save: (path: string, metadata: SongMetadata, sections: Section[]) =>
      invoke<void>('save_song', { path, metadata, sections }),

    create: (title: string) =>
      invoke<SongPayload>('create_song', { title }),

    delete: (path: string) =>
      invoke<void>('delete_song', { path }),
  },

  snapshot: {
    create: (path: string, sections: Section[], note: string | null) =>
      invoke<SnapshotHeader>('create_snapshot', { path, sections, note }),

    load: (path: string, snapshotId: string) =>
      invoke<Snapshot>('load_snapshot', { path, snapshotId }),

    restore: (path: string, snapshotId: string) =>
      invoke<Section[]>('restore_snapshot', { path, snapshotId }),

    cherryPick: (path: string, snapshotId: string, sectionId: string) =>
      invoke<Section>('cherry_pick_section', { path, snapshotId, sectionId }),
  },

  diff: {
    diffSnapshots: (path: string, snapshotIdA: string, snapshotIdB: string) =>
      invoke<SectionDiff[]>('diff_snapshots', { path, snapshotIdA, snapshotIdB }),

    diffWorkingVsSnapshot: (path: string, snapshotId: string, sections: Section[]) =>
      invoke<SectionDiff[]>('diff_working_vs_snapshot', { path, snapshotId, sections }),
  },

  section: {
    add: (path: string, sectionType: SectionType, name: string, order: number) =>
      invoke<Section>('add_section', { path, sectionType, name, order }),

    delete: (path: string, sectionId: string) =>
      invoke<void>('delete_section', { path, sectionId }),

    reorder: (path: string, orderedIds: string[]) =>
      invoke<void>('reorder_sections', { path, orderedIds }),
  },

  comment: {
    add: (
      path: string,
      sectionId: string,
      snapshotId: string | null,
      text: string,
    ) => invoke<Comment>('add_comment', { path, sectionId, snapshotId, text }),

    resolve: (path: string, commentId: string) =>
      invoke<void>('resolve_comment', { path, commentId }),

    list: (path: string, sectionId: string) =>
      invoke<Comment[]>('list_comments', { path, sectionId }),
  },

  config: {
    get: () =>
      invoke<AppConfig>('get_config'),

    set: (config: AppConfig) =>
      invoke<void>('set_config', { config }),
  },

  export: {
    plainText: (path: string, includeHistory: boolean) =>
      invoke<string>('export_plain_text', { path, includeHistory }),

    // Returns an HTML string; the frontend opens it in a printable window.
    pdf: (path: string, includeHistory: boolean) =>
      invoke<string>('export_pdf', { path, includeHistory }),
  },
}
