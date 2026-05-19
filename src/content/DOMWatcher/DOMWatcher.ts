// Highly sensitive code, make sure that you know what you're doing
// https://stackoverflow.com/a/39332340/10432429

// @TODO Canvas and SVG
// @TODO Lazy loading for div.style.background-image?
// @TODO <div> and <a>
// @TODO video

import { IImageFilter } from '../Filter/ImageFilter'

export type IDOMWatcher = {
  watch: () => void
}

export class DOMWatcher implements IDOMWatcher {
  private readonly observer: MutationObserver
  private readonly imageFilter: IImageFilter

  constructor (imageFilter: IImageFilter) {
    this.imageFilter = imageFilter
    this.observer = new MutationObserver(this.callback.bind(this))
  }

  public watch (): void {
    // Scan images and visual elements already present in the DOM (e.g. direct image URLs, fast-loading pages)
    this.findAndCheckAllVisualElements(document.documentElement)
    this.observer.observe(document, DOMWatcher.getConfig())
  }

  private callback (mutationsList: MutationRecord[]): void {
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i]
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        this.findAndCheckAllVisualElements(mutation.target as Element)
      } else if (mutation.type === 'attributes') {
        this.checkAttributeMutation(mutation)
      }
    }
  }

  private findAndCheckAllVisualElements (element: Element): void {
    const images = element.getElementsByTagName('img')
    for (let i = 0; i < images.length; i++) {
      this.imageFilter.analyzeImage(images[i], false)
    }

    const elements = element.querySelectorAll<HTMLElement>('[data-src], [srcset], [style*="background-image"]')
    for (let i = 0; i < elements.length; i++) {
      const current = elements[i]
      if (current.nodeName === 'IMG') continue
      this.imageFilter.analyzeElement(current, false)
    }
  }

  private checkAttributeMutation (mutation: MutationRecord): void {
    const target = mutation.target as HTMLElement
    const attrName = mutation.attributeName

    if (target.nodeName === 'IMG') {
      const isSrcAttribute = attrName === 'src' || attrName === 'srcset' || attrName === 'data-src'
      const isStyleAttribute = attrName === 'style'

      if (isStyleAttribute) {
        this.imageFilter.checkStyleMutation(target as HTMLImageElement)
        return
      }

      if (isSrcAttribute) {
        this.imageFilter.analyzeImage(target as HTMLImageElement, true)
      }

      return
    }

    const isBackgroundAttribute = attrName === 'style' || attrName === 'class' || attrName === 'data-src'
    if (!isBackgroundAttribute) return

    if (attrName === 'style' || attrName === 'class') {
      this.imageFilter.checkStyleMutation(target)
    }

    if (attrName === 'data-src') {
      this.imageFilter.analyzeElement(target, true)
    } else {
      this.imageFilter.analyzeElement(target, false)
    }
  }

  private static getConfig (): MutationObserverInit {
    return {
      characterData: false,
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src', 'style', 'srcset', 'data-src', 'class']
    }
  }
}
