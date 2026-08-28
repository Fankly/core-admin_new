import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface SearchData {
  dataType: string
  nd: string
  protypeId: string
}

interface EditData {
  id: string
  nd: string
  protypeId: string
  startDate: string
  endDate: string
}

// 获取数据
export const getPageData = (params: SearchData): Promise<Result> => {
  return baseService.post(`/xmProtypeXjjzPeriod/page`, params)
}

// 编辑
export const editData = (params: EditData): Promise<Result> => {
  return baseService.post(`/xmProtypeXjjzPeriod/edit`, params)
}

// 删除
export const removeData = (idList: string[]): Promise<Result> => {
  return baseService.post(`/xmProtypeXjjzPeriod/remove`, idList)
}

// 批量修改
export const batchUpdateData = (params: EditData[]): Promise<Result> => {
  return baseService.post(`/xmProtypeXjjzPeriod/batchUpdate`, params)
}
