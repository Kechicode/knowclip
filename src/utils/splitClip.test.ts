import { describe, expect, it } from 'vitest'
import { MIN_CLIP_LENGTH_MS } from './clipBoundary'
import { getSplitPoint, SPLIT_CLIP_REJECTED_MESSAGE } from './splitClip'

const clip = { start: 1000, end: 4000 }

describe('getSplitPoint', () => {
  it('accepts a playhead that leaves the minimum length on both sides', () => {
    expect(getSplitPoint(clip, 1000 + MIN_CLIP_LENGTH_MS)).toEqual({
      ok: true,
      splitAt: 1100,
    })
    expect(getSplitPoint(clip, 4000 - MIN_CLIP_LENGTH_MS)).toEqual({
      ok: true,
      splitAt: 3900,
    })
    expect(getSplitPoint(clip, 2500)).toEqual({ ok: true, splitAt: 2500 })
  })

  it('rejects a playhead outside the card or closer than the minimum length', () => {
    for (const playheadMs of [0, 1000, 1099, 3901, 4000, 5000]) {
      expect(getSplitPoint(clip, playheadMs)).toEqual({
        ok: false,
        message: SPLIT_CLIP_REJECTED_MESSAGE,
      })
    }
  })

  it('rejects a clip that is too short to split', () => {
    expect(
      getSplitPoint(
        { start: 0, end: MIN_CLIP_LENGTH_MS * 2 - 1 },
        MIN_CLIP_LENGTH_MS
      ).ok
    ).toBe(false)
  })
})