import { MIN_CLIP_LENGTH_MS } from './clipBoundary'

export const SPLIT_CLIP_REJECTED_MESSAGE =
  'Move the playhead inside this card, leaving at least 0.1 seconds on each side.'

export type SplitPoint =
  | { ok: true; splitAt: number }
  | { ok: false; message: string }

/**
 * A clip can be split only when the playhead leaves at least
 * MIN_CLIP_LENGTH_MS on both sides.
 */
export const getSplitPoint = (
  clip: { start: number; end: number },
  playheadMs: number
): SplitPoint => {
  const earliest = clip.start + MIN_CLIP_LENGTH_MS
  const latest = clip.end - MIN_CLIP_LENGTH_MS
  if (playheadMs < earliest || playheadMs > latest) {
    return { ok: false, message: SPLIT_CLIP_REJECTED_MESSAGE }
  }
  return { ok: true, splitAt: playheadMs }
}
