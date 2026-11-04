import { ignoreElements, mergeMap, tap } from 'rxjs/operators'
import A from '../types/ActionType'
import { actions } from '../actions'
import { combineEpics, ofType } from 'redux-observable'
import { getRegionEnd, secondsToMs } from 'clipwave'
import { getFlashcard, getNewFlashcardForStretchedClip } from '../selectors'
import { EMPTY, of } from 'rxjs'
import { TransliterationFlashcardFields } from '../types/Project'

const addClipEpic: AppEpic = (action$, state$, { dispatchClipwaveEvent }) => {
  return action$.pipe(
    ofType(A.addClip as const),
    tap(({ clip }) => {
      dispatchClipwaveEvent(({ actions: { addItem } }) => {
        addItem({
          start: clip.start,
          end: clip.end,
          clipwaveType: 'Primary',
          id: clip.id,
        })
      })
    }),
    ignoreElements()
  )
}

const addClipsEpic: AppEpic = (
  action$,
  state$,
  { dispatchClipwaveEvent, getMediaPlayer }
) => {
  return action$.pipe(
    ofType(A.addClips as const),
    tap(({ clips }) => {
      dispatchClipwaveEvent(({ actions: { addItems } }) => {
        const newItems = clips.map((clip) => ({
          start: clip.start,
          end: clip.end,
          clipwaveType: 'Primary' as const,
          id: clip.id,
        }))

        const currentTime = getMediaPlayer()?.currentTime

        addItems(
          newItems,
          currentTime != null ? secondsToMs(currentTime) : undefined
        )
      })
    }),
    ignoreElements()
  )
}

const stretchClipEpic: AppEpic = (
  action$,
  state$,
  { dispatchClipwaveEvent }
) => {
  return action$.pipe(
    ofType(A.stretchClip as const),
    mergeMap(
      ({
        stretchedClip,
        unstretchedClip,
        newRegions,
        frontOverlappedSubtitlesCardBases,
        backOverlappedSubtitlesCardBases,
      }) => {
        dispatchClipwaveEvent(({ dispatch, state: { regions } }) => {
          const clipToStretchId = stretchedClip.id

          const newStart = stretchedClip.start
          const newEnd = stretchedClip.end

          if (regions !== newRegions)
            dispatch({
              type: 'SET_REGIONS',
              regions: newRegions,
              newSelectionItemId: clipToStretchId,
              newSelectionRegion: newRegions.findIndex(
                (region, i) =>
                  region.start >= newStart &&
                  getRegionEnd(newRegions, i) < newEnd
              ),
            })
        })

        if (
          frontOverlappedSubtitlesCardBases.length ||
          backOverlappedSubtitlesCardBases.length
        ) {
          const newFields = getNewFlashcardForStretchedClip(
            state$.value,
            unstretchedClip,
            stretchedClip,
            {
              front: frontOverlappedSubtitlesCardBases,
              back: backOverlappedSubtitlesCardBases,
            }
          )

          const oldFields = getFlashcard(state$.value, stretchedClip.id)
            ?.fields as TransliterationFlashcardFields | undefined
          const fieldWasUpdated = Object.entries(newFields?.fields || {}).some(
            ([fn, val]) => {
              const oldFieldValue =
                oldFields?.[fn as TransliterationFlashcardFieldName] || ''
              const newFieldValue = val || ''
              return oldFieldValue !== newFieldValue
            }
          )

          return fieldWasUpdated
            ? of(actions.editClip(stretchedClip.id, null, newFields))
            : EMPTY
        }
        return EMPTY
      }
    )
  )
}

export default combineEpics(addClipEpic, addClipsEpic, stretchClipEpic)
