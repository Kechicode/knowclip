import { useEffect, useRef, useState, type RefObject } from 'react'
import { WaveformInterface } from 'clipwave'
import { isTextFieldFocused } from '../utils/isTextFieldFocused'
import {
  auditionEndMs,
  auditionStartMs,
  formatSplitReadout,
  isPlayheadInsideClip,
  nudgePlayheadMs,
  setSplitAuditionCanceller,
  subscribeSplitAudition,
  type SplitAuditionSide,
} from '../utils/splitPlayhead'
import css from './PlayheadGuide.module.css'

type PlayheadLabel = {
  x: number
  y: number
  text: string
}

type Audition = {
  clipId: string
  side: SplitAuditionSide
  splitMs: number
  startMs: number
  endMs: number
}

/**
 * Keeps a time readout on the playhead, marks a prospective split on the
 * selected card, and auditions either side without moving the cut.
 */
export function PlayheadGuide({
  waveform,
  playerRef,
  waveformReady,
  waveformKey,
  highlightedClipId,
  clipsById,
}: {
  waveform: WaveformInterface
  playerRef: RefObject<HTMLVideoElement | HTMLAudioElement | null>
  waveformReady: boolean
  waveformKey: string | null
  highlightedClipId: string | null
  clipsById: Record<string, Clip>
}) {
  const [label, setLabel] = useState<PlayheadLabel | null>(null)
  const waveformRef = useRef(waveform)
  waveformRef.current = waveform
  const highlightedClipIdRef = useRef(highlightedClipId)
  highlightedClipIdRef.current = highlightedClipId
  const clipsRef = useRef(clipsById)
  clipsRef.current = clipsById

  useEffect(() => {
    const svg = waveformRef.current.svgRef.current
    if (!waveformReady || !svg) return

    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    mark.setAttribute('stroke', '#ffeb3b')
    mark.setAttribute('stroke-width', '2')
    mark.setAttribute('y1', '0')
    mark.setAttribute('pointer-events', 'none')
    mark.style.display = 'none'
    svg.appendChild(mark)

    let audition: Audition | null = null
    let awaitingSeek = false
    let frame = 0
    let lastLabel: PlayheadLabel | null = null

    const placePlayhead = (ms: number) => {
      const player = playerRef.current
      if (!player) return
      player.currentTime = ms / 1000
      syncPlayheadLine(svg, ms, waveformRef.current.state.pixelsPerSecond)
    }

    const stopAudition = () => {
      audition = null
      awaitingSeek = false
    }

    const startAudition = (clipId: string, side: SplitAuditionSide) => {
      const player = playerRef.current
      const clip = clipsRef.current[clipId]
      if (!player || !clip) return

      const splitMs = audition?.clipId === clipId
        ? audition.splitMs
        : player.currentTime * 1000
      if (!isPlayheadInsideClip(splitMs, clip)) return

      audition = {
        clipId,
        side,
        splitMs,
        startMs: clip.start,
        endMs: clip.end,
      }
      awaitingSeek = true
      placePlayhead(auditionStartMs(side, splitMs, clip.start))
      void player.play()
    }

    const nudge = (direction: -1 | 1, fine: boolean) => {
      const player = playerRef.current
      if (!player) return
      const base = audition?.splitMs ?? player.currentTime * 1000
      audition = null
      player.pause()
      placePlayhead(
        nudgePlayheadMs(base, direction, fine, player.duration)
      )
    }

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const player = playerRef.current
      if (!player) return

      const ms = player.currentTime * 1000
      if (audition) {
        const start = auditionStartMs(
          audition.side,
          audition.splitMs,
          audition.startMs
        )
        const end = auditionEndMs(
          audition.side,
          audition.splitMs,
          audition.endMs
        )
        if (awaitingSeek) {
          // Wait until playback has actually arrived at the start of this
          // side. The playhead is still the cut until that seek lands.
          if (Math.abs(ms - start) <= 40) awaitingSeek = false
        } else if (ms >= end - 30 || ms < start - 50) {
          const splitMs = audition.splitMs
          audition = null
          player.pause()
          placePlayhead(splitMs)
        }
      }

      const shownMs = audition?.splitMs ?? player.currentTime * 1000
      const { pixelsPerSecond, viewBoxStartMs } = waveformRef.current.state
      const highlighted = highlightedClipIdRef.current
      const clip = highlighted ? clipsRef.current[highlighted] : null
      const inside = Boolean(clip && isPlayheadInsideClip(shownMs, clip))
      const x = (shownMs / 1000) * pixelsPerSecond
      if (inside) {
        mark.style.display = ''
        mark.setAttribute('x1', String(x))
        mark.setAttribute('x2', String(x))
        mark.setAttribute('y2', svg.getAttribute('height') || '0')
      } else {
        mark.style.display = 'none'
      }

      const bounds = svg.getBoundingClientRect()
      const nextLabel = {
        x: bounds.left + ((shownMs - viewBoxStartMs) / 1000) * pixelsPerSecond,
        y: bounds.top + 8,
        text: formatSplitReadout(shownMs, inside && clip ? clip : null),
      }
      if (
        !lastLabel ||
        lastLabel.text !== nextLabel.text ||
        Math.abs(lastLabel.x - nextLabel.x) >= 1 ||
        Math.abs(lastLabel.y - nextLabel.y) >= 1
      ) {
        lastLabel = nextLabel
        setLabel(nextLabel)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (isTextFieldFocused()) return
      if (event.code === 'Comma' || event.code === 'Period') {
        event.preventDefault()
        nudge(event.code === 'Comma' ? -1 : 1, event.shiftKey)
        return
      }
      if (event.code === 'BracketLeft' || event.code === 'BracketRight') {
        const clipId = highlightedClipIdRef.current
        if (!clipId) return
        event.preventDefault()
        startAudition(clipId, event.code === 'BracketLeft' ? 'left' : 'right')
      }
    }

    const unsubscribe = subscribeSplitAudition(startAudition)
    const clearCanceller = setSplitAuditionCanceller(stopAudition)
    window.addEventListener('keydown', onKeyDown)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      unsubscribe()
      clearCanceller()
      mark.remove()
    }
  }, [playerRef, waveformKey, waveformReady])

  if (!label) return null
  return (
    <div className={css.label} style={{ left: label.x, top: label.y }}>
      {label.text}
    </div>
  )
}

function syncPlayheadLine(
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
