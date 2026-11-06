import React, { useCallback, memo } from 'react'
import cn from 'clsx'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@mui/material'
import r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import {
  Edit,
  Photo,
  Delete,
  Loop,
  Download,
  Merge,
  Visibility,
  CallSplit,
  PlayArrow,
} from '@mui/icons-material'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import { TransliterationFlashcardFields } from '../types/Project'
import useClozeControls from '../utils/clozeField/useClozeControls'
import ClozeButtons from './FlashcardSectionDisplayClozeButtons'
import { getKeyboardShortcut } from './KeyboardShortcuts'
import { requestSplitAudition } from '../utils/splitPlayhead'

import { flashcardSectionDisplayCard$ as $ } from './FlashcardSectionDisplayCard.testLabels'

const FlashcardSectionDisplayCard = memo(
  ({
    mediaFile,
    onDoubleClickField,
    flashcard,
    className,
  }: {
    className?: string
    mediaFile: MediaFile
    flashcard: Flashcard
    clipId: ClipId
    onDoubleClickField?: (fieldName: FlashcardFieldName) => void
  }) => {
    const { fieldsToTracks, viewMode, isLoopOn, hasOverlappingCards } =
      useSelector((state: AppState) => ({
        allTags: r.getAllTags(state),
        currentNoteType: r.getCurrentNoteType(state),
        isLoopOn: r.getLoopState(state),
        fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
        viewMode: state.settings.viewMode,
        hasOverlappingCards:
          r.getOverlappingClipIds(state, flashcard.id).length > 0,
      }))

    const { fields: f } = flashcard
    const fields = f as TransliterationFlashcardFields

    const handleDoubleClick: (fn: TransliterationFlashcardFieldName) => void =
      useCallback(
        (fieldName) => {
          if (onDoubleClickField) onDoubleClickField(fieldName)
        },
        [onDoubleClickField]
      )

    const dispatch = useDispatch()
    const startEditing = useCallback(() => {
      dispatch(r.startEditingCards())
    }, [dispatch])

    const toggleIncludeStill = useCallback(() => {
      dispatch(
        r.editClip(flashcard.id, null, {
          image: flashcard.image
            ? null
            : { type: 'VideoStillImage', id: flashcard.id },
        })
      )
    }, [dispatch, flashcard.id, flashcard.image])

    const deleteClipAndCard = useCallback(() => {
      dispatch(r.deleteCard(flashcard.id))
    }, [dispatch, flashcard.id])

    const exportSingleCard = useCallback(() => {
      dispatch(r.exportSingleCardRequest(mediaFile.id, flashcard.id))
    }, [dispatch, mediaFile.id, flashcard.id])

    const previewCard = useCallback(() => {
      dispatch(r.cardPreviewDialog(mediaFile.id, flashcard.id))
    }, [dispatch, mediaFile.id, flashcard.id])

    const mergeOverlappingCards = useCallback(() => {
      dispatch(r.mergeOverlappingClips(flashcard.id))
    }, [dispatch, flashcard.id])

    const splitCard = useCallback(() => {
      dispatch(r.splitClipRequest(flashcard.id))
    }, [dispatch, flashcard.id])

    const playSplitSide = useCallback(
      (side: 'left' | 'right') => {
        requestSplitAudition(flashcard.id, side)
      },
      [flashcard.id]
    )

    const clozeControls = useClozeControls({
      deletions: flashcard.cloze,
      onNewClozeCard: useCallback(
        (deletion) => {
          dispatch(
            r.addClozeDeletion(flashcard.id, flashcard.cloze || [], deletion)
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
      onEditClozeCard: useCallback(
        (clozeIndex: number, ranges: ClozeRange[]) => {
          dispatch(
            r.editClozeDeletion(
              flashcard.id,
              flashcard.cloze,
              clozeIndex,
              ranges
            )
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
      onDeleteClozeCard: useCallback(
        (clozeIndex: number) => {
          dispatch(
            r.removeClozeDeletion(flashcard.id, flashcard.cloze, clozeIndex)
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
    })
    const toggleLoop = useCallback(
      () => dispatch(r.toggleLoop('BUTTON')),
      [dispatch]
    )

    return (
      <FlashcardSectionDisplay
        className={cn(className, css.card, $.container)}
        mediaFile={mediaFile}
        fieldsToTracks={fieldsToTracks}
        fields={fields}
        viewMode={viewMode}
        onDoubleClickField={handleDoubleClick}
        clozeControls={clozeControls}
        menuItems={
          <>
            {fields.transcription.trim() && (
              <ClozeButtons controls={clozeControls} />
            )}
            <Tooltip
              title={`Edit card (${getKeyboardShortcut(
                'Start editing fields'
              )} key)`}
            >
              <IconButton
                className={css.editCardButton}
                onClick={startEditing}
                id={$.editButton}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export this card's audio as an mp3 file">
              <IconButton
                className={css.editCardButton}
                onClick={exportSingleCard}
                id={$.exportButton}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={`Preview how this card will look in Anki (${getKeyboardShortcut(
                'Preview selected card'
              )} key)`}
            >
              <IconButton
                className={css.editCardButton}
                onClick={previewCard}
                id={$.previewButton}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
          </>
        }
        secondaryMenuItems={
          <>
            <Tooltip
              title={`Loop selection (${getKeyboardShortcut('Toggle loop')})`}
            >
              <IconButton
                onClick={toggleLoop}
                color={isLoopOn ? 'secondary' : 'default'}
              >
                <Loop />
              </IconButton>
            </Tooltip>
            {mediaFile.isVideo && (
              <Tooltip
                title={
                  flashcard.image
                    ? 'Click to leave out image'
                    : 'Click to include image'
                }
              >
                <IconButton
                  className={css.editCardButton}
                  onClick={toggleIncludeStill}
                  style={{
                    color: flashcard.image ? 'rgba(0, 0, 0, 0.54)' : '#ddd',
                  }}
                >
                  <Photo />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete clip and flashcard">
              <IconButton onClick={deleteClipAndCard}>
                <Delete />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={`Play the part before the playhead (${getKeyboardShortcut(
                'Play left side of split'
              )})`}
            >
              <IconButton
                onClick={() => playSplitSide('left')}
                id={$.playLeftButton}
              >
                <PlayArrow style={{ transform: 'scaleX(-1)' }} />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={`Play the part after the playhead (${getKeyboardShortcut(
                'Play right side of split'
              )})`}
            >
              <IconButton
                onClick={() => playSplitSide('right')}
                id={$.playRightButton}
              >
                <PlayArrow />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={`Split this card at the playhead (${getKeyboardShortcut(
                'Split card at playhead'
              )})`}
            >
              <IconButton onClick={splitCard} id={$.splitButton}>
                <CallSplit />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={`Merge with overlapping cards (${getKeyboardShortcut(
                'Merge overlapping cards'
              )} key)`}
            >
              <IconButton
                onClick={mergeOverlappingCards}
                id={$.mergeButton}
                disabled={!hasOverlappingCards}
              >
                <Merge />
              </IconButton>
            </Tooltip>
          </>
        }
      />
    )
  }
)

export default FlashcardSectionDisplayCard
