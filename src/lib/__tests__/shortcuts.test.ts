import { describe, it, expect } from 'vitest'
import { matchesShortcut, SHORTCUT_CATEGORIES } from '../shortcuts'
import type { ShortcutDef } from '../shortcuts'

function makeEvent(overrides: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    key: '',
    ...overrides,
  })
}

const MOD_N: ShortcutDef = { label: 'New Song', action: 'new-song', keys: ['mod', 'N'] }
const MOD_SHIFT_S: ShortcutDef = { label: 'Save Take', action: 'save-version', keys: ['mod', 'shift', 'S'] }
const MOD_COMMA: ShortcutDef = { label: 'Preferences', action: 'preferences', keys: ['mod', ','] }

describe('matchesShortcut', () => {
  describe('mod+key combos', () => {
    it('matches when ctrlKey is pressed', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ ctrlKey: true, key: 'n' }))).toBe(true)
    })

    it('matches when metaKey is pressed', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ metaKey: true, key: 'n' }))).toBe(true)
    })

    it('does not match without mod key', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ key: 'n' }))).toBe(false)
    })

    it('does not match wrong key', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ ctrlKey: true, key: 'm' }))).toBe(false)
    })

    it('does not match when shift is unexpectedly pressed', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ ctrlKey: true, shiftKey: true, key: 'n' }))).toBe(false)
    })
  })

  describe('mod+shift+key combos', () => {
    it('matches with both mod and shift', () => {
      expect(matchesShortcut(MOD_SHIFT_S, makeEvent({ ctrlKey: true, shiftKey: true, key: 's' }))).toBe(true)
    })

    it('does not match without shift', () => {
      expect(matchesShortcut(MOD_SHIFT_S, makeEvent({ ctrlKey: true, key: 's' }))).toBe(false)
    })

    it('does not match without mod', () => {
      expect(matchesShortcut(MOD_SHIFT_S, makeEvent({ shiftKey: true, key: 's' }))).toBe(false)
    })
  })

  describe('key case insensitivity', () => {
    it('matches uppercase event key against lowercase definition', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ ctrlKey: true, key: 'N' }))).toBe(true)
    })

    it('matches lowercase event key against uppercase definition', () => {
      expect(matchesShortcut(MOD_N, makeEvent({ metaKey: true, key: 'n' }))).toBe(true)
    })
  })

  describe('non-alpha keys', () => {
    it('matches comma key', () => {
      expect(matchesShortcut(MOD_COMMA, makeEvent({ ctrlKey: true, key: ',' }))).toBe(true)
    })

    it('does not match wrong non-alpha key', () => {
      expect(matchesShortcut(MOD_COMMA, makeEvent({ ctrlKey: true, key: '.' }))).toBe(false)
    })
  })

  describe('shortcut without main key', () => {
    it('returns false for a def with only modifiers and no main key', () => {
      const noMainKey: ShortcutDef = { label: 'Empty', action: 'empty', keys: ['mod', 'shift'] }
      expect(matchesShortcut(noMainKey, makeEvent({ ctrlKey: true, shiftKey: true }))).toBe(false)
    })
  })
})

describe('SHORTCUT_CATEGORIES', () => {
  it('contains at least one category', () => {
    expect(SHORTCUT_CATEGORIES.length).toBeGreaterThan(0)
  })

  it('every shortcut has a non-empty keys array', () => {
    for (const cat of SHORTCUT_CATEGORIES) {
      for (const s of cat.shortcuts) {
        expect(s.keys.length).toBeGreaterThan(0)
      }
    }
  })

  it('every shortcut has at least one non-modifier key', () => {
    for (const cat of SHORTCUT_CATEGORIES) {
      for (const s of cat.shortcuts) {
        const mainKey = s.keys.find(k => k !== 'mod' && k !== 'shift')
        expect(mainKey, `${s.action} has no main key`).toBeDefined()
      }
    }
  })

  it('no two shortcuts share the same key combo', () => {
    const seen = new Set<string>()
    for (const cat of SHORTCUT_CATEGORIES) {
      for (const s of cat.shortcuts) {
        const hasMod = s.keys.includes('mod')
        const hasShift = s.keys.includes('shift')
        const mainKey = s.keys.find(k => k !== 'mod' && k !== 'shift')!
        const combo = `${hasMod ? 'mod+' : ''}${hasShift ? 'shift+' : ''}${mainKey.toLowerCase()}`
        expect(seen.has(combo), `Duplicate shortcut: ${combo} (${s.action})`).toBe(false)
        seen.add(combo)
      }
    }
  })
})
