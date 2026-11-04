import {
  adjustClipBoundary,
  CLIP_BOUNDARY_STEP_MS,
  MIN_CLIP_LENGTH_MS,
} from './clipBoundary'
import { describe, it, expect } from 'vitest'

describe('adjustClipBoundary', () => {
  const clip = { start: 1000, end: 2000 }

  it('lengthens the clip when the end moves later', () => {
    expect(
      adjustClipBoundary({ clip, boundary: 'end', direction: 1 })
    ).toEqual({ start: 1000, end: 2000 + CLIP_BOUNDARY_STEP_MS })
  })

  it('shortens the clip when the end moves earlier', () => {
    expect(
      adjustClipBoundary({ clip, boundary: 'end', direction: -1 })
    ).toEqual({ start: 1000, end: 2000 - CLIP_BOUNDARY_STEP_MS })
  })

  it('moves the start earlier', () => {
    expect(
      adjustClipBoundary({ clip, boundary: 'start', direction: -1 })
    ).toEqual({ start: 1000 - CLIP_BOUNDARY_STEP_MS, end: 2000 })
  })

  it('moves the start later', () => {
    expect(
      adjustClipBoundary({ clip, boundary: 'start', direction: 1 })
    ).toEqual({ start: 1000 + CLIP_BOUNDARY_STEP_MS, end: 2000 })
  })

  it('never lets the end move past the start', () => {
    const { start, end } = adjustClipBoundary({
      clip: { start: 1000, end: 1050 },
      boundary: 'end',
      direction: -1,
    })
    expect(end).toBe(start + MIN_CLIP_LENGTH_MS)
  })

  it('never lets the start move past the end', () => {
    const { start, end } = adjustClipBoundary({
      clip: { start: 1000, end: 1050 },
      boundary: 'start',
      direction: 1,
    })
    expect(start).toBe(end - MIN_CLIP_LENGTH_MS)
  })

  it('never lets the start go below zero', () => {
    const { start } = adjustClipBoundary({
      clip: { start: 50, end: 2000 },
      boundary: 'start',
      direction: -1,
    })
    expect(start).toBe(0)
  })

  it('never extends the clip past the end of the media file', () => {
    const { start, end } = adjustClipBoundary({
      clip: { start: 1000, end: 2000 },
      boundary: 'end',
      direction: 1,
      mediaDurationMs: 2050,
    })
    expect(end).toBe(2050)
    expect(start).toBe(1000)
  })

  it('respects a custom step size', () => {
    expect(
      adjustClipBoundary({
        clip,
        boundary: 'end',
        direction: 1,
        step: 500,
      })
    ).toEqual({ start: 1000, end: 2500 })
  })
})
