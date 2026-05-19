import { createStore } from 'redux'

import { createChromeStore } from '../popup/redux/chrome-storage'
import { rootReducer } from '../popup/redux/reducers'

import { DOMWatcher } from './DOMWatcher/DOMWatcher'
import { ImageFilter } from './Filter/ImageFilter'

const init = (): void => {
  // Inject a global blur to ensure every image is blurred immediately on filtered pages.
  const STYLE_ID = 'nsfw-filter-initial-style'
  let style: HTMLStyleElement | null = document.getElementById(STYLE_ID) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    style.innerHTML = 'img { filter: blur(25px) !important; visibility: visible !important }'
    document.head?.appendChild(style)
  }

  const imageFilter = new ImageFilter()
  const domWatcher = new DOMWatcher(imageFilter)

  createChromeStore({ createStore })(rootReducer)
    .then(store => {
      const { filterEffect, websites } = store.getState().settings
      if (websites.includes(window.location.hostname)) {
        // Remove the global blur on excluded sites.
        style?.parentNode?.removeChild(style)
        return
      }

      imageFilter.setSettings({ filterEffect })
      domWatcher.watch()
    })
    .catch(error => {
      console.warn(error)
      style?.parentNode?.removeChild(style)
      imageFilter.setSettings({ filterEffect: 'blur' })
    })
}

// Ignore iframes, https://stackoverflow.com/a/326076/10432429
if (window.self === window.top) init()
