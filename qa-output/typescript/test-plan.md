# Test Plan — Lyra TypeScript (Tier 1 + Tier 2)
Generated: 2026-05-04

## Scope

Pure logic in `src/lib/` and Zustand store state management in `src/stores/`. No Tauri APIs or React rendering involved — all tests run in happy-dom.

## Setup

- **Framework**: Vitest 4.x + happy-dom
- **Coverage**: @vitest/coverage-v8
- **Config**: `vitest.config.ts` (separate from vite.config.ts to avoid Tailwind plugin conflicts)
- **Scripts**:
  - `npm test` — single run
  - `npm run test:watch` — watch mode
  - `npm run test:coverage` — with coverage report

## Files Covered

| Source File | Test File | Test Types | # Tests |
|---|---|---|---|
| `src/lib/findMatches.ts` | `src/lib/__tests__/findMatches.test.ts` | unit | 18 |
| `src/lib/sectionClipboard.ts` | `src/lib/__tests__/sectionClipboard.test.ts` | unit | 18 |
| `src/lib/shortcuts.ts` | `src/lib/__tests__/shortcuts.test.ts` | unit | 14 |
| `src/lib/ulid.ts` | `src/lib/__tests__/ulid.test.ts` | unit | 7 |
| `src/stores/songStore.ts` | `src/stores/__tests__/songStore.test.ts` | unit | 14 |
| `src/stores/editorStore.ts` | `src/stores/__tests__/editorStore.test.ts` | unit | 42 |

## Test Cases Summary

### `src/lib/findMatches.ts`
- `computeMatches`: empty query, empty sections, single match, multiple matches in one section
- `matchIndex` per-section reset
- Cross-section matching with correct `sectionIndex`
- Case sensitivity on/off
- Whole-word: no substring match, standalone word, start/end of string, punctuation boundaries, partial-boundary rejection
- `end` offset = `start + query.length`

### `src/lib/sectionClipboard.ts`
- `serializeSection`: correct header format, all field types, empty content
- `parseSection`: round-trip, null for empty/bad input, unknown type → `'verse'`, all valid types, lowercase normalization, CRLF handling, content trimming, internal newlines preserved
- `looksLikeSection`: true for `---` prefix, false for plain text, leading-whitespace handling, empty string

### `src/lib/shortcuts.ts`
- `matchesShortcut`: ctrlKey, metaKey, no-mod, wrong key, unexpected shift, mod+shift combos, key case insensitivity, non-alpha keys (comma), def with no main key
- `SHORTCUT_CATEGORIES`: non-empty, all shortcuts have keys, all shortcuts have a main key, no duplicate combos

### `src/lib/ulid.ts`
- Format: 26 chars, Crockford base32 regex, 50-call fuzzing
- Uniqueness: 100 consecutive calls, same timestamp
- Sortability: later timestamp → lexicographically greater; time prefix monotonic across 10 sequential timestamps

### `src/stores/songStore.ts`
- `setSongs`: full replace, clear to empty
- `upsertSong`: insert new, update existing by `file_path`, two different paths
- `removeSong`: removes by path, clears `selectedSongPath` when active song removed, preserves selection for other song, no-op for unknown path
- `selectSong`: set, deselect with null, switch between paths

### `src/stores/editorStore.ts`
- `loadSong`: populates state, resets dirty+history, closes find panel via uiStore
- `closeSong`: nullifies all fields
- `execute/undo/redo`: apply called, clears future, undo → future, undo no-op on empty stack, redo → past, redo no-op, MAX_HISTORY=100 cap
- `updateSection`: content updated, rapid-edit merging within 2s, no merge after 2s, no merge for different sections, undo restores, no-op for unknown id
- `addSection`: append, insert at index, undoable
- `removeSection`: removes, clears focused section, undo restores position, no-op for unknown id
- Find navigation: `setFindQuery` populates matches, `findNext` advances, `findNext` wraps, `findPrev` wraps backward, no-op when no matches, `clearFind` resets all
- `setFindCaseSensitive`: recomputes matches
- `setFindWholeWord`: recomputes matches
- `replaceCurrent`: replaces active match, no-op with no matches, index clamped when count shrinks
- `replaceAll`: replaces across sections, multiple matches per section, no-op with no matches, undoable
- Diff state: `setDiff` stores result+targets, `clearDiff` nullifies
- Preview: `enterPreview` sets id, `exitPreview` clears

## Known Gaps / Not Covered

- `src/lib/format.ts` — file is empty (no logic to test)
- `src/lib/tauri.ts` — excluded; all calls go through Tauri IPC
- `src/lib/tourSteps.ts` — pure data, no logic
- `src/stores/uiStore.ts` — simple boolean toggles with no branching; the store is imported and exercised indirectly via `loadSong`
- `src/stores/tourStore.ts` — not in scope for this pass
- `updateMetadata` and `reorderSections` undo/redo — the pattern is identical to the covered actions; skipped to avoid redundancy

## Results

| Test File | Passed | Failed | Skipped |
|---|---|---|---|
| `findMatches.test.ts` | 18 | 0 | 0 |
| `sectionClipboard.test.ts` | 18 | 0 | 0 |
| `shortcuts.test.ts` | 14 | 0 | 0 |
| `ulid.test.ts` | 7 | 0 | 0 |
| `songStore.test.ts` | 14 | 0 | 0 |
| `editorStore.test.ts` | 42 | 0 | 0 |
| **Total** | **113** | **0** | **0** |

## Coverage

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   78.19 |    77.88 |   64.12 |   79.32 |
 stores            |         |          |         |         |
  editorStore.ts   |   82.56 |    70.49 |   77.21 |    84.9 |
  songStore.ts     |     100 |    83.33 |     100 |     100 |
  tourStore.ts     |       0 |        0 |       0 |       0 |
  uiStore.ts       |   14.81 |     100  |   11.53 |   13.04 |
-------------------|---------|----------|---------|---------|
```

HTML report: `qa-output/typescript/coverage/index.html`
