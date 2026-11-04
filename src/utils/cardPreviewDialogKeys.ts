/**
 * Keyboard shortcuts that work while the card preview dialog is open.
 *
 * - Left / Right switch between the front and the back of the card.
 * - Space plays (or pauses) the preview's audio.
 *
 * Escape is not handled here: MUI's Dialog handles it through its `onClose`
 * callback, because it stops the propagation of the Escape keypress before
 * it reaches the window.
 */

export type CardPreviewSide = 'FRONT' | 'BACK'

export type CardPreviewDialogKeyAction =
  | { type: 'SWITCH_SIDE'; side: CardPreviewSide }
  | { type: 'TOGGLE_AUDIO' }

export type CardPreviewDialogKeyOptions = {
  /** The key that was pressed. */
  key: string
  /** Whether the user is typing in a text field. */
  isTextFieldFocused?: boolean
}

/**
 * Returns the action that a keypress should trigger in the preview dialog, or
 * null if the key isn't a shortcut.
 */
export const getCardPreviewDialogKeyAction = ({
  key,
  isTextFieldFocused,
}: CardPreviewDialogKeyOptions): CardPreviewDialogKeyAction | null => {
  // Don't hijack keys while the user is typing.
  if (isTextFieldFocused) return null

  if (key === 'ArrowLeft') return { type: 'SWITCH_SIDE', side: 'FRONT' }

  if (key === 'ArrowRight') return { type: 'SWITCH_SIDE', side: 'BACK' }

  if (key === ' ' || key === 'Spacebar') return { type: 'TOGGLE_AUDIO' }

  return null
}
