import { useState, useEffect } from 'react'
import { tauriApi } from '../../lib/tauri'
import type { AppConfig } from '../../lib/types'
import { useEditorStore } from '../../stores/editorStore'
import { useSongStore } from '../../stores/songStore'
import { useUIStore } from '../../stores/uiStore'
import { Icons } from './Icon'

interface PreferencesModalProps {
  open: boolean
  onClose: () => void
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-none cursor-pointer transition-colors"
      style={{ background: checked ? 'var(--color-accent)' : 'oklch(0.32 0.012 60 / 0.5)' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
        style={{
          transform: checked ? 'translateX(18px)' : 'translateX(2px)',
          boxShadow: '0 1px 3px oklch(0 0 0 / 0.3)',
        }}
      />
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-muted font-medium uppercase tracking-wide mb-2"
      style={{ fontSize: 10.5 }}
    >
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div className="text-secondary" style={{ fontSize: 13 }}>{label}</div>
        {description && (
          <div className="text-muted mt-0.5 leading-snug" style={{ fontSize: 11.5 }}>{description}</div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [nukeConfirming, setNukeConfirming] = useState(false)
  const [nuking, setNuking] = useState(false)
  const [resetConfirming, setResetConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { setNudgeDismissed } = useUIStore()

  useEffect(() => {
    if (!open) return
    setNukeConfirming(false)
    setResetConfirming(false)
    tauriApi.config.get().then(setConfig)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleToggle = async (field: keyof Pick<AppConfig, 'debug_mode' | 'nudge_dismissed'>, value: boolean) => {
    if (!config) return
    const updated = { ...config, [field]: value }
    setConfig(updated)
    if (field === 'nudge_dismissed') setNudgeDismissed(value)
    await tauriApi.config.set(updated)
  }

  const handleNuke = async () => {
    setNuking(true)
    try {
      await tauriApi.debug.nukeVault()
      useSongStore.getState().setSongs([])
      useSongStore.getState().selectSong(null)
      useEditorStore.getState().closeSong()
      onClose()
    } finally {
      setNuking(false)
      setNukeConfirming(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await tauriApi.debug.resetApp()
      window.location.reload()
    } finally {
      setResetting(false)
      setResetConfirming(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0.08 0.006 60 / 0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full mx-4 rounded-xl border border-border overflow-hidden"
        style={{
          maxWidth: '26rem',
          background: 'oklch(0.205 0.012 60)',
          boxShadow: '0 24px 64px oklch(0.06 0.005 60 / 0.8), 0 0 0 1px oklch(0.32 0.012 60 / 0.4)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.72 0.10 55 / 0.6), transparent)' }}
        />

        <button
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded flex items-center justify-center text-faint hover:text-secondary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <Icons.X size={15} />
        </button>

        <div className="px-6 pt-6 pb-6">
          <h2
            className="text-primary font-semibold mb-5"
            style={{ fontSize: 15, letterSpacing: '-0.01em' }}
          >
            Preferences
          </h2>

          {config ? (
            <div className="space-y-5">
              {/* General */}
              <div>
                <SectionLabel>General</SectionLabel>
                <div
                  className="rounded-lg border border-border-soft px-3"
                  style={{ background: 'oklch(0.175 0.01 60)' }}
                >
                  <ToggleRow
                    label="Hide save take reminder"
                    description="Don't show the nudge to save a take while writing"
                    checked={config.nudge_dismissed}
                    onChange={(v) => handleToggle('nudge_dismissed', v)}
                  />
                </div>
              </div>

              {/* Developer */}
              <div>
                <SectionLabel>Developer</SectionLabel>
                <div
                  className="rounded-lg border border-border-soft px-3"
                  style={{ background: 'oklch(0.175 0.01 60)' }}
                >
                  <ToggleRow
                    label="Debug mode"
                    description="Show developer tools and commands"
                    checked={config.debug_mode}
                    onChange={(v) => handleToggle('debug_mode', v)}
                  />
                </div>

                {config.debug_mode && (
                  <div
                    className="mt-3 rounded-lg border px-3 py-3"
                    style={{
                      background: 'oklch(0.55 0.18 25 / 0.06)',
                      borderColor: 'oklch(0.55 0.18 25 / 0.25)',
                    }}
                  >
                    <div
                      className="font-semibold uppercase tracking-wide mb-2.5"
                      style={{ fontSize: 10.5, color: 'oklch(0.65 0.18 25)' }}
                    >
                      Danger Zone
                    </div>

                    {!nukeConfirming ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-secondary" style={{ fontSize: 13 }}>Nuke Vault</div>
                          <div className="text-muted mt-0.5 leading-snug" style={{ fontSize: 11.5 }}>
                            Delete all songs and reset the vault index
                          </div>
                        </div>
                        <button
                          onClick={() => setNukeConfirming(true)}
                          className="shrink-0 px-3 py-1.5 rounded-lg font-semibold border-none cursor-pointer transition-all hover:brightness-110"
                          style={{
                            fontSize: 12.5,
                            background: 'var(--color-danger)',
                            color: 'oklch(0.96 0.01 60)',
                          }}
                        >
                          Nuke Vault
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-secondary leading-snug mb-3" style={{ fontSize: 12.5 }}>
                          This will permanently delete all songs and reset the vault index. This cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setNukeConfirming(false)}
                            disabled={nuking}
                            className="px-3 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elev transition-colors border border-border-soft bg-transparent cursor-pointer disabled:opacity-40"
                            style={{ fontSize: 12.5 }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleNuke}
                            disabled={nuking}
                            className="px-3 py-1.5 rounded-lg font-semibold border-none cursor-pointer transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              fontSize: 12.5,
                              background: 'var(--color-danger)',
                              color: 'oklch(0.96 0.01 60)',
                            }}
                          >
                            {nuking ? 'Deleting…' : 'Delete everything'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid oklch(0.55 0.18 25 / 0.2)' }}>
                      {!resetConfirming ? (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-secondary" style={{ fontSize: 13 }}>Reset App</div>
                            <div className="text-muted mt-0.5 leading-snug" style={{ fontSize: 11.5 }}>
                              Clear vault path and return to first-launch state
                            </div>
                          </div>
                          <button
                            onClick={() => setResetConfirming(true)}
                            className="shrink-0 px-3 py-1.5 rounded-lg font-semibold border-none cursor-pointer transition-all hover:brightness-110"
                            style={{
                              fontSize: 12.5,
                              background: 'var(--color-danger)',
                              color: 'oklch(0.96 0.01 60)',
                            }}
                          >
                            Reset App
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-secondary leading-snug mb-3" style={{ fontSize: 12.5 }}>
                            This will clear your vault path and all app settings, returning Lyra to its first-launch state. Your song files will not be deleted.
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setResetConfirming(false)}
                              disabled={resetting}
                              className="px-3 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elev transition-colors border border-border-soft bg-transparent cursor-pointer disabled:opacity-40"
                              style={{ fontSize: 12.5 }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleReset}
                              disabled={resetting}
                              className="px-3 py-1.5 rounded-lg font-semibold border-none cursor-pointer transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{
                                fontSize: 12.5,
                                background: 'var(--color-danger)',
                                color: 'oklch(0.96 0.01 60)',
                              }}
                            >
                              {resetting ? 'Resetting…' : 'Reset everything'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-faint text-sm py-4 text-center">Loading…</div>
          )}
        </div>
      </div>
    </div>
  )
}
