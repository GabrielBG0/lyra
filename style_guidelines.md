# Lyra — Style & Design Guidelines

> A design language for a songwriter's study. Quiet, editorial, star-lit. Lyra is named for the lyre constellation, and the UI borrows its posture: dark, spacious, and dotted with small, deliberate points of warmth.

---

## 1. Design Philosophy

Lyra is a desktop app for writing lyrics. Writing is the protagonist — the interface is the theater, and it should mostly get out of the way.

### Five guiding principles

1. **The page is sacred.** The lyric area is the only region that uses a serif, the only region with generous leading, and the only region that runs at 85% width for measure. Chrome surrounds it, but never invades it.
2. **Ink over glass.** No glassmorphism, no gradients on content surfaces, no shine. Elevations are expressed by subtle shifts in lightness on a warm-dark substrate, not by shadows or blurs. Shadows exist only under modals and popovers, where they signal *detachment* from the surface — not decoration.
3. **Warm restraint.** A single amber accent (`--color-accent`) and a rose secondary (`--color-brand-rose`) do all the emotional work. Status colors exist but are muted and used sparingly. No blues, no vibrant greens, no saturated UI chrome.
4. **Progressive disclosure.** Section tools, delete affordances, rename hints, insert-between handles — all hidden until hover. The editing surface looks finished at rest; controls appear when you reach for them.
5. **Typographic hierarchy before visual hierarchy.** Borders are soft (`border-soft` at 22% opacity). Dividers are nearly invisible. The eye is led by size, weight, and color — not by boxes and lines.

### Tone
- **Editorial, not productive.** Lyra is closer to a leather-bound journal than a project manager. Copy is plain, slightly literary. Empty states invite ("Pick a song from the sidebar, or start a new one.") rather than instruct.
- **Craftsman-grade, not corporate.** Rounded-lg corners, hairline separators, tabular numerals in metadata, italic placeholders in snapshots.

---

## 2. Brand & Identity

### The Lyra mark (`components/ui/LyraLogo.tsx`)
A five-star constellation in **parchment cream `#FCE7C1`** connected by **bronze-amber `#b0864f`** hairlines, with **Vega** (`#FFBB41`) as the brightest point — optionally haloed by a Gaussian glow.

- **Use `glow={true}`** in hero contexts (vault setup, timeline "Now" card, empty editor state).
- **Use `glow={false}`** in dense chrome (menu bar brand lockup).
- **Use `dim={true}`** (18% opacity) when the logo is a passive silhouette inside an empty state — never a pulling focus.
- **Sizing ladder**: `14px` (chrome), `16–36px` (inline badges / empty rows), `48–72px` (empty editor / sidebar empty state), `56–160px` (onboarding).

### Wordmark
"Lyra" is set in Satoshi 600, `text-xs` (`12px`), `tracking-wide`. Always paired with the mark on a `1.5` spacing gap in `text-primary`. Never rendered alone below 12px; never stretched, italicized, or colored.

### The treble clef glyph `𝄞`
A decorative fallback used only in the collapsed sidebar (AppShell.tsx:66). It's a typographic hug to the subject matter — never replace the Lyra mark with it in a primary surface.

---

## 3. Color System

All colors are authored in **OKLCH** for perceptual consistency and defined in `src/styles/global.css` under `@theme`. Tailwind classes map 1:1 to these tokens (e.g. `bg-panel`, `text-primary`, `border-border-soft`).

### 3.1 Surfaces — "Editorial Ink"

A four-step dark palette with a subtle warm bias (chroma `0.008–0.014`, hue `60`). Each step is ~3% lighter than the previous in OKLCH L.

| Token                | OKLCH                    | Role                                                                     |
| -------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `bg` / `--color-bg`  | `0.145 0.008 60`         | Application canvas. The editor, empty states, vault setup.               |
| `surface`            | `0.175 0.01 60`          | Slight-raised surfaces: snapshot cards, modal fields, onboarding cards.  |
| `panel`              | `0.205 0.012 60`         | Sidebar, menu bar, timeline strip, modal body. The "furniture."          |
| `elev`               | `0.245 0.014 60`         | Hover/active states, dropdown menus, inline chips, modal input hover.    |

**Rules of use**

- `bg` is always the background of the lyric-writing area. Never place text on `bg` below ~12px — contrast is calibrated for reading-size type.
- Panels (`panel`) sit against `bg` with a `border-border-soft` hairline. Never stack two `panel`-colored regions without a border or a color step between them.
- `elev` is **interactive feedback**, not a layer. Don't use it as a static panel background. `hover:bg-elev` is the canonical hover for chrome buttons.
- Modal bodies run on `panel` (`oklch(0.205 0.012 60)`), against a backdrop of `oklch(0.08 0.006 60 / 0.75)` with `backdropFilter: blur(4px)`. This is the one place blur is allowed.

### 3.2 Borders

| Token         | OKLCH                       | Role                                                    |
| ------------- | --------------------------- | ------------------------------------------------------- |
| `border`      | `0.32 0.012 60 / 0.5`       | Visible edges: menus, modals, snapshot-card resting.    |
| `border-soft` | `0.32 0.012 60 / 0.22`      | Hairlines: divider rows, panel edges, input outlines.   |

**Rule of thumb**: if the border must read as "this is a container," use `border`. If it must read as "there is a subtle boundary here," use `border-soft`. Most of the app uses `border-soft`.

### 3.3 Text

Four-step typographic gray scale, warm-biased (chroma ~0.01, hue 70–85).

| Token       | OKLCH               | Use for                                                     |
| ----------- | ------------------- | ----------------------------------------------------------- |
| `primary`   | `0.95 0.013 85`     | Titles, active values, lyric body.                          |
| `secondary` | `0.78 0.013 80`     | Labels, menu items at rest, placeholder controls.           |
| `muted`     | `0.55 0.01 75`      | Metadata, secondary text, inactive menu triggers.           |
| `faint`     | `0.4 0.008 70`      | Timestamps, hint text, disabled affordances, soft dividers. |

**Hover convention**: `text-muted` / `text-faint` → `text-primary` or `text-secondary`. Never jump two levels (muted → faint).

### 3.4 Accents

Only two accent hues exist. **Use them sparingly** — once the eye indexes amber as "this matters," that contract must be protected.

| Token                     | OKLCH                    | Role                                                                                                 |
| ------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `accent`                  | `0.72 0.1 55`            | Muted amber. Primary CTAs, active icon state, dirty-dot, selection bar, accent border on focus.      |
| `accent-soft`             | `0.72 0.1 55 / 0.12`     | Selected song background, "Saved" toast, comments-open hover, active snapshot card.                  |
| `brand-rose`              | `0.66 0.1 22`            | Bridge section type; destructive chip hover (X on tags). **Never** a primary action color.           |

**Danger / destructive red** is distinct from the rose and used only for the "Delete" CTA (`oklch(0.55 0.18 25)`). It never appears in chrome, status, or branding.

### 3.5 Status palette (song lifecycle)

Four diagnostic hues, each a calm mid-chroma color — never loud.

| Status     | Token             | OKLCH              | Character   |
| ---------- | ----------------- | ------------------ | ----------- |
| `idea`     | `status-idea`     | `0.75 0.08 230`    | Cool blue   |
| `draft`    | `status-draft`    | `0.78 0.1 65`      | Warm gold   |
| `demo`     | `status-demo`     | `0.68 0.12 15`     | Ember red   |
| `finished` | `status-finished` | `0.8 0.1 115`      | Pale green  |

Render as: **text in status color + 10% bg tint + 20% border tint**. See `STATUS_PILL` in `SongEntry.tsx:13` for the canonical pattern:
```tsx
"text-status-draft bg-status-draft/10 border-status-draft/20"
```

### 3.6 Diff palette

A separate, pre-computed hex palette because diff highlight ink must be **legible against its own background**, not adjusted to ambient tokens.

| Token                | Hex        | Use                     |
| -------------------- | ---------- | ----------------------- |
| `diff-add`           | `#14532d`  | Added text background   |
| `diff-add-text`      | `#86efac`  | Added text foreground   |
| `diff-remove`        | `#450a0a`  | Removed text background |
| `diff-remove-text`   | `#fca5a5`  | Removed text foreground |

Removed text gets an additional `line-through`; added text does not. This is an intentional visual asymmetry — removal is louder because it is rarer and more consequential.

### 3.7 Selection & focus

```css
::selection {
  background-color: oklch(0.72 0.10 55 / 0.35);
  color: oklch(0.95 0.013 85);
}
```

Text selection is amber-tinted — consistent with the accent identity — at 35% opacity so it doesn't obliterate the word underneath.

**Focus rings** are never the browser default. Two canonical patterns:
- **Inline field focus** (MetaField, AddSection inputs): a single `border-b border-accent`, no glow.
- **Modal input focus** (NewSongModal, SnapshotModal): `border: oklch(0.72 0.10 55 / 0.6)` with `box-shadow: 0 0 0 3px oklch(0.72 0.10 55 / 0.1)` — a soft halo. Applied via `onFocus`/`onBlur` handlers.

---

## 4. Typography

Two families. No third family is ever permitted.

### 4.1 UI — **Satoshi** (`--font-ui`, `font-ui`)
```
"Satoshi", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif
```
Neo-grotesque. Weights 400/500/600/700 loaded from Fontshare. Handles everything that is not a lyric: titles, buttons, menus, metadata, labels, status pills, modals.

### 4.2 Lyrics — **Newsreader** (`--font-lyrics`, `font-lyrics`)
```
"Newsreader", Georgia, "Times New Roman", serif
```
A contemporary serif with a wide optical-size range (`opsz 6..72`). Loaded in weights 400/500 plus italic 400. **Used only in**:
- The lyric textarea (`.lyric-textarea` in `global.css:98`)
- Diff content (`DiffSection.tsx` — `font-lyrics text-primary leading-[1.85]`)
- Snapshot preview section bodies

Never in metadata, chrome, or buttons. A serif lyric block against a sans-serif UI is the defining typographic gesture of the app.

### 4.3 Type scale

Lyra overrides a handful of Tailwind default sizes and introduces two custom ones.

| Token              | px     | Canonical uses                                                                   |
| ------------------ | ------ | -------------------------------------------------------------------------------- |
| `text-2xs`         | **10** | Status pill labels, section-type tabs (`TYPE_LABEL`), timestamps, footer counts. |
| `text-[10.5px]`    | 10.5   | Vault path crumb, footer metadata, "click to rename" hint.                       |
| `text-[11px]`      | 11     | Fine chips, inline kbd glyphs, tag chips.                                        |
| `text-xs`          | 12     | Modal description lines, keyboard-hint tokens in menu bar.                       |
| `text-[12.5px]`    | 12.5   | Menu item labels, search input, comment body.                                    |
| `text-[13px]`      | 13     | Song titles in list, modal button labels.                                        |
| `text-sm`          | 14     | Modal primary inputs, empty-state body copy.                                     |
| `text-base`        | 16     | The lyric textarea (only).                                                       |
| `text-title`       | **26** | Song title in MetadataBar.                                                       |
| `text-3xl`         | 30     | Vault setup welcome heading (the largest heading anywhere).                      |

**Note**: the app freely mixes Tailwind utility classes and inline `style={{ fontSize: 12.5 }}` — the latter is used when a half-pixel or a specifically-tuned value matters. This is a deliberate convention, not an accident. If a designer needs 11.5px, write it inline; don't invent a new token.

### 4.4 Weight

| Weight | Role                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| 400    | Body, menu items, meta values.                                                  |
| 500 (`font-medium`) | Song title in list, fine tags, in-line "Me" author names, action buttons. |
| 600 (`font-semibold`) | H1/H2, brand wordmark, primary CTAs, saved toast, snapshot label "v1".   |
| 700 (`font-bold`) | Snapshot version labels ("Now", "v1"), counter badges on comment icons.     |

Italic is used in exactly one place: the tagline on the vault setup ("Lyra — the lyre constellation…") and for missing-note placeholders in snapshot cards.

### 4.5 Tracking (letter-spacing)

A quiet, deliberate tracking ladder:

- `tracking-tight` (`-0.01em` / `-0.025em`): song titles and welcome heading. Tightens display type.
- default (0): body, buttons, inputs.
- `tracking-wide` (`0.025em`): chrome brand lockup, kbd tokens, minor UI chips.
- `tracking-[0.08em]`: uppercase field labels (KEY, BPM, CAPO). Always paired with `uppercase` + `font-semibold` + `9.5px`.
- `tracking-[0.14em]`: section-type labels (VERSE, CHORUS, BRIDGE) and "Add section" CTA. The widest tracking in the app — it signals *category*, not content.

### 4.6 Leading

- UI chrome: `leading-tight` or default. Never generous.
- Lyric body: **`line-height: 1.85`**. Calibrated for how lyrics breathe and for how stanza breaks read. Never change this without discussing it.
- Diff body: also `1.85`. Keep parity with lyric leading so a diff doesn't feel like a different document.
- Modal body copy: `leading-relaxed` or `leading-snug`.

### 4.7 Numerals
Metadata values that the user scans or edits (BPM, Capo, timestamps, version labels) use `tabular-nums`. Never let proportional digits wobble under a changing value.

### 4.8 Case

Uppercase is a design device, not a shouting mechanism. Reserved for:
- Field labels in the MetadataBar
- Section type tabs (VERSE, CHORUS)
- Status pill labels (IDEA, DRAFT)
- Small category chips (e.g. language codes rendered `item.toUpperCase()` in `MetadataBar.tsx:364`)

When using uppercase, always pair with `font-semibold` (600) or `font-medium` (500) and **widen tracking** (`0.08em`+). Uppercase at default tracking looks cramped and is forbidden.

---

## 5. Layout, Grid & Spacing

### 5.1 Top-level shell (`AppShell.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ MenuBar                                 h-8, panel       │
├────────────┬────────────────────────────────────────────┤
│            │                                             │
│ Sidebar    │ EditorPanel                                 │
│ w-65       │   ├── MetadataBar      (shrink-0)           │
│ (or w-12)  │   ├── [DiffBanner | SnapshotPreviewBanner]  │
│            │   ├── SectionEditor    (flex-1, scroll-y)   │
│            │   └── VersionTimeline  (42px | 184px)       │
│            │                                             │
└────────────┴────────────────────────────────────────────┘
```

- **Menu bar**: `h-8` (32px), `data-tauri-drag-region` enabled, `z-50`. Left-padding is `76px` on macOS (traffic-lights) and `10px` elsewhere. No subpixel compromises.
- **Sidebar expanded**: `w-65` (260px). Never resizable; the constraint is intentional.
- **Sidebar collapsed**: `w-12` (48px) — a narrow strip with the treble clef glyph, new-song button, and expand button stacked.
- **Editor inner column**: `w-[85%] mx-auto px-14` (224px padding inside 85% column). This is the *measure* — never put editable lyric text outside this container. Timeline uses full width by design.

### 5.2 Spacing scale

Lyra uses Tailwind's default 0.25rem step but **freely uses arbitrary half-steps** (`w-1.25`, `py-0.5`, `h-1.75`) because at this information density every half-pixel matters. Do not try to round these to the nearest integer — they were tuned.

**Canonical spacing moments**:
- Modal inner padding: `px-6 pt-6 pb-5`
- Modal header → body gap: `mb-5`
- Sidebar section padding: `px-3.5 pt-3.5 pb-2.5`
- MetadataBar padding: `px-7 pt-5 pb-4`
- Editor column outer padding: `px-14 py-3.5 pb-16` (large bottom pad reserves breathing room at end of song)
- SongEntry padding: `px-2.5 py-2.5`

### 5.3 Corner radii

A narrow radius vocabulary.

| Token             | Use                                                                 |
| ----------------- | ------------------------------------------------------------------- |
| `rounded` (4px)   | Small chrome buttons, menu items, kbd tokens, field chips.          |
| `rounded-md` (6px)| "New song" CTA in empty state, vault setup primary button.         |
| `rounded-lg` (8px)| Song entries, modals inputs, panels, context menus, snapshot cards. |
| `rounded-xl` (12px)| Modal surfaces.                                                    |
| `rounded-full`    | Status pills, tag chips, counter dots, avatar-like status dots.     |

Never mix `rounded` and `rounded-lg` on adjacent siblings — the eye reads it as a bug.

### 5.4 Dividers

Three divider styles, not more:

1. **Hairline section edge** — `border-b border-border-soft` on bars (MenuBar, MetadataBar). Essentially invisible until the eye needs it.
2. **Visible edge** — `border-border` on modals and menus (edges that must read as container boundary).
3. **Micro inline** — `<div className="w-px h-5 bg-border-soft mx-0.5" />` between groups of chips in MetadataBar. Vertical pipes only when two kinds of data abut; never as pure decoration.

### 5.5 Z-index ladder

- `z-10` — local popovers (status dropdown, section "more" menu)
- `z-40` — modal backdrop click-catcher in portaled popovers
- `z-50` — menu bar, modal surfaces, dropdown menus, context menus, AddSection portals

Do not invent new z values. If a new layer is needed, it belongs to one of these tiers.

---

## 6. Surface & Elevation

Lyra does not use drop shadows to lift components off the page. Elevation is communicated by:

1. **Color step** (`bg → surface → panel → elev`)
2. **Border** (`border-soft` hairline)
3. **Position** (fixed/absolute for overlays)

The single exception is **modals and floating popovers**, which use a real shadow:

```css
box-shadow:
  0 24px 64px oklch(0.06 0.005 60 / 0.8),
  0 0 0 1px oklch(0.32 0.012 60 / 0.4);
```

The second "shadow" is a **1px outline** masquerading as a shadow — it gives the surface a painted edge against the blurred backdrop. Shadow-2xl (Tailwind) is used on dropdowns for the same effect at a smaller scale.

**Modal top-edge accent line**: every modal has a `1px` horizontal gradient line at the top:

```css
background: linear-gradient(90deg, transparent, oklch(0.72 0.10 55 / 0.6), transparent);
```

For the delete modal this line uses the danger hue (`oklch(0.55 0.18 25 / 0.6)`) — the only place in the app where the mere top edge of a surface communicates intent.

---

## 7. Iconography

### 7.1 Library
**Lucide React** only, re-exported as a flat namespace in `components/ui/Icon.tsx`. Never import from `lucide-react` directly; always `import { Icons } from '.../ui/Icon'`.

### 7.2 Sizing ladder

| Size | Context                                           |
| ---- | ------------------------------------------------- |
| 9px  | X button inside a 11px chip                       |
| 11px | X inside search/clear                             |
| 13px | Section-tools row (grip, comments, more), sidebar |
| 14px | Chrome brand logo, add-section CTA                |
| 15px | Save / Camera in MetadataBar, modal close         |
| 16px | Icons inside modal callouts                       |
| 22px | Folder icon in vault setup cards                  |

Lucide uses `1.5px` stroke by default. Increase to `strokeWidth={2.5}` only for the plus-badge composited on the "Create Vault" folder (needs weight at 9px).

### 7.3 Aliases

Two Lucide icons are re-exported under shorter names for linguistic clarity: `GripVertical → Grip` and `Trash2 → Trash`. Follow this convention if adding new aliases — internal names should read naturally in a sentence.

### 7.4 Color
Icons inherit from `color`. Default resting state is `text-faint` or `text-secondary`; `text-accent` for active/pinned; `text-brand-rose` for destructive hover. An icon should never use an arbitrary color outside the token palette.

---

## 8. Components

Every component should live in one of nine folders: `comments/`, `diff/`, `editor/`, `layout/`, `shell/`, `sidebar/`, `timeline/`, `ui/`, `vault/`. `ui/` is reserved for *app-wide primitives* (modals, icons, logo, context menu); feature folders own their own subcomponents.

### 8.1 Buttons

Lyra does not have a `<Button />` component. Buttons are composed inline with Tailwind. Three canonical shapes:

**Primary (filled amber)**
```tsx
className="px-4 py-2 rounded-lg font-semibold border-none"
style={{ background: 'oklch(0.72 0.10 55)', color: 'oklch(0.145 0.008 60)' }}
```
Use for: "Create Song", "Save Version", vault-setup continue. Only **one** primary button per modal / screen region. Disabled state: `background` at 35% alpha + foreground at 50% alpha.

**Secondary (bordered, transparent)**
```tsx
className="px-4 py-2 rounded-lg text-secondary hover:text-primary hover:bg-elev
           transition-colors border border-border-soft bg-transparent"
```
Use for: Cancel, exit-diff, Close Song in menus.

**Chrome / icon button**
```tsx
className="w-7 h-7 flex items-center justify-center rounded text-secondary
           hover:bg-elev hover:text-primary transition-colors
           border-none bg-transparent cursor-pointer"
```
Use for: sidebar toggle, save icon, snapshot icon, modal close. Always square, always `rounded`, always transparent at rest. Sizes in common use: `w-5.5 h-5.5`, `w-6 h-6`, `w-7 h-7`, `w-7.5 h-7.5`, `w-8 h-8`.

**Pill / tag**
```tsx
className="px-1.5 py-px rounded-full text-2xs font-semibold uppercase
           tracking-wide border [status color classes]"
```

### 8.2 Inputs

Two input patterns. **Do not invent a third.**

**Inline editable (MetaField)** — for in-situ editing of metadata values. At rest, renders as plain text; on click, swaps in an `<input>` with `border-b border-accent`. No box, no background.

**Boxed (modal / form)** — `bg-bg` (darker than the modal it sits in), `border border-border-soft`, `rounded-lg`, `px-3 py-2.5`, `text-sm`. On focus, borders shift to `oklch(0.72 0.10 55 / 0.6)` plus a `box-shadow` halo. Placeholder is always `placeholder:text-faint`.

**Search input** — a specialized boxed input with a leading `Search` icon, a trailing clear `X`, and `focus-within:border-accent`. See `SongSearch.tsx`.

### 8.3 Modals

The canonical modal (`NewSongModal`, `SnapshotModal`, `DeleteSongModal`, `KeyboardShortcutsModal`) is a stable recipe:

- `fixed inset-0 z-50 flex items-center justify-center`
- **Backdrop**: `oklch(0.08 0.006 60 / 0.75)` + `backdrop-filter: blur(4px)`
- **Surface**: `oklch(0.205 0.012 60)`, `rounded-xl`, `border border-border`, the shadow recipe in §6, the gradient top line.
- **Max width**: `max-w-sm` (confirmations), `max-w-md` (single-field forms), dynamic 1–3 cols for Keyboard Shortcuts.
- **Close** via: click-outside (on backdrop), Escape key, top-right `X` button, Cancel button. All four must work.
- **Layout**: `px-6 pt-6 pb-5`, header row `mb-5`, label `mb-1.5`, action row `mt-5 justify-end gap-2.5`.

**Confirmation modals** (DeleteSongModal) add a **semantic icon callout** in the top-left: a `9×9` rounded-lg tile in the action's color at 15% alpha with a 25%-alpha border, holding the Lucide icon at 65%-lightness color.

### 8.4 Menus & dropdowns

Menu bar dropdowns and metadata dropdowns follow the same pattern:
- Surface: `bg-elev border border-border rounded-lg p-1 shadow-2xl`
- Item: `px-2.5 py-1.5 rounded text-[12px|12.5px]`
- Item hover: **`hover:bg-accent-soft hover:text-accent`** — this is the single canonical menu-hover combination. Do not override.
- Divider: `h-px bg-border-soft my-1 mx-1.5`
- Keyboard hint glyph: `text-muted text-[11px]` right-aligned
- Disabled item: `text-muted cursor-not-allowed opacity-50`, optional `TODO` badge (`text-[9px] font-mono uppercase tracking-widest`).

### 8.5 Status pills & chips

Two sizes:
- **Status pill** (song lifecycle): rounded-full, border in status color at 20%, bg at 10%, text in status color. Uppercase, `text-2xs`, `font-semibold`, `tracking-wide`. Always `px-1.5 py-px`.
- **Tag chip** (genre, mood, language): rounded-full, `bg-elev border border-border-soft`, `text-faint`, `font-medium`, `text-2xs`. A *quieter* variant of the same shape.

**Dashed "add-a-tag" button**: same dimensions but `bg-transparent border-dashed border-border-soft text-muted`, hover `text-accent border-accent`. This is the canonical "add an item to a group" affordance.

### 8.6 Snapshot card (`SnapshotCard.tsx`)

The timeline card is a miniature document:

- Fixed width `w-42.5` (170px) — tight enough that 4–5 fit on screen, wide enough for a two-line note.
- `bg-surface` (slightly raised from timeline panel).
- Resting: `border-border-soft`; hover: `border-accent bg-elev`; preview-selected: solid `border-accent bg-accent-soft`; shift-selected: `border-dashed border-accent`.
- "Now" card is a special case: uses a 155° amber gradient overlay plus a glowing left accent bar (`box-shadow: 0 0 8px oklch(0.72 0.10 55)`) — the only component in the app with an internal gradient.
- Header row: version label (`text-[11px] font-bold`) + time-ago (`text-[10.5px] text-faint`).
- Body: 2-line clamped note in `text-[12px]` (secondary if present, faint italic if absent).
- Footer: `text-2xs uppercase tracking-wide font-medium text-faint` — section count.

### 8.7 Section block

A lyric section is a **purely typographic object**. No box, no background, no border.

- **Header**: a ghost row (`opacity-0`, `group-hover:opacity-100`) with grip, comments, and more-actions. Label is a section-type tab: a colored dot + uppercase label + middle-dot + name in faint normal-case.
- **Body**: a bare `<textarea>` styled only via `.lyric-textarea`: no border, no background, serif, `line-height 1.85`, `letter-spacing 0.002em`, `font-variant-ligatures: common-ligatures`.
- **Dragging**: opacity 0.5 via `@dnd-kit/sortable`.
- **Insert-between affordance**: on hover of the divider row between sections, a horizontal line subtly tints to `accent` at 35% opacity, and a circular `+` button fades in centered.

This is the most important component in the app. **No chrome should ever live on the lyric textarea itself** — the textarea is empty of affordances; everything happens at the header or section-divider row.

### 8.8 Diff view

When a diff is active:
- The `DiffBanner` replaces/overlays the Metadata → Sections area, `bg-accent-soft border-b border-accent`.
- The lyric area becomes read-only: same 85% column, same font, but text is wrapped in `<mark>` / `<del>` with the diff palette.
- Inline "Use this section" appears only when the right-hand target is a snapshot (not "now") and the section is changed/added.

The diff and the editor share the exact same typography. This is critical: a diff that switches fonts would break the illusion that it's the same document.

---

## 9. Motion & Interaction

### 9.1 Motion principles

- **Functional, not expressive.** No animation exists for delight — only to disambiguate state change.
- **Short and tight.** Default transitions are `transition-colors` (Tailwind default, 150ms). The longest non-loading animation is the modal width transition (`180ms ease`) in the keyboard-shortcuts modal.
- **No spring, no easing curves beyond `ease`.** Match Tailwind's defaults.
- **Respect reduced motion.** Do not author motion that meaningfully distracts when stripped.

### 9.2 Canonical transitions

- `transition-colors` — the default for all chrome hovers.
- `transition-opacity` — for hover-reveal controls (section tools).
- `transition-all` — only on surfaces that change *both* color and border (snapshot cards, vault-setup option cards). Avoid elsewhere because it's lazy.
- `animate-spin` — for the `Loader` icon and only that.

### 9.3 Hover reveals

A defining interaction pattern. Examples:
- SectionHeader controls: `opacity-0 group-hover:opacity-100`
- SongEntry delete button: mounted only when `hovered === true`
- Song title "click to rename" hint: `opacity-0 group-hover/title:opacity-100`
- Insert-between section handle: `opacity-0 group-hover/divider:opacity-100`

**Convention**: hover reveals use `opacity`, not `display`, so layout doesn't shift. Pair with `transition-opacity`.

### 9.4 Feedback moments

- **Save confirmation**: a "Saved" pill (`bg-accent-soft text-accent rounded-full`) flashes for `1500ms` on successful save (`MetadataBar.tsx:57–60`). Do not persist.
- **Dirty indicator**: a `w-1.5 h-1.5 rounded-full bg-accent` dot, and the save icon gains a `box-shadow: 0 0 6px` amber glow. The glow is subtle enough to be ambient but visible enough to be noticed.
- **Latest snapshot dot**: `w-1.75 h-1.75 rounded-full bg-accent` with the same 8px glow — a quiet "pulse" of recency.

### 9.5 Cursors

- `cursor-pointer` on every clickable non-input.
- `cursor-text` on the song title at rest (signals in-place edit).
- `cursor-grab` / `active:cursor-grabbing` on the drag handle.
- `cursor-not-allowed` on disabled buttons.
- `cursor-default` on purely decorative rows (e.g. the insert-divider row at rest).

---

## 10. Keyboard & Accessibility

### 10.1 Shortcuts (`lib/shortcuts.ts`, `hooks/useKeyboardShortcuts.ts`)

Every shortcut the user can reach is cataloged in `SHORTCUT_CATEGORIES` and surfaced in the KeyboardShortcutsModal. Never hard-code a shortcut outside that file.

Canonical bindings:

| Binding         | Action         |
| --------------- | -------------- |
| `mod + N`       | New song       |
| `mod + S`       | Save           |
| `mod + Shift + S` | Save version |
| `mod + W`       | Close song     |
| `mod + \`       | Toggle sidebar |
| `Esc`           | Close modal / exit diff / exit preview / cancel inline edit |

`mod` resolves to `⌘` on macOS and `Ctrl` on Windows/Linux via `navigator.platform` + UA sniff (`MenuBar.tsx:11`, `KeyboardShortcutsModal.tsx:10`). Render the platform-appropriate glyph — never "Ctrl" on macOS or "⌘" on Windows.

### 10.2 Keyboard affordances
- Every clickable `<div role="button">` must set `tabIndex={0}` and handle Enter + Space (`SongEntry.tsx:41`).
- Inline-edit fields commit on `Enter`, cancel on `Escape`, and commit on blur unless Escape was pressed (the `cancelledRef` pattern in MetaField / ChipGroup).
- Modal inputs autofocus **after a 30ms delay** — a small but deliberate buffer to let the dialog's own focus trap settle.

### 10.3 Semantic & ARIA
- Icon-only buttons **must** have both `title=` and `aria-label=` when the icon is not textual (see SongEntry's delete button).
- Form fields use real `<label>` elements where possible; otherwise, pair with an uppercase "label" text and place the input directly below.
- Modal surfaces do not yet implement a focus trap; future modals should add one. Escape + click-outside + Cancel all close — don't remove any of those exits.

### 10.4 Contrast
All text tokens meet WCAG AA against their intended background. Do not place `text-faint` on `bg`; it is designed for `surface` or `panel`. Do not place `text-muted` on `elev` without testing.

---

## 11. Editor Conventions

### 11.1 The 85% column
Every piece of lyric content — sections, diffs, snapshot previews — renders inside `w-[85%] mx-auto px-14 py-3.5 pb-16`. Never deviate. The 15% margin is the "page's breath."

### 11.2 Metadata hierarchy
MetadataBar uses a **gradient fade-out** from `surface` to `transparent`:

```css
background: linear-gradient(180deg, oklch(0.175 0.010 60), transparent);
```

This is the only gradient background in the app. It signals: this bar is *above* the lyric page, but it dissolves into the page rather than sitting on it.

### 11.3 Tiny dots are a system
A cluster of 1–2px colored circles carry state across the app:
- `w-1 h-1` — section type dot (dim amber / rose / faint)
- `w-1.25 h-1.25` — unsaved glow on save icon
- `w-1.5 h-1.5` — dirty indicator, song-list dirty dot, title-row glow
- `w-1.75 h-1.75` — status pill dot (MetadataBar), latest snapshot pulse

**Use the smallest dot that will be read.** Dots are ambient, not announcements.

### 11.4 Tabs, not spaces, for layout
When a menu item needs a keyboard hint beside it, the label and kbd are separated by a literal `\t` in the label string, split on parse (`MenuBar.tsx:177`). This is a small pragma — do not redesign it.

---

## 12. Content & Copy

### 12.1 Voice
- **Calm imperatives**: "Pick a song from the sidebar, or start a new one." Never "Select a song to continue."
- **Concrete nouns**: "vault," "snapshot," "section" — not "workspace," "save point," "block."
- **Don't apologize for absence**: empty states say "No songs yet. Create one to begin." — not "You don't have any songs."
- **Punctuation**: prefer `—` (em-dash) and `·` (middle dot) as separators over `,` and `|`. The app is full of both, and it reads as a considered typographic choice.

### 12.2 Placeholders
- `Write verse…`, `Write chorus…` — auto-generated from section name lowercased.
- `Untitled Song` — new-song modal placeholder.
- `e.g. Added bridge, tweaked chorus…` — snapshot note placeholder. Use this exact cadence for any new freeform field.
- `Search songs…` — always ends in an ellipsis (`…`, not `...`).

### 12.3 Unit formatting
- Time-ago: `just now` / `Nm ago` / `Nh ago` / `yesterday` / `Nd ago` (`SnapshotCard.tsx:20`).
- Date: `toLocaleDateString(undefined, { dateStyle: 'medium' })` — e.g. "Apr 20, 2026."
- Counts: `1 song` / `2 songs` — always pluralize, never "song(s)".

### 12.4 TODO-honesty
Unimplemented menu items are shown grayed with an explicit `TODO` badge (`MenuBar.tsx:192`). This is part of the voice: the app does not pretend to have what it doesn't. Preserve this pattern rather than removing stubs.

---

## 13. States — a quick reference

| State         | Treatment                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| **Rest**      | Surfaces at `panel`, text at `secondary`/`primary`, borders `border-soft`.   |
| **Hover**     | Background lifts to `elev`; text to `primary`; border may shift to `accent`. |
| **Active**    | `bg-accent-soft` + `text-accent` (menus, section-comments toggle).            |
| **Selected**  | `bg-accent-soft` + `song-entry-selected` left bar (2px amber, radius 0 2 2 0). |
| **Focus**     | Accent border + halo (boxed inputs) or accent bottom-border (inline fields).  |
| **Disabled** | `opacity-40` or `opacity-50` with `cursor-not-allowed`. No grayscale.         |
| **Loading**   | `Icons.Loader` with `animate-spin` in `text-muted`.                          |
| **Dirty**     | `w-1.5 h-1.5 rounded-full bg-accent` with 6–8px amber box-shadow.            |
| **Danger**    | `brand-rose` text on hover; `oklch(0.55 0.18 25)` fill on confirm CTA.       |

---

## 14. Do & Don't

**Do**
- Use OKLCH tokens via Tailwind classes.
- Follow the 85%-column rule for anything resembling a lyric.
- Prefer `text-[12.5px]` inline over inventing a new scale step.
- Use hover-reveal for editing affordances.
- Pair uppercase with `tracking-[0.08em]` or wider and a weight of 500+.
- Treat amber as a finite resource — spend it on the thing that matters on the screen.

**Don't**
- Use shadows on content surfaces.
- Add a third font family.
- Introduce a new accent hue; extend the muted amber / rose vocabulary instead.
- Put borders on lyric textareas or any reading surface.
- Animate for delight. Motion reflects state change.
- Use blue for CTAs. Lyra does not have a blue.
- Call `alert()` or native `confirm()`; use a modal following the recipe.
- Render uppercase at default tracking.

---

## 15. File & Architecture Conventions

- **One component per file**, PascalCase filename matching default export.
- **Styles live inline** via Tailwind utilities or a handful of `@layer components` classes in `global.css`. CSS Modules and styled-components are not used.
- **Colors are token references.** Do not hard-code OKLCH values in components *except* inside `style={{}}` objects when a dynamic computation is required (modals use inline styles for dynamic borders/shadows — this is the established exception).
- **Icons always come from the `Icons` namespace** (`components/ui/Icon.tsx`).
- **Modals live in `components/ui/`**; feature-specific sub-panels live in their feature folder.
- **Global design tokens**: authoritatively in `src/styles/global.css` under `@theme`. Supplemental raw vars (for inline-style gradients) go in `src/styles/tokens.css`.

---

## 16. Evolving this document

Lyra's visual identity earns its restraint through discipline. Before adding a new color, font, shadow, or animation, answer two questions:

1. **What specifically is inadequate about the existing vocabulary for this case?**
2. **If I add this, what am I committing future changes to?**

If the answers feel thin, the addition probably isn't ready. This document should be edited when a new pattern genuinely lands — not when a one-off appears.

> The constellation is finite. Every new star must belong.
