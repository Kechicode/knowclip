import { describe, it, expect } from 'vitest'
import { getCardPreviewDialogKeyAction } from './cardPreviewDialogKeys'

describe('getCardPreviewDialogKeyAction', () => {
  it('switches to the front on ArrowLeft', () => {
    expect(getCardPreviewDialogKeyAction({ key: 'ArrowLeft' })).toEqual({
      type: 'SWITCH_SIDE',
      side: 'FRONT',
    })
  })

  it('switches to the back on ArrowRight', () => {
    expect(getCardPreviewDialogKeyAction({ key: 'ArrowRight' })).toEqual({
      type: 'SWITCH_SIDE',
      side: 'BACK',
    })
  })

  it('toggles the audio on Space', () => {
    expect(getCardPreviewDialogKeyAction({ key: ' ' })).toEqual({
      type: 'TOGGLE_AUDIO',
    })
  })

  it('toggles the audio on the legacy Spacebar key', () => {
    expect(getCardPreviewDialogKeyAction({ key: 'Spacebar' })).toEqual({
      type: 'TOGGLE_AUDIO',
    })
  })

  it('ignores other keys', () => {
    expect(getCardPreviewDialogKeyAction({ key: 'a' })).toBeNull()
    expect(getCardPreviewDialogKeyAction({ key: 'Enter' })).toBeNull()
    expect(getCardPreviewDialogKeyAction({ key: 'ArrowUp' })).toBeNull()
  })

  it("ignores Escape, which is handled by the dialog's onClose", () => {
    expect(getCardPreviewDialogKeyAction({ key: 'Escape' })).toBeNull()
  })

  it('ignores keys while a text field is focused', () => {
    expect(
      getCardPreviewDialogKeyAction({
        key: 'ArrowRight',
        isTextFieldFocused: true,
      })
    ).toBeNull()
    expect(
      getCardPreviewDialogKeyAction({ key: ' ', isTextFieldFocused: true })
    ).toBeNull()
  })
})
