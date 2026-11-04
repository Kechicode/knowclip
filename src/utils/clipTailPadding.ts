/**
 * Extra time (in milliseconds) appended to the end of every exported clip.
 *
 * Two reasons for this:
 * 1. The mp3 encoder introduces a small amount of padding at the end of the
 *    file, which eats into the tail of the audio. Players that don't honour
 *    gapless metadata will cut the last few milliseconds of sound.
 * 2. Sounds often decay gradually. Cutting exactly at the clip boundary makes
 *    the last syllable hard to make out.
 *
 * Users can adjust this value in the settings.
 */
export const DEFAULT_CLIP_TAIL_PADDING_MS = 500

/** How much extra time to append to the end of a clip when exporting. */
export const getClipTailPadding = (state: AppState): number => {
  const padding = state.settings?.clipTailPaddingMs
  if (typeof padding !== 'number' || Number.isNaN(padding)) {
    return DEFAULT_CLIP_TAIL_PADDING_MS
  }
  return Math.max(0, padding)
}
