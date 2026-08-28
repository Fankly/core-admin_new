import { SearchForm } from '@/api/targetBudget/types/provinceTarget'
import { ElForm } from 'element-plus'
import { inject, ref, toRef } from 'vue'
import { Page, SearchProps } from '../../types/provinceTarget'

export const useSearch = (props: SearchProps) => {
  const searchForm = inject<SearchForm>('searchForm')!
  const page = inject<Page>('page')!

  const searchFormRef = ref<InstanceType<typeof ElForm>>()

  // 查询数据
  const handleSearchData = () => {
    page.page = 1
    props.search()
  }

  // 重置数据
  const handleResetData = () => {
    searchFormRef.value?.resetFields()
    // 重置数据
    page.page = 1
    props.search()
  }

  const statusList = toRef(props, 'statusList')
  return {
    searchFormRef,
    searchForm,
    statusList,
    handleSearchData,
    handleResetData
  }
}
