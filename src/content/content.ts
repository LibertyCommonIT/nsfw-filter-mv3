import { createStore } from 'redux'

import { createChromeStore } from '../popup/redux/chrome-storage'
import { rootReducer } from '../popup/redux/reducers'

import { DOMWatcher } from './DOMWatcher/DOMWatcher'
import { ImageFilter } from './Filter/ImageFilter'

const init = (): void => {
  // Inject a global blur to ensure every image and inline background-image starts blurred.
  const STYLE_ID = 'nsfw-filter-initial-style'
  let style: HTMLStyleElement | null = document.getElementById(STYLE_ID) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    style.innerHTML = 'img, [data-src], [style*="background-image"] { filter: blur(25px) !important; visibility: visible !important }'
    document.head?.appendChild(style)
  }

  const imageFilter = new ImageFilter()
  const domWatcher = new DOMWatcher(imageFilter)

  createChromeStore({ createStore })(rootReducer)
    .then(store => {
      const { filterEffect } = store.getState().settings
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
