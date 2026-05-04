// Domain types that mirror the Rust models exactly.
// Keep in sync with src-tauri/src/models/.

export type SongStatus = 'idea' | 'draft' | 'demo' | 'finished'
export type SectionType = 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'custom'
export type DiffStatus = 'equal' | 'changed' | 'added' | 'removed'
export type HunkKind = 'equal' | 'insert' | 'delete'

export interface MusicalInfo {
  key: string | null
  bpm: number | null
  capo: number | null
  tuning: string | null
}

export interface SongTags {
  genre: string[]
  mood: string[]
  language: string[]
}

export interface AlbumRef {
  album_id: string | null
  track_number: number | null
}

export interface SongMetadata {
  id: string
  title: string
  status: SongStatus
  created_at: string
  updated_at: string
  musical: MusicalInfo
  tags: SongTags
  album: AlbumRef
}

export interface SongIndexEntry {
  id: string
  title: string
  status: SongStatus
  bpm: number | null
  key: string | null
  genre: string[]
  mood: string[]
  language: string[]
  file_path: string
  updated_at: string
}

export interface Section {
  id: string
  name: string
  section_type: SectionType
  order: number
  content: string
  created_at: string
  updated_at: string
}

export interface SongPayload {
  metadata: SongMetadata
  sections: Section[]
  snapshot_headers: SnapshotHeader[]
  file_path: string
}

export interface SnapshotHeader {
  id: string
  created_at: string
  created_by: string | null
  note: string | null
  section_count: number
}

export interface SnapshotSection {
  section_id: string
  name: string
  section_type: SectionType
  order: number
  content: string
}

export interface Snapshot {
  id: string
  created_at: string
  created_by: string | null
  note: string | null
  sections: SnapshotSection[]
}

export interface DiffHunk {
  kind: HunkKind
  text: string
}

export interface SectionDiff {
  section_id: string
  name: string
  status: DiffStatus
  hunks: DiffHunk[]
}

export interface Comment {
  id: string
  section_id: string
  snapshot_id: string | null
  text: string
  resolved: boolean
  created_at: string
  created_by: string | null
}

export interface AppConfig {
  vault_path: string | null
  last_opened_song: string | null
  debug_mode: boolean
  nudge_dismissed: boolean
  tutorial_completed: boolean
}

export interface FindMatch {
  sectionId: string
  sectionIndex: number
  matchIndex: number
  start: number
  end: number
}
