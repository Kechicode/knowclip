import { describe, expect, it } from 'vitest'
import {
  PLAYHEAD_GRAB_PX,
  clampPlayheadMs,
  isWithinPlayheadGrab,
} from './waveformCoordinates'

const pixelsPerSecond = 50
const playheadMs = 10_000
const pxToMs = (px: number) => (px / pixelsPerSecond) * 1000

describe('isWithinPlayheadGrab', () => {
  it('includes a pointer exactly 8px from the playhead', () => {
    expect(
      isWithinPlayheadGrab(
        playheadMs + pxToMs(PLAYHEAD_GRAB_PX),
        playheadMs,
        pixelsPerSecond
      )
    ).toBe(true)
    expect(
      isWithinPlayheadGrab(
        playheadMs - pxToMs(PLAYHEAD_GRAB_PX),
        playheadMs,
        pixelsPerSecond
      )
    ).toBe(true)
  })

  it('excludes a pointer just outside the grab distance', () => {
    expect(
      isWithinPlayheadGrab(
        playheadMs + pxToMs(PLAYHEAD_GRAB_PX) + 1,
        playheadMs,
        pixelsPerSecond
      )
    ).toBe(false)
  })
})

describe('clampPlayheadMs', () => {
  it('clamps a drag past the start or the end of the media', () => {
    expect(clampPlayheadMs(-20, 10)).toBe(0)
    expect(clampPlayheadMs(10_500, 10)).toBe(10_000)
    expect(clampPlayheadMs(2_500, 10)).toBe(2_500)
  })

  it('still clamps the start when the duration is unknown', () => {
    expect(clampPlayheadMs(-5, Number.NaN)).toBe(0)
    expect(clampPlayheadMs(5_000, Number.NaN)).toBe(5_000)
  })
})
