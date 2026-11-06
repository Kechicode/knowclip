import { describe, expect, it } from 'vitest'
import { WaveformItem, WaveformRegion } from 'clipwave'
import { findPreviousSelectableItem } from './isWaveformItemSelectable'

const left: WaveformItem = {
  id: 'left',
  start: 0,
  end: 1000,
  clipwaveType: 'Primary',
}
const right: WaveformItem = {
  id: 'right',
  start: 1000,
  end: 2000,
  clipwaveType: 'Primary',
}

// The right card continues through a later region, the way a card does once
// playback has moved past its start.
const regions: WaveformRegion[] = [
  { start: 0, itemIds: ['left'] },
  { start: 1000, itemIds: ['right'] },
  { start: 1500, itemIds: ['right'] },
  { start: 2000, itemIds: [], end: 2000 },
]

const items: Record<string, WaveformItem> = { left, right }

describe('findPreviousSelectableItem', () => {
  it('selects the previous card when playback is in the middle of the current one', () => {
    const previous = findPreviousSelectableItem(
      regions,
      { regionIndex: 2, item: 'right' },
      (id) => items[id] || null
    )

    expect(previous?.item.id).toBe('left')
    expect(previous?.item.start).toBe(0)
  })
})
