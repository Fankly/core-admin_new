import { useTable as useBaseTable } from './useTable'

/** 保留历史入口及每页 100 条的默认值，共用查询与请求生命周期。 */
export const useTable = <T = unknown>(...args: Parameters<typeof useBaseTable<T>>) => {
  const [api, initParam, isPageable, dataCallBack, requestError, clearSelection, initialPageSize = 100] = args
  return useBaseTable<T>(api, initParam, isPageable, dataCallBack, requestError, clearSelection, initialPageSize)
}
