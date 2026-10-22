import type { MaybeRef, MaybeRefOrGetter } from 'vue'
import type { TableStateProps } from './interface'
import type { SearchParams, TableRequest, TableResponseData } from '@/components/ProTable/interface'
import { getCurrentScope, onScopeDispose, reactive, shallowReactive, ref, toRefs, toValue, unref } from 'vue'
import { handleError } from '@/utils/error'

/** 表格查询与分页。initParam 支持 ref/getter，以便父组件整体替换查询条件。 */
export const useTable = <T = unknown>(
  api?: MaybeRef<TableRequest<T> | undefined>,
  initParam: MaybeRefOrGetter<SearchParams> = {},
  isPageable: MaybeRefOrGetter<boolean> = true,
  dataCallBack?: (data: TableResponseData<T>) => TableResponseData<T>,
  requestError?: (error: unknown) => void,
  clearSelection?: () => void,
  initialPageSize = 20
) => {
  const state = shallowReactive<TableStateProps<T>>({
    tableData: shallowReactive<T[]>([]),
    pageable: reactive({ current: 1, size: initialPageSize, total: 0 }),
    searchParam: reactive<SearchParams>({}),
    searchInitParam: {},
    totalParam: {}
  })
  const loading = ref(false)
  let requestId = 0
  let disposed = false

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      requestId += 1
      loading.value = false
    })
  }

  const getTableList = async () => {
    const request = unref(api)
    if (!request || disposed) return
    const currentRequestId = ++requestId
    const pageable = toValue(isPageable)
    loading.value = true

    try {
      // 初始化条件只参与本次请求，不写回已提交的搜索条件，避免删除字段后仍携带旧值。
      const params: SearchParams = {
        ...state.searchInitParam,
        ...state.totalParam,
        ...toValue(initParam),
        ...(pageable ? { page: state.pageable.current, limit: state.pageable.size } : {})
      }
      if (!pageable) {
        delete params.page
        delete params.limit
      }
      let { data } = await request(params)
      // 搜索与翻页可以重叠，只有最后发起的请求可以提交数据、错误和 loading 状态。
      if (currentRequestId !== requestId) return
      if (dataCallBack) data = dataCallBack(data)
      if (currentRequestId !== requestId) return

      if (pageable && Array.isArray(data)) throw new Error('分页响应缺少 records')
      if (!pageable && !Array.isArray(data)) throw new Error('非分页响应必须是数组')
      state.tableData = shallowReactive(Array.isArray(data) ? data : data.records)
      if (pageable && !Array.isArray(data)) {
        Object.assign(state.pageable, {
          current: data.current,
          size: data.size,
          total: data.total
        })
      }
    } catch (error) {
      if (currentRequestId !== requestId) return
      if (requestError) requestError(error)
      else handleError(error, '获取表格数据失败')
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  const updatedTotalParam = () => {
    const nowSearchParam: SearchParams = {}
    for (const key in state.searchParam) {
      const value = state.searchParam[key]
      if (value || value === false || value === 0) nowSearchParam[key] = value
    }
    state.totalParam = nowSearchParam
  }

  const search = () => {
    state.pageable.current = 1
    updatedTotalParam()
    return getTableList()
  }

  const reset = () => {
    state.pageable.current = 1
    state.searchParam = reactive(
      Object.fromEntries(Object.entries(state.searchInitParam).map(([key, value]) => [key, Array.isArray(value) ? [...(value as unknown[])] : value]))
    )
    updatedTotalParam()
    return getTableList()
  }

  const handleSizeChange = (val: number) => {
    clearSelection?.()
    state.pageable.current = 1
    state.pageable.size = val
    return getTableList()
  }

  const handleCurrentChange = (val: number) => {
    clearSelection?.()
    state.pageable.current = val
    return getTableList()
  }

  return {
    ...toRefs(state),
    loading,
    getTableList,
    search,
    reset,
    handleSizeChange,
    handleCurrentChange,
    updatedTotalParam
  }
}
