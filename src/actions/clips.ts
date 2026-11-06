import { DeepPartial } from 'redux'
import { trimClozeRangeOverlaps } from '../utils/clozeRanges'
import A from '../types/ActionType'
import { PrimaryClip, WaveformDrag, WaveformRegion } from 'clipwave'
import { SubtitlesCardBase } from '../selectors'
import { KnowclipActionCreatorsSubset } from '.'

export type OverlappedCardBaseDuringClipStretch = {
  subtitlesCardBase: SubtitlesCardBase
  isSelectable: boolean
}

export const clipsActions = {
  addClipRequest: (waveformDrag: WaveformDrag) => ({
    type: A.addClipRequest,
    waveformDrag,
  }),

  stretchClip: (
    stretchedClip: { id: Clip['id']; start: number; end: number },
    overlappedClips: PrimaryClip[],
    unstretchedClip: { id: Clip['id']; start: number; end: number },
    frontOverlappedSubtitlesCardBases: OverlappedCardBaseDuringClipStretch[],
    backOverlappedSubtitlesCardBases: OverlappedCardBaseDuringClipStretch[],
    newRegions: WaveformRegion[]
  ) => ({
    type: A.stretchClip,
    stretchedClip,
    overlappedClips,
    unstretchedClip,
    frontOverlappedSubtitlesCardBases,
    backOverlappedSubtitlesCardBases,
    newRegions,
  }),

  addClip: (
    clip: Clip,
    flashcard: Flashcard,
    startEditing: boolean = false
  ) => ({
    type: A.addClip,
    clip,
    flashcard,
    startEditing,
  }),

  /**
   * Resize a clip by moving one of its boundaries.
   *
   * Used by the keyboard shortcuts for adjusting the selected card's range.
   */
  resizeClip: (id: ClipId, start: number, end: number) => ({
    type: A.resizeClip,
    id,
    start,
    end,
  }),

  addClips: (
    clips: Array<Clip>,
    flashcards: Array<Flashcard>,
    fileId: MediaFileId
  ) => ({
    type: A.addClips,
    clips,
    flashcards,
    fileId,
  }),

  /** Pass `null` to indicate waveform reset */
  selectWaveformItem: (selection: WaveformSelection | null) => ({
    type: A.selectWaveformItem,
    selection,
  }),

  editClip: (
    id: ClipId,
    override: DeepPartial<Clip> | null,
    flashcardOverride: DeepPartial<Flashcard> | null
  ) => ({
    type: A.editClip,
    id,
    override,
    flashcardOverride,
  }),

  editClips: (
    edits: {
      id: ClipId
      override: DeepPartial<Clip> | null
      flashcardOverride: DeepPartial<Flashcard> | null
    }[]
  ) => ({
    type: A.editClips,
    edits,
  }),

  mergeClips: (ids: Array<ClipId>, newSelection: WaveformSelection) => ({
    type: A.mergeClips,
    ids,
    newSelection,
  }),

  mergeOverlappingClips: (clipId: ClipId) => ({
    type: A.mergeOverlappingClips,
    clipId,
  }),

  /** Open the split dialog if the playhead is inside this clip. */
  splitClipRequest: (clipId: ClipId) => ({
    type: A.splitClipRequest,
    clipId,
  }),

  /**
   * Split a clip at `splitAt`. The original clip keeps the first half.
   * Audio is not copied; later export and preview cut the source media
   * using these start and end times.
   */
  splitClip: (split: {
    clipId: ClipId
    newClipId: ClipId
    splitAt: number
    leftTranscription: string
    rightTranscription: string
  }) => ({
    type: A.splitClip,
    ...split,
    newSelection: { type: 'Clip' as const, id: split.newClipId },
  }),

  moveClip: (
    id: ClipId,
    deltaX: number,
    overlapIds: Array<ClipId>,
    newRegions: WaveformRegion[]
  ) => ({
    type: A.moveClip,
    id,
    deltaX,
    overlapIds,
    newRegions,
  }),

  setFlashcardField: (
    id: ClipId,
    key: FlashcardFieldName,
    value: string,
    caretLocation: number
  ) => ({
    type: A.setFlashcardField,
    id,
    key,
    value,
    caretLocation,
  }),

  addFlashcardTag: (id: ClipId, text: string) => ({
    type: A.addFlashcardTag,
    id,
    text,
  }),

  deleteFlashcardTag: (id: ClipId, index: number, tag: string) => ({
    type: A.deleteFlashcardTag,
    id,
    index,
    tag,
  }),

  deleteCard: (id: ClipId) => ({
    type: A.deleteCard,
    id,
  }),

  deleteCards: (ids: Array<ClipId>) => ({
    type: A.deleteCards,
    ids,
  }),
} satisfies KnowclipActionCreatorsSubset

const addFlashcardImage = (id: ClipId, seconds?: number) => {
  const image: FlashcardImage = seconds
    ? {
        id,
        type: 'VideoStillImage',
        seconds,
      }
    : { id, type: 'VideoStillImage' }
  return clipsActions.editClip(id, null, {
    image,
  })
}

const removeFlashcardImage = (id: ClipId) =>
  clipsActions.editClip(id, null, { image: null })

const addClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  deletion: ClozeDeletion
) =>
  clipsActions.editClip(id, null, {
    cloze: trimClozeRangeOverlaps(
      currentCloze,
      deletion,
      currentCloze.length
    ).filter(({ ranges }) => ranges.length),
  })

const editClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number,
  ranges: ClozeDeletion['ranges']
) =>
  clipsActions.editClip(id, null, {
    cloze: trimClozeRangeOverlaps(currentCloze, { ranges }, clozeIndex),
  })

const removeClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number
) =>
  clipsActions.editClip(id, null, {
    cloze: currentCloze.filter((_c, i) => i !== clozeIndex),
  })

export const compositeClipsActions = {
  addFlashcardImage,
  removeFlashcardImage,
  addClozeDeletion,
  editClozeDeletion,
  removeClozeDeletion,
}
