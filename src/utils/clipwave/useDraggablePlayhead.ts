import { useEffect, useRef, type RefObject } from 'react'
import { WaveformInterface } from 'clipwave'
import { cancelSplitAudition } from '../splitPlayhead'
import {
  clampPlayheadMs,
  isWithinPlayheadGrab,
  waveformTimeAtMousePosition,
} from '../waveformCoordinates'

/**
 * Dragging near the waveform's playhead seeks the media instead of creating a clip.
 * The line itself is still moved by clipwave while audio is playing.
 */
export function useDraggablePlayhead(
  waveform: WaveformInterface,
  playerRef: RefObject<HTMLVideoElement | HTMLAudioElement | null>,
  waveformReady: boolean,
  waveformKey: string | null
) {
  const waveformRef = useRef(waveform)
  waveformRef.current = waveform

  useEffect(() => {
    const svg = waveformRef.current.svgRef.current
    if (!waveformReady || !svg) return

    let stopDrag = () => {}

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return
      const player = playerRef.current
      if (!player) return

      const { viewBoxStartMs, pixelsPerSecond } = waveformRef.current.state
      const mouseMs = waveformTimeAtMousePosition(
        event,
        svg,
        viewBoxStartMs,
        pixelsPerSecond
      )
      const playheadMs = player.currentTime * 1000
      if (!isWithinPlayheadGrab(mouseMs, playheadMs, pixelsPerSecond)) return

      event.stopPropagation()
      event.preventDefault()
      cancelSplitAudition()

      const previousCursor = document.body.style.cursor
      document.body.style.cursor = 'ew-resize'

      const seek = (moveEvent: MouseEvent) => {
        const state = waveformRef.current.state
        const ms = clampPlayheadMs(
          waveformTimeAtMousePosition(
            moveEvent,
            svg,
            state.viewBoxStartMs,
            state.pixelsPerSecond
          ),
          player.duration
        )
        player.currentTime = ms / 1000
        moveCursorLine(svg, ms, state.pixelsPerSecond)
      }

      stopDrag = () => {
        document.body.style.cursor = previousCursor
        window.removeEventListener('mousemove', seek)
        window.removeEventListener('mouseup', stopDrag)
      }

      seek(event)
      window.addEventListener('mousemove', seek)
      window.addEventListener('mouseup', stopDrag)
    }

    svg.addEventListener('mousedown', onMouseDown, true)
    return () => {
      stopDrag()
      svg.removeEventListener('mousedown', onMouseDown, true)
    }
  }, [playerRef, waveformKey, waveformReady])
}

function moveCursorLine(
  svg: SVGElement,
  ms: number,
  pixelsPerSecond: number
) {
  const cursor = svg.querySelector('line.cursor')
  if (!cursor) return
  const x = String((ms / 1000) * pixelsPerSecond)
  cursor.setAttribute('x1', x)
  cursor.setAttribute('x2', x)
}
