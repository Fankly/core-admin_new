import { inject, reactive, ref } from 'vue'
import { CrudTableRefInjectionKey } from '@/views/suzhou/common/types/crud'
import type { CrudQueryParams } from '@/views/suzhou/common/types/crud'

export const useCrudSearch = <T extends CrudQueryParams>(initialState: T) => {
  const materialTableRef = inject(CrudTableRefInjectionKey, ref())
  const searchForm = reactive({ ...initialState }) as T

  const getSearchParams = () => {
    const params: CrudQueryParams = { ...searchForm }
    if ('materialCode' in searchForm) {
      params.materialCodeList = searchForm.materialCode ? String(searchForm.materialCode).split(',') : []
    }
    if ('smallCategoryCode' in searchForm) {
      params.smallCategoryCodeList = searchForm.smallCategoryCode ? String(searchForm.smallCategoryCode).split(',') : []
    }
    return params
  }

  const handleSearch = () => {
    materialTableRef.value?.searchData(getSearchParams(), { resetPage: true })
  }

  const handleReset = () => {
    Object.assign(searchForm, { ...initialState })
    materialTableRef.value?.searchData(getSearchParams(), { resetPage: true })
  }

  return {
    searchForm,
    getSearchParams,
    handleSearch,
    handleReset
  }
}
