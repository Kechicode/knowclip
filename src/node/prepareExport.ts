import r from '../redux'
import { toTimestamp } from './ffmpeg'
import { extname, basename } from 'path'
import { getNoteTypeFields } from '../utils/noteType'
import { getFileAvailability, encodeClozeDeletions } from '../selectors'
import { getVideoStillPngPath } from './getVideoStill'
import { sanitizeFileName } from '../utils/sanitizeFilename'
import moment from 'moment'
import { existsSync } from 'fs'
import { getMidpoint } from '../files/videoStillImageFile'
import { getClipTailPadding } from '../utils/clipTailPadding'

const roughEscape = (text: string) => text.replace(/[\n\r]/g, '<br />')

const FRONT_SIDE = '{{FrontSide}}'
const HR = '<hr id="answer" />'
const TRANSCRIPTION = '<p class="transcription">{{transcription}}</p>'
const CLOZE_TRANSCRIPTION =
  '<p class="transcription">{{cloze:transcription}}</p>'
const MEANING = '<p class="meaning">{{meaning}}</p>'
const PRONUNCIATION = `{{#pronunciation}}
<p class="pronunciation">{{pronunciation}}
</p>
{{/pronunciation}}`
const NOTES = `{{#notes}}
<p class="notes">{{notes}}
</p>
{{/notes}}`
const IMAGE = `{{#image}}
<div class="image">{{image}}</div>
{{/image}}`
const TAGS = `{{#Tags}}
<div class="tags">{{Tags}}</div>
{{/Tags}}`

const getListeningCard = (noteType: NoteType) => ({
  name: 'Listening',
  questionFormat: [IMAGE, `{{sound}}`].join('\n'),
  answerFormat: [
    FRONT_SIDE,
    HR,
    TRANSCRIPTION,
    ...(noteType === 'Transliteration' ? [PRONUNCIATION] : []),
    MEANING,
    NOTES,
    TAGS,
  ].join('\n\n'),
})

export const CLOZE_QUESTION_FORMAT = [IMAGE, CLOZE_TRANSCRIPTION, MEANING].join(
  '\n\n'
)
export const getCloseAnswerFormat = (noteType: NoteType) =>
  [
    CLOZE_QUESTION_FORMAT,
    `{{sound}}`,
    ...(noteType === 'Transliteration' ? [PRONUNCIATION] : []),
    NOTES,
    TAGS,
  ].join('\n\n')

const getCards = (noteType: NoteType) => [getListeningCard(noteType)]

export const TEMPLATE_CSS = `.card {
  font-family: Helvetica, Arial;
  font-size: 16px;
  text-align: center;
  color: black;
  background-color: white;
  line-height: 1.25
}

.transcription {
  font-size: 2em;
}

.pronunciation {
  font-style: italic;
  font-size: 1.4em;
}

.meaning {
  margin-top: 4em;
  margin-bottom: 4em;
}

.notes {
  background-color: #efefef;
  padding: .8em;
  border-radius: .2em;
  text-align: justify;
  max-width: 40em;
  margin-left: auto;
  margin-right: auto;
}

.tags {
  color: #999999;
  font-size: .8em;
}
`

/**
 * Builds the export specs for a single clip.
 *
 * The clip's end time is extended by the configured tail padding so that the
 * tail of a sound isn't cut off. It never extends past the end of the media
 * file.
 */
export const getClipSpec = (
  state: AppState,
  media: MediaFile,
  filePath: string,
  id: ClipId,
  tailPadding: number
): ClipSpecs => {
  const clip = r.getClip(state, id)
  const flashcard = r.getFlashcard(state, id)
  if (!clip) throw new Error('Could not find clip ' + id)
  if (!flashcard) throw new Error('Could not find flashcard ' + id)

  const extension = extname(filePath)
  const filenameWithoutExtension = basename(filePath, extension)

  const startTime = clip.start
  // The clip's own end time, used to name the output file. Keeping this
  // based on the clip itself (rather than the padded end time) means that
  // changing the tail padding doesn't rename existing media files.
  const clipEndTime = clip.end

  // Extend the end of the audio so that the tail of the sound isn't cut
  // off. Never extend past the end of the media file.
  const mediaEndTime = media.durationSeconds
    ? Math.round(media.durationSeconds * 1000)
    : Infinity
  const endTime = Math.min(clipEndTime + tailPadding, mediaEndTime)

  const outputFilename =
    sanitizeFileName(
      `${filenameWithoutExtension.slice(0, 20)}__${media.id}`
    ) +
    `__${toTimestamp(startTime, '!', '!')}_${toTimestamp(clipEndTime, '!', '!')}.mp3`

  const getSeconds = (seconds?: number) =>
    typeof seconds === 'number'
      ? seconds
      : +(getMidpoint(startTime, clipEndTime) / 1000).toFixed(3)

  return {
    sourceFilePath: filePath,
    startTime,
    endTime,
    outputFilename,
    flashcardSpecs: {
      id: clip.id,
      fields: [
        ...Object.values(flashcard.fields).map(roughEscape),
        `[sound:${outputFilename}]`,
        flashcard.image
          ? `<img src="${basename(
              getVideoStillPngPath(
                flashcard.image.id,
                filePath,
                getSeconds(flashcard.image.seconds)
              )
            )}" />`
          : '',
      ],
      tags: flashcard.tags.map((t) => t.replace(/\s+/g, '_')).join(' '),
      image: flashcard.image
        ? {
            id: flashcard.image.id,
            seconds: getSeconds(flashcard.image.seconds),
          }
        : null,

      clozeDeletions: flashcard.cloze.length
        ? roughEscape(
            encodeClozeDeletions(
              flashcard.fields.transcription,
              flashcard.cloze
            )
          )
        : undefined,
    },
  }
}

/**
 * Returns the export specs for a single clip, for exporting it as an mp3 file.
 *
 * Unlike `getApkgExportData`, this doesn't need a project, and it doesn't
 * build any of the Anki deck structures.
 */
export const getSingleClipExportData = (
  state: AppState,
  mediaFileId: MediaFileId,
  clipId: ClipId
):
  | { type: 'SUCCESS'; clipSpec: ClipSpecs }
  | { type: 'MISSING MEDIA FILE'; mediaFile: MediaFile | null } => {
  const media = r.getFile<MediaFile>(state, 'MediaFile', mediaFileId)
  if (!media) return { type: 'MISSING MEDIA FILE', mediaFile: null }

  const fileLoaded = getFileAvailability(state, media)
  if (!fileLoaded.filePath || !existsSync(fileLoaded.filePath))
    return { type: 'MISSING MEDIA FILE', mediaFile: media }

  const clipSpec = getClipSpec(
    state,
    media,
    fileLoaded.filePath,
    clipId,
    getClipTailPadding(state)
  )

  return { type: 'SUCCESS', clipSpec }
}

/** Returns either valid export data or a list of missing media files. */
export const getApkgExportData = async (
  state: AppState,
  project: ProjectFile,
  mediaIdToClipsIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
) => {
  const fieldNames = getNoteTypeFields(project.noteType)
  const mediaFiles = r.getProjectMediaFiles(state, project.id)
  const tailPadding = getClipTailPadding(state)

  const missingMediaFiles = mediaFiles.filter((mediaFile) => {
    if (!mediaIdToClipsIds[mediaFile.id].length) return false

    const fileLoaded = getFileAvailability(state, mediaFile)
    return (
      !fileLoaded || !fileLoaded.filePath || !existsSync(fileLoaded.filePath)
    )
  })
  if (missingMediaFiles.length > 0)
    return { type: 'MISSING MEDIA FILES' as const, missingMediaFiles }

  const clipSpecs: ClipSpecs[] = []

  for (const mediaFileId in mediaIdToClipsIds) {
    const clipIds = mediaIdToClipsIds[mediaFileId]
    if (!clipIds.length) continue

    const media = r.getFile<MediaFile>(
      state,
      'MediaFile',
      mediaFileId
    ) as MediaFile

    const fileLoaded = getFileAvailability(state, media)
    if (!fileLoaded.filePath)
      throw new Error(`Please open ${media.name} and try again.`)

    for (const id of clipIds) {
      if (!id) continue

      clipSpecs.push(
        getClipSpec(state, media, fileLoaded.filePath, id, tailPadding)
      )
    }
  }

  const projectId = moment(project.createdAt).valueOf()

  // The deck name is used as-is, without any additional branding, so that the
  // deck looks exactly like the user named their project.
  const deckName = project.name
  const finalFieldNames = [...fieldNames, 'sound', 'image']
  const fields = finalFieldNames.map((fn) => ({ name: fn }))
  const sortf = fields.findIndex((f) => f.name === 'sound')

  const apkgData: ApkgExportData = {
    clips: clipSpecs,
    projectId,
    deckName,
    noteModel: {
      name: `Audio note (${project.name})`,
      id: projectId + 1,
      flds: fields,
      sortf,
      req: getCards(project.noteType).map((t, i) => [
        i,
        'all',
        [finalFieldNames.indexOf('sound')],
      ]),
      css: TEMPLATE_CSS,
      tmpls: getCards(project.noteType).map((template) => ({
        name: template.name,
        qfmt: template.questionFormat,
        afmt: template.answerFormat,
      })),
    },
    clozeNoteModel: {
      id: projectId + 2,
      name: `Cloze (${project.name})`,
      sortf,
      flds: fields,
      css: TEMPLATE_CSS,
      tmpl: {
        name: 'Cloze',
        qfmt: CLOZE_QUESTION_FORMAT,
        afmt: getCloseAnswerFormat(project.noteType),
      },
    },
  }
  return { type: 'SUCCESS' as const, apkgData }
}
