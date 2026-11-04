import { getClozeSegments } from './clozePreview'
import { describe, it, expect } from 'vitest'

describe('getClozeSegments', () => {
  it('returns the whole text when there are no cloze deletions', () => {
    expect(getClozeSegments('hello', [], 0)).toEqual([
      { text: 'hello', clozeIndex: null, isHidden: false },
    ])
  })

  it('splits the text around a deletion', () => {
    const segments = getClozeSegments(
      'hello world',
      [{ ranges: [{ start: 6, end: 11 }] }],
      0
    )

    expect(segments).toEqual([
      { text: 'hello ', clozeIndex: null, isHidden: false },
      { text: 'world', clozeIndex: 1, isHidden: true },
    ])
  })

  it('hides only the deletion being previewed', () => {
    const segments = getClozeSegments(
      'one two three',
      [{ ranges: [{ start: 0, end: 3 }] }, { ranges: [{ start: 8, end: 13 }] }],
      1
    )

    expect(segments).toEqual([
      { text: 'one', clozeIndex: 1, isHidden: false },
      { text: ' two ', clozeIndex: null, isHidden: false },
      { text: 'three', clozeIndex: 2, isHidden: true },
    ])
  })

  it('handles a deletion at the start of the text', () => {
    const segments = getClozeSegments(
      'hello world',
      [{ ranges: [{ start: 0, end: 5 }] }],
      0
    )

    expect(segments).toEqual([
      { text: 'hello', clozeIndex: 1, isHidden: true },
      { text: ' world', clozeIndex: null, isHidden: false },
    ])
  })

  it('handles a deletion at the end of the text', () => {
    const segments = getClozeSegments(
      'hello world',
      [{ ranges: [{ start: 6, end: 11 }] }],
      0
    )

    expect(segments).toEqual([
      { text: 'hello ', clozeIndex: null, isHidden: false },
      { text: 'world', clozeIndex: 1, isHidden: true },
    ])
  })

  it('handles multiple ranges in one deletion', () => {
    const segments = getClozeSegments(
      'a b c',
      [
        {
          ranges: [
            { start: 0, end: 1 },
            { start: 4, end: 5 },
          ],
        },
      ],
      0
    )

    expect(segments).toEqual([
      { text: 'a', clozeIndex: 1, isHidden: true },
      { text: ' b ', clozeIndex: null, isHidden: false },
      { text: 'c', clozeIndex: 1, isHidden: true },
    ])
  })

  it('handles an empty text', () => {
    expect(getClozeSegments('', [], 0)).toEqual([
      { text: '', clozeIndex: null, isHidden: false },
    ])
  })
})
