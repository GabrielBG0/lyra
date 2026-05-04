import { useEffect, useRef } from 'react'
import { SHORTCUT_CATEGORIES, matchesShortcut } from '../lib/shortcuts'

type Handlers = Record<string, (() => void) | undefined>

export function useKeyboardShortcuts(handlers: Handlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement

      for (const category of SHORTCUT_CATEGORIES) {
        for (const shortcut of category.shortcuts) {
          if (isInput && !shortcut.bypassInputFilter) continue
          if (matchesShortcut(shortcut, e)) {
            e.preventDefault()
            handlersRef.current[shortcut.action]?.()
            return
          }
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
