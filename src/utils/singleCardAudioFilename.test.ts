import {
  getSingleCardAudioBaseName,
  getSingleCardAudioFileName,
  timestampForFilename,
  MAX_FILENAME_BASE_LENGTH,
} from './singleCardAudioFilename'
import { describe, it, expect } from 'vitest'

describe('timestampForFilename', () => {
  it('formats milliseconds as HH-MM-SS', () => {
    expect(timestampForFilename(0)).toBe('00-00-00')
    expect(timestampForFilename(1000)).toBe('00-00-01')
    expect(timestampForFilename(61000)).toBe('00-01-01')
    expect(timestampForFilename(3661000)).toBe('01-01-01')
  })
})

describe('getSingleCardAudioBaseName', () => {
  it('uses the transcription when there is one', () => {
    expect(
      getSingleCardAudioBaseName({
        transcription: '笹を食べながら',
        mediaName: 'video.mp4',
      })
    ).toBe('笹を食べながら')
  })

  it('falls back to the media name', () => {
    expect(
      getSingleCardAudioBaseName({
        transcription: '   ',
        mediaName: 'my video.mp4',
      })
    ).toBe('my video')
  })

  it('falls back to "clip" when there is nothing to go on', () => {
    expect(getSingleCardAudioBaseName({})).toBe('clip')
  })

  it('truncates long names', () => {
    const name = getSingleCardAudioBaseName({
      transcription: 'a'.repeat(100),
    })
    expect(name.length).toBe(MAX_FILENAME_BASE_LENGTH)
  })
})

describe('getSingleCardAudioFileName', () => {
  it('combines the name with the clip time range', () => {
    expect(
      getSingleCardAudioFileName({
        transcription: 'hello',
        start: 1000,
        end: 3000,
      })
    ).toBe('hello_00-00-01-00-00-03.mp3')
  })
})
