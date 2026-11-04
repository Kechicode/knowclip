import { clipAudio } from './clipAudio'
import { failure } from '../utils/result'
import { temporaryDirectory } from './tempy'
import { join } from 'path'

/**
 * Generates a temporary mp3 file containing the audio of a single clip.
 *
 * This is used for previewing a single card: the audio that gets previewed is
 * exactly the same audio that would end up in an exported deck, including the
 * configured tail padding.
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
