import { mergeMap, switchMap, catchError } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'

/**
 * Generates the audio of the card being previewed.
 *
 * The audio is generated in the main process from the clip's own start and
 * end. The export tail is not included.
 */
const loadCardPreview: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.loadCardPreview as const),
    mergeMap(async ({ mediaFileId, clipId }) => {
      const result = await effects.createClipPreviewAudio(
        state$.value,
        mediaFileId,
        clipId
      )

      if (result.error) {
        return r.cardPreviewFailed(
          result.error.message || 'Could not generate the preview audio.'
        )
      }

      return r.cardPreviewLoaded(result.value.fileId)
    }),
    switchMap((action) => of(action)),
    catchError((err) => {
      console.error(err)
      return of(r.cardPreviewFailed(String(err)))
    })
  )

export default loadCardPreview
