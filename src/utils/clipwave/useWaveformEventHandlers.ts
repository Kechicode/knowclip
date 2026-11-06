import React, { useEffect } from 'react'
import {
  ClipStretch,
  PrimaryClip,
  WaveformRegion,
  GetWaveformItemDangerously,
  WaveformItem,
  WaveformInterface,
} from 'clipwave'
import { Dispatch } from 'redux'
import { KEYS } from '../keyboard'
import { isTextFieldFocused } from '../isTextFieldFocused'
import {
  getSubtitlesCardBases,
  SubtitlesCardBase,
  SubtitlesCardBases,
} from '../../selectors'
import { getCurrentDialog } from '../../selectors/dialog'
import { useSelector } from 'react-redux'
import { useHandleWaveformDrag } from './useWaveformHandleDrag'
import { useHandleWaveformClipDrag } from './useWaveformHandleClipDrag'
import { useWaveformHandleClipEdgeDrag } from './useWaveformHandleClipEdgeDrag'
import {
  findPreviousSelectableItem,
  isWaveformItemSelectable,
} from './isWaveformItemSelectable'
export const STRETCH_START_DELAY = 100

export function useWaveformEventHandlers({
  playerRef,
  dispatch,
  waveform,
  highlightedClipId,
}: {
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
  dispatch: Dispatch<Action>
  waveform: WaveformInterface
  highlightedClipId: string | null
}) {
  const cardsBases = useSelector(getSubtitlesCardBases)
  const currentDialog = useSelector(getCurrentDialog)

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const { altKey, key } = event
      // Shift + arrow is used to resize the selected clip, so it shouldn't
      // also change the selection.
      if (event.shiftKey) return

      // While the card preview is open, the arrow keys switch between the
      // front and the back of the card instead of changing the selection.
      if (currentDialog?.type === 'CardPreview') return

      if (key === KEYS.arrowRight && (altKey || !isTextFieldFocused())) {
        return waveform.actions.selectNextItemAndSeek(
          playerRef.current,
          isWaveformItemSelectable
        )
      }

      if (key === KEYS.arrowLeft && (altKey || !isTextFieldFocused())) {
        const { regions, selection } = waveform.state
        const previous = findPreviousSelectableItem(
          regions,
          selection,
          waveform.getItem
        )
        if (previous?.item) {
          waveform.actions.selectItemAndSeekTo(
            previous.regionIndex,
            previous.item.id,
            playerRef.current,
            previous.item.start
          )
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [
    currentDialog,
    playerRef,
    waveform.actions.selectPreviousItemAndSeek,
    waveform.actions.selectNextItemAndSeek,
    waveform.actions,
  ])

  return {
    handleWaveformDrag: useHandleWaveformDrag(playerRef, dispatch, waveform),
    handleClipDrag: useHandleWaveformClipDrag(
      playerRef,
      dispatch,
      waveform,
      highlightedClipId
    ),
    handleClipEdgeDrag: useWaveformHandleClipEdgeDrag(
      cardsBases,
      waveform,
      dispatch,
      playerRef
    ),
  }
}

type StretchedClipOverlaps = {
  clips: PrimaryClip[]
  subtitlesFront: SubtitlesCardBase[]
  subtitlesBack: SubtitlesCardBase[]
}
export function getStretchedClipOverlaps(
  stretch: ClipStretch,
  getItemDangerously: GetWaveformItemDangerously,
  stretchedClip: WaveformItem,
  cardsBases: SubtitlesCardBases
): StretchedClipOverlaps {
  return stretch.overlaps.reduce(
    (acc: StretchedClipOverlaps, id) => {
      const item = getItemDangerously(id)
      const { start, end } = item
      const overlap = start <= stretchedClip.end && end >= stretchedClip.start
      if (!overlap) return acc

      if (item.clipwaveType === 'Primary') acc.clips.push(item)

      if (item.clipwaveType === 'Secondary') {
        const side =
          item.start < stretchedClip.start
            ? acc.subtitlesFront
            : acc.subtitlesBack
        const cardBase = cardsBases.cardsMap[item.id]
        if (cardBase) side.push(cardBase)
      }
      return acc
    },
    {
      clips: [],
      subtitlesFront: [],
      subtitlesBack: [],
    }
  )
}

export function getRegionEnd(regions: WaveformRegion[], index: number): number {
  const end = regions[regions.length - 1].end
  if (typeof end !== 'number') throw new Error('No regions end found')
  const nextRegion: WaveformRegion | null = regions[index + 1] || null
  if (!nextRegion) return end
  const nextRegionStart = nextRegion.start
  return nextRegionStart
}
