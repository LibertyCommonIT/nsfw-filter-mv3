import { Input, Select, Button } from 'antd'
import React, { useState } from 'react'
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

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

const disableExtension = async (disableCode: string): Promise<boolean> => {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'))
    const config = await response.json()
    const hashedCode = await hashPassword(disableCode)
    
    if (hashedCode === config.disablePassword) {
      const extensionId = chrome.runtime.id
      await chrome.management.setEnabled(extensionId, false)
      return true
    }
    return false
  } catch (error) {
    console.error('Error disabling extension:', error)
    return false
  }
}

export const Production: React.FC = () => {
  const dispatch = useDispatch()
  const [disableCode, setDisableCode] = useState('')
  const [disableMessage, setDisableMessage] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)
  
  const {
    trainedModel,
    filterEffect
  } = useSelector<RootState>((state) => state.settings) as SettingsState
  const { totalBlocked } = useSelector<RootState>((state) => state.statistics) as StatisticsState

  const handleDisableExtension = async (): Promise<void> => {
    if (!disableCode.trim()) {
      setDisableMessage('Please enter a code')
      return
    }

    setIsDisabling(true)
    const success = await disableExtension(disableCode)
    
    if (success) {
      setDisableMessage('Extension disabled successfully!')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      setDisableMessage('Invalid code')
      setDisableCode('')
      setIsDisabling(false)
    }
  }

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
      <div>Disable extension temporarily</div>
      <TextBox>
        <Input
          placeholder="Enter disable code"
          type="password"
          value={disableCode}
          onChange={event => setDisableMessage('Extension Disabled') || setDisableCode(event.target.value)}
          disabled={isDisabling}
        />
        <Button 
          onClick={handleDisableExtension} 
          loading={isDisabling}
          style={{ marginTop: '8px' }}
        >
          Disable
        </Button>
        {disableMessage && (
          <div style={{ marginTop: '8px', color: disableMessage === 'Invalid code' ? 'red' : 'green' }}>
            {disableMessage}
          </div>
        )}
      </TextBox>
    </Container>)
  )
}
