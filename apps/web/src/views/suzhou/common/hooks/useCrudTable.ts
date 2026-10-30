import type { InjectionKey, Ref } from 'vue'
import { inject, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { CheckedRowsInjectionKey, CrudSearchApiInjectionKey, CurrentUserRoleInjectionKey, defaultUserRole } from '@/views/suzhou/common/types/crud'
import type { CrudQueryParams, CrudRequest, CrudSearchOptions } from '@/views/suzhou/common/types/crud'
import { cleanQueryParams, getRoleQueryParams } from '@/views/suzhou/common/utils/params'

export const useCrudTable = <T = any>(columns?: VxeGridProps<T>['columns']) => {
  const checkedData = inject<Ref<T[]>>(CheckedRowsInjectionKey as InjectionKey<Ref<T[]>>, ref([]) as Ref<T[]>)
  const currentUserRole = inject(CurrentUserRoleInjectionKey, ref(defaultUserRole()))
  const injectedSearchApi = inject(CrudSearchApiInjectionKey, undefined)
  const legacySearchApi = inject<CrudRequest | null>('searchFn', null)
  const searchApi = injectedSearchApi || legacySearchApi
  const gridRef = ref()
  const lastSearchParams = ref<CrudQueryParams>({})

  const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0 as number | string
  })

  const gridOptions = reactive<VxeGridProps<T>>({
    border: true,
    stripe: true,
    loading: false,
    loadingConfig: {
      icon: 'el-icon-loading',
      text: '正在加载中...'
    },
    headerAlign: 'center',
    showHeaderOverflow: true,
    showOverflow: true,
    checkboxConfig: {
      trigger: 'row',
      highlight: true
    },
    height: '100%',
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    columns: columns || [],
    data: []
  })

  const getSearchParams = () => ({
    ...lastSearchParams.value
  })

  const buildRequestParams = () => {
    return cleanQueryParams({
      page: pagination.page,
      limit: pagination.limit,
      ...lastSearchParams.value,
      ...getRoleQueryParams(currentUserRole.value)
    })
  }

  const clearSelection = () => {
    checkedData.value = []
    gridRef.value?.clearCheckboxRow?.()
  }

  const searchData = async (searchParams?: CrudQueryParams, options: CrudSearchOptions = {}) => {
    if (!searchApi) {
      ElMessage.error('未配置查询接口')
      return
    }

    if (searchParams !== undefined) {
      const cleanParams = cleanQueryParams(searchParams)
      delete cleanParams.page
      delete cleanParams.limit
      lastSearchParams.value = cleanParams
    }

    if (options.resetPage) {
      pagination.page = 1
    }

    gridOptions.loading = true
    try {
      const searchPageRes = await searchApi(buildRequestParams())
      if (!searchPageRes.success) throw new Error(searchPageRes.msg)
      gridOptions.data = searchPageRes.data?.records || []
      pagination.total = searchPageRes.data?.total || 0
      clearSelection()
    } catch (e) {
      handleError((e as Error).message)
    } finally {
      gridOptions.loading = false
    }
  }

  const reloadData = async () => {
    await searchData()
  }

  const handleChangeSizeChange = async (val: number) => {
    if (val <= 0) return
    pagination.limit = val
    pagination.page = 1
    await searchData()
  }

  const handleChangeCurrentChange = async (val: number) => {
    if (val <= 0) return
    pagination.page = val
    await searchData()
  }

  const gridEvents: VxeGridListeners<T> = {
    cellClick: ({ row, column }: { row: T; column: any }) => {
      if (column.type === 'checkbox') return
      checkedData.value = []
      gridRef.value?.clearCheckboxRow?.()
      gridRef.value?.setCheckboxRow?.(row, true)
      checkedData.value.push(row)
    },
    checkboxAll: ({ records }: { records: T[] }) => {
      checkedData.value = records
    },
    checkboxChange: ({ records }: { records: T[] }) => {
      checkedData.value = records
    }
  }

  const handleError = (message = '操作失败'): void => {
    ElMessage({
      message: `${message}`,
      type: 'error',
      duration: 5000
    })
  }

  return {
    page: pagination,
    gridRef,
    handleChangeSizeChange,
    handleChangeCurrentChange,
    searchData,
    reloadData,
    getSearchParams,
    gridOptions,
    gridEvents
  }
}
