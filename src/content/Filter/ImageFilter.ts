import { PredictionRequest } from '../../utils/messages'

import { Filter } from './Filter'

type imageFilterSettingsType = {
  filterEffect: 'blur' | 'hide'
}

export type IImageFilter = {
  analyzeImage: (image: HTMLImageElement, srcAttribute: boolean) => void
  analyzeElement: (element: HTMLElement, srcAttribute: boolean) => void
  setSettings: (settings: imageFilterSettingsType) => void
  checkStyleMutation: (element: HTMLElement) => void
}

export class ImageFilter extends Filter implements IImageFilter {
  private readonly MIN_IMAGE_SIZE: number
  private settings: imageFilterSettingsType

  constructor () {
    super()
    this.MIN_IMAGE_SIZE = 41

    this.settings = { filterEffect: 'hide' }
  }

  public setSettings (settings: imageFilterSettingsType): void {
    this.settings = settings
  }

  public analyzeImage (image: HTMLImageElement, srcAttribute: boolean = false): void {
    const url = this.getImageUrl(image)
    const imageIsNotAnalyzed = srcAttribute || image.dataset.nsfwFilterStatus === undefined
    const isImageValid = url.length > 0 && ((image.width > this.MIN_IMAGE_SIZE && image.height > this.MIN_IMAGE_SIZE) || image.height === 0 || image.width === 0)

    if (imageIsNotAnalyzed && isImageValid) {
      image.dataset.nsfwFilterStatus = 'processing'
      this._analyzeElement(image, url)
    }
  }

  public analyzeElement (element: HTMLElement, srcAttribute: boolean = false): void {
    const url = this.getBackgroundImageUrl(element)
    if (url.length === 0) return

    const elementIsNotAnalyzed = srcAttribute || element.dataset.nsfwFilterStatus === undefined
    if (!elementIsNotAnalyzed) return

    element.dataset.nsfwFilterStatus = 'processing'
    this._analyzeElement(element, url)
  }

  public checkStyleMutation (element: HTMLElement): void {
    const isStyleOutdated = this.isStyleOutdated(element)

    if (!isStyleOutdated) return

    const url = this.getBackgroundImageUrl(element)
    if (url.length === 0) return

    this.applyFilter(element, url)
  }

  private isStyleOutdated (element: HTMLElement): boolean {
    const isNSFW = element.dataset.nsfwFilterStatus === 'nsfw'

    if (!isNSFW) return false

    const style = element.getAttribute('style') ?? ''
    const isVisibilityHiddenOutdated = this.settings.filterEffect === 'hide' && style.includes('visibility: hidden') === false
    const isBlurOutdated = this.settings.filterEffect === 'blur' && style.includes('filter: blur') === false

    return isVisibilityHiddenOutdated || isBlurOutdated
  }

  private _analyzeElement (element: HTMLElement, url: string): void {
    this.applyInitialBlur(element)

    const request = new PredictionRequest(url)
    this.requestToAnalyzeImage(request)
      .then(({ result }) => {
        if (result) {
          element.dataset.nsfwFilterStatus = 'nsfw'
          this.applyFilter(element, url)
          this.blockedItems++
        } else {
          this.showElement(element, url)
        }
      }).catch(() => {
        this.showElement(element, url)
      })
  }

  private getImageUrl (image: HTMLImageElement): string {
    return image.src || image.getAttribute('data-src') || image.dataset.src || ''
  }

  private getBackgroundImageUrl (element: HTMLElement): string {
    if (element instanceof HTMLImageElement) {
      return this.getImageUrl(element)
    }

    const dataSrc = element.getAttribute('data-src') || element.dataset.src
    if (dataSrc) return dataSrc

    const backgroundImage = element.style.backgroundImage || window.getComputedStyle(element).backgroundImage
    return this.extractBackgroundImageUrl(backgroundImage)
  }

  private extractBackgroundImageUrl (backgroundImage: string): string {
    const match = backgroundImage.match(/url\((?:'|")?(.*?)(?:'|")?\)/)
    return match ? match[1] : ''
  }

  private applyInitialBlur (element: HTMLElement): void {
    element.style.setProperty('filter', 'blur(25px)', 'important')
    element.style.visibility = 'visible'

    if (element instanceof HTMLImageElement && element.parentNode?.nodeName === 'BODY') element.hidden = false
  }

  private applyFilter (element: HTMLElement, url: string): void {
    if (this.settings.filterEffect === 'blur') {
      element.style.setProperty('filter', 'blur(25px)', 'important')
      this.showElement(element, url)
      return
    }
    this.hideElement(element)
  }

  private hideElement (element: HTMLElement): void {
    if (element instanceof HTMLImageElement && element.parentNode?.nodeName === 'BODY') element.hidden = true

    element.style.visibility = 'hidden'
  }

  private showElement (element: HTMLElement, url: string): void {
    const currentUrl = this.getBackgroundImageUrl(element)
    if (currentUrl === url) {
      if (element instanceof HTMLImageElement && element.parentNode?.nodeName === 'BODY') element.hidden = false

      if (element.dataset.nsfwFilterStatus !== 'nsfw') {
        element.style.setProperty('filter', 'none', 'important')
      }

      element.dataset.nsfwFilterStatus = 'sfw'
      element.style.visibility = 'visible'
    }
  }
}
