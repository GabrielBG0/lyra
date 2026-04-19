import { useEffect, useRef, useState } from 'react'
import { Icons } from './Icon'

interface SnapshotModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (note: string | null) => void
}

export default function SnapshotModal({ open, onClose, onSubmit }: SnapshotModalProps) {
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setNote('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(note.trim() || null)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0.08 0.006 60 / 0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl border border-border overflow-hidden"
        style={{
          background: 'oklch(0.205 0.012 60)',
          boxShadow: '0 24px 64px oklch(0.06 0.005 60 / 0.8), 0 0 0 1px oklch(0.32 0.012 60 / 0.4)',
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
              <h2
                className="text-primary font-semibold"
                style={{ fontSize: 15, letterSpacing: '-0.01em' }}
              >
                Save Version
              </h2>
              <p className="text-muted mt-0.5" style={{ fontSize: 12 }}>
                Add an optional note to describe this snapshot
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

          <form onSubmit={handleSubmit}>
            <label
              className="block text-secondary mb-1.5"
              style={{ fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              Note
            </label>
            <input
              ref={inputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Added bridge, tweaked chorus…"
              className="w-full rounded-lg px-3 py-2.5 text-primary placeholder:text-faint outline-none transition-all"
              style={{
                background: 'oklch(0.145 0.008 60)',
                border: '1px solid oklch(0.32 0.012 60 / 0.5)',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'oklch(0.72 0.10 55 / 0.6)'
                e.currentTarget.style.boxShadow = '0 0 0 3px oklch(0.72 0.10 55 / 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'oklch(0.32 0.012 60 / 0.5)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-secondary hover:text-primary hover:bg-elev transition-colors border border-border-soft font-ui cursor-pointer bg-transparent"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer border-none"
                style={{
                  fontSize: 13,
                  background: 'oklch(0.72 0.10 55)',
                  color: 'oklch(0.145 0.008 60)',
                }}
              >
                Save Version
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
