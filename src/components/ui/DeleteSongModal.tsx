import { useEffect } from 'react'
import { Icons } from './Icon'

interface DeleteSongModalProps {
  open: boolean
  songTitle: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DeleteSongModal({ open, songTitle, onClose, onConfirm }: DeleteSongModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0.08 0.006 60 / 0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-xl border border-border overflow-hidden"
        style={{
          background: 'oklch(0.205 0.012 60)',
          boxShadow: '0 24px 64px oklch(0.06 0.005 60 / 0.8), 0 0 0 1px oklch(0.32 0.012 60 / 0.4)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.55 0.18 25 / 0.6), transparent)' }}
        />

        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-3.5 mb-5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'oklch(0.55 0.18 25 / 0.15)', border: '1px solid oklch(0.55 0.18 25 / 0.25)' }}
            >
              <Icons.Trash size={16} style={{ color: 'oklch(0.65 0.18 25)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-primary font-semibold"
                style={{ fontSize: 15, letterSpacing: '-0.01em' }}
              >
                Delete song?
              </h2>
              <p className="text-muted mt-1 leading-snug" style={{ fontSize: 12.5 }}>
                <span
                  className="font-medium"
                  style={{ color: 'oklch(0.82 0.04 60)' }}
                >
                  "{songTitle}"
                </span>{' '}
                will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <button
              className="w-7 h-7 rounded flex items-center justify-center text-faint hover:text-secondary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer shrink-0"
              onClick={onClose}
              aria-label="Close"
            >
              <Icons.X size={15} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-secondary hover:text-primary hover:bg-elev transition-colors border border-border-soft font-ui cursor-pointer bg-transparent"
              style={{ fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer border-none"
              style={{
                fontSize: 13,
                background: 'oklch(0.55 0.18 25)',
                color: 'oklch(0.96 0.01 60)',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
