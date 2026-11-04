import { describe, it, expect } from 'vitest'
import { getCardPreviewShortcutTarget } from './cardPreviewShortcut'

describe('getCardPreviewShortcutTarget', () => {
  const validState = {
    key: 'p',
    highlightedClipId: 'clip-1' as ClipId,
    currentMediaFileId: 'media-1' as MediaFileId,
  }

  it('returns the selected card when P is pressed', () => {
    expect(getCardPreviewShortcutTarget(validState)).toEqual({
      mediaFileId: 'media-1',
      clipId: 'clip-1',
    })
  })

  it('works with an uppercase P', () => {
    expect(
      getCardPreviewShortcutTarget({ ...validState, key: 'P' })
    ).not.toBeNull()
  })

  it('ignores other keys', () => {
    expect(getCardPreviewShortcutTarget({ ...validState, key: 'x' })).toBeNull()
  })

  it('ignores P when Ctrl is held', () => {
    expect(
      getCardPreviewShortcutTarget({ ...validState, ctrlKey: true })
    ).toBeNull()
  })

  it('ignores P while a text field is focused', () => {
    expect(
      getCardPreviewShortcutTarget({ ...validState, isTextFieldFocused: true })
    ).toBeNull()
  })

  it('ignores P when another dialog is already open', () => {
    expect(
      getCardPreviewShortcutTarget({ ...validState, isDialogOpen: true })
    ).toBeNull()
  })

  it('ignores P when no card is selected', () => {
    expect(
      getCardPreviewShortcutTarget({ ...validState, highlightedClipId: null })
    ).toBeNull()
  })

  it('ignores P when no media file is loaded', () => {
    expect(
      getCardPreviewShortcutTarget({ ...validState, currentMediaFileId: null })
    ).toBeNull()
  })
})
