# Lyra — Project Overview

> A comprehensive reference for AI assistants entering the codebase mid-conversation. It covers the full stack: Rust backend, React frontend, data format, state management, design system, and the cross-cutting patterns that hold everything together.

---

## Table of Contents

1. [What Lyra Is](#1-what-lyra-is)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Data Format — the `.lyr` file](#4-data-format--the-lyr-file)
5. [SQLite Index](#5-sqlite-index)
6. [Rust Backend Architecture](#6-rust-backend-architecture)
7. [IPC Layer — `tauriApi`](#7-ipc-layer--tauriapi)
8. [Frontend State Management](#8-frontend-state-management)
9. [Command Pattern & Undo/Redo](#9-command-pattern--undoredo)
10. [React Component Tree](#10-react-component-tree)
11. [Key Feature Implementations](#11-key-feature-implementations)
12. [Design System](#12-design-system)
13. [Keyboard Shortcuts](#13-keyboard-shortcuts)
14. [IDs — ULIDs](#14-ids--ulids)
15. [Lifecycle Hooks](#15-lifecycle-hooks)
16. [Tauri Configuration](#16-tauri-configuration)
17. [Conventions & Rules](#17-conventions--rules)

---

## 1. What Lyra Is

Lyra is a **desktop application for songwriters** to manage lyrics with version snapshots, diffs, and annotations. It is built with **Tauri 2 + React 19 + Rust** and runs on macOS and Windows.

Core workflow:
1. The user picks a folder on disk — the **vault**.
2. Each song is a `.lyr` file (ZIP archive) in that folder.
3. Songs are composed of ordered **sections** (verse, chorus, bridge, etc.).
4. At any point the user can save a **snapshot** (immutable point-in-time capture, like a git commit).
5. Any two snapshots (or "now" vs. a snapshot) can be **diffed** at the character level.
6. Sections have **comments** that can be resolved.

The app is currently at `v0.1.0-beta`.

---

## 2. Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Desktop shell    | **Tauri 2** (Rust runtime, WebView frontend)                          |
| Frontend         | **React 19**, TypeScript, Vite 7                                      |
| Styling          | **Tailwind CSS 4** (utility-first), custom design tokens via `@theme` |
| State management | **Zustand 5** (multiple small stores)                                 |
| Drag-and-drop    | **@dnd-kit** (sortable sections)                                      |
| Icons            | **Lucide React** (re-exported via `Icon.tsx`)                         |
| Backend logic    | **Rust** (async via Tokio)                                            |
| Database         | **SQLite** via **sqlx 0.7** (index cache only)                        |
| File format      | ZIP archive (`zip` crate) + TOML/JSON entries                         |
| Diffing          | **similar** crate (character-level diffs)                             |
| IDs              | **ULID** (Rust `ulid` crate + hand-rolled TS implementation)          |
| Serialization    | **serde** + **toml** + **serde_json**                                 |
| Error handling   | **thiserror** (typed errors), **anyhow** (internal)                   |

---

## 3. Repository Layout

```
lyra/
├── src/                          # React frontend
│   ├── App.tsx                   # Root component, init + routing
│   ├── main.tsx                  # ReactDOM.createRoot entry
│   ├── components/
│   │   ├── comments/             # CommentPanel, CommentEntry
│   │   ├── diff/                 # DiffBanner, DiffHunk, DiffSection
│   │   ├── editor/               # MetadataBar, SectionBlock, SectionEditor, SectionHeader, AddSection
│   │   ├── layout/               # AppShell, EditorPanel, Sidebar, error boundaries
│   │   ├── shell/                # MenuBar
│   │   ├── sidebar/              # SongEntry, SongList, SongSearch
│   │   ├── timeline/             # VersionTimeline, SnapshotCard, SnapshotPreviewBanner
│   │   ├── tour/                 # TourOverlay, TooltipBubble, TourArrow, TourNavigation, TourProgressDots
│   │   ├── ui/                   # App-wide primitives: modals, Icon, LyraLogo, ContextMenu
│   │   └── vault/                # VaultSetup
│   ├── hooks/
│   │   ├── useAutosave.ts        # Debounced autosave (2s delay)
│   │   ├── useCloseGuard.ts      # Save on window close
│   │   ├── useDiff.ts            # Diff resolution + store wiring
│   │   ├── useGlobalShortcuts.ts # Undo/redo + clipboard (Cmd/Ctrl+Z/C/X/V)
│   │   ├── useKeyboardShortcuts.ts # App-level shortcuts (Save, New, etc.)
│   │   ├── useSnapshot.ts        # Snapshot CRUD operations
│   │   ├── useSong.ts            # Song open/save/create/delete
│   │   └── useVault.ts           # Vault initialization + file-watcher events
│   ├── lib/
│   │   ├── commands.ts           # EditorCommand interface (Command pattern)
│   │   ├── format.ts             # Time-ago, pluralization helpers
│   │   ├── sectionClipboard.ts   # Section serialize/parse for clipboard
│   │   ├── shortcuts.ts          # SHORTCUT_CATEGORIES definition + matchesShortcut
│   │   ├── tauri.ts              # tauriApi — typed wrappers for every Rust command
│   │   ├── tourSteps.ts          # Tour step definitions
│   │   ├── types.ts              # Domain types mirroring Rust models
│   │   └── ulid.ts               # Client-side ULID generator
│   ├── stores/
│   │   ├── editorStore.ts        # Active song state + undo/redo history
│   │   ├── songStore.ts          # Sidebar song list + selection
│   │   ├── tourStore.ts          # First-launch tour state
│   │   └── uiStore.ts            # Modal open/close + layout toggles
│   └── styles/
│       ├── global.css            # @theme tokens, @layer base, @layer components
│       └── tokens.css            # Supplemental raw CSS variables
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # App setup, plugin registration, command handler
│   │   ├── main.rs               # Binary entry point
│   │   ├── error.rs              # AppError enum + AppResult<T>
│   │   ├── commands/             # Tauri command handlers (thin wrappers over core/)
│   │   │   ├── comment.rs
│   │   │   ├── config.rs
│   │   │   ├── debug.rs
│   │   │   ├── diff.rs
│   │   │   ├── export.rs
│   │   │   ├── section.rs
│   │   │   ├── snapshot.rs
│   │   │   ├── song.rs
│   │   │   └── vault.rs
│   │   ├── core/                 # Domain logic
│   │   │   ├── comment.rs        # Comment read/write in comments.toml
│   │   │   ├── config.rs         # Config file read/write (~/.config/lyra/config.json)
│   │   │   ├── diff.rs           # Snapshot diff using `similar`
│   │   │   ├── export.rs         # Plain text / PDF export
│   │   │   ├── index.rs          # SQLite CRUD (upsert_song, list_songs, etc.)
│   │   │   ├── section.rs        # Section file-level operations
│   │   │   ├── snapshot.rs       # Snapshot create/load/restore/cherry-pick
│   │   │   ├── song.rs           # .lyr ZIP read/write/create
│   │   │   ├── utils.rs          # ZIP copy helpers, filename sanitization
│   │   │   └── vault.rs          # Vault scanning, file-watcher
│   │   └── models/               # Serde structs mirrored by src/lib/types.ts
│   │       ├── comment.rs
│   │       ├── diff.rs
│   │       ├── section.rs
│   │       ├── snapshot.rs
│   │       └── song.rs
│   ├── migrations/
│   │   ├── 001_initial.sql       # songs table + indexes
│   │   └── 002_add_mood_language.sql
│   └── tauri.conf.json           # App identifier, window config, file association
│
├── style_guidelines.md           # Exhaustive design rules (ALWAYS consult for UI work)
├── CLAUDE.md                     # AI assistant instructions
└── tutorial_spec.md              # Tour feature specification
```

---

## 4. Data Format — the `.lyr` file

A `.lyr` file is a **ZIP archive**. Every song is a single self-contained file on disk. The vault is just a flat folder of `.lyr` files.

### ZIP structure

```
my-song.lyr (ZIP)
├── meta.json                     # Format version gate
├── song.toml                     # Song metadata
├── sections/
│   ├── 01HXKM5P8Q.toml          # One file per section (ULID filename)
│   └── 01HXKM5P9R.toml
├── snapshots/
│   ├── 01HXKM5PC0.json          # One file per snapshot (append-only)
│   └── 01HXKM5PD1.json
└── comments.toml                 # All comments in one file
```

### `meta.json`

```json
{
  "lyr_format_version": "1.0",
  "created_at": "2025-05-01T14:22:00Z",
  "created_by": null
}
```

The Rust reader gates on `major version == 1`. Only version "1" or "1.x" is accepted.

### `song.toml`

```toml
id = "01HXKM5P8Q9R2S3T4U5V6W7X8Y"
title = "Blue Hour"
status = "draft"
created_at = "2025-05-01T14:22:00Z"
updated_at = "2025-05-01T16:03:00Z"

[musical]
key = "C#m"
bpm = 92
capo = 2
tuning = "Standard"

[tags]
genre = ["indie", "folk"]
mood = ["melancholic"]
language = ["en"]

[album]
album_id = null
track_number = null
```

`status` is one of: `"idea"`, `"draft"`, `"demo"`, `"finished"`.

### `sections/{ulid}.toml`

```toml
id = "01HXKM5P8Q9R2S3T4U5V6W7X8Y"
name = "Verse 1"
section_type = "verse"
order = 1
content = "In the blue hour before the sun\nI find the words I've always run from"
created_at = "2025-05-01T14:22:00Z"
updated_at = "2025-05-01T16:03:00Z"
```

`section_type` is one of: `"intro"`, `"verse"`, `"pre-chorus"`, `"chorus"`, `"bridge"`, `"outro"`, `"custom"`.

`order` is a 1-indexed integer. Sections are sorted by `order` on read.

The filename is the section's ULID — this is the stable identity across saves and snapshots.

### `snapshots/{ulid}.json`

```json
{
  "id": "01HXKM5PC0...",
  "created_at": "2025-05-01T16:03:00Z",
  "created_by": null,
  "note": "Added bridge, tweaked chorus",
  "sections": [
    {
      "section_id": "01HXKM5P8Q...",
      "name": "Verse 1",
      "section_type": "verse",
      "order": 1,
      "content": "In the blue hour..."
    }
  ]
}
```

Snapshots are **immutable and append-only** — they are never modified after creation. Section IDs in snapshots are the same ULIDs as the live sections, enabling cross-version identity tracking.

### `comments.toml`

```toml
[[comments]]
id = "01HXKM5P..."
section_id = "01HXKM5P8Q..."
snapshot_id = null
text = "Try a different rhyme here"
resolved = false
created_at = "2025-05-01T14:30:00Z"
created_by = null
```

### Write strategy (atomic)

All writes go through a **write-to-temp-then-rename** pattern in `core/song.rs`:

```rust
// 1. Write the new content to `{path}.lyr.tmp`
let tmp_path = path.with_extension("lyr.tmp");

// 2. Copy all existing entries except those being overwritten
//    (preserves snapshots, comments, meta.json)
copy_entries_except(&mut src_archive, &mut writer, &overwritten, opts)?;

// 3. Write the new song.toml + sections/*.toml
// ...

// 4. Atomic rename: tmp → final (fails atomically on error)
std::fs::rename(&tmp_path, path)?;
```

On any error, the temp file is deleted before returning so no corrupt `.lyr` file is left on disk.

---

## 5. SQLite Index

The SQLite database at `{vault}/.lyrindex/index.db` is a **cache** — not the source of truth. It is rebuilt from `.lyr` files on vault scan and can be manually rebuilt via `rebuild_index`.

### Schema

```sql
CREATE TABLE IF NOT EXISTS songs (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL,
    bpm         INTEGER,
    key_sig     TEXT,
    genre       TEXT NOT NULL DEFAULT '[]',   -- JSON array
    mood        TEXT NOT NULL DEFAULT '[]',   -- JSON array
    language    TEXT NOT NULL DEFAULT '[]',   -- JSON array
    file_path   TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE INDEX idx_songs_status ON songs (status);
CREATE INDEX idx_updated_at   ON songs (updated_at DESC);
```

`genre`, `mood`, and `language` are stored as JSON strings (e.g., `'["indie","folk"]'`) and deserialized via `sqlx::types::Json<Vec<String>>`.

### Startup behavior

If a vault path is configured, `init_index(vault_path)` opens the real SQLite pool and runs migrations. If no vault is configured yet (first launch), a **in-memory SQLite pool** is created so the app starts cleanly without crashing.

```rust
let pool = if let Some(ref vault_path) = config.vault_path {
    match init_index(Path::new(vault_path)).await {
        Ok(p) => p,
        Err(_) => in_memory_pool().await,
    }
} else {
    in_memory_pool().await
};
```

---

## 6. Rust Backend Architecture

### Module structure

```
src-tauri/src/
├── lib.rs         → app setup, plugin init, command registration
├── error.rs       → AppError, AppResult<T>
├── commands/      → @tauri::command handlers (thin, call into core/)
├── core/          → domain logic (pure async functions)
└── models/        → serde structs (mirrors src/lib/types.ts exactly)
```

### AppState

The shared mutable state passed to all commands:

```rust
pub struct AppState {
    pub pool:   Mutex<SqlitePool>,
    pub config: Mutex<AppConfig>,
}
```

Both fields are `Mutex<T>` because Tauri's state system requires `Send + Sync`. Commands lock, clone, and release immediately:

```rust
let pool = state.pool.lock().unwrap().clone();
// pool is now a cloned SqlitePool (cheap, connection pool is Arc-backed)
```

### Command layer pattern

Commands in `commands/` are thin wrappers that extract state, call into `core/`, and return `AppResult<T>`:

```rust
// commands/snapshot.rs
#[tauri::command]
pub async fn create_snapshot(
    state: tauri::State<'_, AppState>,
    path: String,
    sections: Vec<Section>,
    note: Option<String>,
) -> AppResult<SnapshotHeader> {
    let path = PathBuf::from(path);
    core::snapshot::create_snapshot(&path, &sections, note).await
}
```

Business logic lives in `core/`, not in `commands/`. This makes core functions unit-testable.

### Error handling

`AppError` is a `thiserror` enum that implements `serde::Serialize` (serializes as a string) so Tauri can send it to the frontend as a rejection:

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]     Io(#[from] std::io::Error),
    #[error("ZIP error: {0}")]    Zip(#[from] zip::result::ZipError),
    #[error("Song not found: {0}")] SongNotFound(String),
    #[error("Snapshot not found: {0}")] SnapshotNotFound(String),
    // ...
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}
```

### Config file

The app config (`AppConfig`) is persisted at `~/.config/lyra/config.json` (via `dirs` crate):

```rust
pub struct AppConfig {
    pub vault_path: Option<String>,
    pub last_opened_song: Option<String>,
    pub debug_mode: bool,
    pub nudge_dismissed: bool,
    pub tutorial_completed: bool,
}
```

### Window close interception

The Rust side prevents the native close event and emits a custom event to let the frontend handle unsaved state:

```rust
window.on_window_event(move |event| {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window_clone.emit("window:close-requested", ());
    }
});
```

The frontend (`useCloseGuard.ts`) listens to this event, saves if dirty, then calls `win.destroy()`.

---

## 7. IPC Layer — `tauriApi`

All Tauri `invoke()` calls are centralized in `src/lib/tauri.ts`. **Never call `invoke()` directly** — always go through `tauriApi`. This provides TypeScript types, camelCase→snake_case argument mapping, and a single place to track all IPC surface area.

```typescript
// src/lib/tauri.ts
export const tauriApi = {
  vault: {
    listSongs: () => invoke<SongIndexEntry[]>('list_songs'),
    setVaultPath: (path: string) => invoke<void>('set_vault_path', { path }),
    rebuildIndex: () => invoke<SongIndexEntry[]>('rebuild_index'),
    importSong: (externalPathStr: string) => invoke<SongIndexEntry>('import_song', { externalPathStr }),
  },
  song: {
    open:   (path: string) => invoke<SongPayload>('open_song', { path }),
    save:   (path: string, metadata: SongMetadata, sections: Section[]) =>
              invoke<void>('save_song', { path, metadata, sections }),
    create: (title: string) => invoke<SongPayload>('create_song', { title }),
    delete: (path: string)  => invoke<void>('delete_song', { path }),
  },
  snapshot: {
    create:     (path, sections, note) => invoke<SnapshotHeader>('create_snapshot', { path, sections, note }),
    load:       (path, snapshotId)     => invoke<Snapshot>('load_snapshot', { path, snapshotId }),
    restore:    (path, snapshotId)     => invoke<Section[]>('restore_snapshot', { path, snapshotId }),
    cherryPick: (path, snapshotId, sectionId) => invoke<Section>('cherry_pick_section', { path, snapshotId, sectionId }),
  },
  diff: {
    diffSnapshots:         (path, snapshotIdA, snapshotIdB) => invoke<SectionDiff[]>('diff_snapshots', ...),
    diffWorkingVsSnapshot: (path, snapshotId, sections)     => invoke<SectionDiff[]>('diff_working_vs_snapshot', ...),
  },
  section: {
    add:     (path, sectionType, name, order) => invoke<Section>('add_section', ...),
    delete:  (path, sectionId)  => invoke<void>('delete_section', ...),
    reorder: (path, orderedIds) => invoke<void>('reorder_sections', ...),
  },
  comment: { add, resolve, list },
  config:  { get, set },
  export:  { plainText, pdf },
  debug:   { nukeVault, resetApp },
}
```

Tauri 2 automatically maps camelCase JS keys to `snake_case` on the Rust side, so `{ externalPathStr }` becomes `external_path_str: String` in Rust.

### Event listeners

In addition to command/response, the frontend listens to events emitted by Rust (e.g., from the file watcher):

```typescript
// useVault.ts
listen<SongIndexEntry>('vault:song-updated', (e) => upsertSong(e.payload))
listen<string>('vault:song-removed', (e) => removeSong(e.payload))
```

App-level events that Rust emits to the frontend (from MenuBar native integrations):
- `window:close-requested` — intercepted native window close
- `new-song`, `save`, `save-version`, `toggle-sidebar`, etc. (emitted by the Rust command-event bridge)

---

## 8. Frontend State Management

There are four **Zustand stores**, each with a single responsibility.

### `editorStore` — active song

The largest and most important store. Holds the working copy of the currently open song, snapshot cache, diff result, and the full undo/redo history.

```typescript
interface EditorStore {
  filePath: string | null
  metadata: SongMetadata | null
  sections: Section[]
  isDirty: boolean
  snapshotHeaders: SnapshotHeader[]
  loadedSnapshots: Record<string, Snapshot>   // in-memory cache
  diffResult: SectionDiff[] | null
  diffTargetA: string | null   // snapshot id or 'now'
  diffTargetB: string | null
  previewSnapshotId: string | null
  past: EditorCommand[]        // undo stack
  future: EditorCommand[]      // redo stack
  focusedSectionId: string | null

  // Actions
  loadSong(payload: SongPayload): void
  closeSong(): void
  updateSection(id: string, content: string): void
  updateMetadata(partial: Partial<SongMetadata>): void
  reorderSections(orderedIds: string[]): void
  addSection(section: Section, insertAt?: number): void
  removeSection(id: string): void
  markClean(): void
  // ... snapshot, diff, preview, undo/redo actions
}
```

### `songStore` — sidebar list

```typescript
interface SongStore {
  songs: SongIndexEntry[]          // from SQLite index
  selectedSongPath: string | null  // path of open song

  setSongs(songs: SongIndexEntry[]): void
  upsertSong(entry: SongIndexEntry): void   // insert or update by file_path
  removeSong(filePath: string): void
  selectSong(path: string | null): void
}
```

### `uiStore` — layout + modal state

Manages all modal open/close state and layout toggles. Every modal follows the same pattern:

```typescript
newSongModalOpen: boolean
openNewSongModal: () => void
closeNewSongModal: () => void
// repeated for: snapshot, shortcuts, deleteSong, about, vaultOptions, preferences
```

Also manages:
- `sidebarCollapsed` / `historyBarExpanded` — layout flags
- `nudgeDismissed` — whether the "save a take?" nudge has been dismissed

### `tourStore` — first-launch tour

```typescript
interface TourStore {
  active: boolean
  currentStep: number
  start(): void
  next(): void
  back(): void
  dismiss(): void   // marks tutorial_completed=true in config
}
```

### Store access pattern

Components read slices with selectors to avoid unnecessary re-renders:

```typescript
// Good: subscribe only to what you need
const filePath = useEditorStore((s) => s.filePath)

// Inside event handlers, read current state imperatively (no re-render cost)
const state = useEditorStore.getState()
```

---

## 9. Command Pattern & Undo/Redo

Every mutation to the song goes through the **Command pattern** (defined in `src/lib/commands.ts`):

```typescript
export interface EditorCommand {
  readonly description: string
  apply(): void
  undo(): void
}
```

All mutations create a command object, call `execute(cmd)`, which calls `cmd.apply()` and pushes to the `past` stack. Undo pops from `past`, calls `cmd.undo()`, pushes to `future`. Redo is the inverse.

The history limit is **100 commands** (oldest is dropped when exceeded).

### Implemented commands

| Mutation                              | Command created in            |
| ------------------------------------- | ----------------------------- |
| Edit section content                  | `editorStore.updateSection`   |
| Update metadata (title, status, key…) | `editorStore.updateMetadata`  |
| Reorder sections                      | `editorStore.reorderSections` |
| Add section                           | `editorStore.addSection`      |
| Delete section                        | `editorStore.removeSection`   |

### Command merging (typing deduplication)

For `updateSection`, rapid keystrokes within 2 seconds are **merged** into a single command to avoid creating hundreds of undo steps while typing:

```typescript
// If the top of the past stack is an updateSection for the same section
// and it was pushed less than 2000ms ago, update _after in-place
// instead of pushing a new command.
if (
  top._kind === 'updateSection' &&
  top._sectionId === id &&
  Date.now() - top._pushedAt < 2000
) {
  existing._after = content
  existing._pushedAt = Date.now()
  // Update state directly, no new command pushed
  return
}
```

`_kind`, `_sectionId`, `_pushedAt`, `_before`, `_after` are internal fields on the command object — not part of the `EditorCommand` interface.

---

## 10. React Component Tree

```
App.tsx
├── VaultSetup              (shown if no vault configured)
└── AppShell                (main UI)
    ├── MenuBar             (custom title bar, menus, window controls)
    ├── Sidebar (collapsible)
    │   ├── SongSearch
    │   └── SongList
    │       └── SongEntry (× N)
    ├── EditorPanel
    │   ├── MetadataBar     (title, status, key, BPM, tags, undo/redo, snapshot button)
    │   ├── [DiffBanner | SnapshotPreviewBanner]
    │   ├── SectionEditor (DndContext)
    │   │   └── SectionBlock (× N)
    │   │       ├── SectionHeader  (grip, type label, name, comments button, more menu)
    │   │       ├── <textarea class="lyric-textarea">
    │   │       ├── AddSection (inline insert-between affordance)
    │   │       └── CommentPanel (conditional)
    │   │           └── CommentEntry (× N)
    │   └── VersionTimeline (collapsible history bar)
    │       ├── NowCard
    │       └── SnapshotCard (× N)
    └── TourOverlay         (portaled tooltip overlay for first-launch tour)
        └── TooltipBubble
            ├── TourArrow
            ├── TourProgressDots
            └── TourNavigation

Modals (portaled, managed by uiStore):
├── NewSongModal
├── SnapshotModal
├── KeyboardShortcutsModal
├── AboutModal
├── DeleteSongModal
├── VaultOptionsModal
└── PreferencesModal
```

### Data-tour attributes

Key elements carry `data-tour="..."` attributes for the first-launch tour to target:

- `data-tour="app-shell"` — root container
- `data-tour="sidebar"` — sidebar panel
- `data-tour="new-song-button"` — new song button
- `data-tour="song-search"` — search input
- `data-tour="editor-panel"` — editor area
- `data-tour="metadata-bar"` — metadata bar
- `data-tour="section-editor"` — sections container
- `data-tour="snapshot-button"` — save-a-take button
- `data-tour="version-timeline"` — history strip

---

## 11. Key Feature Implementations

### Autosave (`useAutosave.ts`)

Watches `isDirty` in `editorStore`. When dirty, starts a 2-second debounce timer. On fire, reads latest state and calls `tauriApi.song.save(...)`, then `markClean()` and refreshes the sidebar entry.

```typescript
const AUTOSAVE_DELAY_MS = 2_000

useEffect(() => {
  if (!isDirty || !filePath || !metadata) return
  const timer = setTimeout(async () => {
    const state = useEditorStore.getState()  // re-read at fire time
    if (!state.isDirty || !state.filePath) return
    await tauriApi.song.save(state.filePath, state.metadata, state.sections)
    state.markClean()
    // ...refresh sidebar
  }, AUTOSAVE_DELAY_MS)
  return () => clearTimeout(timer)
}, [isDirty, filePath, metadata, sections, markClean])
```

The re-read at fire time is important: React's stale closure would capture old state without it.

### Diff system (`useDiff.ts`, `core/diff.rs`)

Two diff modes:
1. **Snapshot vs. snapshot**: `diffTwoSnapshots(idA, idB)` — both are loaded from disk (or cache), then sent to Rust's `diff_snapshots` command.
2. **Working copy vs. snapshot**: `diffWorkingVsSnapshot(id)` — current `sections` in `editorStore` are sent alongside the snapshot ID.

The Rust diff engine uses `similar::TextDiff::from_chars` (character-level) and produces hunks:

```rust
pub struct DiffHunk { kind: HunkKind, text: String }
pub enum HunkKind { Equal, Insert, Delete }

pub struct SectionDiff {
  section_id: String,
  name: String,
  status: DiffStatus,  // Equal | Changed | Added | Removed
  hunks: Vec<DiffHunk>,
}
```

Adjacent hunks of the same kind are merged in Rust before returning.

The `DiffSection` component renders `Equal` hunks as plain text, `Insert` as `<mark>` with `bg-diff-add` and `text-diff-add-text`, `Delete` as `<del>` with `line-through` + `bg-diff-remove` and `text-diff-remove-text`.

Snapshots are cached in `editorStore.loadedSnapshots` (keyed by snapshot ID) to avoid redundant disk reads.

### Snapshot preview

When the user clicks a snapshot card without holding Shift, the snapshot is loaded, diffed against "now", and the editor switches to a read-only preview mode. The `previewSnapshotId` field in `editorStore` controls this. `SnapshotPreviewBanner` shows a banner with a "Restore this take" button.

Cherry-picking a section from a snapshot calls `tauriApi.snapshot.cherryPick(...)` which returns the section with updated content, then `updateSection` is called to push it as an undoable command.

### Shift-click diff (two-snapshot compare)

In the timeline, Shift-clicking a first card sets `shiftSelectedId`. Shift-clicking a second card calls `diffTwoSnapshots(id1, id2)`. The `DiffBanner` shows which two snapshots are being compared.

### Drag-and-drop section reorder

Sections use `@dnd-kit/sortable`. The `SectionBlock` receives `useSortable` props (`listeners`, `attributes`, `transform`, `isDragging`). On drag end, the `SectionEditor` calls `reorderSections(orderedIds)` which creates an undoable command and calls `tauriApi.section.reorder(path, orderedIds)` to persist the new order to disk.

### Section clipboard (`sectionClipboard.ts`)

Sections are serialized as a header line + content for clipboard:

```
--- verse: Verse 1 ---
In the blue hour before the sun
I find the words I've always run from
```

`looksLikeSection(text)` checks if clipboard text starts with `--- ` to decide whether paste should be treated as a section import. `parseSection(text)` extracts `name`, `section_type`, and `content`. The pasted section gets a fresh ULID and is inserted after the focused section (or at the end).

### Snapshot nudge

The `VersionTimeline` tracks:
- `changeCount` — incremented every time `sections` or `metadata` changes in `editorStore` (via `useEditorStore.subscribe`)
- `songOpenTime` — reset when a new song is opened

After `NUDGE_MIN_CHANGES = 10` changes AND `NUDGE_MIN_ELAPSED_MS = 5 minutes` since the last snapshot (or song open), a nudge banner appears: "You've been writing for a while, save a take?" This is dismissed by clicking the X or by taking a snapshot (which resets `changeCount`).

### First-launch tour

The tour is triggered on first launch (when `config.tutorial_completed === false` after vault setup). It:
1. Creates a "Welcome to Lyra" demo song if the vault is empty
2. Calls `useTourStore.start()`

`TourOverlay` is a portaled component that:
- Uses `document.querySelector(step.target)` to find the target element
- Waits 220ms after step activation for layout to settle (`requestAnimationFrame` + `setTimeout`)
- Positions a `TooltipBubble` relative to the target's `getBoundingClientRect()`
- Handles keyboard navigation (Arrow keys, Enter, Escape)

On tour completion, `tourStore.dismiss()` sets `tutorial_completed: true` in the config file.

---

## 12. Design System

The full design system is documented in `style_guidelines.md`. This is the authoritative reference for all UI work. Below is a condensed summary.

### Design philosophy

> Writing is the protagonist — the interface is the theater.

Five principles:
1. **The page is sacred** — lyric area uses serif font and generous leading; chrome does not invade it.
2. **Ink over glass** — no glassmorphism, no gradients on content surfaces.
3. **Warm restraint** — single amber accent + rose secondary. No blues, no saturated chrome.
4. **Progressive disclosure** — editing controls hidden until hover.
5. **Typographic hierarchy** — borders are nearly invisible; the eye is led by size/weight/color.

### Color system (OKLCH)

All colors use **OKLCH** (perceptually uniform). Defined in `src/styles/global.css` under `@theme`, mapped 1:1 to Tailwind classes.

**Surface palette** (dark, warm-biased):

| Token     | OKLCH            | Role                           |
| --------- | ---------------- | ------------------------------ |
| `bg`      | `0.145 0.008 60` | App canvas, lyric area         |
| `surface` | `0.175 0.01 60`  | Snapshot cards, modal fields   |
| `panel`   | `0.205 0.012 60` | Sidebar, menu bar, timeline    |
| `elev`    | `0.245 0.014 60` | Hover/active states, dropdowns |

**Text scale**:

| Token       | OKLCH           | Use                               |
| ----------- | --------------- | --------------------------------- |
| `primary`   | `0.95 0.013 85` | Titles, active values, lyric body |
| `secondary` | `0.78 0.013 80` | Labels, menu items at rest        |
| `muted`     | `0.55 0.01 75`  | Metadata, secondary text          |
| `faint`     | `0.4 0.008 70`  | Timestamps, hint text, disabled   |

**Accent** (muted amber): `oklch(0.72 0.1 55)` — used for CTAs, active states, dirty indicator. Treat as a finite resource.

**Status colors**:

| Status     | Token                             | Character  |
| ---------- | --------------------------------- | ---------- |
| `idea`     | `status-idea` = `0.75 0.08 230`   | Cool blue  |
| `draft`    | `status-draft` = `0.78 0.1 65`    | Warm gold  |
| `demo`     | `status-demo` = `0.68 0.12 15`    | Ember red  |
| `finished` | `status-finished` = `0.8 0.1 115` | Pale green |

Status pill pattern:
```tsx
"text-status-draft bg-status-draft/10 border-status-draft/20"
```

**Diff palette** (pre-computed hex for legibility against their own backgrounds):
- Add: `bg: #00220b`, text: `#48aa79`
- Remove: `bg: #310c10`, text: `#e68478` (also `line-through`)

### Typography

Two families only. No third is ever permitted.

- **UI**: Satoshi (neo-grotesque). All chrome, titles, buttons, metadata.
- **Lyrics**: Noto Serif + Noto Serif JP + Noto Serif KR. Used **only** in the lyric textarea, diff content, and snapshot preview.

Key sizes: `text-2xs` (10px) for status pills/section type tabs, `text-base` (16px) for lyrics (only), `text-title` (26px) for song title.

Lyric `line-height` is always **1.85**. Never change it. Diff also uses 1.85 for visual parity.

### Layout

```
h-8 MenuBar (32px)
┌──────────────────────────────────────────────────┐
│ Sidebar w-65 │ EditorPanel flex-1                │
│ (or w-12)    │   MetadataBar (shrink-0)          │
│              │   [DiffBanner | PreviewBanner]    │
│              │   SectionEditor (flex-1 scroll-y) │
│              │   VersionTimeline (42px or 160px) │
└──────────────────────────────────────────────────┘
```

The editor's lyric column is `w-[85%] mx-auto px-14` — the "measure." Nothing editable lives outside this container.

### Component patterns

**Buttons** — three canonical shapes, no `<Button>` component:

```tsx
// Primary (amber filled)
className="px-4 py-2 rounded-lg font-semibold border-none"
style={{ background: 'oklch(0.72 0.10 55)', color: 'oklch(0.145 0.008 60)' }}

// Secondary (bordered, transparent)
className="px-4 py-2 rounded-lg text-secondary hover:text-primary hover:bg-elev
           transition-colors border border-border-soft bg-transparent"

// Chrome / icon button (square, transparent)
className="w-7 h-7 flex items-center justify-center rounded text-secondary
           hover:bg-elev hover:text-primary transition-colors
           border-none bg-transparent cursor-pointer"
```

**Modals** — canonical recipe:
- `fixed inset-0 z-50 flex items-center justify-center`
- Backdrop: `oklch(0.08 0.006 60 / 0.75)` + `backdrop-filter: blur(4px)` (only place blur is used)
- Surface: `oklch(0.205 0.012 60)`, `rounded-xl`, `border border-border`
- Top-edge gradient line: `linear-gradient(90deg, transparent, oklch(0.72 0.10 55 / 0.6), transparent)`
- Close via: Escape, click-outside, X button, Cancel button — all four must work

**Menus** — hover state is always `hover:bg-accent-soft hover:text-accent`. No exceptions.

**Inline editable fields** (`MetaField`) — at rest: plain text; on click: `<input>` with `border-b border-accent`. Uses `cancelledRef` pattern:

```typescript
const cancelledRef = useRef(false)
const handleBlur = () => {
  if (!cancelledRef.current) onCommit(draft)  // only commit if not cancelled
  cancelledRef.current = false
  setEditing(false)
}
onKeyDown={(e) => {
  if (e.key === 'Escape') {
    cancelledRef.current = true  // prevent blur from committing
    setEditing(false)
  }
}}
```

**Hover reveals** — use `opacity`, not `display`, to avoid layout shift:
```tsx
// Section header tools
className="opacity-0 group-hover:opacity-100 transition-opacity"
```

**Icons** — always from `Icons` namespace, never direct `lucide-react` imports:
```tsx
import { Icons } from '../ui/Icon'
<Icons.Pin size={15} />
```

**Dirty indicator** — a `w-1.5 h-1.5 rounded-full bg-accent` dot with amber `box-shadow` glow when `isDirty`:
```tsx
style={{ boxShadow: isDirty ? '0 0 6px oklch(0.72 0.10 55)' : 'none' }}
```

### Keyboard shortcut rendering

Always: `${mod}${shift}Key` order. `mod` is `⌘` on macOS, `Ctrl+` on Windows. `shift` is `⇧` on macOS, `Shift+` on Windows. Determined at runtime via `navigator.platform`.

---

## 13. Keyboard Shortcuts

All shortcuts are defined in `src/lib/shortcuts.ts` as `SHORTCUT_CATEGORIES`. The `matchesShortcut(def, e)` helper checks modifier state.

| Shortcut      | Action                                       |
| ------------- | -------------------------------------------- |
| `mod+N`       | New song                                     |
| `mod+W`       | Close song                                   |
| `mod+S`       | Save                                         |
| `mod+Shift+S` | Save take (snapshot)                         |
| `mod+b`       | Toggle sidebar                               |
| `mod+H`       | Toggle history bar                           |
| `mod+,`       | Preferences                                  |
| `mod+Z`       | Undo                                         |
| `mod+Shift+Z` | Redo                                         |
| `mod+C`       | Copy focused section                         |
| `mod+X`       | Cut focused section                          |
| `mod+V`       | Paste section                                |
| `Esc`         | Close modal / exit diff / cancel inline edit |

Two hook layers:
- `useKeyboardShortcuts` — handles app-level actions (Save, New, Toggle)
- `useGlobalShortcuts` — handles undo/redo and section clipboard (Cmd+Z/C/X/V)

Both hooks skip events when `target` is `INPUT` or `TEXTAREA` to allow normal typing.

---

## 14. IDs — ULIDs

All entities use **ULIDs** (Universally Unique Lexicographically Sortable Identifiers):
- 26 characters, Crockford base32
- Prefix: 10-char millisecond timestamp (sortable chronologically by string comparison)
- Suffix: 16-char cryptographically random

Used for: song IDs, section IDs, snapshot IDs, comment IDs.

**Rust**: `ulid::Ulid::new().to_string()`

**TypeScript** (`src/lib/ulid.ts`): hand-rolled implementation using `crypto.getRandomValues` for the random portion:
```typescript
export function generateUlid(): string {
  return encodeTime(Date.now()) + encodeRandom()
}
```

The TS implementation is used for **optimistic updates** — e.g., assigning a new ID to a pasted section before the server confirms it. The Rust side also generates ULIDs for entities created server-side (new song, new snapshot).

---

## 15. Lifecycle Hooks

### `useVault` — initialization

On app startup, loads the song list from SQLite and subscribes to file-watcher events from Rust (`vault:song-updated`, `vault:song-removed`).

### `useAutosave` — background persistence

2-second debounce on `isDirty`. Reads state at fire time (not closure time) to avoid stale data.

### `useCloseGuard` — save on exit

Intercepts `onCloseRequested` from Tauri. Saves if dirty, then calls `win.destroy()`. Handles the case where the user closes the app mid-edit.

### `useKeyboardShortcuts` — app shortcuts

Registered on `window` (not on any specific element). Uses `handlersRef` pattern to avoid stale closures while the handler function changes:

```typescript
const handlersRef = useRef(handlers)
handlersRef.current = handlers  // always current
useEffect(() => {
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [])  // empty deps: listener registered once, reads from ref
```

### `useGlobalShortcuts` — undo/redo + clipboard

Handles `mod+Z`, `mod+Shift+Z`, `mod+C`, `mod+X`, `mod+V`. For clipboard, only activates when the active element is NOT an INPUT or TEXTAREA (to allow normal typing to work).

---

## 16. Tauri Configuration

```json
// src-tauri/tauri.conf.json (key fields)
{
  "identifier": "dev.gabrielbg.lyra",
  "app": {
    "windows": [{
      "decorations": false,         // custom chrome via MenuBar.tsx
      "width": 1200,
      "height": 750,
      "minWidth": 720,
      "minHeight": 480
    }]
  }
}
```

- Dev port: **1420** (Vite), HMR on **1421**
- File association: `.lyr` → `application/x-lyr`
- Window decorations are **disabled** — the entire title bar is custom (`MenuBar.tsx`)
- `data-tauri-drag-region` on the MenuBar enables dragging the window

On **macOS**, the MenuBar has `paddingLeft: 76px` to clear the traffic-light buttons. On Windows, custom window controls (minimize/maximize/close) are rendered inline.

---

## 17. Conventions & Rules

### TypeScript / React

- One component per file, PascalCase filename matching the default export.
- Styles are inline Tailwind utilities. CSS Modules and styled-components are not used.
- CSS color tokens are always referenced via Tailwind classes (`bg-panel`, `text-accent`). Inline `style={{}}` is only used for dynamic values or half-pixel-tuned sizes.
- All colors are OKLCH. No hex in component code except the diff palette (in `global.css`).
- Icons always come from `Icons` namespace (`import { Icons } from '../ui/Icon'`).
- Modals live in `components/ui/`; feature sub-panels live in their feature folder.

### Rust

- Commands layer (`commands/`) is thin — no business logic.
- Core layer (`core/`) contains business logic — independently testable.
- `AppState` fields are `Mutex<T>` — lock, clone, release immediately.
- All ZIP writes go through write-to-temp-then-atomic-rename.
- SQLite index is always a cache. Never read it as a source of truth.

### Data

- All IDs are ULIDs. Never use sequential integers.
- Timestamps are ISO 8601 strings (RFC 3339 format from `chrono`).
- The SQLite index can always be rebuilt from disk with `rebuild_index`.
- Snapshots are append-only and immutable after creation.

### UI copy

- No em dashes (`—`). Use commas or split sentences.
- No "—" in code-generated strings either.
- Write in a human way. "Here you can edit your songs" not "This is the song editor where you can edit your songs."
- Empty states invite rather than instruct. "Pick a song from the sidebar, or start a new one."
- Unimplemented menu items show a `TODO` badge — do not remove stubs.
- Ellipsis in placeholders: `…` (U+2026), not `...` (three dots).

### Keyboard shortcuts (display order)

Always render in this order: **command/control first, then Shift, then Alt, then the key**.
- Correct: `Ctrl+Shift+Z`, `⌘⇧Z`
- Wrong: `Shift+Ctrl+Z`, `⇧⌘Z`

In code: `${mod}${shift}Z`, never `${shift}${mod}Z`.
