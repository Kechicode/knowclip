import { clampPlayheadMs } from './waveformCoordinates'

export const PLAYHEAD_NUDGE_MS = 50
export const PLAYHEAD_NUDGE_FINE_MS = 10

export type SplitAuditionSide = 'left' | 'right'

export type SplitRange = {
  start: number
  end: number
}

export function nudgePlayheadMs(
  currentMs: number,
  direction: -1 | 1,
  fine: boolean,
  durationSeconds: number
) {
  const step = fine ? PLAYHEAD_NUDGE_FINE_MS : PLAYHEAD_NUDGE_MS
  return clampPlayheadMs(currentMs + direction * step, durationSeconds)
}

/** Where playback of one side of a prospective split should stop. */
export function auditionEndMs(
  side: SplitAuditionSide,
  splitMs: number,
  clipEndMs: number
) {
  return side === 'left' ? splitMs : clipEndMs
}

export function auditionStartMs(
  side: SplitAuditionSide,
  splitMs: number,
  clipStartMs: number
) {
  return side === 'left' ? clipStartMs : splitMs
}

export function formatPlayheadMs(ms: number) {
  const rounded = Math.max(0, Math.round(ms))
  const minutes = Math.floor(rounded / 60000)
  const seconds = Math.floor(rounded / 1000) % 60
  const millis = rounded % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export function formatSplitReadout(playheadMs: number, clip: SplitRange | null) {
  const time = formatPlayheadMs(playheadMs)
  if (!clip || playheadMs < clip.start || playheadMs > clip.end) return time
  const left = ((playheadMs - clip.start) / 1000).toFixed(2)
  const right = ((clip.end - playheadMs) / 1000).toFixed(2)
  return `${time} · ${left}s | ${right}s`
}

export function isPlayheadInsideClip(playheadMs: number, clip: SplitRange) {
  return playheadMs >= clip.start && playheadMs <= clip.end
}

type AuditionListener = (clipId: string, side: SplitAuditionSide) => void

const auditionListeners = new Set<AuditionListener>()
let cancelAudition: () => void = () => {}

export function requestSplitAudition(clipId: string, side: SplitAuditionSide) {
  auditionListeners.forEach((listener) => listener(clipId, side))
}

export function subscribeSplitAudition(listener: AuditionListener) {
  auditionListeners.add(listener)
  return () => {
    auditionListeners.delete(listener)
  }
}

/** Drop an in-progress audition without seeking back to the old cut. */
export function cancelSplitAudition() {
  cancelAudition()
}

export function setSplitAuditionCanceller(canceller: () => void) {
  cancelAudition = canceller
  return () => {
    if (cancelAudition === canceller) cancelAudition = () => {}
  }
}
