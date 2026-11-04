import { Reducer } from 'redux'
import A from '../types/ActionType'
import { DEFAULT_CLIP_TAIL_PADDING_MS } from '../utils/clipTailPadding'

export const initialState: SettingsState = {
  mediaFolderLocation: null,
  assetsDirectories: [],
  warnBeforeConvertingMedia: true,
  viewMode: 'VERTICAL',
  clipTailPaddingMs: DEFAULT_CLIP_TAIL_PADDING_MS,
}

const settings: Reducer<SettingsState, Action> = (
  state = initialState,
  action
): SettingsState => {
  switch (action.type) {
    case A.setMediaFolderLocation:
      return {
        ...state,
        mediaFolderLocation: action.directoryPath,
      }

    case A.addAssetsDirectories:
      return {
        ...state,
        assetsDirectories: [
          ...new Set([...state.assetsDirectories, ...action.directoryPaths]),
        ],
      }

    case A.removeAssetsDirectories:
      return {
        ...state,
        assetsDirectories: state.assetsDirectories.filter(
          (path) => !action.directoryPaths.includes(path)
        ),
      }

    case A.overrideSettings:
      return {
        ...state,
        ...action.settings,
      }

    case A.setViewMode:
      return { ...state, viewMode: action.viewMode }

    case A.addActiveDictionary: {
      const activeDictionaries = new Set([
        ...(state.activeDictionaries || []).filter(
          (d) => d.type === action.dictionaryType
        ),
        { id: action.id, type: action.dictionaryType },
      ])
      return {
        ...state,
        activeDictionaries: [...activeDictionaries],
      }
    }

    case A.removeActiveDictionary:
      return {
        ...state,
        activeDictionaries: (state.activeDictionaries || []).filter(
          (d) => d.id !== action.id
        ),
      }

    case A.setWarnBeforeConvertingMedia:
      return {
        ...state,
        warnBeforeConvertingMedia: action.warn,
      }

    case A.setClipTailPaddingMs:
      return {
        ...state,
        clipTailPaddingMs: action.clipTailPaddingMs,
      }

    default:
      return state
  }
}

export default settings
