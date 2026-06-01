
import { SettingsActionTypes } from '../actions/settings'
import {
  TOGGLE_LOGGING,
  SET_FILTER_EFFECT,
  SET_TRAINED_MODEL
} from '../actions/settings/settingsTypes'

export type SettingsState = {
  logging: boolean
  filterEffect: 'hide' | 'blur'
  trainedModel: 'MobileNet_v2' | 'InceptionV3'
  filterStrictness: number
}

const initialState: SettingsState = {
  logging: process.env.NODE_ENV === 'development',
  filterEffect: 'blur',
  trainedModel: 'MobileNet_v2',
  filterStrictness: 100
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
    default:
      return normalizedState
  }
}
