

# Benzaiten 弁財天 — Development Roadmap

> A spec-driven roadmap for building Benzaiten, a file-primary lyric versioning tool built with Tauri 2, Rust, React 18, and SQLite.
> 
> Each step includes a description, motivation, and implementation spec detailed enough to generate a focused development prompt or implement directly.

-----

## Reading this document

Steps are organized in phases. Each phase builds on the previous. Within a phase, steps are ordered — follow them in sequence. Each step has:

- **What**: what gets built
- **Why**: the motivation and design rationale
- **Spec**: concrete requirements, types, behaviors, and edge cases

A ✦ mark indicates a decision point where a choice was made during design — the rationale is included so you don’t second-guess it later.

-----

## Phase 0 — Project Initialization

### Step 0.1 — Tauri + React + Vite scaffold

**What:** Initialize the Tauri 2 project with a React + TypeScript + Vite frontend. Establish the folder structure defined in the architecture.

**Why:** Tauri 2 is the foundation. Everything else layers on top. Getting the scaffold right avoids structural refactors later.

**Spec:**

- Run `npm create tauri-app@latest benzaiten -- --template react-ts` to bootstrap
- Confirm Tauri 2.x is used (not v1)
- Set `productName = "Benzaiten"` in `tauri.conf.json`
- Set `identifier = "com.gyfu.benzaiten"` in `tauri.conf.json`
- Window config: `width: 1280, height: 800, minWidth: 900, minHeight: 600, decorations: true`
- Register `.lyr` file association in `tauri.conf.json` under `fileAssociations`: extension `lyr`, mime type `application/x-lyr`
- Ensure `src-tauri/src/` has `main.rs`, `lib.rs`, `error.rs` and empty `commands/`, `core/`, `models/` modules
- Ensure `src/` has `main.tsx`, `App.tsx`, `stores/`, `hooks/`, `components/`, `lib/`, `styles/`
- Verify `tauri dev` runs successfully with a blank white window

-----

### Step 0.2 — Tailwind + design tokens

**What:** Install and configure Tailwind CSS. Define all CSS custom properties in `tokens.css`. Wire Tailwind’s config to reference those variables.

**Why:** Tailwind accelerates UI development. CSS variables as the source of truth means theming is a single-file change, not a Tailwind config rebuild.

**Spec:**

- Install: `tailwindcss`, `postcss`, `autoprefixer` as devDependencies
- `tailwind.config.ts` must extend — not replace — the default theme. Use `theme.extend` only
- Define Tailwind color aliases that map to CSS variables:
  - `surface` → `var(--color-surface)`
  - `surface-raised` → `var(--color-surface-raised)`
  - `surface-overlay` → `var(--color-surface-overlay)`
  - `border` → `var(--color-border)`
  - `accent` → `var(--color-accent)`
  - `accent-muted` → `var(--color-accent-muted)`
  - `text-primary` → `var(--color-text-primary)`
  - `text-secondary` → `var(--color-text-secondary)`
  - `text-muted` → `var(--color-text-muted)`
  - `status-idea` → `var(--color-status-idea)`
  - `status-draft` → `var(--color-status-draft)`
  - `status-demo` → `var(--color-status-demo)`
  - `status-finished` → `var(--color-status-finished)`
  - `diff-add` → `var(--color-diff-add)`
  - `diff-add-text` → `var(--color-diff-add-text)`
  - `diff-remove` → `var(--color-diff-remove)`
  - `diff-remove-text` → `var(--color-diff-remove-text)`
- Define font family aliases:
  - `font-ui` → `var(--font-ui)`
  - `font-lyrics` → `var(--font-lyrics)`
- `tokens.css` default values (dark theme, adjust aesthetics later):
  
  ```css
  :root {
    --color-surface: #0d0d0d;
    --color-surface-raised: #161616;
    --color-surface-overlay: #1f1f1f;
    --color-border: #2a2a2a;
    --color-accent: #c084fc;
    --color-accent-muted: #7c3aed33;
    --color-text-primary: #ebebeb;
    --color-text-secondary: #a3a3a3;
    --color-text-muted: #525252;
    --color-status-idea: #6b7280;
    --color-status-draft: #3b82f6;
    --color-status-demo: #f59e0b;
    --color-status-finished: #22c55e;
    --color-diff-add: #14532d;
    --color-diff-add-text: #86efac;
    --color-diff-remove: #450a0a;
    --color-diff-remove-text: #fca5a5;
    --font-ui: "Inter", sans-serif;
    --font-lyrics: "Lora", serif;
    --radius-card: 8px;
    --radius-input: 6px;
  }
  ```
- `global.css` imports `tokens.css`, resets box-sizing, sets `body { background: var(--color-surface); color: var(--color-text-primary); font-family: var(--font-ui); }`
- Load Inter and Lora from Google Fonts or bundle them locally (local preferred for offline use)

-----

### Step 0.3 — Rust dependencies and module stubs

**What:** Add all required Rust dependencies to `Cargo.toml`. Create empty module files with doc comments describing their purpose.

**Why:** Establishing the full dependency tree upfront avoids incremental `cargo add` friction later. Stubs let the project compile cleanly from the start.

**Spec:**

`Cargo.toml` dependencies:

```toml
[dependencies]
tauri = { version = "2", features = ["shell-open"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "0.8"
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio", "macros"] }
ulid = "1"
similar = "2"
notify = "6"
zip = "2"
chrono = { version = "0.4", features = ["serde"] }
anyhow = "1"
thiserror = "1"
once_cell = "1"
```

Module stubs to create (each file should have a module-level doc comment and `#![allow(dead_code)]` during development):

- `src-tauri/src/error.rs`
- `src-tauri/src/commands/mod.rs` + one file per command group
- `src-tauri/src/core/mod.rs` + one file per core module
- `src-tauri/src/models/mod.rs` + one file per model
- `src-tauri/migrations/001_initial.sql` (empty for now)

Confirm `cargo build` compiles cleanly with all stubs in place.

-----

## Phase 1 — Rust Core: Data Models and Error Handling

### Step 1.1 — Unified error type

**What:** Define `AppError` in `error.rs` — a unified error enum that covers all failure modes and can be serialized to a frontend-friendly string via Tauri’s command system.

**Why:** Tauri commands return `Result<T, String>` to the frontend. Without a centralized error type, every command has bespoke error handling. A unified type ensures consistent error messages and makes the IPC contract clean.

**Spec:**

```rust
// error.rs
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("ZIP error: {0}")]
    Zip(#[from] zip::result::ZipError),
    #[error("TOML parse error: {0}")]
    TomlParse(#[from] toml::de::Error),
    #[error("TOML serialize error: {0}")]
    TomlSerialize(#[from] toml::ser::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Song not found: {0}")]
    SongNotFound(String),
    #[error("Snapshot not found: {0}")]
    SnapshotNotFound(String),
    #[error("Section not found: {0}")]
    SectionNotFound(String),
    #[error("Vault not configured")]
    VaultNotConfigured,
    #[error("File already exists: {0}")]
    FileExists(String),
    #[error("{0}")]
    Other(String),
}

// Implement serde::Serialize so Tauri can send it to the frontend
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

All Tauri commands return `Result<T, AppError>`.

-----

### Step 1.2 — Data models

**What:** Define all Rust structs in `models/`. These are the in-memory representations of all domain entities and the types that cross the IPC boundary to React.

**Why:** Models are the contract between the Rust core and the frontend. Defining them before any logic forces precision and prevents type mismatches later.

**Spec:**

`models/song.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongMetadata {
    pub id: String,           // ULID
    pub title: String,
    pub status: SongStatus,
    pub created_at: String,   // ISO 8601
    pub updated_at: String,
    pub musical: MusicalInfo,
    pub tags: SongTags,
    pub album: AlbumRef,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicalInfo {
    pub key: Option<String>,
    pub bpm: Option<u16>,
    pub capo: Option<u8>,
    pub tuning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongTags {
    pub genre: Vec<String>,
    pub mood: Vec<String>,
    pub language: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlbumRef {
    pub album_id: Option<String>,
    pub track_number: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SongStatus { Idea, Draft, Demo, Finished }

// What open_song returns to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongPayload {
    pub metadata: SongMetadata,
    pub sections: Vec<Section>,
    pub snapshot_headers: Vec<SnapshotHeader>,
    pub file_path: String,
}

// What list_songs returns (index row, no content)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongIndexEntry {
    pub id: String,
    pub title: String,
    pub status: SongStatus,
    pub bpm: Option<u16>,
    pub key: Option<String>,
    pub genre: Vec<String>,
    pub file_path: String,
    pub updated_at: String,
}
```

`models/section.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Section {
    pub id: String,           // ULID, stable identity
    pub name: String,
    pub section_type: SectionType,
    pub order: u32,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotSection {
    pub section_id: String,
    pub name: String,
    pub section_type: SectionType,
    pub order: u32,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum SectionType {
    Intro, Verse, PreChorus, Chorus, Bridge, Outro, Custom
}
```

`models/snapshot.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub id: String,           // ULID
    pub created_at: String,
    pub created_by: Option<String>,
    pub note: Option<String>,
    pub sections: Vec<SnapshotSection>,
}

// Lightweight — used in timeline, no section content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotHeader {
    pub id: String,
    pub created_at: String,
    pub created_by: Option<String>,
    pub note: Option<String>,
    pub section_count: u32,
}
```

`models/diff.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionDiff {
    pub section_id: String,
    pub name: String,
    pub status: DiffStatus,
    pub hunks: Vec<DiffHunk>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DiffStatus { Equal, Changed, Added, Removed }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffHunk {
    pub kind: HunkKind,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HunkKind { Equal, Insert, Delete }
```

`models/comment.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: String,
    pub section_id: String,
    pub snapshot_id: Option<String>,
    pub text: String,
    pub resolved: bool,
    pub created_at: String,
    pub created_by: Option<String>,
}
```

-----

## Phase 2 — Rust Core: `.lyr` File I/O

### Step 2.1 — `.lyr` archive read

**What:** Implement the parser in `core/song.rs` that reads a `.lyr` ZIP archive and returns a fully populated in-memory `SongPayload`.

**Why:** This is the most foundational piece of the system. Every other feature reads through this. Getting the parsing correct and robust upfront prevents data corruption bugs later.

**Spec:**

Function signature:

```rust
pub async fn read_lyr_file(path: &Path) -> AppResult<SongPayload>
```

Reading order (matters for error quality):

1. Open ZIP archive
1. Read and parse `meta.json` first — check `lyr_format_version`. If version is unrecognized, return a clear `AppError::Other("unsupported format version")` before touching other files
1. Read and parse `song.toml` → `SongMetadata`
1. Enumerate files in `sections/` — parse each `{ulid}.toml` → `Section`. Sort by `order` field ascending
1. Enumerate files in `snapshots/` — parse filename as ULID for sort order, parse each file’s `created_at` and `note` only → `SnapshotHeader`. Do NOT parse full snapshot content here
1. Read and parse `comments.toml` → `Vec<Comment>` (include in payload for later use, though not displayed on open)
1. Return `SongPayload { metadata, sections, snapshot_headers, file_path }`

Edge cases to handle:

- Missing `sections/` directory: treat as empty song (no sections)
- Missing `snapshots/` directory: treat as no history
- Missing `comments.toml`: treat as no comments
- Malformed TOML in any section file: return `AppError::TomlParse` with the filename included in context
- ZIP entries that don’t match expected patterns: silently skip (forward compatibility)

-----

### Step 2.2 — `.lyr` archive write

**What:** Implement the writer in `core/song.rs` that serializes the in-memory state back to a `.lyr` ZIP archive atomically.

**Why:** Writes must be atomic — a crash mid-write must not corrupt the existing file. The write-to-temp-then-rename pattern achieves this.

**Spec:**

Function signatures:

```rust
pub async fn write_lyr_file(
    path: &Path,
    metadata: &SongMetadata,
    sections: &[Section],
) -> AppResult<()>

pub async fn write_section(
    path: &Path,
    section: &Section,
) -> AppResult<()>   // used for single-section updates, avoids full rewrite
```

Write strategy:

1. Write to a temp file at `{path}.tmp`
1. Copy all existing archive contents to the temp file (preserve snapshots, comments, meta)
1. Overwrite `song.toml` with serialized metadata
1. Overwrite each section file in `sections/{id}.toml`
1. Rename temp file to final path (atomic on all target OSes)
1. On any error, delete the temp file before returning

`meta.json` is written once at file creation and never modified during normal saves (format version doesn’t change on edit).

TOML serialization notes:

- `song.toml`: serialize `SongMetadata` with `toml::to_string_pretty`
- `sections/{ulid}.toml`: serialize `Section` — the `content` field should use TOML multiline strings (`"""..."""`) for readability when the file is opened in a text editor
- Filenames use the section’s `id` (ULID), never derived from `name`

-----

### Step 2.3 — `.lyr` file creation

**What:** Implement `create_lyr_file` in `core/song.rs` — creates a new, empty `.lyr` archive on disk.

**Why:** New song creation is a distinct flow from writing: it initializes `meta.json`, a default section, and the folder structure inside the ZIP.

**Spec:**

```rust
pub async fn create_lyr_file(
    vault_path: &Path,
    title: &str,
) -> AppResult<(PathBuf, SongPayload)>
```

Behavior:

1. Generate a ULID for the song id
1. Sanitize `title` into a filename: lowercase, spaces to hyphens, strip non-alphanumeric except hyphens. E.g. `"Blue Hour"` → `blue-hour.lyr`
1. If `blue-hour.lyr` already exists in vault, try `blue-hour-2.lyr`, `blue-hour-3.lyr`, etc.
1. Create ZIP archive at `{vault_path}/{filename}`
1. Write `meta.json` with `lyr_format_version: "1.0"`, current timestamp
1. Write `song.toml` with provided title, `status: "idea"`, current timestamps, all other fields null/empty
1. Create one default section: id = new ULID, name = `"Verse 1"`, type = `verse`, order = 1, content = `""`
1. Write `sections/{ulid}.toml`
1. Create empty `snapshots/` directory entry in ZIP
1. Write empty `comments.toml` (empty array)
1. Return `(file_path, SongPayload)`

-----

### Step 2.4 — Snapshot write and read

**What:** Implement snapshot persistence in `core/snapshot.rs` — creating a new snapshot inside a `.lyr` archive and reading a full snapshot back out.

**Why:** Snapshots are append-only entries inside the archive. Writing them is a partial archive update (add one file, touch nothing else).

**Spec:**

```rust
pub async fn create_snapshot(
    path: &Path,
    sections: &[Section],
    note: Option<String>,
) -> AppResult<SnapshotHeader>

pub async fn load_snapshot(
    path: &Path,
    snapshot_id: &str,
) -> AppResult<Snapshot>

pub async fn restore_snapshot(
    path: &Path,
    snapshot_id: &str,
) -> AppResult<Vec<Section>>

pub async fn cherry_pick_section(
    path: &Path,
    snapshot_id: &str,
    section_id: &str,
) -> AppResult<Section>
```

`create_snapshot`:

1. Generate ULID for snapshot id
1. Capture current timestamp
1. Build `Snapshot { id, created_at, created_by: None, note, sections: sections.iter().map(|s| SnapshotSection::from(s)).collect() }`
1. Serialize to JSON
1. Open ZIP archive in append mode, write to `snapshots/{ulid}.json`
1. Return `SnapshotHeader` (no section content)

`load_snapshot`:

1. Open ZIP, find `snapshots/{snapshot_id}.json`
1. Parse full `Snapshot` including all section content
1. Return `Snapshot`

`restore_snapshot`:

1. Call `load_snapshot`
1. Convert `SnapshotSection` → `Section` (set `updated_at` to now, preserve all other fields)
1. Call `write_lyr_file` to overwrite live sections
1. Return `Vec<Section>` (the restored sections)

`cherry_pick_section`:

1. Call `load_snapshot`
1. Find section by `section_id` in snapshot — `AppError::SectionNotFound` if absent
1. Convert to `Section`, set `updated_at` to now
1. Call `write_section` to update just that section in the archive
1. Return updated `Section`

-----

## Phase 3 — Rust Core: Vault, Index, and File Watcher

### Step 3.1 — App config

**What:** Implement `core/config.rs` — reads and writes the platform-native app config file that stores the vault path and UI preferences.

**Why:** The vault path must survive app restarts and lives outside the vault itself. Platform-native config paths ensure the app behaves conventionally on each OS.

**Spec:**

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub vault_path: Option<String>,
    pub last_opened_song: Option<String>,   // file path
}

pub fn config_path() -> AppResult<PathBuf>
pub async fn load_config() -> AppResult<AppConfig>
pub async fn save_config(config: &AppConfig) -> AppResult<()>
```

Config file location:

- Linux: `~/.config/benzaiten/config.toml`
- macOS: `~/Library/Application Support/benzaiten/config.toml`
- Windows: `%APPDATA%\benzaiten\config.toml`

Use `tauri::path::BaseDirectory` or construct manually via `dirs` crate. If the file doesn’t exist, return `AppConfig { vault_path: None, last_opened_song: None }` without error.

-----

### Step 3.2 — SQLite index schema and migrations

**What:** Define the SQLite index schema in `migrations/001_initial.sql` and implement the migration runner in `core/index.rs`.

**Why:** The index is a cache of song metadata for fast listing and search. Running migrations at startup ensures the schema is always up to date.

**Spec:**

`migrations/001_initial.sql`:

```sql
CREATE TABLE IF NOT EXISTS songs (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL,
    bpm         INTEGER,
    key_sig     TEXT,
    genre       TEXT NOT NULL DEFAULT '[]',  -- JSON array
    file_path   TEXT NOT NULL UNIQUE,
    updated_at  TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_updated ON songs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status);
```

`core/index.rs` public API:

```rust
pub async fn init_index(vault_path: &Path) -> AppResult<SqlitePool>
pub async fn upsert_song(pool: &SqlitePool, entry: &SongIndexEntry) -> AppResult<()>
pub async fn remove_song(pool: &SqlitePool, file_path: &str) -> AppResult<()>
pub async fn list_songs(pool: &SqlitePool) -> AppResult<Vec<SongIndexEntry>>
pub async fn get_song_by_path(pool: &SqlitePool, file_path: &str) -> AppResult<Option<SongIndexEntry>>
```

`init_index`:

1. Ensure `.lyrindex/` directory exists inside vault
1. Open SQLite connection to `.lyrindex/index.db`
1. Run migrations via `sqlx::migrate!()`
1. Return pool

The pool is stored in Tauri’s managed state (`tauri::Manager::manage`) so all commands can access it.

-----

### Step 3.3 — Vault scanner

**What:** Implement `core/vault.rs` — scans the vault folder, compares `.lyr` file mtimes against the index, and rebuilds stale entries.

**Why:** The index must reflect the current state of the vault on every startup, even if files were added, modified, or removed while the app was closed (e.g. Dropbox sync).

**Spec:**

```rust
pub async fn scan_vault(
    vault_path: &Path,
    pool: &SqlitePool,
) -> AppResult<Vec<SongIndexEntry>>
```

Algorithm:

1. Walk the vault directory (non-recursive — flat vault model)
1. For each `*.lyr` file found:
   a. Check if `file_path` exists in the index AND `updated_at` in index matches file mtime
   b. If stale or missing: call `read_lyr_file`, extract `SongIndexEntry` from `SongPayload`, call `upsert_song`
1. For each index entry whose `file_path` no longer exists on disk: call `remove_song`
1. Return final `list_songs` result

Ignore the `.lyrindex/` directory during scan.

-----

### Step 3.4 — File watcher

**What:** Start a `notify` file watcher on the vault directory when the app launches. React to filesystem events and keep the index up to date, emitting Tauri events to the frontend.

**Why:** If the user adds a file via Dropbox, Git, or Finder while the app is open, it should appear in the song list automatically without requiring an app restart.

**Spec:**

```rust
pub fn start_watcher(
    vault_path: PathBuf,
    pool: SqlitePool,
    app_handle: tauri::AppHandle,
) -> AppResult<()>
```

Events to handle:

- `Create` / `Modify` on a `.lyr` file: parse header, upsert index, emit `"vault:song-updated"` Tauri event with `SongIndexEntry` payload
- `Remove` on a `.lyr` file: remove from index, emit `"vault:song-removed"` event with file path
- `Rename` (old path → new path, both in vault): update `file_path` in index entry, emit `"vault:song-updated"`
- `Rename` (old path in vault, new path outside): treat as remove
- `Rename` (old path outside vault, new path in vault): treat as create

Ignore all events inside `.lyrindex/`. Use a debounce of 300ms on modify events (editors write multiple times on save).

The watcher runs in a background Tokio task for the app lifetime.

-----

## Phase 4 — Rust Core: Diff Engine

### Step 4.1 — Diff computation

**What:** Implement `core/diff.rs` using the `similar` crate to produce section-level and character-level diffs between two snapshot states.

**Why:** The diff view is a core feature. The diff engine must handle sections that exist in one snapshot but not the other, sections that were renamed, and produce character-level hunks for display.

**Spec:**

```rust
pub fn diff_snapshots(
    snapshot_a: &Snapshot,
    snapshot_b: &Snapshot,
) -> Vec<SectionDiff>

pub fn diff_working_vs_snapshot(
    live_sections: &[Section],
    snapshot: &Snapshot,
) -> Vec<SectionDiff>
```

Algorithm for `diff_snapshots`:

1. Build a map `section_id → SnapshotSection` for each snapshot
1. Collect all unique `section_id`s across both snapshots
1. For each `section_id`:
- In A only: `DiffStatus::Removed`, hunks = full content as Delete
- In B only: `DiffStatus::Added`, hunks = full content as Insert
- In both, content equal: `DiffStatus::Equal`, no hunks needed
- In both, content different: `DiffStatus::Changed`, compute character-level diff with `similar::TextDiff::from_chars`
1. Sort result by order from snapshot_b (use snapshot_a order as fallback for removed sections)
1. Return `Vec<SectionDiff>`

Character-level hunk construction:

```rust
// For each change op in similar::TextDiff:
// similar::ChangeTag::Equal   → HunkKind::Equal
// similar::ChangeTag::Insert  → HunkKind::Insert
// similar::ChangeTag::Delete  → HunkKind::Delete
```

For `diff_working_vs_snapshot`: convert `live_sections` to `SnapshotSection` format, then call `diff_snapshots` logic.

-----

## Phase 5 — Tauri Command Layer

### Step 5.1 — Wire all commands

**What:** Implement all Tauri command handlers in `commands/`. Each handler is a thin shim: validate input, call into `core/`, return result.

**Why:** The command layer is the complete IPC surface between React and Rust. Implementing it all at once makes the frontend integration clean — no partial APIs.

**Spec:**

All commands follow this pattern:

```rust
#[tauri::command]
pub async fn command_name(
    state: tauri::State<'_, AppState>,
    // ...args
) -> Result<ReturnType, AppError>
```

`AppState` struct (managed via `tauri::Manager::manage`):

```rust
pub struct AppState {
    pub pool: SqlitePool,
    pub config: Mutex<AppConfig>,
}
```

Full command list (grouped by file):

`commands/vault.rs`:

- `list_songs(state) → Vec<SongIndexEntry>`: calls `index::list_songs`
- `set_vault_path(state, path: String) → ()`: updates config, triggers `scan_vault`
- `get_vault_path(state) → Option<String>`: reads config
- `rebuild_index(state) → Vec<SongIndexEntry>`: drops and recreates index, runs full scan
- `import_song(state, external_path: String) → SongIndexEntry`: copies file into vault (with collision resolution), indexes it

`commands/song.rs`:

- `open_song(state, path: String) → SongPayload`
- `save_song(state, path: String, metadata: SongMetadata, sections: Vec<Section>) → ()`
- `create_song(state, title: String) → SongPayload`
- `delete_song(state, path: String) → ()`: deletes file, removes from index

`commands/snapshot.rs`:

- `create_snapshot(state, path: String, sections: Vec<Section>, note: Option<String>) → SnapshotHeader`
- `load_snapshot(state, path: String, snapshot_id: String) → Snapshot`
- `restore_snapshot(state, path: String, snapshot_id: String) → Vec<Section>`
- `cherry_pick_section(state, path: String, snapshot_id: String, section_id: String) → Section`

`commands/diff.rs`:

- `diff_snapshots(state, path: String, snapshot_id_a: String, snapshot_id_b: String) → Vec<SectionDiff>`
- `diff_working_vs_snapshot(state, path: String, snapshot_id: String, sections: Vec<Section>) → Vec<SectionDiff>`

`commands/section.rs`:

- `add_section(state, path: String, section_type: SectionType, name: String) → Section`
- `delete_section(state, path: String, section_id: String) → ()`
- `reorder_sections(state, path: String, ordered_ids: Vec<String>) → ()`

`commands/comment.rs`:

- `add_comment(state, path: String, section_id: String, snapshot_id: Option<String>, text: String) → Comment`
- `resolve_comment(state, path: String, comment_id: String) → ()`
- `list_comments(state, path: String, section_id: String) → Vec<Comment>`

`commands/export.rs`:

- `export_plain_text(state, path: String, include_history: bool) → String`
- `export_pdf(state, path: String, include_history: bool) → Vec<u8>`

`commands/config.rs`:

- `get_config(state) → AppConfig`
- `set_config(state, config: AppConfig) → ()`

Register all commands in `main.rs` via `.invoke_handler(tauri::generate_handler![...])`.

-----

## Phase 6 — React Foundation

### Step 6.1 — Typed IPC bindings

**What:** Implement `src/lib/tauri.ts` — typed async wrappers around every Tauri `invoke()` call. Mirror all types from the Rust models as TypeScript interfaces.

**Why:** Raw `invoke()` calls scattered through components are untyped and fragile. A single typed binding file means TypeScript catches mismatches between frontend and backend early.

**Spec:**

Types to define in `src/lib/types.ts`:

```typescript
export type SongStatus = 'idea' | 'draft' | 'demo' | 'finished'
export type SectionType = 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'custom'
export type DiffStatus = 'equal' | 'changed' | 'added' | 'removed'
export type HunkKind = 'equal' | 'insert' | 'delete'

export interface MusicalInfo { key: string | null; bpm: number | null; capo: number | null; tuning: string | null }
export interface SongTags { genre: string[]; mood: string[]; language: string[] }
export interface AlbumRef { album_id: string | null; track_number: number | null }
export interface SongMetadata { id: string; title: string; status: SongStatus; created_at: string; updated_at: string; musical: MusicalInfo; tags: SongTags; album: AlbumRef }
export interface SongIndexEntry { id: string; title: string; status: SongStatus; bpm: number | null; key: string | null; genre: string[]; file_path: string; updated_at: string }
export interface Section { id: string; name: string; section_type: SectionType; order: number; content: string; created_at: string; updated_at: string }
export interface SongPayload { metadata: SongMetadata; sections: Section[]; snapshot_headers: SnapshotHeader[]; file_path: string }
export interface SnapshotHeader { id: string; created_at: string; created_by: string | null; note: string | null; section_count: number }
export interface SnapshotSection { section_id: string; name: string; section_type: SectionType; order: number; content: string }
export interface Snapshot { id: string; created_at: string; created_by: string | null; note: string | null; sections: SnapshotSection[] }
export interface DiffHunk { kind: HunkKind; text: string }
export interface SectionDiff { section_id: string; name: string; status: DiffStatus; hunks: DiffHunk[] }
export interface Comment { id: string; section_id: string; snapshot_id: string | null; text: string; resolved: boolean; created_at: string; created_by: string | null }
export interface AppConfig { vault_path: string | null; last_opened_song: string | null }
```

`src/lib/tauri.ts` — one exported function per command, each calling `invoke<ReturnType>('command_name', args)`. Example:

```typescript
import { invoke } from '@tauri-apps/api/core'
import type { SongPayload, SongIndexEntry, ... } from './types'

export const tauriApi = {
  vault: {
    listSongs: () => invoke<SongIndexEntry[]>('list_songs'),
    setVaultPath: (path: string) => invoke<void>('set_vault_path', { path }),
    getVaultPath: () => invoke<string | null>('get_vault_path'),
    rebuildIndex: () => invoke<SongIndexEntry[]>('rebuild_index'),
    importSong: (externalPath: string) => invoke<SongIndexEntry>('import_song', { externalPath }),
  },
  song: {
    open: (path: string) => invoke<SongPayload>('open_song', { path }),
    save: (path: string, metadata: SongMetadata, sections: Section[]) => invoke<void>('save_song', { path, metadata, sections }),
    create: (title: string) => invoke<SongPayload>('create_song', { title }),
    delete: (path: string) => invoke<void>('delete_song', { path }),
  },
  // ... all other groups
}
```

-----

### Step 6.2 — Zustand stores

**What:** Implement `stores/songStore.ts` and `stores/editorStore.ts`.

**Why:** Global state that multiple components need to read and write. Zustand is minimal, synchronous, and React-friendly without a provider wrapper.

**Spec:**

`stores/songStore.ts`:

```typescript
interface SongStore {
  songs: SongIndexEntry[]
  selectedSongPath: string | null
  setSongs: (songs: SongIndexEntry[]) => void
  upsertSong: (entry: SongIndexEntry) => void
  removeSong: (filePath: string) => void
  selectSong: (path: string | null) => void
}
```

`stores/editorStore.ts`:

```typescript
interface EditorStore {
  filePath: string | null
  metadata: SongMetadata | null
  sections: Section[]
  isDirty: boolean
  snapshotHeaders: SnapshotHeader[]
  loadedSnapshots: Record<string, Snapshot>
  diffResult: SectionDiff[] | null
  diffTargetA: string | null   // snapshot id or 'now'
  diffTargetB: string | null

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
}
```

`updateSection` sets `isDirty = true`. `markClean` sets it to `false`.

-----

### Step 6.3 — Custom hooks

**What:** Implement all hooks in `src/hooks/`. Each hook encapsulates the IPC calls and store updates for one domain.

**Why:** Components should not call `tauriApi` directly. Hooks are the right abstraction boundary — they handle loading state, error handling, and store updates in one place.

**Spec:**

`hooks/useVault.ts`:

```typescript
export function useVault() {
  const { setSongs, upsertSong, removeSong } = useSongStore()

  const loadSongs = async () => {
    const songs = await tauriApi.vault.listSongs()
    setSongs(songs)
  }

  // Set up Tauri event listeners for vault:song-updated and vault:song-removed
  useEffect(() => {
    const unlisten1 = listen<SongIndexEntry>('vault:song-updated', e => upsertSong(e.payload))
    const unlisten2 = listen<string>('vault:song-removed', e => removeSong(e.payload))
    return () => { unlisten1.then(f => f()); unlisten2.then(f => f()) }
  }, [])

  return { loadSongs }
}
```

`hooks/useSong.ts` — wraps `open`, `save`, `create`, `delete`. `save` calls `tauriApi.song.save` then `markClean`. `open` calls `tauriApi.song.open` then `loadSong`.

`hooks/useSnapshot.ts` — wraps `create`, `loadSnapshot`, `restore`, `cherryPick`. `create` appends to `snapshotHeaders`. `loadSnapshot` caches in `loadedSnapshots`. `restore` replaces `sections`. `cherryPick` updates one section.

`hooks/useDiff.ts` — resolves both snapshot ids (loading from cache or fetching), calls `tauriApi.diff.diffSnapshots` or `diffWorkingVsSnapshot`, calls `setDiff`.

`hooks/useAutosave.ts` — debounced effect watching `isDirty`. After 30 seconds of no edits, calls `tauriApi.song.save` silently if `isDirty` is true. Emits no visible feedback except clearing `isDirty`.

-----

### Step 6.4 — App shell and layout

**What:** Implement `AppShell.tsx`, the top-level two-panel layout with collapsible sidebar.

**Why:** The shell is the frame everything else renders inside. Getting it right before building content components means no layout refactors later.

**Spec:**

- State: `sidebarOpen: boolean` (default true) — `useState` in `AppShell`
- Layout: CSS grid with two columns. When `sidebarOpen`: `grid-template-columns: 280px 1fr`. When collapsed: `grid-template-columns: 48px 1fr`. Transition: `transition: grid-template-columns 200ms ease`
- Sidebar collapse toggle: a `<button>` absolutely positioned at the right edge of the sidebar, shows `‹` when open and `›` when collapsed
- Collapsed sidebar: shows only a vertical strip with the `+` new song button and small status-colored dots per song (for orientation)
- Keyboard shortcut: `Cmd+\` (Meta+Backslash) toggles sidebar — use a `useEffect` with `keydown` listener
- `<Sidebar />` and `<EditorPanel />` are the two children
- On mount: call `loadSongs()` from `useVault`. If vault path is not set, render `<VaultSetupScreen />` instead of the normal layout

`VaultSetupScreen`: a centered card with two options — “Create new vault” (folder picker via `tauri-plugin-dialog`) and “Open existing vault” (folder picker). On confirm, calls `tauriApi.vault.setVaultPath`, then `loadSongs`.

-----

## Phase 7 — Song List UI

### Step 7.1 — Song list and song entry

**What:** Implement `Sidebar.tsx`, `SongList.tsx`, and `SongEntry.tsx`.

**Why:** The left panel is the primary navigation surface. It must be fast to scan and immediately informative.

**Spec:**

`Sidebar.tsx`: renders header row (logo/app name left, `+` button right), `SongSearch`, sort control, `SongList`.

`SongList.tsx`: reads `songs` from `songStore`. Renders a scrollable list of `SongEntry` components. Shows empty state (“No songs yet. Click + to create one.”) when list is empty.

Sort control: a small `<select>` with options: `Updated (newest)`, `Updated (oldest)`, `Title A–Z`, `Status`. Sorting is client-side, applied to the `songs` array before rendering.

`SongEntry.tsx` props: `entry: SongIndexEntry`, `isSelected: boolean`, `onSelect: () => void`.

Layout of each entry (compact, ~64px tall):

- First line: song title (truncated, `text-primary`, medium weight)
- Second line: status badge (colored pill with label) + BPM (muted) + key (muted)
- Third line: first two genre tags as small chips

Status badge colors map to `--color-status-*` tokens.

`onSelect` triggers `useSong.openSong(entry.file_path)` and calls `selectSong(entry.file_path)` on the store.

`SongSearch.tsx`: a text input. On change, filters the `songs` array by matching title, genre, mood, language (case-insensitive substring). Filtering is client-side over the index data already in store.

-----

## Phase 8 — Editor UI

### Step 8.1 — Metadata bar

**What:** Implement `MetadataBar.tsx` — the fixed-height top strip of the editor showing song title and all metadata fields.

**Why:** All song-level metadata must be quickly accessible and editable without leaving the editor context.

**Spec:**

Left side: song title as a large inline-editable text input (no visible border until focused, uses `font-ui` at ~20px). On blur or Enter: calls `updateMetadata({ title })` on the store and updates the song list entry.

Right side (compact inline fields, left to right):

- Key: text input, ~60px wide, placeholder “Key”
- BPM: number input, ~60px wide, placeholder “BPM”
- Capo: number input, ~40px wide, placeholder “0”
- Tuning: text input, ~80px wide, placeholder “Standard”
- Status: a styled `<select>` or custom dropdown cycling through `idea → draft → demo → finished`. Renders as a colored pill matching status token colors
- Tag clusters for genre, mood, language: each tag is a small removable chip; an `+` button opens a small inline text input to add a new tag

Far right:

- Save button (floppy disk icon): disabled and muted when `!isDirty`. On click calls `useSong.save()`. Shows a fading “Saved” ghost text for 2 seconds after successful save
- Save version button (camera icon): always enabled when a song is open. On click opens a small inline popover with a text input for the note and a confirm button. On confirm calls `useSnapshot.createSnapshot(note)`
- Dirty indicator: a small dot on the Save button when `isDirty` is true

All field changes call `updateMetadata` on the store (setting `isDirty = true`) but do not immediately persist — they are persisted on the next save.

-----

### Step 8.2 — Section editor

**What:** Implement `SectionEditor.tsx`, `SectionBlock.tsx`, `SectionHeader.tsx`, and `AddSection.tsx`.

**Why:** The section editor is the primary creative surface. It must feel like writing, not like filling in a form.

**Spec:**

`SectionEditor.tsx`: reads `sections` from `editorStore`. Renders sections in `order` sequence using `@dnd-kit/sortable` for drag-to-reorder. Renders `AddSection` at the bottom and between sections on hover. In diff mode (`diffResult !== null`), renders `DiffSection` components instead of `SectionBlock`.

`SectionBlock.tsx` props: `section: Section`, `onContentChange: (id, content) => void`.

Layout:

- `SectionHeader` at top
- `<textarea>` below, auto-expanding (no fixed height — grows with content using a resize observer or the `field-sizing: content` CSS property if available, otherwise the classic `scrollHeight` trick)
- Textarea styling: no border normally, subtle border on focus; `font-family: var(--font-lyrics)`; `font-size: 15px`; `line-height: 1.8`; `padding: 12px 16px`; background `surface-raised`; color `text-primary`

`SectionHeader.tsx`: drag handle (⠿ icon, cursor grab), section type badge (colored by type, clickable to open type picker), editable section name (inline input), comment icon with unresolved count badge, `⋯` overflow menu (duplicate section, delete section).

Section type picker: a small absolutely-positioned dropdown listing all `SectionType` values. Selecting one calls `tauriApi.section.updateSectionType` (or handles it as a metadata update on the section).

`AddSection.tsx`: renders as a subtle `+ Add section` button. On click: calls `tauriApi.section.addSection` with a default type of `verse` and name `"Verse N"` (where N is current verse count + 1), then appends to `sections` in store.

Between-section add: render a thin horizontal rule between each pair of sections that shows a `+` icon on hover. On click: same as above but inserts at a specific `order` position.

Drag-to-reorder: on drag end, compute new `order` values and call `tauriApi.section.reorderSections(orderedIds)`. Update store immediately (optimistic).

-----

## Phase 9 — Version Timeline UI

### Step 9.1 — Timeline strip

**What:** Implement `VersionTimeline.tsx` and `SnapshotCard.tsx`.

**Why:** The timeline is how the user navigates their song’s history. It must be visually inviting — creative history, not a technical log.

**Spec:**

`VersionTimeline.tsx`:

- Collapsible via a chevron in the top-right corner. `timelineOpen` state, default true
- Height when expanded: ~180px. Height when collapsed: ~36px (single summary row). CSS transition on height
- Top of strip: section label “History” left, snapshot count muted right, chevron toggle far right
- Horizontal scrollable row of `SnapshotCard` components when expanded, newest on the left
- A “Now” card always at the far left (represents the live working copy). Styled distinctly — outlined instead of filled

`SnapshotCard.tsx` props: `header: SnapshotHeader`, `isSelected: boolean`, `onClick: () => void`.

Card layout (~140px wide, ~120px tall):

- Note text (primary, truncated to 2 lines, italic). If null: show “Untitled snapshot” in muted text
- Relative timestamp below (“2 days ago”), full ISO timestamp on hover via `title` attribute
- Section count in muted text (“4 sections”)

Interactions:

- Single click: calls `useSnapshot.loadSnapshot(id)` (loads into cache), enters a “preview” state — the editor shows the snapshot content read-only alongside a banner “Viewing snapshot — [note] — [date]” with an “Exit” button and a “Restore” button
- Two-card comparison: hold Shift and click a second card — enters diff mode via `useDiff.diffTwoSnapshots(idA, idB)`
- Right-click context menu: “Restore this version”, “Compare with current”, “Delete snapshot”

Comparing with current: passes `diffTarget = { a: 'now', b: snapshotId }` — `useDiff` handles the `'now'` sentinel by using live `sections` from the store.

-----

## Phase 10 — Diff UI

### Step 10.1 — Diff view

**What:** Implement `DiffBanner.tsx`, `DiffSection.tsx`, and `DiffHunk.tsx`.

**Why:** The diff view is the core payoff of the versioning system. It must be readable and calm — a creative tool for reviewing evolution, not a code review interface.

**Spec:**

`DiffBanner.tsx`: a full-width strip at the top of `EditorPanel` when `diffResult !== null`. Shows “Comparing [note A] → [note B]” in center. Right side: “Restore version B” button and “Exit” button (calls `clearDiff()`). Background: `surface-overlay`. A subtle top border in `accent`.

`DiffSection.tsx` props: `diff: SectionDiff`. Replaces `SectionBlock` in diff mode.

Layout:

- Header shows section name + `DiffStatus` badge. Badge colors: `equal` = muted, `changed` = amber, `added` = green, `removed` = red/coral
- If `equal`: render section content in muted text, no hunks
- If `added` or `removed`: render full content in appropriate diff color
- If `changed`: render `DiffHunk` components inline
- If `changed` or `added`: show “Use this section” button in header (calls `cherryPickSection`)

`DiffHunk.tsx` props: `hunk: DiffHunk`. Renders an inline `<span>`:

- `equal`: `color: text-primary`
- `insert`: `background: diff-add`, `color: diff-add-text`
- `delete`: `background: diff-remove`, `color: diff-remove-text`, `text-decoration: line-through`

Whitespace preservation: `white-space: pre-wrap` on the diff section body — newlines and spacing must be exactly preserved.

-----

## Phase 11 — Comments UI

### Step 11.1 — Comment panel

**What:** Implement `CommentPanel.tsx` and `CommentEntry.tsx` — an inline slide-out panel per section.

**Why:** Annotations are tied to specific sections and optionally to specific snapshots. They should not interrupt the writing flow — they live under the section, not in a modal.

**Spec:**

Comment icon in `SectionHeader`: a speech bubble icon. Shows a small badge with the count of unresolved comments if > 0. Clicking toggles `commentPanelOpen` state on that section block.

`CommentPanel.tsx` appears as an animated slide-down panel between the section textarea and the next section, when open. Not a modal.

Layout:

- List of `CommentEntry` components (unresolved first, then resolved in muted style)
- A “Show resolved” toggle if there are resolved comments
- A text area input at the bottom with a “Add note” submit button (calls `useComment.addComment`)
- If a snapshot is currently loaded/previewed, a checkbox “Pin to this snapshot version” that sets `snapshot_id` on the comment

`CommentEntry.tsx`: shows comment text, relative timestamp, a checkmark “Resolve” button. Resolved comments show with strikethrough text and muted color.

-----

## Phase 12 — Export

### Step 12.1 — Plain text and PDF export

**What:** Implement the export commands in Rust and connect them to the UI via a menu item and keyboard shortcut.

**Why:** Songs must leave the app in universal formats. Plain text is the primary export — simple, universal, and writable by the Rust core without dependencies. PDF is a polish export.

**Spec:**

`commands/export.rs — export_plain_text`:

- Read song from file
- Format:
  
  ```
  {title}
  {key} · {bpm} BPM · {tuning}
  ─────────────────────────
  [{section name}]
  {section content}
  
  [{section name}]
  ...
  ```
- If `include_history = true`: append a separator and list each snapshot with its note, date, and full section content
- Return the string — frontend saves via `tauri-plugin-fs` or triggers a save dialog

`commands/export.rs — export_pdf`:

- Render HTML string of the song (same structure as plain text export but styled)
- Use Tauri’s `WebviewWindow::print()` or a headless rendering approach
- Alternative (simpler): return the plain text and instruct frontend to open a printable HTML page in a new Tauri window with `@media print` styles. This avoids a heavy PDF dependency in Rust.
- ✦ Decision: use the printable HTML window approach for MVP. A dedicated Rust PDF library (`printpdf`) can replace it later.

Export trigger in UI: `File > Export > Plain Text / PDF` in the menu bar. Both open a save dialog via `tauri-plugin-dialog` to choose destination.

-----

## Phase 13 — Native Menu Bar

### Step 13.1 — Tauri menu implementation

**What:** Implement the native menu bar using Tauri 2’s menu API.

**Why:** The menu bar is a discoverability layer. Every item must mirror an existing UI action — no menu-only functionality.

**Spec:**

Use `tauri::menu::Menu` builder in `main.rs` to construct the full menu defined during UX design. Each menu item emits a named Tauri event (e.g. `"menu:new-song"`, `"menu:save"`) that the React frontend listens for and routes to the appropriate hook.

This decouples the menu from any specific component — the frontend’s global `useEffect` in `App.tsx` listens for all menu events and dispatches them to the right store action or hook.

Keyboard shortcuts are declared in the menu builder (Tauri handles OS-level registration). UI buttons do not need separate shortcut logic — the menu handles it.

Items to implement: all items from the UX design phase menu structure. Greyed-out items for future features (`Find in Songs`) are acceptable — use `enabled: false`.

-----

## Phase 14 — Polish and Hardening

### Step 14.1 — Error boundaries and empty states

**What:** Add React error boundaries around the editor panel and song list. Add empty states for: no vault configured, empty vault, no song selected, song file missing.

**Why:** Users will encounter edge cases. Graceful degradation is important for a tool you trust with creative work.

### Step 14.2 — Autosave and dirty state reliability

**What:** Audit the `isDirty` flow end-to-end. Ensure autosave fires reliably, that navigating away from a dirty song prompts a save, and that a crash does not cause data loss beyond the last autosave.

**Why:** A versioning tool that loses work is worse than no versioning tool.

**Spec:** Add a `beforeunload` / Tauri `CloseRequested` handler that checks `isDirty` and prompts “You have unsaved changes. Save before closing?”

### Step 14.3 — First-launch experience

**What:** Polish the vault setup screen. Ensure first-launch flow is smooth: vault creation, first song creation, and a brief tooltip or callout explaining snapshots.

### Step 14.4 — File association handling

**What:** Handle the case where the app is opened by double-clicking a `.lyr` file in the OS. Tauri delivers the file path via a deep link or file association event.

**Spec:** Listen for the `tauri://file-drop` event or the `open-url` deep link in `main.rs`. If the path is inside the vault, open it. If outside, trigger the import flow.

-----

## Next Steps (Post-MVP)

These features were deliberately excluded from the MVP. They are ready to be designed and implemented once the core is stable.

**UX / Interaction**

- Zen / focus mode: full-screen writing surface, all chrome hidden, `Cmd+Shift+F` toggle
- Phonetic overlay: syllable stress annotation mode, language-aware (EN/JA/PT/KO), toggle that doesn’t disturb normal editing
- Keyboard shortcut reference panel (Help menu)

**Organization**

- Album view: logical song grouping with track ordering, new mode in left panel
- Subfolder support in vault
- Advanced filter/sort: mood, language, date range, multi-tag

**Collaboration**

- Multi-user presence indicators on snapshots (`created_by` field already in schema)
- Merge UI for reconciling two diverged `.lyr` files
- Optional cloud sync: user-configured backend (VPS or S3, no hosted service)

**Power features**

- Global search across all song content and snapshot history
- Snapshot diff export (share a visual diff as PDF)
- CLI companion: scripting over the vault (bulk export, snapshot stats, search)
- Version graph: visual DAG if branching is ever supported
- Light mode theme (tokens.css `:root[data-theme="light"]` override)


# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
