# Lyra

[![CI](https://github.com/GabrielBG0/lyra/actions/workflows/ci.yml/badge.svg)](https://github.com/GabrielBG0/lyra/actions/workflows/ci.yml)
[![Release](https://github.com/GabrielBG0/lyra/actions/workflows/release.yml/badge.svg)](https://github.com/GabrielBG0/lyra/actions/workflows/release.yml)
[![Latest release](https://img.shields.io/github/v/release/GabrielBG0/lyra?include_prereleases)](https://github.com/GabrielBG0/lyra/releases)

**A desktop app for songwriters to write, version, and compare lyrics.**

Lyra keeps every draft of your lyrics as immutable snapshots, lets you diff any two versions at the character level, and stores everything in plain files you own. No cloud, no accounts, no lock-in.

---

## Features

- **Vault** — point Lyra at any folder and it becomes your song library.
- **Sections** — songs are built from ordered, labeled sections (Verse, Chorus, Bridge, etc.) that you can drag to reorder.
- **Snapshots** — save a named point-in-time capture of your song at any moment, like a git commit for lyrics.
- **Diffs** — compare any two snapshots, or a snapshot against your current draft, with character-level highlighting.
- **Comments** — annotate any section with notes, optionally pinned to a specific snapshot.
- **Autosave** — changes are saved to disk automatically after 2 seconds of inactivity.
- **Export** — plain-text export of any song, with optional version history appended.
- **File association** — double-click a `.lyr` file in your OS to open it directly in Lyra.

---

## Documentation

The [`docs/user/`](docs/user/) folder contains the full user guide:

- [Getting Started](docs/user/getting-started.md)
- [Songs and Sections](docs/user/songs-and-sections.md)
- [Snapshots](docs/user/snapshots.md)
- [Comparing Versions](docs/user/comparing-versions.md)
- [Comments](docs/user/comments.md)
- [Find and Replace](docs/user/find-and-replace.md)
- [Exporting](docs/user/exporting.md)
- [Keyboard Shortcuts](docs/user/keyboard-shortcuts.md)

---

## Prerequisites

| Requirement                                                    | Version | Notes                                            |
| -------------------------------------------------------------- | ------- | ------------------------------------------------ |
| [Node.js](https://nodejs.org/)                                 | ≥ 20    | For the frontend build                           |
| [Rust](https://rustup.rs/)                                     | stable  | For the Tauri backend                            |
| [Tauri system deps](https://v2.tauri.app/start/prerequisites/) | —       | Platform-specific (see link)                     |
| WebView2                                                       | —       | Windows only, usually pre-installed on Win 10/11 |
| WebKitGTK + other libs                                         | —       | Linux only, install via your distro's package manager (see Tauri prerequisites link above) |

Follow the [Tauri v2 prerequisites guide](https://v2.tauri.app/start/prerequisites/) for your OS before continuing.

---

## Installation

```bash
git clone https://github.com/GabrielBG0/lyra.git
cd lyra
npm install
```

---

## Development

```bash
npm run tauri dev
```

This starts the Vite dev server on port 1420 with hot module replacement, then launches the Tauri window on top of it. Changes to React files reload instantly; changes to Rust files trigger a Rust recompile.

---

## Building

```bash
npm run tauri build
```

Produces a native installer for your current platform in `src-tauri/target/release/bundle/`. On macOS this is a `.dmg`; on Windows an `.msi` and `.exe` installer; on Linux an `.AppImage`, `.deb`, and `.rpm`.

---

## Project structure

```
lyra/
├── src/                      # React frontend (TypeScript + Vite)
│   ├── components/           # UI components, organized by feature
│   ├── hooks/                # Custom React hooks (autosave, shortcuts, vault, etc.)
│   ├── lib/                  # Typed IPC bindings, domain types, utilities
│   ├── stores/               # Zustand state stores
│   └── styles/               # Global CSS, design tokens (OKLCH color system)
│
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── commands/         # Tauri command handlers (thin IPC layer)
│   │   ├── core/             # Domain logic: file I/O, diff, vault scanning, index
│   │   └── models/           # Serde structs mirroring the TypeScript types
│   └── migrations/           # SQLite migration files
│
├── CLAUDE.md                 # AI assistant instructions for this codebase
├── project_overview.md       # Full architecture reference
└── style_guidelines.md       # Design system and UI conventions
```

---

## How it works

### The vault

A vault is any folder on your disk. Lyra scans it for `.lyr` files on startup and keeps a SQLite index at `.lyrindex/index.db` for fast listing and search. The index is a cache — it can always be rebuilt from the files themselves. If you add, remove, or sync `.lyr` files while the app is open (e.g. via Dropbox), the file watcher picks up the changes automatically.

### The `.lyr` file format

Each song is a single `.lyr` file, which is a ZIP archive with a predictable structure:

```
my-song.lyr (ZIP)
├── meta.json            # format version gate
├── song.toml            # title, status, key, BPM, tags
├── sections/
│   ├── 01HXKM....toml  # one file per section, identified by ULID
│   └── 01HXKM....toml
├── snapshots/
│   └── 01HXKM....json  # append-only, immutable snapshot files
└── comments.toml        # all section annotations
```

All writes go through a write-to-temp-then-atomic-rename pattern so a crash mid-write never corrupts your file. Snapshots are append-only and never modified after creation.

Because `.lyr` files are just ZIPs, you can inspect them with any archive tool, version them with git, or move them between machines without any export step.

---

## Keyboard shortcuts

| Shortcut             | Action                                |
| -------------------- | ------------------------------------- |
| `Ctrl/⌘ + N`         | New song                              |
| `Ctrl/⌘ + S`         | Save                                  |
| `Ctrl/⌘ + Shift + S` | Save a snapshot (take)                |
| `Ctrl/⌘ + W`         | Close song                            |
| `Ctrl/⌘ + B`         | Toggle sidebar                        |
| `Ctrl/⌘ + H`         | Toggle history bar                    |
| `Ctrl/⌘ + Z`         | Undo                                  |
| `Ctrl/⌘ + Shift + Z` | Redo                                  |
| `Ctrl/⌘ + C`         | Copy focused section                  |
| `Ctrl/⌘ + X`         | Cut focused section                   |
| `Ctrl/⌘ + V`         | Paste section                         |
| `Ctrl/⌘ + ,`         | Preferences                           |
| `Esc`                | Close modal / exit diff / cancel edit |

A full shortcut reference is available inside the app under **Help > Keyboard Shortcuts**.

---

## Tech stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Desktop shell | Tauri 2                                |
| Frontend      | React 19, TypeScript, Vite 7           |
| Styling       | Tailwind CSS 4, OKLCH design tokens    |
| State         | Zustand 5                              |
| Backend       | Rust, Tokio                            |
| Database      | SQLite via sqlx 0.7 (index cache only) |
| File format   | ZIP (`zip` crate) + TOML + JSON        |
| Diffing       | `similar` crate (character-level)      |
| Icons         | Lucide React                           |

---

## License

MIT
