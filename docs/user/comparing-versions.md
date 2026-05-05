# Comparing Versions

Lyra can compare any two snapshots, or your current draft against any snapshot, and highlight exactly what changed.

## Starting a comparison

Open the history bar (`Ctrl+H` / `⌘H`) and click a snapshot card to preview it. Then **Shift+click** a second snapshot card to compare the two.

To compare your working draft against a snapshot, preview the snapshot first, then Shift+click the **Now** card.

## Reading the diff

Each section shows a status badge in the diff view:

| Badge | Meaning |
|-------|---------|
| **Unchanged** | The section is identical in both versions. |
| **Changed** | The section exists in both versions but the content differs. |
| **Added** | The section exists only in the newer version. |
| **Removed** | The section exists only in the older version. |

For sections marked **Changed**, Lyra shows a character-level diff inside the section body. Removed text is highlighted in red, added text in green, and the surrounding context is shown in muted text to give you orientation.

## Cherry-picking a section

When you are diffing against your working draft, any section marked **Added** or **Changed** from the snapshot shows a **Use this section** button. Clicking it copies that section's content from the snapshot into your working draft.

This is useful when you want to pull a single rewritten section from an older version without reverting the whole song.

## Exiting the diff view

Click the **Now** card in the history bar, or press Escape, to leave the diff view and return to normal editing.
