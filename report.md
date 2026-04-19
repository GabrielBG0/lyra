# Lyra Frontend — Spec vs. Implementation Gap Report

Phases 7–14 of the README roadmap compared against the current frontend implementation.

---

## Phase 7 — Song List UI
**Status: Mostly done, minor gaps**

| Spec | Implemented | Gap |
|------|-------------|-----|
| Status badge = colored pill with label | Status dot only (no label text) | Minor |
| Sort options: Updated newest/oldest, Title A–Z, Status | Same + extra "Z–A" option | Extra, not missing |
| Sidebar header: logo/app name + `+` button | Logo + vault path + `+` button | Vault path not in spec |
| Search filters by title, genre, mood, language | Filters by title and genre only | Mood/language filtering missing |

---

## Phase 8 — Editor UI
**Status: Significant gap in 8.2**

### 8.1 MetadataBar — mostly done
- Musical fields (Key, BPM, Capo, Tuning): spec requires compact **inline fields** visible directly in the bar. Implementation uses **modal/popover inputs** — an extra click is required to edit any musical field.
- Everything else (title inline edit, status pill, tag chips, Save flash, snapshot button) matches the spec.

### 8.2 Section Editor — major gap
- Spec requires `@dnd-kit/sortable` for drag-to-reorder sections. The grip handle is rendered visually but **drag-and-drop is not implemented**.
- Section type picker (clickable type badge opens a small dropdown listing all `SectionType` values) — type colors appear hardcoded per type rather than driven by a live picker component.
- Diff mode: `SectionEditor` should render `DiffSection` instead of `SectionBlock` when `diffResult !== null` — integration with the editor canvas needs verification.

---

## Phase 9 — Version Timeline UI
**Status: Core interactions missing**

| Spec | Status |
|------|--------|
| Collapsible timeline, 180px/36px height transition | ✅ Done |
| "Now" card at far left, outlined style | ✅ Done |
| SnapshotCard layout (note, relative timestamp, section count) | ✅ Done |
| Single click → preview mode (read-only editor + "Viewing snapshot — [note] — [date]" banner with Exit + Restore buttons) | ❌ Not implemented |
| Shift+click second card → diff mode | ❌ Not implemented |
| Right-click context menu (Restore, Compare with current, Delete snapshot) | ❌ Not implemented |

Timeline renders correctly but snapshot cards don't trigger any state changes on click.

---

## Phase 10 — Diff UI
**Status: Structure present, actions missing**

| Spec | Status |
|------|--------|
| DiffBanner: "Comparing [note A] → [note B]" format | ⚠️ Shows "Working copy" / "Snapshot [ID]" instead |
| DiffBanner: "Restore version B" button | ❌ Missing |
| DiffSection: "Use this section" button for changed/added sections (cherry-pick) | ❌ Missing |
| DiffHunk: inline `<span>` with equal/insert/delete coloring | ✅ Done (uses `<mark>`/`<del>`) |
| `white-space: pre-wrap` on diff body | Needs verification |

---

## Phase 11 — Comments UI
**Status: Largely done**

Mostly matches spec. One item to confirm: resolved comments should render with **strikethrough text and muted color** — the resolve button exists but the resolved style needs verification.

---

## Phase 12 — Export
**Status: Backend stub, no UI**

Tauri API calls are wired in `lib/tauri.ts` but no `File > Export` path in the UI routes to them. The Rust command implementations are also stubs.

---

## Phase 13 — Native Menu Bar
**Status: Wrong approach — architectural divergence**

- **Spec**: Native OS menu bar using `tauri::menu::Menu` builder in `main.rs`. Each item emits a named Tauri event that the React frontend listens for. Keyboard shortcuts registered at the OS level by the menu builder.
- **Implemented**: A custom React-rendered `<MenuBar />` component rendered inside the window chrome. No native OS menu. No OS-level keyboard shortcut registration.

This means the app has no native menu bar on any platform and keyboard shortcuts are not system-registered.

---

## Phase 14 — Polish and Hardening
**Status: All items missing**

| Spec | Status |
|------|--------|
| React error boundaries around editor panel and song list | ❌ Missing |
| Empty state for "song file missing" | ❌ Missing |
| `CloseRequested` / `beforeunload` handler prompting save when `isDirty` | ❌ Missing |
| First-launch tooltip or callout explaining snapshots | ❌ Missing |
| File association handler (double-clicking a `.lyr` file opens it in the app) | ❌ Missing |

---

## Summary

| Phase | Coverage | Notes |
|-------|----------|-------|
| 7 — Song List | ~85% | Status pill label and mood/language search missing |
| 8.1 — MetadataBar | ~80% | Musical fields need inline edit, not modals |
| 8.2 — Section Editor | ~60% | Drag-to-reorder not implemented |
| 9 — Version Timeline | ~40% | Cards render; click interactions not implemented |
| 10 — Diff UI | ~60% | Hunks correct; restore and cherry-pick buttons missing |
| 11 — Comments | ~90% | Resolved style needs verification |
| 12 — Export | ~10% | API wired; no UI trigger, Rust stubs |
| 13 — Menu Bar | ~30% | React menu instead of native Tauri menu |
| 14 — Polish | ~0% | All items missing |
