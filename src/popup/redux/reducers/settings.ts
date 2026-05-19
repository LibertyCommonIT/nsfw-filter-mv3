
import { SettingsActionTypes } from '../actions/settings'
import {
  TOGGLE_LOGGING,
  SET_FILTER_EFFECT,
  SET_TRAINED_MODEL,
  SET_WEBSITE_LIST
} from '../actions/settings/settingsTypes'

export type SettingsState = {
  logging: boolean
  filterEffect: 'hide' | 'blur'
  trainedModel: 'MobileNet_v2' | 'InceptionV3'
  filterStrictness: number
  websites: string[]
}

const initialState: SettingsState = {
  logging: process.env.NODE_ENV === 'development',
  filterEffect: 'blur',
  trainedModel: 'MobileNet_v2',
  filterStrictness: 100,
  websites: []
}

export function settings (state = initialState, action: SettingsActionTypes): SettingsState {
  const normalizedState = { ...state, filterStrictness: 100 }

  switch (action.type) {
    case TOGGLE_LOGGING:
      return { ...normalizedState, logging: !normalizedState.logging }
    case SET_FILTER_EFFECT:
      return { ...normalizedState, filterEffect: action.payload.filterEffect }
    case SET_TRAINED_MODEL:
      return { ...normalizedState, trainedModel: action.payload.trainedModel }
    case SET_WEBSITE_LIST:
      return { ...normalizedState, websites: action.payload.websites }
    default:
      return normalizedState
  }
}
