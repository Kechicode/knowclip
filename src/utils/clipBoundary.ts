/**
 * Utilities for adjusting the boundaries of a clip with the keyboard.
 *
 * The selected clip can be resized with Shift + Left/Right arrow:
 * - Shift + Left  shortens the clip (its end moves earlier)
 * - Shift + Right lengthens the clip (its end moves later)
 *
 * Holding Alt (or Ctrl) as well moves the *start* of the clip instead of its
 * end.
 */

/** How much a single keypress changes a clip boundary by. */
export const CLIP_BOUNDARY_STEP_MS = 100

/** The shortest a clip is allowed to be. */
export const MIN_CLIP_LENGTH_MS = 100

export type ClipBoundary = 'start' | 'end'

export type AdjustClipBoundaryOptions = {
  clip: { start: number; end: number }
  /** Which boundary to move. */
  boundary: ClipBoundary
  /**
   * -1 moves the boundary earlier, 1 moves it later.
   */
  direction: -1 | 1
  /** How far to move the boundary. Defaults to CLIP_BOUNDARY_STEP_MS. */
  step?: number
  /** The length of the media file, used to keep the clip inside it. */
  mediaDurationMs?: number
}

/**
 * Returns the new start and end of a clip after moving one of its boundaries.
 *
 * The clip is never allowed to become inverted or shorter than
 * MIN_CLIP_LENGTH_MS, and it is never allowed to extend past the end of the
 * media file.
 */
export const adjustClipBoundary = ({
  clip,
  boundary,
  direction,
  step = CLIP_BOUNDARY_STEP_MS,
  mediaDurationMs,
}: AdjustClipBoundaryOptions): { start: number; end: number } => {
  const { start, end } = clip
  const delta = direction * step

  if (boundary === 'end') {
    const newEnd = end + delta
    // Don't let the clip get shorter than the minimum, or invert.
    const clampedEnd = Math.max(newEnd, start + MIN_CLIP_LENGTH_MS)
    if (mediaDurationMs != null)
      return { start, end: Math.min(clampedEnd, mediaDurationMs) }
    return { start, end: clampedEnd }
  }

  const newStart = start + delta
  // Don't let the clip get shorter than the minimum, or invert.
  const clampedStart = Math.min(newStart, end - MIN_CLIP_LENGTH_MS)
  return { start: Math.max(0, clampedStart), end }
}
