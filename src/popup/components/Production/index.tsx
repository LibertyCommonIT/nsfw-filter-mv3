import { Input, Select } from 'antd'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  setTrainedModel,
  setFilterEffect
} from '../../redux/actions/settings/index'
import { RootState } from '../../redux/reducers'
import { SettingsState } from '../../redux/reducers/settings'
import { StatisticsState } from '../../redux/reducers/statistics'

import { Container, Stats, DropdownRow, TextBox } from './styles'

const { Option } = Select
export const Production: React.FC = () => {
  const dispatch = useDispatch()
  const {
    trainedModel,
    filterEffect
  } = useSelector<RootState>((state) => state.settings) as SettingsState
  const { totalBlocked } = useSelector<RootState>((state) => state.statistics) as StatisticsState

  return (
    (<Container>
      <Stats>
        <span>Total blocked: {totalBlocked}</span>
      </Stats>
      <DropdownRow>
        <span>Filter effect</span>
        <Select
          defaultValue={filterEffect}
          style={{ width: 140 }}
          onChange={value => dispatch(setFilterEffect(value))}
        >
          <Option value="hide">Hide</Option>
          <Option value="blur">Blur</Option>
        </Select>
      </DropdownRow>
      <DropdownRow>
        <span>Trained model</span>
        <Select
          defaultValue={trainedModel}
          style={{ width: 140 }}
          onChange={value => dispatch(setTrainedModel(value))}
        >
          <Option value="MobileNet_v2">MobileNet v2</Option>
          <Option value="InceptionV3">InceptionV3</Option>
        </Select>
      </DropdownRow>
    </Container>)
  )
}
