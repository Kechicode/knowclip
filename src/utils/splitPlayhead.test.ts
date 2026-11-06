import { describe, expect, it } from 'vitest'
import {
  PLAYHEAD_NUDGE_FINE_MS,
  PLAYHEAD_NUDGE_MS,
  auditionEndMs,
  nudgePlayheadMs,
} from './splitPlayhead'

describe('nudgePlayheadMs', () => {
  it('moves by 50ms, or by 10ms when the fine step is requested', () => {
    expect(nudgePlayheadMs(1000, 1, false, 60)).toBe(1000 + PLAYHEAD_NUDGE_MS)
    expect(nudgePlayheadMs(1000, -1, false, 60)).toBe(1000 - PLAYHEAD_NUDGE_MS)
    expect(nudgePlayheadMs(1000, 1, true, 60)).toBe(1000 + PLAYHEAD_NUDGE_FINE_MS)
    expect(nudgePlayheadMs(1000, -1, true, 60)).toBe(
      1000 - PLAYHEAD_NUDGE_FINE_MS
    )
  })

  it('clamps a nudge past the start or the end of the media', () => {
    expect(nudgePlayheadMs(5, -1, false, 10)).toBe(0)
    expect(nudgePlayheadMs(9_980, 1, false, 10)).toBe(10_000)
  })
})

describe('auditionEndMs', () => {
  it('stops the left side at the cut and the right side at the card end', () => {
    expect(auditionEndMs('left', 2_500, 4_000)).toBe(2_500)
    expect(auditionEndMs('right', 2_500, 4_000)).toBe(4_000)
  })
})
