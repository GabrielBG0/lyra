# Lyra — Gap Correction Specification

Technical spec for bridging the gaps identified in `report.md`. Each section maps to a gap, identifies the exact files to change, and describes the required behaviour in enough detail to implement directly.

Items are ordered by dependency (earlier items unblock later ones).

---

## 1. Phase 9 — Snapshot Preview Mode

**Gap:** Clicking a `SnapshotCard` does nothing. The spec requires it to enter a read-only preview state with a dismissible banner, an Exit button, and a Restore button.

### 1.1 Store additions — `editorStore.ts`

Add two fields and two actions to `EditorStore`:

```typescript
// new state fields
previewSnapshotId: string | null   // null = not previewing

// new actions
enterPreview: (snapshotId: string) => void
exitPreview: () => void
```

`enterPreview` sets `previewSnapshotId`. `exitPreview` clears it to `null`. Both are pure store mutations — no IPC calls.

### 1.2 `SnapshotCard.tsx`

Wire `onClick` on the outer `<div>` of `SnapshotCard`. The handler must:

1. Call `useSnapshot().loadSnapshot(header.id)` — loads and caches the snapshot content.
2. Call `useEditorStore().enterPreview(header.id)`.

Add `isPreview: boolean` visual state: when the card is the active preview, render its border and background in accent colour (same treatment as the selected state in `SongEntry`).

Pass `isPreview` from `VersionTimeline`, which reads `previewSnapshotId` from the store.

`NowCard` onClick: if `previewSnapshotId !== null`, call `exitPreview()` to return to live view.

### 1.3 `SnapshotPreviewBanner.tsx` — new component

Create `src/components/timeline/SnapshotPreviewBanner.tsx`.

Props:
```typescript
interface SnapshotPreviewBannerProps {
  snapshotId: string
}
```

The component reads `loadedSnapshots[snapshotId]` from `editorStore` to get the note and `created_at`.

Layout — a full-width strip above the section editor (same position as `DiffBanner`):

```
[ eye icon ]  Viewing snapshot — {note ?? 'Untitled'} — {formatted date}   [ Restore ]  [ Exit ]
```

- Background: `bg-panel`, border-bottom `border-border-soft`, top border in a muted amber: `border-t border-status-demo/40`.
- "Restore" button: on click calls `useSnapshot().restoreSnapshot(snapshotId)` then `exitPreview()`.
- "Exit" button: calls `exitPreview()` only.
- If `loadedSnapshots[snapshotId]` is not yet available (still loading), show a spinner in place of the note text.

### 1.4 `EditorPanel.tsx`

`EditorPanel` currently renders:

```tsx
<MetadataBar />
<div className="flex-1 overflow-y-auto">
  <SectionEditor lyricFont={lyricFont} />
</div>
<VersionTimeline />
```

Add preview logic:

```tsx
const { metadata, previewSnapshotId, loadedSnapshots } = useEditorStore()

// inside the returned JSX, between MetadataBar and the scrollable area:
{previewSnapshotId && <SnapshotPreviewBanner snapshotId={previewSnapshotId} />}
```

When `previewSnapshotId` is set, `SectionEditor` must render the snapshot's sections read-only instead of the live `sections`. Pass a `readOnly` prop to `SectionEditor`:

```tsx
<SectionEditor
  lyricFont={lyricFont}
  readOnly={previewSnapshotId !== null}
  previewSections={
    previewSnapshotId
      ? (loadedSnapshots[previewSnapshotId]?.sections ?? null)
      : null
  }
/>
```

### 1.5 `SectionEditor.tsx`

Accept new props:

```typescript
interface SectionEditorProps {
  lyricFont: string
  readOnly?: boolean
  previewSections?: SnapshotSection[] | null
}
```

When `readOnly` is true:

- Use `previewSections` instead of `sections` from the store.
- Render `SectionBlock` with `readOnly={true}` — the textarea is `disabled` and the add/delete/reorder controls are hidden.
- Omit the `<AddSection />` component at the bottom.

When `previewSections` is `null` and `readOnly` is true (still loading), show a centred loading spinner.

---

## 2. Phase 9 — Shift+Click Diff Entry

**Gap:** No mechanism exists to enter diff mode from the timeline. The spec requires holding Shift while clicking a second snapshot card to trigger a diff.

### 2.1 `VersionTimeline.tsx`

Add local state:

```typescript
const [shiftSelectedId, setShiftSelectedId] = useState<string | null>(null)
```

Modify the `onClick` handler passed to each `SnapshotCard`:

```typescript
const handleCardClick = (headerId: string, shiftHeld: boolean) => {
  if (shiftHeld && shiftSelectedId) {
    // second card — enter diff mode
    useDiff().diffTwoSnapshots(shiftSelectedId, headerId)
    setShiftSelectedId(null)
    return
  }
  if (shiftHeld) {
    // first card with shift — stage for diff
    setShiftSelectedId(headerId)
    return
  }
  // normal click — preview
  setShiftSelectedId(null)
  handlePreviewClick(headerId)
}
```

`SnapshotCard` receives `onClick: (id: string, shiftHeld: boolean) => void`. Inside the card's click handler: `onClick(header.id, e.shiftKey)`.

Cards with `shiftSelectedId === header.id` get a distinct visual state: dashed accent border and a small "compare from" label.

"Compare with current" shortcut: clicking `NowCard` while `shiftSelectedId` is set calls `useDiff().diffWorkingVsSnapshot(shiftSelectedId)` then clears `shiftSelectedId`.

### 2.2 `SectionEditor.tsx` — diff mode

`EditorPanel` already has `diffResult` accessible via the store. Extend the conditional rendering in `EditorPanel`:

```tsx
{diffResult !== null ? (
  <div className="max-w-190 mx-auto px-14 py-3.5 pb-16">
    {diffResult.map((d) => (
      <DiffSection key={d.section_id} diff={d} />
    ))}
  </div>
) : (
  <SectionEditor lyricFont={lyricFont} readOnly={previewSnapshotId !== null} previewSections={...} />
)}
```

This replaces the current pattern where `SectionEditor` always renders regardless of diff state.

---

## 3. Phase 9 — Right-Click Context Menu on SnapshotCard

**Gap:** No context menu exists on snapshot cards.

### 3.1 `ContextMenu.tsx` — new primitive

Create `src/components/ui/ContextMenu.tsx`.

A generic absolutely-positioned menu driven by a `position: { x: number; y: number } | null` prop. When `position` is non-null, renders at those coordinates. Closes on `Escape`, outside click, or item selection.

```typescript
interface ContextMenuProps {
  position: { x: number; y: number } | null
  items: Array<{ label: string; danger?: boolean; onClick: () => void }>
  onClose: () => void
}
```

Style: `bg-elev border border-border rounded-lg shadow-2xl p-1 z-50 min-w-44`. Each item is a `<button>` with `text-left text-sm px-3 py-1.5 rounded hover:bg-panel`. Danger items use `text-rose-400`.

### 3.2 `SnapshotCard.tsx`

Add `onContextMenu` handler on the outer div:

```typescript
const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault()
  setMenuPos({ x: e.clientX, y: e.clientY })
}
```

Render `<ContextMenu>` with three items:

- **Restore this version** — calls `useSnapshot().restoreSnapshot(header.id)`.
- **Compare with current** — calls `useDiff().diffWorkingVsSnapshot(header.id)`.
- **Delete snapshot** — ⚠️ The Rust backend has no `delete_snapshot` command yet. For now, show a `window.alert('Not yet implemented')` placeholder and file a TODO comment. Do not wire a non-existent IPC call.

---

## 4. Phase 10 — DiffBanner improvements

**Gap:** The banner lacks a "Restore version B" button and uses raw snapshot IDs instead of notes as labels.

### 4.1 `DiffBanner.tsx`

Replace the current label logic:

```typescript
// current
const labelA = diffTargetA === 'now' ? 'Working copy' : `Snapshot ${diffTargetA.slice(0, 8)}`

// new — look up note from cached snapshots
const snapA = diffTargetA !== 'now' ? loadedSnapshots[diffTargetA] : null
const snapB = diffTargetB !== 'now' ? loadedSnapshots[diffTargetB] : null
const labelA = diffTargetA === 'now' ? 'Working copy' : (snapA?.note ?? `v${...}`)
const labelB = diffTargetB === 'now' ? 'Working copy' : (snapB?.note ?? `v${...}`)
```

`loadedSnapshots` is available from `useEditorStore()` — no additional store changes needed.

Add a "Restore B" button to the right side of the banner, between the labels and "Exit diff":

```tsx
<button
  className="flex items-center gap-1 px-2.5 py-1 bg-elev border border-border-soft rounded text-secondary hover:bg-panel text-xs cursor-pointer"
  onClick={handleRestoreB}
>
  Restore this version
</button>
```

`handleRestoreB`:
- If `diffTargetB === 'now'`: no-op (working copy is already live).
- Otherwise: call `useSnapshot().restoreSnapshot(diffTargetB)` then `clearDiff()`.

### 4.2 `DiffSection.tsx` — cherry-pick button

**Gap:** No "Use this section" button for `changed` or `added` sections.

Add a header row to `DiffSection` that shows the `DiffStatus` badge and, when status is `changed` or `added`, a "Use this section" button:

```tsx
<div className="flex items-center justify-between mb-2">
  <div className="flex items-center gap-2">
    <span className="text-2xs font-semibold tracking-[0.14em] uppercase text-muted font-ui">
      {diff.name}
    </span>
    <DiffStatusBadge status={diff.status} />
  </div>
  {(diff.status === 'changed' || diff.status === 'added') && (
    <button
      className="text-2xs px-2 py-0.5 border border-border-soft rounded text-secondary hover:text-primary hover:bg-elev cursor-pointer bg-transparent"
      onClick={handleCherryPick}
    >
      Use this section
    </button>
  )}
</div>
```

`handleCherryPick` calls `useSnapshot().cherryPickSection(snapshotId, diff.section_id)`. The `snapshotId` comes from `diffTargetB` in the store (or `diffTargetA` for removed sections, but cherry-pick on removed is not in scope).

`DiffStatusBadge` is a small inline component:

```typescript
const BADGE: Record<DiffStatus, { label: string; className: string }> = {
  equal:   { label: 'unchanged', className: 'text-muted bg-elev' },
  changed: { label: 'changed',   className: 'text-status-demo bg-status-demo/10' },
  added:   { label: 'added',     className: 'text-status-finished bg-status-finished/10' },
  removed: { label: 'removed',   className: 'text-rose-400 bg-rose-400/10' },
}
```

---

## 5. Phase 7 — SongEntry status pill

**Gap:** `SongEntry` shows a status colour dot with no label. The spec requires a coloured pill with the status word.

### `SongEntry.tsx`

Replace the standalone dot:

```tsx
// current
<span className={`w-2 h-2 rounded-full mt-1.25 shrink-0 ${STATUS_DOT[song.status]}`} />

// new — keep the dot for the left alignment gutter, add a pill in the second line
```

Move the status indicator into the metadata row (second line, next to key/BPM). Replace the raw dot with a pill:

```tsx
const STATUS_PILL: Record<SongStatus, string> = {
  idea:     'text-status-idea     bg-status-idea/10     border-status-idea/20',
  draft:    'text-status-draft    bg-status-draft/10    border-status-draft/20',
  demo:     'text-status-demo     bg-status-demo/10     border-status-demo/20',
  finished: 'text-status-finished bg-status-finished/10 border-status-finished/20',
}

// render in the second line:
<span className={`px-1.5 py-px rounded-full border text-2xs font-semibold uppercase tracking-wide ${STATUS_PILL[song.status]}`}>
  {song.status}
</span>
```

Remove the standalone dot `<span>` from the left gutter. The entry layout stays two-column (no dot), title fills the full width.

---

## 6. Phase 7 — Search: mood and language filtering

**Gap:** `SongList` search only filters by title and genre. The store holds `genre` on `SongIndexEntry` but not mood or language (they are not in `SongIndexEntry` — only the full `SongPayload` has them).

### Assessment

`SongIndexEntry` does not include `mood` or `language` fields — they are part of `SongMetadata.tags` which is only in the full payload. Adding them to the index requires a Rust-side change.

**Required Rust change:** Add `mood` and `language` columns to the `songs` SQLite table (a new migration), update `SongIndexEntry` model, update `upsert_song` to populate them, and update `list_songs` to return them.

**Frontend change** (after Rust): extend the filter in `SongList.tsx`:

```typescript
// current
const filtered = songs.filter(s =>
  s.title.toLowerCase().includes(q) ||
  s.genre.some(g => g.toLowerCase().includes(q))
)

// new
const filtered = songs.filter(s =>
  s.title.toLowerCase().includes(q) ||
  s.genre.some(g => g.toLowerCase().includes(q)) ||
  s.mood.some(m => m.toLowerCase().includes(q)) ||
  s.language.some(l => l.toLowerCase().includes(q))
)
```

Until the Rust side is updated, mood/language filtering cannot be added without false results — do not fake it by loading all full payloads on search.

---

## 7. Phase 13 — Native Menu Bar

**Gap:** `MenuBar.tsx` is a custom React component rendered inside the window. The spec requires a native OS menu using `tauri::menu::Menu` in `main.rs`.

### 7.1 `src-tauri/src/lib.rs`

Build the native menu in the `run()` function before creating the window, using Tauri 2's menu builder API:

```rust
use tauri::menu::{MenuBuilder, SubmenuBuilder};

let menu = MenuBuilder::new(&app)
    .item(&SubmenuBuilder::new(&app, "File")
        .text("new-song",       "New Song")
        .separator()
        .text("save",           "Save")
        .text("save-version",   "Save Version")
        .separator()
        .text("export-txt",     "Export Plain Text…")
        .text("export-pdf",     "Export PDF…")
        .separator()
        .text("close-vault",    "Close Vault")
        .build()?)
    .item(&SubmenuBuilder::new(&app, "Edit")
        .text("undo", "Undo").enabled(false)
        .text("redo", "Redo").enabled(false)
        .build()?)
    .item(&SubmenuBuilder::new(&app, "Song")
        .text("delete-song",    "Delete Song")
        .separator()
        .text("rebuild-index",  "Rebuild Index")
        .build()?)
    .item(&SubmenuBuilder::new(&app, "View")
        .text("toggle-sidebar", "Toggle Sidebar")
        .text("toggle-timeline","Toggle Timeline")
        .build()?)
    .build()?;

app.set_menu(menu)?;
```

Keyboard shortcuts: pass them as the fourth argument to `.text()` using `tauri::menu::MenuItemBuilder::with_id(...).accelerator("CmdOrCtrl+S")`. Tauri registers them at the OS level.

### 7.2 Menu event listener in `lib.rs`

```rust
app.on_menu_event(|app, event| {
    let _ = app.emit(event.id().as_ref(), ());
});
```

This emits a Tauri event with the item ID as the event name. React listens for these.

### 7.3 `App.tsx` — global menu event listener

Add a `useEffect` in `App.tsx` that listens for all menu events and dispatches to the right hook:

```typescript
useEffect(() => {
  const unlisteners = [
    listen('new-song',       () => /* trigger new song flow */),
    listen('save',           () => editorStore.isDirty && useSong().saveSong()),
    listen('save-version',   () => /* open snapshot prompt */),
    listen('toggle-sidebar', () => /* toggle sidebar state */),
    listen('export-txt',     () => /* trigger plain text export */),
    listen('export-pdf',     () => /* trigger PDF export */),
    listen('delete-song',    () => /* trigger delete */),
    listen('rebuild-index',  () => tauriApi.vault.rebuildIndex()),
  ]
  return () => { unlisteners.forEach(p => p.then(f => f())) }
}, [])
```

### 7.4 `MenuBar.tsx`

Once the native menu is wired, the custom `<MenuBar />` component can be removed from `AppShell.tsx`. Remove its import and the `<MenuBar>` JSX node. The window height recovered can be reallocated to the editor.

> **Note:** Keep `MenuBar.tsx` in place until the native menu is verified working end-to-end — remove it in the same commit that confirms the native menu events fire correctly.

---

## 8. Phase 14.1 — Error Boundaries

**Gap:** No React error boundaries. A crash in the editor or sidebar tears down the whole app.

### `EditorErrorBoundary.tsx` — new component

Create `src/components/layout/EditorErrorBoundary.tsx` as a class component (error boundaries require class syntax in React):

```typescript
class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <p className="text-base text-primary font-medium">Something went wrong in the editor.</p>
          <p className="text-sm text-muted font-mono">{this.state.error.message}</p>
          <button
            className="px-3 py-1.5 bg-elev border border-border-soft rounded text-sm text-secondary hover:text-primary cursor-pointer"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Wrap in `EditorPanel.tsx`:

```tsx
<EditorErrorBoundary>
  <div className="flex-1 overflow-y-auto">
    <SectionEditor ... />
  </div>
</EditorErrorBoundary>
```

Do the same for `SongList` in `AppShell.tsx` with a `SidebarErrorBoundary` that renders a muted "Sidebar unavailable" state.

---

## 9. Phase 14.2 — Dirty-state close guard

**Gap:** No handler prompts the user before closing with unsaved changes.

### `src-tauri/src/lib.rs`

Register the `CloseRequested` window event listener:

```rust
use tauri::WindowEvent;

window.on_window_event(|event| {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        window.emit("window:close-requested", ()).unwrap();
    }
});
```

### `App.tsx`

Listen for `window:close-requested` and check `isDirty`:

```typescript
listen('window:close-requested', async () => {
  const { isDirty } = useEditorStore.getState()
  if (!isDirty) {
    await getCurrentWindow().close()
    return
  }
  const confirmed = await ask(
    'You have unsaved changes. Close without saving?',
    { title: 'Unsaved changes', kind: 'warning' }
  )
  if (confirmed) await getCurrentWindow().close()
})
```

`ask` is from `@tauri-apps/plugin-dialog`. `getCurrentWindow` is from `@tauri-apps/api/window`.

---

## 10. Phase 8.2 — Drag-to-reorder sections

**Gap:** Section drag handles are visual-only. No actual reordering occurs.

### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### `SectionEditor.tsx`

Wrap the section list in `DndContext` and `SortableContext` from `@dnd-kit`:

```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = sections.findIndex(s => s.id === active.id)
  const newIndex = sections.findIndex(s => s.id === over.id)
  const reordered = arrayMove(sections, oldIndex, newIndex)
  const orderedIds = reordered.map(s => s.id)

  reorderSections(orderedIds) // optimistic store update
  await tauriApi.section.reorder(filePath!, orderedIds)
}

return (
  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
      {sections.map((section, i) => (
        <SectionBlock key={section.id} section={section} ... />
      ))}
    </SortableContext>
  </DndContext>
)
```

### `SectionBlock.tsx` / `SectionHeader.tsx`

Use `useSortable` from `@dnd-kit/sortable` inside `SectionBlock`:

```typescript
const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
}
```

Pass `listeners` and `attributes` to the grip handle `<span>` in `SectionHeader`. The grip currently has `cursor-grab` styling — it just needs the drag listeners attached:

```tsx
<span {...listeners} {...attributes} className="... cursor-grab active:cursor-grabbing">
  <Icons.Grip size={13} />
</span>
```

Do not add drag to `readOnly` sections (preview/diff mode) — gate the `useSortable` registration with an `enabled` prop.

---

## Implementation Order

Follow this sequence to avoid breaking working features:

1. **Item 5** — SongEntry status pill (isolated, no dependencies)
2. **Item 8** — Error boundaries (isolated, protective)
3. **Item 9** — Dirty-close guard (Rust + App.tsx, no UI change)
4. **Item 10** — Drag-to-reorder (self-contained, adds npm packages)
5. **Item 4** — DiffBanner + DiffSection cherry-pick (improves existing diff UI)
6. **Item 1** — Snapshot preview mode (adds store fields + new component)
7. **Item 2** — Shift+click diff entry (depends on preview mode being stable)
8. **Item 3** — Right-click context menu (depends on preview + diff flows)
9. **Item 6** — Mood/language search (requires Rust migration first)
10. **Item 7** — Native menu bar (do last — requires coordinated Rust + React removal of MenuBar)
