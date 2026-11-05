import { onBeforeUnmount, ref } from 'vue'

export interface UsePollingOptions {
  /** 每轮执行的任务，resolve 后才会排下一轮 */
  task: () => Promise<any>
  /** 轮询间隔（毫秒） */
  interval: number
  /** start() 时是否立即执行一次，默认 false（首屏一般已单独加载过） */
  immediate?: boolean
  /** 标签页隐藏时暂停轮询，默认 true */
  pauseOnHidden?: boolean
  /** 连续失败时的最大退避倍数，默认 8 */
  maxBackoff?: number
}

/**
 * 通用轮询：setTimeout 链式调度，上一轮完成后才排下一轮
 * - 不会并发重入，慢响应不会堆积请求
 * - 连续失败按 2^n 退避（上限 maxBackoff 倍），成功后复位
 * - 标签页隐藏时停表，回到前台数据过期则立即补拉
 */
export const usePolling = (options: UsePollingOptions) => {
  const { task, interval, immediate = false, pauseOnHidden = true, maxBackoff = 8 } = options

  const isRunning = ref(false)
  const lastSuccessAt = ref(0)

  let timer: ReturnType<typeof setTimeout> | null = null
  /** 任务是否正在执行，避免手动刷新与定时轮询重入 */
  let inFlight = false
  let failCount = 0
  let visibilityBound = false

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const nextDelay = () => {
    if (!failCount) return interval
    return interval * Math.min(Math.pow(2, failCount), maxBackoff)
  }

  const schedule = (delay = nextDelay()) => {
    clearTimer()
    if (!isRunning.value) return
    timer = setTimeout(runTask, delay)
  }

  const runTask = async () => {
    // 上一轮尚未结束（如手动刷新触发中），推迟到下个周期
    if (inFlight) {
      schedule()
      return
    }
    inFlight = true
    try {
      await task()
      failCount = 0
      lastSuccessAt.value = Date.now()
    } catch (error) {
      failCount += 1
      console.warn('[usePolling] 轮询任务失败', error)
    } finally {
      inFlight = false
      schedule()
    }
  }

  /** 数据是否已过期（超过一个轮询周期未成功） */
  const isStale = () => !lastSuccessAt.value || Date.now() - lastSuccessAt.value >= interval

  const onVisibilityChange = () => {
    if (!isRunning.value) return
    if (document.hidden) {
      clearTimer()
      return
    }
    schedule(isStale() ? 0 : nextDelay())
  }

  const bindVisibility = () => {
    if (!pauseOnHidden || visibilityBound || typeof document === 'undefined') return
    document.addEventListener('visibilitychange', onVisibilityChange)
    visibilityBound = true
  }

  const unbindVisibility = () => {
    if (!visibilityBound) return
    document.removeEventListener('visibilitychange', onVisibilityChange)
    visibilityBound = false
  }

  const start = () => {
    if (isRunning.value) return
    isRunning.value = true
    failCount = 0
    bindVisibility()
    if (immediate) {
      runTask()
    } else {
      schedule(interval)
    }
  }

  const stop = () => {
    isRunning.value = false
    clearTimer()
    unbindVisibility()
  }

  const restart = () => {
    stop()
    start()
  }

  /** 立即执行一次并重置节奏；任务在途时直接复用在途结果 */
  const refreshNow = async () => {
    if (inFlight) return
    clearTimer()
    await runTask()
  }

  onBeforeUnmount(stop)

  return {
    isRunning,
    lastSuccessAt,
    isStale,
    start,
    stop,
    restart,
    refreshNow
  }
}

export default usePolling
