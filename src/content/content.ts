import { createStore } from 'redux'

import { createChromeStore } from '../popup/redux/chrome-storage'
import { rootReducer } from '../popup/redux/reducers'

import { DOMWatcher } from './DOMWatcher/DOMWatcher'
import { ImageFilter } from './Filter/ImageFilter'

const init = (): void => {
  // Inject a temporary global blur so images are never shown unfiltered
  // until our content script has initialized and applied per-image styling.
  const STYLE_ID = 'nsfw-filter-initial-style'
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.innerHTML = 'img { filter: blur(25px); visibility: visible !important }'
    document.head?.appendChild(style)
  }
  const imageFilter = new ImageFilter()
  const domWatcher = new DOMWatcher(imageFilter)

  createChromeStore({ createStore })(rootReducer)
    .then(store => {
      const { filterEffect, websites } = store.getState().settings
      imageFilter.setSettings({ filterEffect })
      // remove the global initial blur so we can rely on per-image inline filter
      const styleEl = document.getElementById(STYLE_ID)
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl)
      if (websites.includes(window.location.hostname) === false) {
        domWatcher.watch()
      }
    })
    .catch(error => {
      console.warn(error)
      imageFilter.setSettings({ filterEffect: 'blur' })
    })
}

// Ignore iframes, https://stackoverflow.com/a/326076/10432429
if (window.self === window.top) init()
