Here's the spec:

---

# Feature Spec: First-Launch Tour

## Intent

When a user opens Lyra for the first time, they are greeted with a guided tooltip tour that walks them through the main UI regions and core features. The goal is to orient the user spatially — where things are and what they do — without requiring them to read documentation. The tour runs once, is dismissable at any step, and never appears again after completion or dismissal. The tour should run automatically on the first launch after the user picks a vault and the app shell is fully loaded.

---

## Trigger and Persistence

The tour is controlled by a boolean field `tutorial_completed` added to `AppConfig` in Rust:

```rust
pub struct AppConfig {
    pub vault_path: Option<String>,
    pub last_opened_song: Option<String>,
    pub tutorial_completed: bool,    // new field, defaults to false
}
```

On app launch, the frontend reads config via `tauriApi.config.getConfig()`. If `tutorial_completed` is `false`, the tour starts automatically after the app shell has mounted and the vault is loaded. When the user completes or skips the tour, the frontend calls `tauriApi.config.setConfig()` with `tutorial_completed: true`. The tour never appears again.

---

## UI State Requirements

The tour needs to control sidebar and timeline visibility. These are already managed in the existing `uiStore`. The tour reads and writes `uiStore` directly via its actions — no new state is needed there.

The tour's own state lives in a dedicated `tourStore`:

```typescript
interface TourStore {
  active: boolean
  currentStep: number
  start: () => void
  next: () => void
  back: () => void
  dismiss: () => void
}
```

`active` drives whether the tour overlay renders at all. `currentStep` is the index into the step definitions array. `start`, `next`, `back`, and `dismiss` are the only mutations. `dismiss` sets `active: false` and persists `tutorial_completed: true` via the config command.

---

## Step Definition Type

Each step in the tour is a plain object conforming to this type:

```typescript
interface TourStep {
  id: string
  target: string           // CSS selector matching a data-tour attribute
  title: string
  body: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void      // runs before the step renders, used to open/close UI regions
}
```

Steps are defined in a single file `src/lib/tourSteps.ts` as an ordered array. This file imports `uiStore` to construct the action functions. Component code never defines step content — it only consumes the array.

---

## Tour Steps

The following steps are defined in order. Target selectors reference `data-tour` attributes that must be added to the corresponding elements.

| #   | ID                | Target                           | Title                | Placement | Action                      |
| --- | ----------------- | -------------------------------- | -------------------- | --------- | --------------------------- |
| 1   | `welcome`         | `[data-tour="app-shell"]`        | Welcome to Lyra      | bottom    | open sidebar, open timeline |
| 2   | `sidebar`         | `[data-tour="sidebar"]`          | Your song library    | right     | open sidebar                |
| 3   | `new-song`        | `[data-tour="new-song-button"]`  | Create a song        | right     | open sidebar                |
| 4   | `search`          | `[data-tour="song-search"]`      | Find your songs      | right     | open sidebar                |
| 5   | `editor`          | `[data-tour="editor-panel"]`     | Write your lyrics    | left      | close sidebar               |
| 6   | `metadata-bar`    | `[data-tour="metadata-bar"]`     | Song details         | bottom    | —                           |
| 7   | `section-editor`  | `[data-tour="section-editor"]`   | Sections             | top       | —                           |
| 8   | `snapshot-button` | `[data-tour="snapshot-button"]`  | Save a version       | bottom    | —                           |
| 9   | `timeline`        | `[data-tour="version-timeline"]` | Your version history | top       | open timeline               |
| 10  | `done`            | `[data-tour="app-shell"]`        | You are ready        | bottom    | open sidebar, open timeline |

Body text for each step:

- **welcome**: "Lyra helps you write, version, and compare your lyrics. This quick tour will show you around."
- **sidebar**: "All your songs live here. Click any song to open it in the editor."
- **new-song**: "Click here to create a new song. Give it a title and start writing."
- **search**: "Filter your songs by title, genre, mood, or language as your library grows."
- **editor**: "This is where you write. Each section of your song gets its own block."
- **metadata-bar**: "Set the key, BPM, status, and tags for your song here. Changes are saved with the song."
- **section-editor**: "Add, reorder, and rename sections using the controls on each block. Drag to rearrange."
- **snapshot-button**: "Take a snapshot to save a version of your song at this moment. Write as many as you like."
- **timeline**: "Every snapshot appears here. Click one to preview it, or compare two versions side by side."
- **done**: "That is everything. Your work saves automatically, and your history is always here when you need it."

---

## data-tour Attributes

The following `data-tour` attributes must be added to existing components. No structural changes to the components are required — only the attribute addition:

| Attribute          | Component             | Element                    |
| ------------------ | --------------------- | -------------------------- |
| `app-shell`        | `AppShell.tsx`        | root container div         |
| `sidebar`          | `Sidebar.tsx`         | root container div         |
| `new-song-button`  | `Sidebar.tsx`         | the `+` create button      |
| `song-search`      | `SongSearch.tsx`      | the search input           |
| `editor-panel`     | `EditorPanel.tsx`     | root container div         |
| `metadata-bar`     | `MetadataBar.tsx`     | root container div         |
| `section-editor`   | `SectionEditor.tsx`   | root container div         |
| `snapshot-button`  | `MetadataBar.tsx`     | the snapshot/camera button |
| `version-timeline` | `VersionTimeline.tsx` | root container div         |

---

## Components

### `TourOverlay.tsx`

The root tour component. Renders only when `tourStore.active` is true. Renders nothing visible itself — it is responsible for measuring the target element and passing the rect down to `TooltipBubble`.

**Behavior:**

On each step change, it:
1. Runs the current step's `action()` if one exists
2. Waits for one animation frame plus 220ms (to clear the sidebar/timeline CSS transition, which is 200ms) before measuring
3. Queries the DOM for `step.target` via `document.querySelector`
4. Reads the element's `getBoundingClientRect()`
5. Passes the rect and current step to `TooltipBubble`

If the target element is not found, log a warning and advance to the next step automatically.

**Keyboard handling:**

- `ArrowRight` or `Enter`: advance to next step
- `ArrowLeft`: go back
- `Escape`: dismiss tour

Mount a `keydown` listener on the document when the tour is active. Remove it on unmount.

**Rendering:**

Renders `<TooltipBubble>` as a direct child of a React portal attached to `document.body`, so it is never clipped by parent overflow or z-index stacking contexts.

---

### `TooltipBubble.tsx`

The visible balloon. Receives `step: TourStep`, `targetRect: DOMRect`, and the navigation callbacks.

**Positioning:**

The bubble renders with `position: fixed`. Its `top` and `left` are calculated from `targetRect` and `step.placement`. A constant `gap` of 12px separates the bubble from the target element edge.

Placement calculations (where `bw` = bubble width, `bh` = bubble height):

```
right:   left = targetRect.right + gap
         top  = targetRect.top + targetRect.height/2 - bh/2

left:    left = targetRect.left - bw - gap
         top  = targetRect.top + targetRect.height/2 - bh/2

bottom:  top  = targetRect.bottom + gap
         left = targetRect.left + targetRect.width/2 - bw/2

top:     top  = targetRect.top - bh - gap
         left = targetRect.left + targetRect.width/2 - bw/2
```

Clamp the final `top` and `left` to keep the bubble within viewport bounds with a 16px margin on all sides.

Because bubble height is unknown until render, use a `ref` on the bubble div and read `offsetWidth` / `offsetHeight` after mount to get `bw` and `bh`. Position is applied in a `useEffect` after measurement. The bubble starts with `opacity: 0` and transitions to `opacity: 1` after positioning is applied, hiding the layout snap.

**Bubble width:** fixed at 280px.

**Visual style:**

- Background: `var(--color-surface-overlay)`
- Border: `1px solid var(--color-border)`
- Border radius: `var(--radius-card)`
- Box shadow: `0 8px 24px rgba(0,0,0,0.4)`
- Padding: `20px`
- Font: `var(--font-ui)`
- Title: `text-primary`, `14px`, `font-weight: 600`
- Body: `text-secondary`, `13px`, `line-height: 1.6`, `margin-top: 8px`

---

### `TourArrow.tsx`

A small component rendered inside `TooltipBubble` that draws the CSS triangle pointer. Receives `placement` and renders the arrow on the correct side of the bubble.

The arrow points toward the target, so its physical position is on the opposite side of the bubble from the `placement` direction:

- `placement: right` → arrow on the **left** side of the bubble, pointing left
- `placement: left` → arrow on the **right** side of the bubble, pointing right
- `placement: bottom` → arrow on the **top** of the bubble, pointing up
- `placement: top` → arrow on the **bottom** of the bubble, pointing down

Implementation uses a CSS border-trick triangle via a pseudo-element or a small absolutely-positioned div. Two layers: one in `--color-border` (slightly larger), one in `--color-surface-overlay` (slightly smaller, offset 1px inward) to simulate a bordered triangle. Arrow size: 8px.

---

### `TourProgressDots.tsx`

Rendered inside `TooltipBubble` in the navigation row. Receives `total: number`, `current: number` (zero-indexed).

Renders one dot per step. Three visual states per dot:

- **Completed** (index < current): filled circle, `--color-text-muted`
- **Current** (index === current): filled circle, `--color-accent`, `transform: scale(1.3)`
- **Upcoming** (index > current): outlined circle (border only, transparent fill), `--color-border`

Dot size: 7px diameter. Gap between dots: 6px. The row is centered horizontally.

Dots are not interactive in this implementation.

---

### `TourNavigation.tsx`

Rendered inside `TooltipBubble` below the body text. Contains the full bottom row of the bubble.

Layout:

```
[ Back ]    ● ● ○ ○ ○ ○ ○    [ Next ]
               Skip tour
```

- **Back button**: text button, `text-secondary`. Hidden on step 0 (first step). On click: `tourStore.back()`
- **Next button**: on all steps except the last — styled as a small filled button in `--color-accent`. Label: "Next". On the last step: label changes to "Done", same style. On click: `tourStore.next()`. On the last step, `next()` triggers `dismiss()` which persists completion
- **Skip tour**: small muted text link below the dot row, centered. On click: `tourStore.dismiss()`. Label: "Skip tour". Hidden on the last step (redundant with Done)

---

## File Structure

New files to create:

```
src/
  components/
    tour/
      TourOverlay.tsx
      TooltipBubble.tsx
      TourArrow.tsx
      TourProgressDots.tsx
      TourNavigation.tsx
  stores/
    tourStore.ts
  lib/
    tourSteps.ts
```

Modified files:

```
src-tauri/src/core/config.rs     — add tutorial_completed field
src/stores/tourStore.ts          — new store
src/lib/tourSteps.ts             — step definitions
src/App.tsx                      — mount TourOverlay, check config on launch
AppShell.tsx                     — add data-tour="app-shell"
Sidebar.tsx                      — add data-tour="sidebar", data-tour="new-song-button"
SongSearch.tsx                   — add data-tour="song-search"
EditorPanel.tsx                  — add data-tour="editor-panel"
MetadataBar.tsx                  — add data-tour="metadata-bar", data-tour="snapshot-button"
SectionEditor.tsx                — add data-tour="section-editor"
VersionTimeline.tsx              — add data-tour="version-timeline"
```

---

## Implementation Notes

- The 220ms delay after running a step action is mandatory. The sidebar and timeline use 200ms CSS transitions. Measuring before the transition completes produces wrong rects.
- The tour must not interfere with normal app operation. While the tour is active, the app behind it remains fully interactive. There is no backdrop or pointer-events blocking layer.
- If `tourStore.dismiss()` is called, it must always persist `tutorial_completed: true` regardless of which step the user was on. A dismissed tour never reappears.
- The tour starts only after the vault is loaded and the app shell is fully mounted. Listen for the vault load completing before calling `tourStore.start()`.
- Step actions are fire-and-forget. They call `uiStore` setters synchronously. The 220ms delay in `TourOverlay` is what absorbs the animation time — the actions themselves do not await anything.