import { mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of } from 'rxjs'
import { recalculateRegions } from 'clipwave'
import r from '../redux'
import A from '../types/ActionType'

/**
 * Merge the highlighted clip with the clips it overlaps.
 *
 * Since clips are allowed to overlap, this has to be triggered explicitly
 * instead of happening implicitly while dragging.
 */
const mergeOverlappingClips: AppEpic = (
  action$,
  state$,
  { dispatchClipwaveEvent }
) =>
  action$.pipe(
    ofType(A.mergeOverlappingClips as const),
    mergeMap(({ clipId }) => {
      const overlappingIds = r.getOverlappingClipIds(state$.value, clipId)

      if (!overlappingIds.length) {
        return of(
          r.simpleMessageSnackbar(
            'This card does not overlap any other cards, so there is nothing to merge.'
          )
        )
      }

      const idsToMerge = [clipId, ...overlappingIds]

      // The clip that is kept is the one that starts first. This matches the
      // behaviour of the old automatic merge.
      const sortedIds = idsToMerge.sort(
        (a, b) =>
          (r.getClip(state$.value, a)?.start || 0) -
          (r.getClip(state$.value, b)?.start || 0)
      )
      const finalId = sortedIds[0]
      const discardedIds = sortedIds.slice(1)

      const mergedClips = sortedIds
        .map((id) => r.getClip(state$.value, id))
        .filter(Boolean) as Clip[]
      const mergedStart = Math.min(...mergedClips.map((c) => c.start))
      const mergedEnd = Math.max(...mergedClips.map((c) => c.end))

      // Update the waveform so that the discarded clips are removed from it,
      // and the kept clip spans the whole merged range.
      dispatchClipwaveEvent(
        ({ dispatch, state: { regions }, getItemDangerously }) => {
          const { regions: newRegions } = recalculateRegions(
            regions,
            getItemDangerously,
            [
              {
                type: 'UPDATE',
                newItem: {
                  ...getItemDangerously(finalId),
                  id: finalId,
                  start: mergedStart,
                  end: mergedEnd,
                },
              },
              ...discardedIds.map((id) => ({
                type: 'DELETE' as const,
                itemId: id,
              })),
            ],
            mergedStart
          )
          dispatch({
            type: 'SET_REGIONS',
            regions: newRegions,
            newSelectionItemId: finalId,
          })
        }
      )

      return of(
        r.mergeClips(sortedIds, {
          type: 'Clip',
          id: finalId,
        })
      )
    })
  )

export default mergeOverlappingClips
