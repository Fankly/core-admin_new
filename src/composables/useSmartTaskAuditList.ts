import { markRaw, reactive, ref, shallowRef } from 'vue'
import { getSmartTaskAuditList } from '@/api/ai/smartTaskAudit'
import type { SmartTaskAuditListItem, SmartTaskAuditSearchParams } from '@/api/ai/smartTaskAudit'

export interface SmartTaskAuditPageState {
  total: number
  limit: number
  page: number
}

type ListParams = Omit<SmartTaskAuditSearchParams, 'page' | 'limit'>
type ListOverrides = Partial<ListParams>

interface UseSmartTaskAuditListOptions<T> {
  buildParams: () => ListParams
  initialLimit?: number
  mapRecords?: (records: SmartTaskAuditListItem[]) => T[]
  onDataChange?: (records: T[]) => void | Promise<void>
  onError?: (message: string) => void
  onLoadingChange?: (loading: boolean) => void
}

export const useSmartTaskAuditList = <T = SmartTaskAuditListItem>(options: UseSmartTaskAuditListOptions<T>) => {
  const records = shallowRef<T[]>([])
  const loading = ref(false)
  const errorMessage = ref('')
  const page = reactive<SmartTaskAuditPageState>({
    total: 0,
    limit: options.initialLimit || 20,
    page: 1
  })
  let requestSeq = 0

  const setLoading = (value: boolean) => {
    loading.value = value
    options.onLoadingChange?.(value)
  }

  const setRecords = async (value: T[]) => {
    records.value = markRaw(value)
    await options.onDataChange?.(records.value)
  }

  const clearRecords = async () => {
    page.total = 0
    await setRecords([])
  }

  const search = async (overrides: ListOverrides = {}) => {
    const seq = ++requestSeq
    const params: SmartTaskAuditSearchParams = {
      ...options.buildParams(),
      page: page.page,
      limit: page.limit,
      ...overrides
    }
    errorMessage.value = ''
    setLoading(true)

    try {
      const res = await getSmartTaskAuditList(params)
      if (seq !== requestSeq) return false
      if (!res.success) {
        const message = res.msg || '查询失败'
        errorMessage.value = message
        await clearRecords()
        options.onError?.(message)
        return false
      }

      const source = Array.isArray(res.data?.records) ? res.data.records : []
      const nextRecords = options.mapRecords ? options.mapRecords(source) : (source as unknown as T[])
      page.total = Number(res.data?.total) || 0
      await setRecords(nextRecords)
      return true
    } catch (error) {
      if (seq !== requestSeq) return false
      const message = (error as Error)?.message || '查询失败'
      errorMessage.value = message
      await clearRecords()
      options.onError?.(message)
      return false
    } finally {
      if (seq === requestSeq) setLoading(false)
    }
  }

  const invalidate = () => {
    requestSeq += 1
    setLoading(false)
  }

  const changePage = (currentPage: number) => {
    page.page = currentPage
    return search()
  }

  const changeLimit = (currentLimit: number) => {
    page.page = 1
    page.limit = currentLimit
    return search()
  }

  return {
    records,
    loading,
    errorMessage,
    page,
    search,
    invalidate,
    changePage,
    changeLimit
  }
}
