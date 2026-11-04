export type ClozeSegment = {
  text: string
  /** the 1-based cloze index this text belongs to, or null if it isn't part of a deletion */
  clozeIndex: number | null
  /** whether this text is hidden (it's the deletion being previewed) */
  isHidden: boolean
}

/**
 * Splits a text into segments, based on the given cloze deletions.
 *
 * This is used to display a card the same way Anki would display it: the text
 * of the cloze deletion that is being previewed is hidden, and the text of the
 * other deletions is shown highlighted.
 */
export const getClozeSegments = (
  text: string,
  cloze: ClozeDeletion[],
  previewClozeIndex: number
): ClozeSegment[] => {
  if (!cloze.length) return [{ text, clozeIndex: null, isHidden: false }]

  const ranges = cloze
    .flatMap((deletion, clozeIndex) =>
      deletion.ranges.map((range) => ({ range, clozeIndex }))
    )
    .sort((a, b) => a.range.start - b.range.start)

  const segments: ClozeSegment[] = []
  let cursor = 0

  for (const { range, clozeIndex } of ranges) {
    if (range.start > cursor) {
      segments.push({
        text: text.slice(cursor, range.start),
        clozeIndex: null,
        isHidden: false,
      })
    }

    segments.push({
      text: text.slice(range.start, range.end),
      clozeIndex: clozeIndex + 1,
      isHidden: clozeIndex === previewClozeIndex,
    })

    cursor = Math.max(cursor, range.end)
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      clozeIndex: null,
      isHidden: false,
    })
  }

  return segments
}
