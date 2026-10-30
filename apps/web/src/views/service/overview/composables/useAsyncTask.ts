import { getCurrentScope, onScopeDispose, ref } from 'vue'
import type { Ref } from 'vue'

/**
 * 单块数据的查询状态：数据、加载中、错误与在途请求号。
 *
 * 总览页有十余个互相独立的查询区域（汇总、单位/专业统计、穿透、阶段详情的四块、宽表分页……），
 * 每块都要做同样三件事：请求开始时清空旧数据、响应回来时只采纳最后一次请求、失败时给出可重试的原因。
 * 这段逻辑此前在每个区域各写一遍，写法略有差异（有的在 finally 里比 id、有的没有），这里统一成一份实现。
 *
 * 用法：
 * ```ts
 * const group = useAsyncTask<GroupStatistics[]>(() => [])
 * const load = async () => {
 *   const params = buildParams()
 *   if (!params) return group.reset()
 *   await group.run(async () => {
 *     const result = await getDataByDw(params)
 *     if (!result.success) throw new Error(result.msg)
 *     return result.data
 *   }, '统计数据加载失败，请重试')
 * }
 * ```
 */
export interface AsyncTask<T> {
  data: Ref<T>
  loading: Ref<boolean>
  error: Ref<string>
  /** 放弃在途请求并回到初始值：筛选条件不完整或被清空时调用。 */
  reset: () => void
  /**
   * 执行一次查询。开始前清空数据与错误；响应回来时如果已经发出了更新的请求，结果直接丢弃，
   * 因此快速切换筛选 / 翻页不会出现旧数据覆盖新数据。task 抛出的错误消息即展示给用户的失败原因。
   */
  run: (task: () => Promise<T>, fallbackMessage: string) => Promise<void>
}

export const useAsyncTask = <T>(initial: () => T): AsyncTask<T> => {
  const data = ref(initial()) as Ref<T>
  const loading = ref(false)
  const error = ref('')
  let requestId = 0

  const reset = () => {
    requestId += 1
    data.value = initial()
    loading.value = false
    error.value = ''
  }

  const run = async (task: () => Promise<T>, fallbackMessage: string) => {
    const current = ++requestId
    data.value = initial()
    error.value = ''
    loading.value = true
    try {
      const next = await task()
      if (current !== requestId) return
      data.value = next
    } catch (cause) {
      if (current !== requestId) return
      error.value = (cause as Error)?.message || fallbackMessage
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  // 卸载时作废在途响应，避免组件销毁后仍写入状态（组件 setup 或其它 effect scope 内调用）。
  if (getCurrentScope()) onScopeDispose(reset)

  return { data, loading, error, reset, run }
}
