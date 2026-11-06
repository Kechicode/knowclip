import clips from './clips'
import r from '../redux'
import { TransliterationFlashcardFields } from '../types/Project'
import { describe, it, expect } from 'vitest'
import A from '../types/ActionType'

const newClip = (
  { start, end }: { start: number; end: number },
  fileId: MediaFileId,
  id: ClipId,
  fields: TransliterationFlashcardFields
): { clip: Clip; card: Flashcard } => ({
  clip: {
    clipwaveType: 'Primary',
    start,
    end,
    fileId,
    id,
  },
  card: {
    id,
    type: 'Transliteration',
    fields: fields,
    tags: [],
    cloze: [],
  },
})

describe('clips reducer', () => {
  const fileId = 'fileId'
  const transliterationFields = {
    pronunciation: 'a',
    meaning: 'aaa',
    transcription: 'asdf',
    notes: 'hey',
  }
  const a = newClip({ start: 1, end: 1.5 }, fileId, 'a', transliterationFields)
  const b = newClip({ start: 2, end: 2.5 }, fileId, 'b', transliterationFields)
  const c = newClip({ start: 3, end: 3.5 }, fileId, 'c', transliterationFields)
  const oldState = clips(
    {
      byId: {
        a: a.clip,
        b: b.clip,
        c: c.clip,
      },
      flashcards: {
        a: a.card,
        b: b.card,
        c: c.card,
      },
      idsByMediaFileId: {
        [fileId]: ['a', 'b', 'c'],
      },
    },
    { type: A.initializeApp }
  )

  it('adds to byId and idsByMediaFileId during addClip', () => {
    const { clip, card } = newClip(
      { start: 2.75, end: 3 },
      fileId,
      'b-c',
      transliterationFields
    )
    const action = r.addClip(clip, card)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'b', 'b-c', 'c'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByMediaFileId during addClip', () => {
    const { clip, card } = newClip(
      { start: 4, end: 4.5 },
      fileId,
      'd',
      transliterationFields
    )
    const action = r.addClip(clip, card)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'b', 'c', 'd'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByMediaFileId during addClips', () => {
    const bC1 = newClip(
      { start: 2.75, end: 2.8 },
      fileId,
      'b-c1',
      transliterationFields
    )
    const bC2 = newClip(
      { start: 2.85, end: 3 },
      fileId,
      'b-c2',
      transliterationFields
    )

    const newClips = [bC1.clip, bC2.clip]
    const newCards = [bC1.card, bC2.card]
    const action = r.addClips(newClips, newCards, fileId)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual([
      'a',
      'b',
      'b-c1',
      'b-c2',
      'c',
    ])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      'b-c1': bC1.clip,
      'b-c2': bC2.clip,
    })
    expect(newState.flashcards).toEqual({
      ...oldState.flashcards,
      'b-c1': bC1.card,
      'b-c2': bC2.card,
    })
  })

  it('merges clips', () => {
    const mergedFields = {
      pronunciation: 'a\na',
      meaning: 'aaa\naaa',
      transcription: 'asdf\nasdf',
      notes: 'hey\nhey',
    }
    const a = newClip(
      { start: 1, end: 1.5 },
      fileId,
      'a',
      transliterationFields
    )
    const b = newClip(
      { start: 2, end: 2.5 },
      fileId,
      'b',
      transliterationFields
    )
    const c = newClip(
      { start: 3, end: 3.5 },
      fileId,
      'c',
      transliterationFields
    )
    const state = clips(
      {
        byId: {
          a: a.clip,
          b: b.clip,
          c: c.clip,
        },
        flashcards: {
          a: a.card,
          b: b.card,
          c: c.card,
        },
        idsByMediaFileId: {
          [fileId]: ['a', 'b', 'c'],
        },
      },
      { type: A.initializeApp }
    )
    const mergeAction = r.mergeClips(['a', 'b'], {
      type: 'Clip',
      id: 'a',
    })

    const expectedA = newClip({ start: 1, end: 2.5 }, fileId, 'a', mergedFields)
    const expectedC = newClip(
      { start: 3, end: 3.5 },
      fileId,
      'c',
      transliterationFields
    )
    expect(clips(state, mergeAction)).toEqual(
      clips(
        {
          byId: { a: expectedA.clip, c: expectedC.clip },
          flashcards: { a: expectedA.card, c: expectedC.card },
          idsByMediaFileId: {
            [fileId]: ['a', 'c'],
          },
        },
        { type: A.initializeApp }
      )
    )
  })

  it('merges clips with cloze fields', () => {
    const a = newClip({ start: 1, end: 1.5 }, fileId, 'a', {
      transcription: 'The quick brown fox',
      pronunciation: '',
      meaning: '',
      notes: '',
    })
    const b = newClip({ start: 2, end: 2.5 }, fileId, 'b', {
      transcription: 'jumps over the lazy dog',
      pronunciation: '',
      meaning: '',
      notes: '',
    })
    const getWordRange = (text: string, word: string) => {
      const start = text.indexOf(word)
      return {
        start,
        end: start + word.length,
      }
    }
    a.card.cloze = [
      { ranges: [getWordRange(a.card.fields.transcription, 'quick')] },
    ]
    b.card.cloze = [
      {
        ranges: [
          getWordRange(b.card.fields.transcription, 'jumps'),
          getWordRange(b.card.fields.transcription, 'over'),
        ],
      },
      { ranges: [getWordRange(b.card.fields.transcription, 'dog')] },
    ]

    const state = clips(
      {
        byId: {
          a: a.clip,
          b: b.clip,
        },
        flashcards: {
          a: a.card,
          b: b.card,
        },
        idsByMediaFileId: {
          [fileId]: ['a', 'b'],
        },
      },
      { type: A.initializeApp }
    )
    const mergeAction = r.mergeClips(['a', 'b'], {
      type: 'Clip',
      id: 'a',
    })

    const expectedMergeResult = newClip({ start: 1, end: 2.5 }, fileId, 'a', {
      transcription: 'The quick brown fox\njumps over the lazy dog',
      pronunciation: '',
      meaning: '',
      notes: '',
    })
    const { fields } = expectedMergeResult.card
    expectedMergeResult.card.cloze = [
      { ranges: [getWordRange(fields.transcription, 'quick')] },
      {
        ranges: [
          getWordRange(fields.transcription, 'jumps'),
          getWordRange(fields.transcription, 'over'),
        ],
      },
      {
        ranges: [getWordRange(fields.transcription, 'dog')],
      },
    ]

    expect(clips(state, mergeAction)).toEqual(
      clips(
        {
          byId: { a: expectedMergeResult.clip },
          flashcards: { a: expectedMergeResult.card },
          idsByMediaFileId: {
            [fileId]: ['a'],
          },
        },
        { type: A.initializeApp }
      )
    )
  })

  it('does not merge clips when moving a clip over another one', () => {
    // "a" runs from 1 to 1.5, "b" from 2 to 2.5. Moving "b" by -1 puts it
    // right on top of "a".
    const state = clips(
      {
        byId: { a: a.clip, b: b.clip },
        flashcards: { a: a.card, b: b.card },
        idsByMediaFileId: { [fileId]: ['a', 'b'] },
      },
      { type: A.initializeApp }
    )

    const newState = clips(state, r.moveClip('b', -1, ['a'], [] as any))

    // Both clips survive, and "b" has moved.
    expect(Object.keys(newState.byId).sort()).toEqual(['a', 'b'])
    expect(newState.byId.b.start).toBe(1)
    expect(newState.byId.b.end).toBe(1.5)
    expect(newState.byId.a.start).toBe(1)
    expect(newState.byId.a.end).toBe(1.5)
  })

  it('does not merge clips when stretching a clip over another one', () => {
    const state = clips(
      {
        byId: { a: a.clip, b: b.clip },
        flashcards: { a: a.card, b: b.card },
        idsByMediaFileId: { [fileId]: ['a', 'b'] },
      },
      { type: A.initializeApp }
    )

    const newState = clips(
      state,
      r.stretchClip(
        { id: 'a', start: 1, end: 2.5 },
        [b.clip],
        { id: 'a', start: 1, end: 1.5 },
        [],
        [],
        [] as any
      )
    )

    // "b" is untouched, and "a" keeps its own (stretched) boundaries.
    expect(Object.keys(newState.byId).sort()).toEqual(['a', 'b'])
    expect(newState.byId.a.start).toBe(1)
    expect(newState.byId.a.end).toBe(2.5)
    expect(newState.byId.b.start).toBe(2)
    expect(newState.byId.b.end).toBe(2.5)
  })

  it('resizes a clip without merging it with the clips it overlaps', () => {
    const state = clips(
      {
        byId: { a: a.clip, b: b.clip },
        flashcards: { a: a.card, b: b.card },
        idsByMediaFileId: { [fileId]: ['a', 'b'] },
      },
      { type: A.initializeApp }
    )

    // Resizing "a" so that it covers "b" keeps both clips around.
    const newState = clips(state, r.resizeClip('a', 1, 2.5))

    expect(Object.keys(newState.byId).sort()).toEqual(['a', 'b'])
    expect(newState.byId.a.start).toBe(1)
    expect(newState.byId.a.end).toBe(2.5)
    expect(newState.byId.b.start).toBe(2)
    expect(newState.byId.b.end).toBe(2.5)
  })

  it('ignores a resize of a clip that does not exist', () => {
    const newState = clips(oldState, r.resizeClip('nope', 0, 1))
    expect(newState.byId).toEqual(oldState.byId)
  })

  it('splits a clip at the given time and copies tags and other fields', () => {
    const source = newClip({ start: 1000, end: 4000 }, fileId, 'a', {
      transcription: 'hello world',
      pronunciation: 'heh-loh',
      meaning: 'a greeting',
      notes: 'note',
    })
    source.card.tags = ['greeting']
    source.card.image = { type: 'VideoStillImage', id: 'a' }
    source.card.cloze = [{ ranges: [{ start: 0, end: 5 }] }]
    source.clip.linkedSubtitlesChunk = 3

    const state = clips(
      {
        byId: { a: source.clip },
        flashcards: { a: source.card },
        idsByMediaFileId: { [fileId]: ['a'] },
      },
      { type: A.initializeApp }
    )

    const newState = clips(
      state,
      r.splitClip({
        clipId: 'a',
        newClipId: 'a2',
        splitAt: 2500,
        leftTranscription: 'hello',
        rightTranscription: 'world',
      })
    )

    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'a2'])
    expect(newState.byId.a).toMatchObject({
      start: 1000,
      end: 2500,
      linkedSubtitlesChunk: 3,
    })
    expect(newState.byId.a2).toEqual({
      id: 'a2',
      start: 2500,
      end: 4000,
      fileId,
      clipwaveType: 'Primary',
    })
    expect(newState.flashcards.a.fields).toEqual({
      transcription: 'hello',
      pronunciation: 'heh-loh',
      meaning: 'a greeting',
      notes: 'note',
    })
    expect(newState.flashcards.a.cloze).toEqual([])
    expect(newState.flashcards.a.image).toEqual({
      type: 'VideoStillImage',
      id: 'a',
    })
    expect(newState.flashcards.a2.fields).toEqual({
      transcription: 'world',
      pronunciation: 'heh-loh',
      meaning: 'a greeting',
      notes: 'note',
    })
    expect(newState.flashcards.a2.tags).toEqual(['greeting'])
    expect(newState.flashcards.a2.tags).not.toBe(source.card.tags)
    expect(newState.flashcards.a2.image).toBeNull()
    expect(newState.flashcards.a2.cloze).toEqual([])
  })

  it('keeps cloze deletions when the first half of the transcription is unchanged', () => {
    const source = newClip({ start: 1000, end: 4000 }, fileId, 'a', {
      transcription: 'hello world',
      pronunciation: '',
      meaning: '',
      notes: '',
    })
    const cloze = [{ ranges: [{ start: 0, end: 5 }] }]
    source.card.cloze = cloze

    const state = clips(
      {
        byId: { a: source.clip },
        flashcards: { a: source.card },
        idsByMediaFileId: { [fileId]: ['a'] },
      },
      { type: A.initializeApp }
    )

    const newState = clips(
      state,
      r.splitClip({
        clipId: 'a',
        newClipId: 'a2',
        splitAt: 2000,
        leftTranscription: 'hello world',
        rightTranscription: '',
      })
    )

    expect(newState.flashcards.a.cloze).toBe(cloze)
    expect(newState.flashcards.a2.cloze).toEqual([])
  })
})
