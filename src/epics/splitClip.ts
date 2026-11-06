import {
  concat,
  endWith,
  filter,
  ignoreElements,
  mergeMap,
  take,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { EMPTY, of } from 'rxjs'
import { recalculateRegions } from 'clipwave'
import r from '../redux'
import A from '../types/ActionType'
import { getSplitPoint } from '../utils/splitClip'

/**
 * Open the split dialog when the playhead sits inside the clip.
 * The audio file is not cut here; export and preview use the new
 * start and end times.
 */
const splitClipRequest: AppEpic = (action$, state$, { getCurrentTime }) =>
  action$.pipe(
    ofType(A.splitClipRequest as const),
    mergeMap(({ clipId }) => {
      const clip = r.getClip(state$.value, clipId)
      const card = r.getFlashcard(state$.value, clipId)
      if (!clip || !card) return EMPTY

      const playheadMs = Math.round(getCurrentTime() * 1000)
      const splitPoint = getSplitPoint(clip, playheadMs)
      if (!splitPoint.ok) return of(r.simpleMessageSnackbar(splitPoint.message))

      return of(
        r.splitClipDialog({
          clipId,
          splitAt: splitPoint.splitAt,
          start: clip.start,
          end: clip.end,
          originalTranscription: card.fields.transcription || '',
        })
      )
    })
  )

/** Keep the waveform in sync after a clip is split into two. */
const splitClipWaveform: AppEpic = (
  action$,
  _state$,
  { dispatchClipwaveEvent }
) =>
  action$.pipe(
    ofType(A.splitClip as const),
    mergeMap(({ clipId, newClipId, splitAt }) => {
      dispatchClipwaveEvent(
        ({ dispatch, state: { regions }, getItemDangerously }) => {
          const item = getItemDangerously(clipId)
          if (!item) return

          const { regions: newRegions, newSelectionRegion } =
            recalculateRegions(
              regions,
              getItemDangerously,
              [
                {
                  type: 'UPDATE',
                  newItem: {
                    ...item,
                    id: clipId,
                    start: item.start,
                    end: splitAt,
                  },
                },
                {
                  type: 'CREATE',
                  newItem: {
                    id: newClipId,
                    start: splitAt,
                    end: item.end,
                    clipwaveType: 'Primary',
                  },
                },
              ],
              splitAt
            )

          dispatch({
            type: 'SET_REGIONS',
            regions: newRegions,
            newSelectionRegion,
            newSelectionItemId: newClipId,
          })
        }
      )

      return []
    })
  )

/**
 * The left card keeps its id, so a still captured at the old midpoint would
 * stay on the preview. Rebuild it the same way a resized card does.
 */
const remakeStillAfterSplit: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.splitClip as const),
    mergeMap(({ clipId }) => {
      const clip = r.getClip(state$.value, clipId)
      const mediaFile = r.getCurrentMediaFile(state$.value)
      if (!(clip && mediaFile && mediaFile.isVideo)) return EMPTY

      const still = r.getFile<VideoStillImageFile>(
        state$.value,
        'VideoStillImage',
        clip.id
      )
      if (!still) return EMPTY

      return of(r.deleteFileRequest(still.type, still.id)).pipe(
        concat(
          action$.pipe(
            filter(
              (a) =>
                a.type === A.deleteFileSuccess &&
                a.file.id === still.id &&
                a.file.type === still.type
            ),
            take(1),
            ignoreElements()
          )
        ),
        endWith(r.openFileRequest(still))
      )
    })
  )

export default combineEpics(
  splitClipRequest,
  splitClipWaveform,
  remakeStillAfterSplit
)
