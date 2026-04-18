# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lyra** is a file-primary lyric versioning tool — a desktop app for musicians to manage, version, and diff song lyrics. The core data format is `.lyr`, a ZIP archive containing song metadata (TOML), sections, snapshots, and comments. A SQLite index at `<vault>/.lyrindex/index.db` provides fast lookup; the source of truth is always the `.lyr` file.

## Commands

```bash
# Run the full app (frontend + Tauri window with Rust backend)
npm run tauri dev

# Frontend only (Vite dev server on port 1420)
npm run dev

# Production build
npm run tauri build

# TypeScript type-check + Vite build (frontend only)
npm run build

# Rust only
cd src-tauri && cargo build
cd src-tauri && cargo check
cd src-tauri && cargo test

# Run a single Rust test
cd src-tauri && cargo test <test_name>
```

## Architecture

### Stack

- **Frontend**: React 19 + TypeScript (strict), Vite, Tailwind CSS 4, Zustand
- **Backend**: Rust (Tauri 2), Tokio, SQLx + SQLite, `similar` (diff), `notify` (file watcher), ULID
- **IPC**: Tauri commands bridge frontend ↔ Rust

### Data Flow

```
.lyr file (ZIP)  ←→  core/song.rs  ←→  Tauri commands  ←→  React hooks/stores  ←→  UI
                          ↕
                     core/index.rs
                          ↕
                     .lyrindex/index.db (SQLite — metadata cache only)
```

1. **Vault** (`core/vault.rs`): User-configured directory of `.lyr` files. Scanned flat (non-recursive) on startup and on vault path change. A `notify` file watcher triggers re-indexing on changes.
2. **.LYR format** (`core/song.rs`): ZIP containing `meta.json`, `song.toml`, `sections/{ulid}.toml`, `snapshots/{ulid}.json`, `comments.toml`.
3. **Index** (`core/index.rs`): SQLite caches lightweight song metadata (`songs` table) for the sidebar list. Full content is always read from the `.lyr` file.
4. **Commands** (`commands/`): One file per domain — `song`, `snapshot`, `diff`, `vault`, `section`, `comment`, `config`, `export`. These are the Tauri `#[tauri::command]` handlers.
5. **Frontend state**: `stores/songStore.ts` (song list), `stores/editorStore.ts` (active song + sections + snapshots). Domain hooks (`useSong`, `useSnapshot`, `useDiff`, `useVault`) call Tauri commands via `@tauri-apps/api`.

### Key Models (`src-tauri/src/models/`)

| Type | Description |
|------|-------------|
| `SongMetadata` | id (ULID), title, status, musical info (key, bpm, capo, tuning), tags, album |
| `SongPayload` | Full song: metadata + sections + snapshot_headers + comments + file_path |
| `SongIndexEntry` | Lightweight row for list views (mirrors SQLite `songs` table) |
| `Section` | id (ULID), name, `SectionType` (kebab-case serde), order, content |
| `SnapshotHeader` | id, created_at, note, section_count — no section content |
| `Snapshot` | Full snapshot including all `SnapshotSection` content |
| `SectionDiff` / `DiffHunk` | Character-level diff output from `similar` crate |
| `Comment` | id, section_id, optional snapshot_id, text, resolved |

### IDs

All entity IDs (songs, sections, snapshots, comments) use **ULID** via the `ulid` crate — not UUID. ULIDs are lexicographically sortable by creation time.

### Error Handling

All Rust errors flow through `AppError` in `src-tauri/src/error.rs`, which implements `serde::Serialize` so Tauri serializes it as a string to the frontend. All commands return `AppResult<T>`.

### Config Persistence

App config (`vault_path`, `last_opened_song`) is stored at:
- Windows: `%APPDATA%\lyra\config.toml`
- macOS: `~/Library/Application Support/lyra/config.toml`
- Linux: `~/.config/lyra/config.toml`

`AppState` holds `config: Mutex<AppConfig>`. Always drop the lock guard before awaiting — the pattern is to clone the value out first, then drop the guard.

## Critical Conventions

### Adding New Tauri Commands

Commands defined in `commands/*.rs` with `#[tauri::command]` must also be **registered in `src-tauri/src/lib.rs`** inside `tauri::generate_handler![...]`. The current `lib.rs` only registers the placeholder `greet` command — this will be updated as features land.

### Atomic ZIP Writes

All `.lyr` archive mutations (write song, write section, create snapshot, delete section) use an atomic pattern:
1. Write to `{path}.lyr.tmp`
2. On success, `std::fs::rename(tmp, path)` — atomic on all target OSes
3. On error, delete the `.tmp` file before returning

Never write directly to the `.lyr` file. See `core/section.rs` and `core/snapshot.rs` for examples.

### Serde Conventions

- `SongStatus` serializes as lowercase (`"idea"`, `"draft"`, `"demo"`, `"finished"`)
- `SectionType` serializes as kebab-case (`"pre-chorus"`, `"verse"`, etc.)
- All timestamps are ISO 8601 strings

### Development State

Several modules are currently **empty stubs** being filled in phase by phase (per the roadmap in `README.md`):
- `commands/comment.rs`, `commands/config.rs`, `commands/export.rs` — no commands implemented yet
- `src/stores/songStore.ts`, `src/stores/editorStore.ts` — stub files
- `src/hooks/useSong.ts`, `src/hooks/useVault.ts`, etc. — stub files

All Rust source files carry `#![allow(dead_code)]` during active development. The frontend (`src/`) has very little implementation yet.

## Configuration

- `tauri.conf.json`: Product name "Lyra", identifier `dev.gabrielbg.lyra`, window 1280×800, `.lyr` file association
- `vite.config.ts`: Dev server port 1420, HMR port 1421
- Design tokens defined as CSS variables in `src/styles/tokens.css`
- SQLite schema in `src-tauri/migrations/001_initial.sql` — applied automatically via `sqlx::migrate!()` on startup

## UI Layout (Planned)

- **AppShell** → **Sidebar** (song list, search) + **EditorPanel** (sections, metadata bar)
- **VersionTimeline**: Snapshot history panel (horizontal scroll strip)
- **DiffSection**: Inline diff view using `DiffHunk` data
- **CommentPanel**: Per-section slide-out annotation panel
