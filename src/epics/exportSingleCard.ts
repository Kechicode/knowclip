import { mergeMap, switchMap, catchError } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of, EMPTY } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { getSingleCardAudioFileName } from '../utils/singleCardAudioFilename'

/**
 * Export a single flashcard's audio as an mp3 file.
 *
 * The user picks where to save the file. The audio is clipped from the media
 * file the card came from, with the configured tail padding applied so that
 * the end of the sound isn't cut off.
 */
const exportSingleCard: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.exportSingleCardRequest as const),
    mergeMap(async ({ mediaFileId, clipId }) => {
      const exportResult = await effects.getSingleClipExportData(
        state$.value,
        mediaFileId,
        clipId
      )

      if (exportResult.error) {
        return of(r.exportApkgFailure(`${exportResult.error.message}`))
      }

      if (exportResult.value.type === 'MISSING MEDIA FILE') {
        const missing = exportResult.value.mediaFile
        return of(
          r.exportApkgFailure(
            `Could not find the media file for this card${
              missing ? ` (${missing.name})` : ''
            }. Please locate it before exporting.`
          )
        )
      }

      const { clipSpec } = exportResult.value

      const clip = r.getClip(state$.value, clipId)
      const flashcard = r.getFlashcard(state$.value, clipId)
      const media = r.getFile<MediaFile>(
        state$.value,
        'MediaFile',
        mediaFileId
      )

      const defaultFileName = getSingleCardAudioFileName({
        transcription: flashcard?.fields.transcription,
        mediaName: media?.name,
        start: clip?.start ?? 0,
        end: clip?.end ?? 0,
      })

      const outputFilePath = await effects.showSaveDialog(
        'MP3 audio file',
        ['mp3'],
        defaultFileName
      )
      if (!outputFilePath) return EMPTY

      document.body.style.cursor = 'progress'

      const writeResult = await effects.writeClipAudio(
        clipSpec,
        outputFilePath
      )

      if (writeResult.error) {
        document.body.style.cursor = 'default'
        return of(r.exportApkgFailure(`${writeResult.error.message}`))
      }

      document.body.style.cursor = 'default'

      return of(
        r.exportApkgSuccess('Audio saved in ' + outputFilePath)
      )
    }),
    switchMap((x) => x),
    catchError((err) => {
      console.error(err)
      return of(r.exportApkgFailure(String(err)))
    })
  )

export default exportSingleCard
