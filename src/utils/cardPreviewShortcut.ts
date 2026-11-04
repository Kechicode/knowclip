/**
 * Logic for the keyboard shortcut that opens the preview of a single card.
 *
 * The shortcut is the "P" key. It only applies when:
 * - The key is "p" (either case) and no Ctrl/Cmd modifier is held.
 * - The user isn't typing in a text field.
 * - No other dialog is already open (we don't want to stack dialogs).
 * - A card is selected and a media file is loaded.
 */

export const PREVIEW_SHORTCUT_KEY = 'p'

export type CardPreviewShortcutOptions = {
  /** The key that was pressed. */
  key: string
  /** Whether Ctrl (or Cmd) was held. */
  ctrlKey?: boolean
  /** Whether the user is typing in a text field. */
  isTextFieldFocused?: boolean
  /** Whether another dialog is already open. */
  isDialogOpen?: boolean
  /** The currently selected card, if any. */
  highlightedClipId?: ClipId | null
  /** The media file that's currently loaded, if any. */
  currentMediaFileId?: MediaFileId | null
}

export type CardPreviewShortcutTarget = {
  mediaFileId: MediaFileId
  clipId: ClipId
}

/**
 * Returns the card that should be previewed for the given keypress, or null
 * if the shortcut shouldn't do anything.
 */
export const getCardPreviewShortcutTarget = ({
  key,
  ctrlKey,
  isTextFieldFocused,
  isDialogOpen,
  highlightedClipId,
  currentMediaFileId,
}: CardPreviewShortcutOptions): CardPreviewShortcutTarget | null => {
  if (key.toLowerCase() !== PREVIEW_SHORTCUT_KEY) return null
  if (ctrlKey) return null
  if (isTextFieldFocused) return null
  if (isDialogOpen) return null
  if (!highlightedClipId) return null
  if (!currentMediaFileId) return null

  return { mediaFileId: currentMediaFileId, clipId: highlightedClipId }
}
