import { Input, Select, Button } from 'antd'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  setTrainedModel,
  setFilterEffect
} from '../../redux/actions/settings/index'
import { disableExtension } from '../../utils/disableExtension'
import { RootState } from '../../redux/reducers'
import { SettingsState } from '../../redux/reducers/settings'
import { StatisticsState } from '../../redux/reducers/statistics'

import { Container, Stats, DropdownRow, TextBox } from './styles'

const { Option } = Select

type DisableState = {
  code: string
  message: string
  loading: boolean
}

const initialDisableState: DisableState = {
  code: '',
  message: '',
  loading: false
}

export const Production: React.FC = () => {
  const dispatch = useDispatch()
  const [disableState, setDisableState] = useState(initialDisableState)
  const { code, message, loading } = disableState

  const {
    trainedModel,
    filterEffect
  } = useSelector<RootState>((state) => state.settings) as SettingsState
  const { totalBlocked } = useSelector<RootState>((state) => state.statistics) as StatisticsState

  const handleDisableExtension = async (): Promise<void> => {
    if (!code.trim()) {
      setDisableState(prev => ({ ...prev, message: 'Please enter a code' }))
      return
    }

    setDisableState(prev => ({ ...prev, loading: true, message: '' }))
    const success = await disableExtension(code)

    if (success) {
      setDisableState(prev => ({ ...prev, message: 'Extension disabled successfully!' }))
      setTimeout(() => window.location.reload(), 1000)
      return
    }

    setDisableState({ code: '', message: 'Invalid code', loading: false })
  }

  return (
    (<Container>
      <Stats>
        <span>Total blocked: {totalBlocked}</span>
      </Stats>
      <DropdownRow>
        <span>Filter effect</span>
        <Select
          value={filterEffect}
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
          value={trainedModel}
          style={{ width: 140 }}
          onChange={value => dispatch(setTrainedModel(value))}
        >
          <Option value="MobileNet_v2">MobileNet v2</Option>
          <Option value="InceptionV3">InceptionV3</Option>
        </Select>
      </DropdownRow>
      <div>Disable extension temporarily</div>
      <TextBox>
        <Input
          placeholder="Enter disable code"
          type="password"
          value={code}
          onChange={event => setDisableState(prev => ({ ...prev, code: event.target.value, message: '' }))}
          disabled={loading}
        />
        <Button
          type="primary"
          onClick={handleDisableExtension}
          loading={loading}
          style={{ marginTop: 8 }}
        >
          Disable
        </Button>
        {message && (
          <div style={{ marginTop: '8px', color: message === 'Invalid code' ? 'red' : 'green' }}>
            {message}
          </div>
        )}
      </TextBox>
    </Container>)
  )
}
