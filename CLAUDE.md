# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lyra** (formerly Benzaiten) is a file-primary lyric versioning tool — a desktop app for musicians to manage, version, and diff song lyrics. The core data format is `.lyr`, a ZIP archive containing song metadata (TOML), sections, snapshots, and comments. A SQLite index at `<vault>/.lyrindex/index.db` provides fast lookup; the source of truth is always the `.lyr` file.

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
```

No dedicated linter or test runner is configured for the frontend yet. TypeScript strict mode is enforced via `tsconfig.json`.

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

1. **Vault** (`core/vault.rs`): User-configured directory of `.lyr` files. A `notify` file watcher triggers re-indexing on changes.
2. **.LYR format** (`core/song.rs`): ZIP containing `meta.json`, `song.toml`, `sections/{ulid}.toml`, `snapshots/{ulid}.json`, `comments.toml`.
3. **Index** (`core/index.rs`): SQLite caches lightweight song metadata (`songs` table) for the sidebar list. Full content is always read from the `.lyr` file.
4. **Commands** (`commands/`): One file per domain — `song`, `snapshot`, `diff`, `vault`, `section`, `comment`, `config`. These are the Tauri `#[tauri::command]` handlers registered in `lib.rs`.
5. **Frontend state**: `stores/songStore.ts` (current song + sections + snapshots), `stores/editorStore.ts` (active section, undo/redo). Domain hooks (`useSong`, `useSnapshot`, `useDiff`, `useVault`) call Tauri commands via `@tauri-apps/api`.

### Key Models (`src-tauri/src/models/`)

| Type | Description |
|------|-------------|
| `SongMetadata` | id (ULID), title, status, musical info (key, bpm, capo, tuning), tags |
| `SongPayload` | Full song: metadata + sections + snapshots + comments + file_path |
| `SongIndexEntry` | Lightweight row for list views (mirrors SQLite `songs` table) |
| `Section` | id, name, `SectionType` enum, order, content (lyrics text) |
| `Snapshot` | id, created_at, note, `Vec<SnapshotSection>` |
| `DiffHunk` / `SectionDiff` | Character-level diff output from `similar` crate |

### Error Handling

All Rust errors flow through `AppError` in `src-tauri/src/error.rs`, which implements `serde::Serialize` for Tauri command serialization.

### UI Layout

- **AppShell** → **Sidebar** (song list, search) + **EditorPanel** (sections, metadata bar)
- **VersionTimeline**: Snapshot history panel
- **DiffSection**: Side-by-side diff view using `DiffHunk` data
- **CommentPanel**: Per-section inline comments

## Configuration

- `tauri.conf.json`: Product name "Lyra", identifier `dev.gabrielbg.lyra`, window 1280×800, `.lyr` file association
- `vite.config.ts`: Dev server port 1420, HMR port 1421, ignores `src-tauri/` in watch
- Design tokens defined as CSS variables in `src/styles/tokens.css`
