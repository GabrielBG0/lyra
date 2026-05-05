# Getting Started

## What Lyra is

Lyra helps you write, organize, and version your lyrics. Songs are split into labeled sections (Verse, Chorus, Bridge, and so on), and you can save named snapshots at any point to build up a version history. When you want to compare two drafts, Lyra shows you a character-level diff.

Everything is stored as `.lyr` files in a folder on your machine. There is no cloud sync, no account, and no internet connection required.

## Setting up your vault

When you first open Lyra, you will be asked to set up a vault. A vault is just a folder where your `.lyr` song files live.

You have two options:

**Create a new vault** — Pick any empty folder. Lyra will use it as your library from here on.

**Open an existing vault** — If you already have a folder with `.lyr` files, point Lyra to it and it will import them automatically.

Once your vault is set, Lyra creates a hidden `.lyrindex/` folder inside it to cache the song index. This file is rebuilt automatically if anything goes wrong, so you can safely ignore it.

You can change your vault location later in Preferences (`Ctrl+,` on Windows/Linux, `⌘,` on Mac).

## The welcome tour

After setting up your vault, Lyra walks you through a short tour of the interface. It covers the sidebar, the editor, sections, snapshots, and the history bar. You can move through it with the arrow keys or by clicking, and press Escape to skip at any time.

If you want to replay it later, you can reset it from Preferences.

## The layout

Lyra has three main areas:

**Sidebar** (left) — Your song library. Use the search bar at the top to filter by title, genre, mood, or language. Click a song to open it.

**Editor** (center) — The main writing area. The metadata bar at the top holds the song title, status, key, BPM, and tags. Below it are your sections, stacked vertically.

**History bar** (bottom) — A collapsible panel showing all your saved snapshots. Click the header or press `Ctrl+H` (`⌘H`) to expand or collapse it.

## Opening a `.lyr` file directly

You can double-click any `.lyr` file in your OS file explorer to open it directly in Lyra, without navigating the sidebar first.
