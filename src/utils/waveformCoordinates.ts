import * as React from 'react'
import { pixelsToMs } from 'clipwave'
import { VITE_INTEGRATION_DEV } from '../env'

// TODO: FIX like below
const toWaveformXRaw = (
  mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
  svgElement: SVGElement,
  xMin = 0
) => mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin

export const toWaveformX = VITE_INTEGRATION_DEV
  ? (
      mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
      svgElement: SVGElement,
      xMin = 0
    ) => {
      const x = toWaveformXRaw(mouseEvent, svgElement, xMin)
      console.log(mouseEvent.type, mouseEvent.pageX, mouseEvent)
      return x
    }
  : toWaveformXRaw

export const waveformTimeAtMousePosition = (
  mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
  svgElement: SVGElement,

  viewBoxStartMs: number,
  pixelsPerSecond: number
) => {
  const { clientX } = mouseEvent
  const { left } = svgElement.getBoundingClientRect()

  const offsetX = clientX - left
  return pixelsToMs(offsetX, pixelsPerSecond) + viewBoxStartMs
}

/** How close the pointer must be to the playhead before a drag seeks instead of drawing a clip. */
export const PLAYHEAD_GRAB_PX = 8

export const isWithinPlayheadGrab = (
  mouseMs: number,
  playheadMs: number,
  pixelsPerSecond: number
) => {
  if (pixelsPerSecond <= 0) return mouseMs === playheadMs
  const distancePx = (Math.abs(mouseMs - playheadMs) / 1000) * pixelsPerSecond
  return distancePx <= PLAYHEAD_GRAB_PX
}

/** Keep a seek inside the media. An unknown duration only clamps the start. */
export const clampPlayheadMs = (ms: number, durationSeconds: number) => {
  const atLeastZero = Math.max(0, ms)
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0)
    return atLeastZero
  return Math.min(atLeastZero, durationSeconds * 1000)
}
