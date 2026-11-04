import { describe, it, expect } from 'vitest'
import clips from '../reducers/clips'
import r from '../redux'
import { getOverlappingClipIds } from '../selectors'
import { TransliterationFlashcardFields } from '../types/Project'
import A from '../types/ActionType'

const fileId = 'fileId'
const fields: TransliterationFlashcardFields = {
  pronunciation: '',
  meaning: 'meaning',
  transcription: 'text',
  notes: '',
}

const newClip = (
  { start, end }: { start: number; end: number },
  id: ClipId
): { clip: Clip; card: Flashcard } => ({
  clip: { clipwaveType: 'Primary', start, end, fileId, id },
  card: { id, type: 'Transliteration', fields, tags: [], cloze: [] },
})

describe('overlapping clips', () => {
  it('finds the clips that overlap the given clip', () => {
    const a = newClip({ start: 1000, end: 2000 }, 'a')
    const b = newClip({ start: 1500, end: 3000 }, 'b')
    const c = newClip({ start: 5000, end: 6000 }, 'c')

    const state = {
      clips: {
        byId: { a: a.clip, b: b.clip, c: c.clip },
        flashcards: { a: a.card, b: b.card, c: c.card },
        idsByMediaFileId: { [fileId]: ['a', 'b', 'c'] },
      },
    } as any

    expect(getOverlappingClipIds(state, 'a')).toEqual(['b'])
    expect(getOverlappingClipIds(state, 'b')).toEqual(['a'])
    expect(getOverlappingClipIds(state, 'c')).toEqual([])
  })

  it('does not consider a clip to overlap itself', () => {
    const a = newClip({ start: 1000, end: 2000 }, 'a')
    const state = {
      clips: {
        byId: { a: a.clip },
        flashcards: { a: a.card },
        idsByMediaFileId: { [fileId]: ['a'] },
      },
    } as any

    expect(getOverlappingClipIds(state, 'a')).toEqual([])
  })

  it('merges overlapping clips into one when merging explicitly', () => {
    const a = newClip({ start: 1000, end: 2000 }, 'a')
    const b = newClip({ start: 1500, end: 3000 }, 'b')

    const state = clips(
      {
        byId: { a: a.clip, b: b.clip },
        flashcards: { a: a.card, b: b.card },
        idsByMediaFileId: { [fileId]: ['a', 'b'] },
      },
      { type: A.initializeApp }
    )

    const merged = clips(
      state,
      r.mergeClips(['a', 'b'], { type: 'Clip', id: 'a' })
    )

    // Only one clip is left, spanning both of the original clips.
    expect(Object.keys(merged.byId)).toEqual(['a'])
    expect(merged.byId.a.start).toBe(1000)
    expect(merged.byId.a.end).toBe(3000)
    expect(merged.idsByMediaFileId[fileId]).toEqual(['a'])
  })
})
