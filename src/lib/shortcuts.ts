export interface ShortcutDef {
  label: string;
  action: string;
  // Use 'mod' for Ctrl/⌘, 'shift' for Shift. All other tokens are literal keys.
  keys: string[];
  bypassInputFilter?: boolean;
}

export interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutDef[];
}

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: "File",
    shortcuts: [
      { label: "New Song", action: "new-song", keys: ["mod", "N"] },
      { label: "Close Song", action: "close-song", keys: ["mod", "W"] },
    ],
  },
  {
    title: "Song",
    shortcuts: [
      { label: "Save", action: "save", keys: ["mod", "S"] },
      {
        label: "Save Take",
        action: "save-version",
        keys: ["mod", "shift", "S"],
      },
      {
        label: "New Section",
        action: "new-section",
        keys: ["mod", "shift", "N"],
        bypassInputFilter: true,
      },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { label: "Toggle Sidebar", action: "toggle-sidebar", keys: ["mod", "B"] },
      {
        label: "Toggle History Bar",
        action: "toggle-history",
        keys: ["mod", "H"],
      },
    ],
  },
  {
    title: "Find",
    shortcuts: [
      {
        label: "Find",
        action: "find",
        keys: ["mod", "F"],
        bypassInputFilter: true,
      },
      {
        label: "Find Next",
        action: "find-next",
        keys: ["mod", "G"],
        bypassInputFilter: true,
      },
      {
        label: "Find Previous",
        action: "find-prev",
        keys: ["mod", "shift", "G"],
        bypassInputFilter: true,
      },
      {
        label: "Show Replace",
        action: "toggle-find-replace",
        keys: ["mod", "shift", "H"],
        bypassInputFilter: true,
      },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { label: "Preferences", action: "preferences", keys: ["mod", ","] },
    ],
  },
];

export function matchesShortcut(def: ShortcutDef, e: KeyboardEvent): boolean {
  const needsMod = def.keys.includes("mod");
  const needsShift = def.keys.includes("shift");
  const mainKey = def.keys.find((k) => k !== "mod" && k !== "shift");
  if (!mainKey) return false;
  return (
    (e.metaKey || e.ctrlKey) === needsMod &&
    e.shiftKey === needsShift &&
    e.key.toLowerCase() === mainKey.toLowerCase()
  );
}
