import { describe, it, expect, beforeEach } from 'vitest'
import { useSongStore } from '../songStore'
import type { SongIndexEntry } from '../../lib/types'

function makeEntry(overrides: Partial<SongIndexEntry> = {}): SongIndexEntry {
  return {
    id: 'id1',
    title: 'Song One',
    status: 'draft',
    bpm: null,
    key: null,
    genre: [],
    mood: [],
    language: [],
    file_path: '/vault/song-one.lyr',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const initialState = useSongStore.getState()

beforeEach(() => {
  useSongStore.setState(initialState, true)
})

describe('setSongs', () => {
  it('replaces the song list entirely', () => {
    useSongStore.getState().setSongs([makeEntry(), makeEntry({ id: 'id2', file_path: '/vault/two.lyr' })])
    expect(useSongStore.getState().songs).toHaveLength(2)
  })

  it('clears the list when given an empty array', () => {
    useSongStore.getState().setSongs([makeEntry()])
    useSongStore.getState().setSongs([])
    expect(useSongStore.getState().songs).toHaveLength(0)
  })
})

describe('upsertSong', () => {
  it('inserts a new entry when the path does not exist', () => {
    useSongStore.getState().upsertSong(makeEntry())
    expect(useSongStore.getState().songs).toHaveLength(1)
  })

  it('updates an existing entry matched by file_path', () => {
    useSongStore.getState().upsertSong(makeEntry({ title: 'Original' }))
    useSongStore.getState().upsertSong(makeEntry({ title: 'Updated' }))
    const songs = useSongStore.getState().songs
    expect(songs).toHaveLength(1)
    expect(songs[0].title).toBe('Updated')
  })

  it('does not confuse two entries with different paths', () => {
    useSongStore.getState().upsertSong(makeEntry({ file_path: '/a.lyr' }))
    useSongStore.getState().upsertSong(makeEntry({ file_path: '/b.lyr' }))
    expect(useSongStore.getState().songs).toHaveLength(2)
  })
})

describe('removeSong', () => {
  it('removes a song by file_path', () => {
    useSongStore.getState().setSongs([makeEntry({ file_path: '/a.lyr' }), makeEntry({ file_path: '/b.lyr' })])
    useSongStore.getState().removeSong('/a.lyr')
    const songs = useSongStore.getState().songs
    expect(songs).toHaveLength(1)
    expect(songs[0].file_path).toBe('/b.lyr')
  })

  it('clears selectedSongPath when the selected song is removed', () => {
    useSongStore.getState().setSongs([makeEntry()])
    useSongStore.getState().selectSong('/vault/song-one.lyr')
    useSongStore.getState().removeSong('/vault/song-one.lyr')
    expect(useSongStore.getState().selectedSongPath).toBeNull()
  })

  it('does not change selectedSongPath when a different song is removed', () => {
    useSongStore.getState().setSongs([makeEntry({ file_path: '/a.lyr' }), makeEntry({ file_path: '/b.lyr' })])
    useSongStore.getState().selectSong('/a.lyr')
    useSongStore.getState().removeSong('/b.lyr')
    expect(useSongStore.getState().selectedSongPath).toBe('/a.lyr')
  })

  it('is a no-op for an unknown path', () => {
    useSongStore.getState().setSongs([makeEntry()])
    useSongStore.getState().removeSong('/nonexistent.lyr')
    expect(useSongStore.getState().songs).toHaveLength(1)
  })
})

describe('selectSong', () => {
  it('sets the selected path', () => {
    useSongStore.getState().selectSong('/vault/song-one.lyr')
    expect(useSongStore.getState().selectedSongPath).toBe('/vault/song-one.lyr')
  })

  it('can deselect with null', () => {
    useSongStore.getState().selectSong('/vault/song-one.lyr')
    useSongStore.getState().selectSong(null)
    expect(useSongStore.getState().selectedSongPath).toBeNull()
  })

  it('can switch selection from one path to another', () => {
    useSongStore.getState().selectSong('/a.lyr')
    useSongStore.getState().selectSong('/b.lyr')
    expect(useSongStore.getState().selectedSongPath).toBe('/b.lyr')
  })
})
