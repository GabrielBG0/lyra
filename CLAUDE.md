# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

If there is ever a conflict between the instructions in this file and the code itself, **the code always takes precedence**. The code is the source of truth, and this document is just a guide to help Claude understand the conventions and architecture of the project.

If you are unsure about something, or of where to find the answer, ask for clarification instead of making assumptions. It's better to ask than to guess wrong.

## What This Project Is

Lyra is a desktop application (Tauri 2 + React 19 + Rust) for songwriters to manage lyrics with version snapshots, diffs, and annotations. Songs are stored as `.lyr` files (ZIP archives), with a SQLite index cache in `.lyrindex/index.db`.

## Data Format

Each song is a ZIP file (`.lyr`) containing:

- `song.toml` — metadata (title, status, key, BPM, tags)
- `sections/{ulid}.toml` — lyric content per section
- `snapshots/{ulid}.json` — immutable point-in-time captures (append-only)
- `comments.toml` — annotations

The SQLite index is a **cache** rebuilt from disk on startup — never treat it as the source of truth.

## CSS Conventions

Colors use **OKLch** (not hex/hsl). Design tokens are defined in `src/styles/global.css` under `@theme`:

- Surfaces: `bg`, `surface`, `panel`, `elev`
- Text: `primary`, `secondary`, `muted`, `faint`
- Accent: amber variants
- Status colors: `idea` (blue), `draft` (amber), `demo` (orange), `finished` (green)
- Diff: `add`/`remove` with text variants

UI font is Satoshi; lyrics use Noto Serif (+ Noto Serif JP/KR for CJK).

## IDs

All entities (songs, sections, snapshots, comments) use **ULIDs** — sortable, collision-resistant, generated client-side via `src/lib/ulid.ts`.

## Tauri Configuration

- Dev port: **1420** (fixed, Tauri requirement) with HMR on 1421
- File association: `.lyr` → `application/x-lyr`
- Window decorations are **disabled** (custom chrome via `MenuBar.tsx`)
- App identifier: `dev.gabrielbg.lyra`

## Keyboard Shortcut Hints

When displaying keyboard shortcut hints in the UI (menu items, tooltips, etc.), always use this order: **command/control first, then modifiers (Shift, Alt), then the key**.

- Correct: `Ctrl+Shift+Z`, `⌘⇧Z`
- Wrong: `Shift+Ctrl+Z`, `⇧⌘Z`

In code, use `${mod}${shift}Z` — never `${shift}${mod}Z`.

## Writing preferences

When writing text for the UI components, keep these principles in mind:

- Never use "—" (em dash). Always prefer to use a comma or split into multiple sentences.
- Write in a more human way, when appropriate. For example, instead of "This is the song editor, where you can edit your songs", say "Here you can edit your songs".

## Design Style Guidelines

For design-related decisions, consult the style_guidelines.md file in the root of the repository. It contains detailed instructions on design principles, color usage, typography, and more. Always refer to it when making design choices or implementing UI components.

## Updating the project_overview.md

The `project_overview.md` file in the root of the repository contains a high-level summary of the project, its goals, and its architecture. If you make significant changes to the project structure, data format, or design principles, please update this file accordingly to keep it accurate and helpful for new contributors.

Before updating the `project_overview.md`, ask of the user input if they want to update it, and if so, what specific changes they would like to make. This ensures that the overview remains relevant and up-to-date with the current state of the project. When in doubt if you should update the overview, ask for clarification instead of making assumptions. It's better to ask than to guess wrong.
