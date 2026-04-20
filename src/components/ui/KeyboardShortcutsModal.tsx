import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icons } from './Icon'
import { SHORTCUT_CATEGORIES } from '../../lib/shortcuts'

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const isMac = navigator.platform.startsWith('Mac') || navigator.userAgent.includes('Mac')

const MODAL_WIDTHS = ['24rem', '46rem', '68rem'] // 1, 2, 3 columns
const MAX_CONTENT_RATIO = 0.72 // switch columns before reaching 72% of viewport height
const MAX_COLUMNS = 3

function resolveKey(token: string): string {
  if (token === 'mod')   return isMac ? '⌘' : 'Ctrl'
  if (token === 'shift') return '⇧'
  return token
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-medium text-secondary border border-border-soft"
      style={{ background: 'oklch(0.18 0.01 60)', minWidth: 22, fontFamily: 'inherit' }}
    >
      {children}
    </kbd>
  )
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Measure natural single-column height before first paint and compute column count.
  useLayoutEffect(() => {
    if (!open) { setColumns(1); return }
    const el = contentRef.current
    if (!el) return

    const prev = el.style.columnCount
    el.style.columnCount = '1'
    const naturalH = el.scrollHeight
    el.style.columnCount = prev

    const maxH = window.innerHeight * MAX_CONTENT_RATIO
    const needed = Math.ceil(naturalH / maxH)
    setColumns(Math.min(Math.max(needed, 1), MAX_COLUMNS))
  }, [open])

  if (!open) return null

  const maxHeight = `${MAX_CONTENT_RATIO * 100}vh`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0.08 0.006 60 / 0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full mx-4 rounded-xl border border-border overflow-hidden"
        style={{
          maxWidth: MODAL_WIDTHS[columns - 1],
          background: 'oklch(0.205 0.012 60)',
          boxShadow: '0 24px 64px oklch(0.06 0.005 60 / 0.8), 0 0 0 1px oklch(0.32 0.012 60 / 0.4)',
          transition: 'max-width 180ms ease',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.72 0.10 55 / 0.6), transparent)' }}
        />

        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-primary font-semibold" style={{ fontSize: 15, letterSpacing: '-0.01em' }}>
                Keyboard Shortcuts
              </h2>
              <p className="text-muted mt-0.5" style={{ fontSize: 12 }}>
                {isMac ? 'macOS shortcuts' : 'Windows / Linux shortcuts'}
              </p>
            </div>
            <button
              className="w-7 h-7 rounded flex items-center justify-center text-faint hover:text-secondary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer"
              onClick={onClose}
              aria-label="Close"
            >
              <Icons.X size={15} />
            </button>
          </div>

          <div
            ref={contentRef}
            style={{
              columns,
              columnGap: '2.5rem',
              maxHeight,
              overflowY: 'auto',
            }}
          >
            {SHORTCUT_CATEGORIES.map((category) => (
              <div key={category.title} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
                <div
                  className="text-faint mb-2"
                  style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  {category.title}
                </div>
                <div className="flex flex-col gap-1">
                  {category.shortcuts.map(({ label, keys }) => (
                    <div key={label} className="flex items-center justify-between py-1">
                      <span className="text-secondary" style={{ fontSize: 13 }}>{label}</span>
                      <div className="flex items-center gap-1">
                        {keys.map((k) => <Kbd key={k}>{resolveKey(k)}</Kbd>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
