import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CLIP_TAIL_PADDING_MS,
  getClipTailPadding,
} from './clipTailPadding'

describe('clip tail padding', () => {
  it('defaults to a sensible padding when no setting is present', () => {
    expect(getClipTailPadding({ settings: {} } as any)).toBe(
      DEFAULT_CLIP_TAIL_PADDING_MS
    )
  })

  it('uses the value from the settings', () => {
    expect(
      getClipTailPadding({ settings: { clipTailPaddingMs: 1500 } } as any)
    ).toBe(1500)
  })

  it('allows the padding to be turned off', () => {
    expect(
      getClipTailPadding({ settings: { clipTailPaddingMs: 0 } } as any)
    ).toBe(0)
  })

  it('never returns a negative padding', () => {
    expect(
      getClipTailPadding({ settings: { clipTailPaddingMs: -100 } } as any)
    ).toBe(0)
  })

  it('falls back to the default when the value is not a number', () => {
    expect(
      getClipTailPadding({ settings: { clipTailPaddingMs: 'x' } } as any)
    ).toBe(DEFAULT_CLIP_TAIL_PADDING_MS)
  })
})
