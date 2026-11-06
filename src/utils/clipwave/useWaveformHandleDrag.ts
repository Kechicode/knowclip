import React, { useCallback } from 'react'
import {
  WaveformGestureOf,
  msToSeconds,
  WaveformDrag,
  CLIP_THRESHOLD_MILLSECONDS,
  WaveformInterface,
} from 'clipwave'
import { actions } from '../../actions'
import { Dispatch } from 'redux'
import { cancelSplitAudition } from '../splitPlayhead'

export function useHandleWaveformDrag(
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  dispatch: Dispatch<Action>,
  _waveform: WaveformInterface
) {
  return useCallback(
    ({ gesture }: WaveformGestureOf<WaveformDrag>) => {
      const { start: startRaw, end: endRaw } = gesture
      const left = Math.min(startRaw, endRaw)
      const right = Math.max(startRaw, endRaw)

      // Overlapping clips are allowed now, so that you can deliberately make
      // two clips share a bit of audio. Clips can be merged explicitly with the
      // merge action.
      cancelSplitAudition()

      const tooSmall = right - left < CLIP_THRESHOLD_MILLSECONDS
      if (tooSmall) {
        if (playerRef.current) {
          playerRef.current.currentTime = msToSeconds(endRaw)
        }
        return
      }

      dispatch(actions.addClipRequest(gesture))

      if (playerRef.current) {
        playerRef.current.currentTime = msToSeconds(left)
      }
    },
    [dispatch, playerRef]
  )
}
