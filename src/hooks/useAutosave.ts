// Debounced autosave: silently persists when the song is dirty and
// no edits have been made for 30 seconds.

import { useEffect, useRef } from 'react'
import { tauriApi } from '../lib/tauri'
import { useEditorStore } from '../stores/editorStore'

const AUTOSAVE_DELAY_MS = 30_000

export function useAutosave() {
  const { isDirty, filePath, metadata, sections, markClean } = useEditorStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty || !filePath || !metadata) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      // Re-read state at fire time to ensure we have the latest values.
      const state = useEditorStore.getState()
      if (!state.isDirty || !state.filePath || !state.metadata) return

      await tauriApi.song.save(state.filePath, state.metadata, state.sections)
      state.markClean()
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, filePath, metadata, sections, markClean])
}
