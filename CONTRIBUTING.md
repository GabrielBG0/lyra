# Contributing to Lyra

Thanks for taking the time to contribute. Lyra is a desktop app for songwriters, built with Tauri 2, React 19, TypeScript, Rust, and SQLite. The app stores songs as local `.lyr` files, so correctness, backwards compatibility, and a calm writing experience matter more than cleverness.

Before starting a change, read the docs that match the work:

- `README.md` for setup, features, and the high-level project structure.
- `project_overview.md` for architecture, data flow, state management, IPC, and file format details.
- `style_guidelines.md` for UI, copy, color, typography, motion, and accessibility rules.
- `CLAUDE.md` for repo-specific conventions and maintainer preferences.

If the docs and code disagree, follow the code and mention the mismatch in your issue or pull request.

## Development Setup

Install the required tools:

- Node.js 20 or newer.
- Stable Rust.
- Tauri v2 system dependencies for your platform.
- WebView2 on Windows, usually already present on Windows 10 and 11.

Then install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run tauri dev
```

Tauri uses Vite on port `1420` with HMR on `1421`. Keep this port stable because the Tauri configuration expects it.

Build a native app package:

```bash
npm run tauri build
```

## Project Basics

Lyra has two main layers:

- `src/` contains the React frontend, Zustand stores, hooks, typed IPC bindings, domain types, and styles.
- `src-tauri/` contains the Rust backend, Tauri command handlers, domain logic, SQLite migrations, and file handling.

The `.lyr` file is the source of truth. It is a ZIP archive containing song metadata, section TOML files, immutable snapshot JSON files, and comments. The SQLite database at `.lyrindex/index.db` is only an index cache and must always be rebuildable from `.lyr` files.

## Before You Code

- Open an issue for large features, data format changes, broad UI changes, or behavior that may affect existing vaults.
- Keep pull requests small enough to review. Separate refactors from behavior changes when possible.
- Check for existing patterns before adding a new abstraction, dependency, color, animation, or component convention.
- Protect user data. Any change that writes `.lyr` files, scans vaults, migrates data, or deletes files needs extra care and tests.

## Code Style

### TypeScript and React

- Use one component per file.
- Name component files in PascalCase and match the default export.
- Keep styles inline with Tailwind utilities or existing `@layer components` classes in `src/styles/global.css`.
- Do not add CSS Modules or styled-components.
- Use design tokens through Tailwind classes such as `bg-panel`, `text-primary`, and `border-border-soft`.
- Do not hard-code new colors in component code. Tokens live in `src/styles/global.css` under `@theme`.
- Import icons from the local `Icons` namespace, not directly from `lucide-react`.
- Use `src/lib/tauri.ts` for all Tauri IPC. Do not call `invoke()` directly from components, hooks, or stores.
- Keep frontend types aligned with Rust serde models.

### Rust

- Keep Tauri command handlers in `src-tauri/src/commands/` thin. They should extract state, call `core/`, and return `AppResult<T>`.
- Put business logic in `src-tauri/src/core/` so it can be tested independently.
- When using `AppState`, lock, clone what you need, and release the lock quickly.
- Use `AppError` and `AppResult<T>` for errors that cross the IPC boundary.
- All `.lyr` writes must use the established write-to-temp-then-atomic-rename strategy.
- Treat snapshots as append-only and immutable.
- Treat the SQLite index as a cache, never as canonical data.

### Data and IDs

- Use ULIDs for songs, sections, snapshots, and comments.
- Use RFC 3339 timestamps.
- Preserve backwards compatibility for `.lyr` files whenever possible.
- Include a migration or explicit compatibility note for SQLite index changes.
- Do not mutate existing snapshots after creation.

## UI and Copy Guidelines

Lyra's interface should feel quiet, editorial, and focused on writing.

- Consult `style_guidelines.md` before UI work.
- Preserve the lyric editor's 85% content column for lyrics, diffs, and snapshot previews.
- Use the existing warm dark surface system and restrained amber accent.
- Do not introduce new accent hues, shadows on content surfaces, extra font families, or decorative motion.
- Use hover-reveal patterns for secondary editing controls.
- Icon-only buttons need both `title` and `aria-label`.
- Clickable non-button elements need `role="button"`, `tabIndex={0}`, and Enter and Space handling.
- UI copy should be human, direct, and calm.
- Do not use em dashes in UI copy, generated strings, documentation, comments, or commit messages. Use a comma or split the sentence.
- Use the single ellipsis character in placeholders, for example `Search songs…`.
- Render keyboard shortcuts in command/control, Shift, Alt, key order, for example `Ctrl+Shift+Z` or `⌘⇧Z`.

## Testing and Checks

Run the checks that match your change before opening a pull request.

Frontend tests:

```bash
npm test
```

Frontend build:

```bash
npm run build
```

Rust tests:

```bash
cd src-tauri
cargo test
```

Rust formatting check:

```bash
cd src-tauri
cargo fmt --check
```

Prettier check:

```bash
npx prettier --check .
```

Coverage is available when useful:

```bash
npm run test:coverage
```

For UI changes, also run the app with `npm run tauri dev` and test the affected workflow manually on your platform. Pay attention to keyboard shortcuts, focus behavior, disabled states, hover-reveal controls, and text overflow.

## Pull Request Checklist

Before submitting, make sure:

- The change has a clear reason and a focused scope.
- Tests were added or updated for behavior changes.
- `npm test` passes.
- `cargo test` passes from `src-tauri/` when Rust changed.
- `npx prettier --check .` passes.
- `cargo fmt --check` passes when Rust changed.
- UI changes were tested manually in the app.
- No new OKLCH colors were introduced outside design tokens.
- `.lyr` file format or SQLite index changes are backwards-compatible, or include a migration and explanation.
- `project_overview.md` is updated when architecture, data format, or major project structure changes.
- `style_guidelines.md` is updated when a durable UI pattern changes.

## Commit and PR Writing

- Use concise, active voice.
- Explain why the change exists, not only what files changed.
- Mention user-facing behavior, data compatibility, and testing.
- Link related issues when available.
- Include screenshots or short videos for visible UI changes.
- Call out risks, tradeoffs, follow-up work, and anything you intentionally left out.

## Good First Contributions

Good starting points include:

- Fixing small bugs with clear reproduction steps.
- Adding focused tests around existing behavior.
- Improving documentation that has drifted from the code.
- Tightening accessibility on an existing control.
- Polishing copy while preserving Lyra's voice.

Avoid starting with large rewrites, file format changes, broad styling changes, or new dependencies unless there is already maintainer agreement.

## Security and Data Safety

Lyra works with personal writing stored on disk. Treat that data with care.

- Do not add telemetry, network sync, cloud behavior, or external services without explicit discussion.
- Do not log lyric contents, vault paths, or personal file data unnecessarily.
- Use temporary directories and fixtures in tests.
- Prefer reversible operations and clear user confirmation for destructive actions.
- Never assume the SQLite index is complete or trustworthy when the `.lyr` file can be read directly.

## Keeping Docs Current

Documentation is part of the contribution. Update docs when the change affects setup, architecture, data format, user workflows, keyboard shortcuts, or design conventions.

Use `project_overview.md` for durable architecture knowledge and `style_guidelines.md` for durable design rules. Keep `README.md` focused on what Lyra is, how to install it, and how to run it.
