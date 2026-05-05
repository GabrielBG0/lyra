import { describe, it, expect } from 'vitest'
import { computeMatches } from '../findMatches'
import type { Section } from '../types'

function makeSection(id: string, content: string): Section {
  return { id, name: id, section_type: 'verse', order: 0, content, created_at: '', updated_at: '' }
}

describe('computeMatches', () => {
  describe('basic matching', () => {
    it('returns empty array for empty query', () => {
      expect(computeMatches('', false, [makeSection('s1', 'hello')])).toEqual([])
    })

    it('returns empty array when no sections', () => {
      expect(computeMatches('hello', false, [])).toEqual([])
    })

    it('finds a single match', () => {
      const matches = computeMatches('hello', false, [makeSection('s1', 'say hello world')])
      expect(matches).toHaveLength(1)
      expect(matches[0]).toMatchObject({ sectionId: 's1', start: 4, end: 9 })
    })

    it('finds multiple matches in one section', () => {
      const matches = computeMatches('ab', false, [makeSection('s1', 'ab cd ab ef ab')])
      expect(matches).toHaveLength(3)
      expect(matches.map(m => m.start)).toEqual([0, 6, 12])
    })

    it('assigns matchIndex within a section', () => {
      const matches = computeMatches('x', false, [makeSection('s1', 'x y x y x')])
      expect(matches.map(m => m.matchIndex)).toEqual([0, 1, 2])
    })

    it('finds matches across multiple sections', () => {
      const sections = [makeSection('s1', 'cat'), makeSection('s2', 'dog'), makeSection('s3', 'cat')]
      const matches = computeMatches('cat', false, sections)
      expect(matches).toHaveLength(2)
      expect(matches[0].sectionId).toBe('s1')
      expect(matches[1].sectionId).toBe('s3')
    })

    it('records sectionIndex correctly', () => {
      const sections = [makeSection('a', 'foo'), makeSection('b', 'bar'), makeSection('c', 'foo')]
      const matches = computeMatches('foo', false, sections)
      expect(matches[0].sectionIndex).toBe(0)
      expect(matches[1].sectionIndex).toBe(2)
    })

    it('resets matchIndex per section', () => {
      const sections = [makeSection('s1', 'x x'), makeSection('s2', 'x x')]
      const matches = computeMatches('x', false, sections)
      expect(matches[0].matchIndex).toBe(0)
      expect(matches[1].matchIndex).toBe(1)
      expect(matches[2].matchIndex).toBe(0)
      expect(matches[3].matchIndex).toBe(1)
    })
  })

  describe('case sensitivity', () => {
    it('is case-insensitive by default (caseSensitive=false)', () => {
      const matches = computeMatches('Hello', false, [makeSection('s1', 'hello HELLO Hello')])
      expect(matches).toHaveLength(3)
    })

    it('respects caseSensitive=true', () => {
      const matches = computeMatches('Hello', true, [makeSection('s1', 'hello HELLO Hello')])
      expect(matches).toHaveLength(1)
      expect(matches[0].start).toBe(12)
    })
  })

  describe('whole word matching', () => {
    it('does not match substrings when wholeWord=true', () => {
      const matches = computeMatches('cat', false, [makeSection('s1', 'catfish wildcat concatenate')], true)
      expect(matches).toHaveLength(0)
    })

    it('matches standalone word', () => {
      const matches = computeMatches('cat', false, [makeSection('s1', 'the cat sat')], true)
      expect(matches).toHaveLength(1)
      expect(matches[0].start).toBe(4)
    })

    it('matches at start of string', () => {
      const matches = computeMatches('hello', false, [makeSection('s1', 'hello world')], true)
      expect(matches).toHaveLength(1)
    })

    it('matches at end of string', () => {
      const matches = computeMatches('world', false, [makeSection('s1', 'hello world')], true)
      expect(matches).toHaveLength(1)
    })

    it('matches punctuation-bounded words', () => {
      const matches = computeMatches('love', false, [makeSection('s1', "I love, you love.")], true)
      expect(matches).toHaveLength(2)
    })

    it('skips when only one boundary fails', () => {
      const matches = computeMatches('love', false, [makeSection('s1', 'loved')], true)
      expect(matches).toHaveLength(0)
    })
  })

  describe('end offset', () => {
    it('sets end = start + query.length', () => {
      const matches = computeMatches('abcd', false, [makeSection('s1', 'xxabcdxx')])
      expect(matches[0].start).toBe(2)
      expect(matches[0].end).toBe(6)
    })
  })
})
