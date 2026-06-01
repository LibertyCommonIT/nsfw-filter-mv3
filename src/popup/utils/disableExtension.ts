type DisableConfig = {
  disablePassword: string
}

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const disableExtension = async (disableCode: string): Promise<boolean> => {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'))
    const config = (await response.json()) as DisableConfig
    const hashedCode = await hashPassword(disableCode)

    if (hashedCode !== config.disablePassword) {
      return false
    }

    await chrome.management.setEnabled(chrome.runtime.id, false)
    return true
  } catch (error) {
    console.error('Error disabling extension:', error)
    return false
  }
}
