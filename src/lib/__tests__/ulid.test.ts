import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateUlid } from '../ulid'

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/

describe('generateUlid', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('format', () => {
    it('returns a 26-character string', () => {
      expect(generateUlid()).toHaveLength(26)
    })

    it('uses only valid Crockford base32 characters', () => {
      expect(generateUlid()).toMatch(ULID_REGEX)
    })

    it('produces valid format across many calls', () => {
      for (let i = 0; i < 50; i++) {
        expect(generateUlid()).toMatch(ULID_REGEX)
      }
    })
  })

  describe('uniqueness', () => {
    it('generates distinct values on consecutive calls', () => {
      const ids = Array.from({ length: 100 }, () => generateUlid())
      const unique = new Set(ids)
      expect(unique.size).toBe(100)
    })

    it('generates distinct values at the same timestamp', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
      const a = generateUlid()
      const b = generateUlid()
      expect(a).not.toBe(b)
    })
  })

  describe('sortability', () => {
    it('ULIDs at a later time sort after earlier ones', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
      const early = generateUlid()
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
      const late = generateUlid()
      expect(early < late).toBe(true)
    })

    it('time prefix encodes monotonically', () => {
      vi.useFakeTimers()
      const ids: string[] = []
      for (let ms = 0; ms < 10; ms++) {
        vi.setSystemTime(ms)
        ids.push(generateUlid())
      }
      // The time prefix (first 10 chars) should be non-decreasing
      const prefixes = ids.map(id => id.slice(0, 10))
      for (let i = 1; i < prefixes.length; i++) {
        expect(prefixes[i] >= prefixes[i - 1]).toBe(true)
      }
    })
  })
})
