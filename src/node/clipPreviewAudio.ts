import { clipAudio } from './clipAudio'
import { failure } from '../utils/result'
import { temporaryDirectory } from './tempy'
import { join } from 'path'

/**
 * Generates a temporary mp3 file containing the audio of a single clip.
 *
 * This is used for previewing a single card. The caller decides the range:
 * preview uses the clip's own start and end, without the export tail.
 */
export async function createClipPreviewAudio(
  clipSpecs: ClipSpecs,
  outputDirectory: string
): AsyncResult<string> {
  const { sourceFilePath, startTime, endTime, outputFilename } = clipSpecs

  try {
    const outputFilePath = join(outputDirectory, outputFilename)

    const result = await clipAudio(
      sourceFilePath,
      startTime,
      endTime,
      outputFilePath
    )
    if (result.error) return failure(result.error)

    return { value: outputFilePath }
  } catch (error) {
    return failure(error)
  }
}

/**
 * Creates a temporary directory that preview audio files can be written to.
 */
export const createPreviewAudioDirectory = () => temporaryDirectory()

/**
 * The local file server keeps one URL per id. The left card keeps its id
 * after a split, so the id has to include the range or the browser keeps
 * playing the audio from before the cut.
 */
export const clipPreviewAudioFileId = (
  clipId: ClipId,
  startTime: number,
  endTime: number
) => `clip-preview-${clipId}-${startTime}-${endTime}`
