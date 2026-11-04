import { mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { recalculateRegions } from 'clipwave'
import A from '../types/ActionType'

/**
 * Keep the waveform in sync when a clip is resized from the keyboard.
 *
 * The clip keeps its own boundaries; overlapping clips are allowed and can be
 * merged explicitly with the merge action.
 */
const resizeClip: AppEpic = (action$, state$, { dispatchClipwaveEvent }) =>
  action$.pipe(
    ofType(A.resizeClip as const),
    mergeMap(({ id, start, end }) => {
      dispatchClipwaveEvent(
        ({ dispatch, state: { regions }, getItemDangerously }) => {
          const item = getItemDangerously(id)
          if (!item) return

          const { regions: newRegions, newSelectionRegion } = recalculateRegions(
            regions,
            getItemDangerously,
            [
              {
                type: 'UPDATE',
                newItem: {
                  ...item,
                  id,
                  start,
                  end,
                },
              },
            ],
            start
          )

          dispatch({
            type: 'SET_REGIONS',
            regions: newRegions,
            newSelectionRegion,
            newSelectionItemId: id,
          })
        }
      )

      return []
    })
  )

export default resizeClip
