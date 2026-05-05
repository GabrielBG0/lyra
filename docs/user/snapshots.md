# Snapshots

A snapshot is a named, immutable capture of your song at a specific moment, similar to a commit in version control. Once saved, a snapshot never changes. You can have as many as you like, and Lyra shows you the full history in the history bar.

## Taking a snapshot

Press `Ctrl+Shift+S` (`⌘⇧S`) or go to **Song → Save Take**. A small modal appears where you can add an optional note, such as "Rewrote the bridge" or "Version for the demo session". Click **Save Take** to confirm.

Notes are optional, but a short description makes the history much easier to navigate later.

## The snapshot nudge

After ten or more edits and five or more minutes since your last snapshot, Lyra shows a subtle nudge in the history bar suggesting you save a take. You can click it to open the modal, or dismiss it. To turn the nudge off permanently, go to Preferences.

## Viewing your history

Click the **History** header at the bottom of the window, or press `Ctrl+H` (`⌘H`), to expand the history bar.

The bar shows a list of snapshot cards, newest at the top. Each card displays the date, the time elapsed since it was saved, and any note you added. The **Now** card at the very top represents your current working draft.

## Previewing a snapshot

Click any snapshot card to preview it. The editor switches to read-only mode and shows that snapshot's content. The header updates to indicate which snapshot you are viewing.

To return to your working draft, click the **Now** card or press Escape.

## What snapshots contain

Each snapshot captures the full content of every section at that moment, including the section order. Song metadata (title, key, BPM, tags) is not part of a snapshot; only the lyric content is versioned.

Snapshots are stored inside the `.lyr` file and are safe to copy, move, or sync to another machine.
