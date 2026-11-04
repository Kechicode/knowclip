import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import r from '../../redux'
import { DialogProps } from './DialogProps'
import { getClozeSegments } from '../../utils/clozePreview'
import { getCardPreviewDialogKeyAction } from '../../utils/cardPreviewDialogKeys'
import { isTextFieldFocused } from '../../utils/isTextFieldFocused'
import css from './CardPreviewDialog.module.css'

const CardPreviewDialog = ({
  open,
  data: { mediaFileId, clipId },
}: DialogProps<CardPreviewDialogData>) => {
  const dispatch = useDispatch()

  const {
    flashcard,
    clip,
    mediaFile,
    localServerAddress,
    preview,
    videoStill,
  } = useSelector((state: AppState) => ({
    flashcard: r.getFlashcard(state, clipId),
    clip: r.getClip(state, clipId),
    mediaFile: r.getFile<MediaFile>(state, 'MediaFile', mediaFileId),
    localServerAddress: state.session.localServerAddress,
    preview: state.session.cardPreview,
    videoStill: r.getFileWithAvailability<VideoStillImageFile>(
      state,
      'VideoStillImage',
      clipId
    ),
  }))

  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT')
  const [previewClozeIndex, setPreviewClozeIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const close = useCallback(() => {
    dispatch(r.closeDialog())
  }, [dispatch])

  // Ask the main process to generate the preview audio. This is the same
  // audio that would be exported, so the user hears exactly what they'll get.
  useEffect(() => {
    if (!open) return
    dispatch(r.loadCardPreview(mediaFileId, clipId))
  }, [open, mediaFileId, clipId, dispatch])

  // Make sure the video still image is generated & registered so that it can
  // be served by the local file server.
  useEffect(() => {
    if (!open) return
    if (!mediaFile?.isVideo) return
    if (videoStill.availability.status === 'CURRENTLY_LOADED') return
    if (videoStill.availability.isLoading) return
    dispatch(
      r.openFileRequest({
        id: clipId,
        type: 'VideoStillImage',
        mediaFileId,
      })
    )
  }, [
    open,
    mediaFile,
    mediaFileId,
    clipId,
    videoStill.availability.status,
    videoStill.availability.isLoading,
    dispatch,
  ])

  const audioUrl = preview.audioFileId
    ? `${localServerAddress}/file/${preview.audioFileId}`
    : null

  // Keyboard shortcuts that work while the preview is open:
  // - Space plays (or pauses) the preview's audio.
  // - Left / Right switch between the front and the back of the card.
  // - Escape closes the preview.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getCardPreviewDialogKeyAction({
        key: event.key,
        isTextFieldFocused: isTextFieldFocused(),
      })
      if (!action) return

      switch (action.type) {
        case 'CLOSE': {
          event.preventDefault()
          event.stopPropagation()
          close()
          break
        }
        case 'SWITCH_SIDE': {
          event.preventDefault()
          event.stopPropagation()
          setSide(action.side)
          break
        }
        case 'TOGGLE_AUDIO': {
          const audio = audioRef.current
          if (!audio) break
          event.preventDefault()
          event.stopPropagation()
          if (audio.paused) {
            // Restart from the beginning if the clip has already finished.
            if (audio.ended) audio.currentTime = 0
            void audio.play()
          } else {
            audio.pause()
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  const imageUrl =
    flashcard?.image &&
    mediaFile?.isVideo &&
    videoStill.availability.status === 'CURRENTLY_LOADED'
      ? `${localServerAddress}/file/${videoStill.file?.id}`
      : null

  const fields = flashcard?.fields as Record<string, string> | undefined

  const clozeSegments = useMemo(() => {
    if (!fields || !flashcard?.cloze?.length) return null
    return getClozeSegments(
      fields.transcription || '',
      flashcard.cloze,
      previewClozeIndex
    )
  }, [fields, flashcard?.cloze, previewClozeIndex])

  if (!flashcard || !clip) {
    return (
      <Dialog open={open} className={css.container}>
        <DialogContent>
          <p>Could not find this card.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const hasImage = Boolean(imageUrl)
  const showPronunciation =
    side === 'BACK' && fields?.pronunciation && fields.pronunciation.trim()
  const showMeaning =
    side === 'BACK' && fields?.meaning && fields.meaning.trim()
  const showNotes = side === 'BACK' && fields?.notes && fields.notes.trim()
  const showTags = side === 'BACK' && flashcard.tags.length > 0

  return (
    <Dialog open={open} className={css.container} maxWidth="sm" fullWidth>
      <Tabs
        value={side === 'FRONT' ? 0 : 1}
        onChange={(_e, value) => setSide(value === 0 ? 'FRONT' : 'BACK')}
        className={css.tabs}
      >
        <Tab label="Front" />
        <Tab label="Back" />
      </Tabs>

      <DialogContent className={css.content}>
        {preview.status === 'LOADING' && (
          <div className={css.loading}>
            <CircularProgress size={24} />
            <p>Generating preview audio…</p>
          </div>
        )}

        {preview.status === 'FAILED' && (
          <div className={css.error}>
            <p>
              {preview.errorMessage ||
                'Could not generate the preview audio for this card.'}
            </p>
          </div>
        )}

        {preview.status === 'READY' && (
          <div className={css.cardContainer}>
            <div className={css.card}>
              {hasImage && (
                <div className={css.image}>
                  <img src={imageUrl || undefined} alt="" />
                </div>
              )}

              <div className={css.audioRow}>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    preload="metadata"
                  />
                )}
              </div>

              {side === 'FRONT' && (
                <p className={css.hint}>
                  The front of the card shows the audio
                  {hasImage ? ' and the image' : ''}. Press <kbd>Space</kbd> to
                  play it.
                </p>
              )}
              {side === 'BACK' && (
                <>
                  <p className="transcription">
                    {clozeSegments
                      ? clozeSegments.map((segment, i) =>
                          segment.isHidden ? (
                            <span key={i} className={css.clozeBlank}>
                              {'[...]'}
                            </span>
                          ) : (
                            <span key={i}>{segment.text}</span>
                          )
                        )
                      : fields?.transcription}
                  </p>

                  {showPronunciation && (
                    <p className="pronunciation">{fields?.pronunciation}</p>
                  )}

                  {showMeaning && <p className="meaning">{fields?.meaning}</p>}

                  {showNotes && <p className="notes">{fields?.notes}</p>}

                  {showTags && (
                    <div className="tags">{flashcard.tags.join(' ')}</div>
                  )}
                </>
              )}
            </div>

            {flashcard.cloze.length > 0 && side === 'BACK' && (
              <div className={css.clozeSelector}>
                {flashcard.cloze.map((_deletion, index) => (
                  <Tooltip key={index} title={`Cloze ${index + 1}`}>
                    <IconButton
                      size="small"
                      color={
                        index === previewClozeIndex ? 'secondary' : 'default'
                      }
                      onClick={() => setPreviewClozeIndex(index)}
                    >
                      {index + 1}
                    </IconButton>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <span className={css.shortcutHints}>
          <kbd>←</kbd> <kbd>→</kbd> switch sides · <kbd>Space</kbd> play ·{' '}
          <kbd>Esc</kbd> close
        </span>
        <Button onClick={close} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CardPreviewDialog
