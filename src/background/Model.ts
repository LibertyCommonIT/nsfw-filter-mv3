import { NSFWJS, predictionType } from 'nsfwjs'

import { ILogger } from '../utils/Logger'

export type ModelSettings = {
  filterStrictness: number
}

type IModel = {
  predictImage: (image: HTMLImageElement, url: string) => Promise<boolean>
  setSettings: (settings: ModelSettings) => void
}

export class Model implements IModel {
  private readonly model: NSFWJS
  private readonly logger: ILogger

  private readonly FILTER_LIST: Set<string>
  private readonly firstFilterPercentages: Map<string, number>
  private readonly secondFilterPercentages: Map<string, number>

  constructor (model: NSFWJS, logger: ILogger, settings: ModelSettings) {
    this.model = model
    this.logger = logger

    this.logger.log('Model is loaded')

    this.FILTER_LIST = new Set(['Hentai', 'Porn', 'Sexy'])

    this.firstFilterPercentages = new Map()
    this.secondFilterPercentages = new Map()

    this.setSettings(settings)
  }

  public setSettings (settings: ModelSettings): void {
    const { filterStrictness } = settings
    this.firstFilterPercentages.clear()
    this.secondFilterPercentages.clear()

    for (const className of this.FILTER_LIST.values()) {
      this.firstFilterPercentages.set(
        className,
        Model.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 100,
          minValue: className === 'Porn' ? 30 : 50
        })
      )
    }

    for (const className of this.FILTER_LIST.values()) {
      this.secondFilterPercentages.set(
        className,
        Model.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 50,
          minValue: className === 'Porn' ? 10 : 20
        })
      )
    }
  }

  public async predictImage (image: HTMLImageElement, url: string): Promise<boolean> {
    const start = this.logger.status ? new Date().getTime() : 0
    const prediction = await this.model.classify(image, 3)
    const { result, className, probability } = this.handlePrediction(prediction)

    if (this.logger.status) {
      const end = new Date().getTime()
      this.logger.log(`IMG prediction (${end - start} ms) is ${className} ${probability} for ${url}`)
    }

    return result
  }

  private handlePrediction (prediction: predictionType[]): { result: boolean, className: string, probability: number } {
    const [firstPrediction, ...restPredictions] = prediction
    const { className: cn1, probability: pb1 } = firstPrediction

    if (this.isNSFWPrediction(cn1, pb1, true)) {
      return { result: true, className: cn1, probability: pb1 }
    }

    for (const { className, probability } of restPredictions) {
      if (this.isNSFWPrediction(className, probability, false)) {
        return { result: true, className, probability }
      }
    }

    return { result: false, className: cn1, probability: pb1 }
  }

  private isNSFWPrediction (className: string, probability: number, isTopPrediction: boolean): boolean {
    if (!this.FILTER_LIST.has(className)) return false

    const threshold = isTopPrediction
      ? this.firstFilterPercentages.get(className)
      : this.secondFilterPercentages.get(className)

    return threshold !== undefined && probability > threshold
  }

  public static handleFilterStrictness ({ value, minValue, maxValue }: {value: number, minValue: number, maxValue: number}): number {
    const MIN = minValue
    const MAX = maxValue

    const calc = (value: number): number => {
      if (value <= 1) return MAX
      else if (value >= 100) return MIN
      else {
        const coefficient = 1 - (value / 100)
        return (coefficient * (MAX - MIN)) + MIN
      }
    }

    return Math.round((calc(value) / 100) * 10000) / 10000
  }
}
