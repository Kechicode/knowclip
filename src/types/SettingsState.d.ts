// better to keep this lenient
// as strict changes will force
// migrations in redux-persist.

declare type SettingsState = {
  mediaFolderLocation: string | null
  assetsDirectories: string[]
  warnBeforeConvertingMedia: boolean
  viewMode: ViewMode
  /**
   * Extra time (in milliseconds) appended to the end of every exported clip,
   * so that the tail of the sound isn't cut off.
   */
  clipTailPaddingMs?: number
  activeDictionaries?: { id: FileId; type: DictionaryFileType }[]
}

declare type ViewMode = 'HORIZONTAL' | 'VERTICAL'
