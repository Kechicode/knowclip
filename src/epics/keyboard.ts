import { filter, map, mergeMap, switchMap, takeUntil } from 'rxjs/operators'
import { fromEvent, from, of, merge, EMPTY } from 'rxjs'
import { combineEpics, ofType } from 'redux-observable'
import r from '../redux'
import A from '../types/ActionType'
import { KEYS } from '../utils/keyboard'
import { getMetaOrCtrlKey } from '../components/FlashcardSectionDisplayClozeField'
import { isTextFieldFocused } from '../utils/isTextFieldFocused'
import { adjustClipBoundary } from '../utils/clipBoundary'
import { getCardPreviewShortcutTarget } from '../utils/cardPreviewShortcut'

const keydownEpic: AppEpic = (action$, state$, effects) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    mergeMap((event) => {
      const { ctrlKey, key } = event

      if (
        key.toLowerCase() === KEYS.lLowercase &&
        (ctrlKey || !isTextFieldFocused())
      )
        return of(r.toggleLoop('KEYBOARD'))

      if (
        key.toLowerCase() === KEYS.eLowercase &&
        !isTextFieldFocused() &&
        !(
          r.getHighlightedClipId(state$.value) &&
          r.isUserEditingCards(state$.value)
        )
      ) {
        event.preventDefault()
        return of(r.startEditingCards())
      }
      const playPauseForceKey =
        window.electronApi.platform === 'win32' ? 'ctrlKey' : 'shiftKey'

      if (
        (key === KEYS.space || key === KEYS.process) &&
        (event[playPauseForceKey] || !isTextFieldFocused())
      ) {
        event.preventDefault()
        if (
          !(
            document.activeElement &&
            document.activeElement === effects.getMediaPlayer()
          )
        )
          effects.toggleMediaPaused()
        return EMPTY
      }

      if (key === KEYS.escape) {
        if (r.getCurrentDialog(state$.value) || (window as any).cloze)
          return of({ type: 'NOOP_ESC_KEY' } as unknown as Action)

        if (
          r.getHighlightedClipId(state$.value) &&
          state$.value.session.editingCards
        )
          return from([
            ...(r.getLoopState(state$.value) ? [r.setLoop(false)] : []),
            r.stopEditingCards(),
          ])

        if (state$.value.session.dictionaryPopoverIsOpen) {
          return from([r.closeDictionaryPopover()])
        }

        const mediaIsPlaying = effects.isMediaPlaying()
        const currentTime = effects.getCurrentTime()

        if (
          mediaIsPlaying &&
          r.getClipIdAt(state$.value, currentTime * 1000) ===
            r.getHighlightedClipId(state$.value)
        )
          return of(r.setLoop(false))

        return EMPTY
      }

      if (key === KEYS.dUppercase && ctrlKey) {
        const highlightedClipId = r.getHighlightedClipId(state$.value)
        event.preventDefault()
        return highlightedClipId ? of(r.deleteCard(highlightedClipId)) : EMPTY
      }

      if (
        key.toLowerCase() === KEYS.mLowercase &&
        (ctrlKey || !isTextFieldFocused())
      ) {
        const highlightedClipId = r.getHighlightedClipId(state$.value)
        if (!highlightedClipId) return EMPTY
        event.preventDefault()
        return of(r.mergeOverlappingClips(highlightedClipId))
      }

      // P opens the preview of the selected card.
      const previewTarget = getCardPreviewShortcutTarget({
        key,
        ctrlKey,
        isTextFieldFocused: isTextFieldFocused(),
        isDialogOpen: Boolean(r.getCurrentDialog(state$.value)),
        highlightedClipId: r.getHighlightedClipId(state$.value),
        currentMediaFileId: r.getCurrentMediaFile(state$.value)?.id,
      })
      if (previewTarget) {
        event.preventDefault()
        return of(
          r.cardPreviewDialog(previewTarget.mediaFileId, previewTarget.clipId)
        )
      }

      // Shift + Left/Right resizes the selected clip.
      if (
        event.shiftKey &&
        (key === KEYS.arrowLeft || key === KEYS.arrowRight) &&
        !isTextFieldFocused()
      ) {
        const highlightedClipId = r.getHighlightedClipId(state$.value)
        if (!highlightedClipId) return EMPTY

        event.preventDefault()

        const clip = r.getClip(state$.value, highlightedClipId)
        if (!clip) return EMPTY

        // Alt (or Ctrl) moves the start of the clip instead of its end.
        const boundary = event.altKey || ctrlKey ? 'start' : 'end'
        const direction = key === KEYS.arrowRight ? 1 : -1

        const media = r.getCurrentMediaFile(state$.value)
        const mediaDurationMs = media?.durationSeconds
          ? Math.round(media.durationSeconds * 1000)
          : undefined

        const { start, end } = adjustClipBoundary({
          clip,
          boundary,
          direction,
          mediaDurationMs,
        })

        if (start === clip.start && end === clip.end) return EMPTY

        return of(r.resizeClip(highlightedClipId, start, end))
      }

      return EMPTY
    })
  )

const saveKey = (window: Window) =>
  merge(
    fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      filter((e) => {
        const { key } = e
        return key.toLowerCase() === KEYS.sLowercase && getMetaOrCtrlKey(e)
      })
    )
  )

const saveEpic: AppEpic = (action$, state$, { window }) =>
  action$.pipe(
    ofType(A.openProject as const),
    switchMap(() =>
      saveKey(window).pipe(
        map(({ shiftKey }) =>
          shiftKey ? r.saveProjectAsRequest() : r.saveProjectRequest()
        ),
        takeUntil(action$.pipe(ofType(A.closeProject as const)))
      )
    )
  )

export default combineEpics(keydownEpic, saveEpic)
