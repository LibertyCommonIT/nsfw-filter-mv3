import { PredictionRequest, PredictionResponse } from '../../utils/messages'

type IFilter = {
  getBlockAmount: () => number
}

type FilterQueueRequest = {
  resolve: (value: PredictionResponse) => void
  reject: (error: PredictionRequest) => void
}

type FilterRequestQueueValue = FilterQueueRequest[][]

export class Filter implements IFilter {
  protected blockedItems: number
  private readonly requestQueue: Map<string, FilterRequestQueueValue>

  constructor () {
    this.blockedItems = 0
    this.requestQueue = new Map()
  }

  public getBlockAmount (): number {
    return this.blockedItems
  }

  protected async requestToAnalyzeImage (request: PredictionRequest): Promise<PredictionResponse> {
    return await new Promise((resolve, reject) => {
      const queueName = request.url
      const queue = this.requestQueue.get(queueName)

      if (queue) {
        queue.push([{ resolve, reject }])
        return
      }

      this.requestQueue.set(queueName, [[{ resolve, reject }]])
      this._requestToAnalyzeImage(request, resolve)
    })
  }

  private _requestToAnalyzeImage (request: PredictionRequest, resolve: (value: PredictionResponse) => void): void {
    chrome.runtime.sendMessage(request, (response: PredictionResponse) => {
      const queue = this.requestQueue.get(request.url)
      if (!queue) return

      if (chrome.runtime.lastError !== null && chrome.runtime.lastError !== undefined) {
        this._handleBackgroundErrors(request, resolve, chrome.runtime.lastError.message)
        return
      }

      for (const [{ resolve }] of queue) {
        resolve(response)
      }

      this.requestQueue.delete(request.url)
    })
  }

  private _handleBackgroundErrors (request: PredictionRequest, resolve: (value: PredictionResponse) => void, message: string | undefined): void {
    const reconnectCount = request.clearTimer()
    console.log(`[NSFW-Filter] Cannot connect to background worker for ${request.url} image, attempt ${reconnectCount}, error: ${message}`)

    if (reconnectCount > 5) {
      resolve(new PredictionResponse(false, request.url, 'Background worker doesn\'t working'))
      console.warn(`[NSFW-Filter] Background worker is down, marked as visible ${request.url}`)
      this.requestQueue.delete(request.url)
      return
    }

    request.reconectTimer = window.setTimeout(() => this._requestToAnalyzeImage(request, resolve), 500)
  }
}
