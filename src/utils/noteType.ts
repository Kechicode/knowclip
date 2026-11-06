const SIMPLE_FIELDS: Array<SimpleFlashcardFieldName> = [
  'transcription',
  'meaning',
  'notes',
]

const TRANSLITERATION_FIELDS: Array<TransliterationFlashcardFieldName> = [
  'transcription',
  'pronunciation',
  'meaning',
  'notes',
]

export const getNoteTypeFields = (noteType: NoteType) =>
  noteType === 'Transliteration' ? TRANSLITERATION_FIELDS : SIMPLE_FIELDS
