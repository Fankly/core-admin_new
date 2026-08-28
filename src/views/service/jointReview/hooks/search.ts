import { ref, reactive } from 'vue'

export const searchFun = (
  searchParam: any,
  searchTj: any,
  levelOne: any,
  getPageList: () => void //刷新数据
) => {
  const searchParamsRef = ref()

  // 处理搜索
  const handleSearch = () => {
    getPageList()
  }

  // 查询弹窗
  const searchHandle = () => {
    searchParamsRef.value.levelOne = levelOne.value
    searchParamsRef.value.isShowTable = true
  }

  // 查询
  const getSearch = (parmas: any) => {
    searchParam.value = ''
    searchTj.value = parmas.param
    getPageList()
    searchParamsRef.value.isShowTable = false
  }

  return {
    getSearch,
    searchParamsRef,
    searchHandle,
    handleSearch
  }
}
