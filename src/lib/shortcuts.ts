export interface ShortcutDef {
  label: string
  action: string
  // Use 'mod' for Ctrl/⌘, 'shift' for Shift. All other tokens are literal keys.
  keys: string[]
}

export interface ShortcutCategory {
  title: string
  shortcuts: ShortcutDef[]
}

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'File',
    shortcuts: [
      { label: 'New Song',   action: 'new-song',   keys: ['mod', 'N'] },
      { label: 'Close Song', action: 'close-song', keys: ['mod', 'W'] },
    ],
  },
  {
    title: 'Song',
    shortcuts: [
      { label: 'Save',         action: 'save',         keys: ['mod', 'S'] },
      { label: 'Save Take', action: 'save-version', keys: ['mod', 'shift', 'S'] },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { label: 'Toggle Sidebar',     action: 'toggle-sidebar',  keys: ['mod', '\\'] },
      { label: 'Toggle History Bar', action: 'toggle-history',  keys: ['mod', 'H'] },
    ],
  },
]

export function matchesShortcut(def: ShortcutDef, e: KeyboardEvent): boolean {
  const needsMod   = def.keys.includes('mod')
  const needsShift = def.keys.includes('shift')
  const mainKey    = def.keys.find(k => k !== 'mod' && k !== 'shift')
  if (!mainKey) return false
  return (
    (e.metaKey || e.ctrlKey) === needsMod &&
    e.shiftKey === needsShift &&
    e.key.toLowerCase() === mainKey.toLowerCase()
  )
}
