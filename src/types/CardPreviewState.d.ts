/**
 * The state of the single card preview.
 *
 * The audio of the previewed card is generated on demand in the main
 * process, so that the user hears exactly the audio that would be exported.
 */
declare type CardPreviewState = {
  clipId: ClipId | null
  mediaFileId: MediaFileId | null
  status: 'IDLE' | 'LOADING' | 'READY' | 'FAILED'
  /** the id of the generated audio file, served by the local file server */
  audioFileId: string | null
  errorMessage: string | null
}
