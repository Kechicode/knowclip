import { clipAudio } from './clipAudio'
import { failure } from '../utils/result'

/**
 * Writes the audio of a single clip to the given output path.
 *
 * This is used when exporting one card as an mp3 file, as opposed to
 * exporting a whole deck as an .apkg file.
 */
export async function writeClipAudio(
  clipSpecs: ClipSpecs,
  outputFilePath: string
): AsyncResult<string> {
  const { sourceFilePath, startTime, endTime } = clipSpecs

  try {
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
