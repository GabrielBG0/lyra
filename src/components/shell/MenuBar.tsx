import { useState, useEffect, useRef } from 'react'
import LyraLogo from '../ui/LyraLogo'
import { useEditorStore } from '../../stores/editorStore'
import { useSong } from '../../hooks/useSong'
import { useSnapshot } from '../../hooks/useSnapshot'

const MENUS = {
  File: ['New Song\t⌘N', 'Open Vault…\t⌘O', '—', 'Export as Plain Text…', 'Export as PDF…\t⌘P', '—', 'Close Song\t⌘W'],
  Edit: ['Undo\t⌘Z', 'Redo\t⇧⌘Z', '—', 'Cut\t⌘X', 'Copy\t⌘C', 'Paste\t⌘V', '—', 'Find…\t⌘F'],
  Song: ['Save\t⌘S', 'Save Version…\t⇧⌘S', '—', 'Show History\t⌘H', 'Diff with Snapshot…\t⌘D'],
  View: ['Toggle Sidebar\t⌘\\', 'Zoom In\t⌘+', 'Zoom Out\t⌘-'],
  Help: ['Keyboard Shortcuts…\t⌘?', 'About Lyra'],
} as const

interface MenuBarProps {
  onToggleSidebar: () => void
  onNewSong: () => void
}

export default function MenuBar({ onToggleSidebar, onNewSong }: MenuBarProps) {
  const [open, setOpen] = useState<string | null>(null)
  const { metadata, isDirty } = useEditorStore()
  const { saveSong } = useSong()
  const { createSnapshot } = useSnapshot()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleItem = (_menu: string, item: string) => {
    const label = item.split('\t')[0]
    setOpen(null)
    if (label === 'New Song') onNewSong()
    else if (label === 'Toggle Sidebar') onToggleSidebar()
    else if (label === 'Save') saveSong()
    else if (label === 'Save Version…') {
      const note = window.prompt('Snapshot note (optional):')
      createSnapshot(note || null)
    }
  }

  return (
    <div
      ref={menuRef}
      className="h-7 flex items-center gap-0 px-2.5 bg-panel border-b border-border-soft text-secondary relative z-50 flex-shrink-0"
      style={{ fontSize: 12.5 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-1.5 px-2.5 font-semibold text-primary text-xs tracking-wide mr-1">
        <LyraLogo size={14} glow={false} />
        Lyra
      </div>

      {/* Menu items */}
      {Object.keys(MENUS).map((menu) => (
        <div key={menu} className="relative">
          <button
            className={`px-2.5 py-1 rounded text-[12.5px] cursor-pointer transition-colors select-none ${
              open === menu ? 'bg-elev text-primary' : 'text-secondary hover:bg-elev hover:text-primary'
            }`}
            onMouseEnter={() => open && setOpen(menu)}
            onClick={() => setOpen(open === menu ? null : menu)}
          >
            {menu}
          </button>
          {open === menu && (
            <div className="absolute top-full left-0 mt-0.5 min-w-[220px] bg-elev border border-border rounded-lg p-1 shadow-2xl z-50">
              {MENUS[menu as keyof typeof MENUS].map((item, i) => {
                if (item === '—') {
                  return <div key={i} className="h-px bg-border-soft my-1 mx-1.5" />
                }
                const [label, kbd] = item.split('\t')
                return (
                  <button
                    key={i}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded text-[12.5px] text-primary hover:bg-accent-soft hover:text-accent cursor-pointer transition-colors"
                    onClick={() => handleItem(menu, item)}
                  >
                    <span>{label}</span>
                    {kbd && <span className="text-faint text-[11px] ml-4">{kbd}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {metadata && (
        <div className="flex items-center gap-1.5 pr-1 text-faint text-[11px]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
            style={{ boxShadow: isDirty ? '0 0 6px oklch(0.72 0.10 55)' : 'none' }}
          />
          {metadata.title}{isDirty ? ' · unsaved' : ''}
        </div>
      )}
    </div>
  )
}
