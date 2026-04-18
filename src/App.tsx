import { useEffect, useState } from 'react'
import { tauriApi } from './lib/tauri'
import { useVault } from './hooks/useVault'
import { useAutosave } from './hooks/useAutosave'
import AppShell from './components/layout/AppShell'
import VaultSetup from './components/vault/VaultSetup'

export default function App() {
  const [vaultPath, setVaultPath] = useState<string | null | undefined>(undefined)
  const { loadSongs } = useVault()
  useAutosave()

  useEffect(() => {
    tauriApi.config.get().then(cfg => {
      setVaultPath(cfg.vault_path)
      if (cfg.vault_path) loadSongs()
    }).catch(() => setVaultPath(null))
  }, [])

  if (vaultPath === undefined) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="text-faint text-sm">Loading…</div>
      </div>
    )
  }

  if (!vaultPath) {
    return (
      <VaultSetup
        onDone={(path) => {
          tauriApi.config.set({ vault_path: path, last_opened_song: null })
            .then(() => {
              setVaultPath(path)
              loadSongs()
            })
            .catch((err) => console.error('Failed to save config:', err))
        }}
      />
    )
  }

  return <AppShell vaultPath={vaultPath} />
}
