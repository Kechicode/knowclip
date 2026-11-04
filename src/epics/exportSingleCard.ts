import { mergeMap, switchMap, catchError } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { makeApkg } from './exportApkg'

/**
 * Export a single flashcard as an .apkg file containing only that card.
 *
 * This reuses the same export pipeline as the full deck export, but builds
 * the export data for one clip only.
 */
const exportSingleCard: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.exportSingleCardRequest as const),
    mergeMap(async ({ mediaFileId, clipId }) => {
      const currentProject = r.getCurrentProject(state$.value)
      if (!currentProject)
        return of(r.exportApkgFailure('Could not find project'))

      const exportResult = await effects.getApkgExportData(
        state$.value,
        currentProject,
        { [mediaFileId]: [clipId] }
      )

      if (exportResult.error) {
        return of(r.exportApkgFailure(`${exportResult.error.message}`))
      }

      if (exportResult.value.type === 'MISSING MEDIA FILES') {
        const missing = exportResult.value.missingMediaFiles[0]
        return of(
          r.exportApkgFailure(
            `Could not find the media file for this card: ${missing?.name}. ` +
              `Please locate it before exporting.`
          )
        )
      }

      // Make it clear that this deck only contains a single card.
      const apkgData: ApkgExportData = {
        ...exportResult.value.apkgData,
        deckName: `${exportResult.value.apkgData.deckName} (single card)`,
      }

      return makeApkg(apkgData, effects)
    }),
    switchMap((x) => x),
    catchError((err) => {
      console.error(err)
      return of(r.exportApkgFailure(String(err)))
    })
  )

export default exportSingleCard
