# Songs and Sections

## Creating a song

Press `Ctrl+N` (`⌘N`) or go to **File → New Song**. Type a title and press Enter. The song opens immediately in the editor.

## Song metadata

The metadata bar sits at the top of the editor. Click any field to edit it.

| Field      | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| **Title**  | The song's name. Shown in the sidebar.                             |
| **Status** | Where the song is in your process: Idea, Draft, Demo, or Finished. |
| **Key**    | Musical key, e.g. "C Major" or "A Minor".                          |
| **BPM**    | Tempo in beats per minute.                                         |
| **Capo**   | Guitar capo position.                                              |
| **Tuning** | Guitar tuning string.                                              |
| **Tags**   | Genre, mood, and language. Each can hold multiple values.          |

Changes to metadata are saved along with the rest of the song.

## Saving

Lyra saves automatically after two seconds of inactivity. You can also save manually with `Ctrl+S` (`⌘S`). A dot next to the song title in the sidebar means there are unsaved changes.

## Closing a song

Press `Ctrl+W` (`⌘W`) or go to **File → Close Song**. If there are unsaved changes, Lyra will ask you to confirm before closing.

## Deleting a song

Hover over a song in the sidebar to reveal the delete button (trash icon). Click it to delete. This removes the `.lyr` file from disk and cannot be undone, so confirm before proceeding.

---

## Sections

Sections are the building blocks of a song. Each section has a type (Verse, Chorus, Bridge, etc.), an optional name, and a text body where you write your lyrics.

### Adding a section

Click **+ Add section** at the bottom of the editor. A popover opens with the available section types:

- Intro
- Verse
- Pre-Chorus
- Chorus
- Bridge
- Outro
- Custom

Click a type to select it, optionally give it a name (e.g. "Verse 1" or "Chorus (reprise)"), then press Enter or click **Add**. If you leave the name blank, Lyra uses the type label as the name.

You can also click the **+** button that appears between existing sections to insert a new one at that position.

### Editing lyrics

Click inside any section and type. The text area expands as you write. Lyra saves your changes automatically.

### Reordering sections

Grab the grip handle (⋮⋮) on the left side of any section header and drag it to a new position.

### Deleting a section

Click the **···** menu on the section header and choose **Delete section**. This action can be undone with `Ctrl+Z` (`⌘Z`).

---

## Undo and redo

Lyra tracks up to 100 edits. Press `Ctrl+Z` (`⌘Z`) to undo and `Ctrl+Shift+Z` (`⌘⇧Z`) to redo. Rapid typing in the same section is grouped into single undo steps.

---

## Copying and pasting sections

You can copy and paste whole sections, including between different songs. Click a section to focus it, then use the standard copy (`Ctrl+C` / `⌘C`) and paste (`Ctrl+V` / `⌘V`) shortcuts. The pasted section retains its type and content.
