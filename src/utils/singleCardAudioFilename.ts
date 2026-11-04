/**
 * Builds the default filename for a single card's exported mp3 file.
 *
 * The name is based on the card's transcription (if there is one), falling
 * back to the name of the media file the clip comes from. The clip's time
 * range is appended so that the file is easy to trace back to its card.
 */

const pad = (value: number) => String(value).padStart(2, '0')

/** Formats milliseconds as `HH-MM-SS`, which is safe to use in a filename. */
export const timestampForFilename = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60) % 60
  const seconds = totalSeconds % 60
  return `${pad(hours)}-${pad(minutes)}-${pad(seconds)}`
}

export const MAX_FILENAME_BASE_LENGTH = 40

export const getSingleCardAudioBaseName = ({
  transcription,
  mediaName,
}: {
  transcription?: string | null
  mediaName?: string | null
}): string => {
  const fromTranscription = (transcription || '').trim()
  if (fromTranscription)
    return fromTranscription.slice(0, MAX_FILENAME_BASE_LENGTH)

  const fromMediaName = (mediaName || '').trim()
  if (fromMediaName)
    return fromMediaName
      .replace(/\.[^.]*$/, '')
      .slice(0, MAX_FILENAME_BASE_LENGTH)

  return 'clip'
}

export const getSingleCardAudioFileName = ({
  transcription,
  mediaName,
  start,
  end,
}: {
  transcription?: string | null
  mediaName?: string | null
  start: number
  end: number
}): string => {
  const baseName = getSingleCardAudioBaseName({ transcription, mediaName })
  return `${baseName}_${timestampForFilename(start)}-${timestampForFilename(
    end
  )}.mp3`
}
