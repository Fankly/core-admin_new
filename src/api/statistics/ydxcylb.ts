import baseService from '@/service/baseService'

interface DwList {
  code: string
  nodeType: string
}

export interface Data {
  busiType: string
  dwId: string
  dwList: DwList[]
  endDate: string
  indicators: string
  kxpzLists?: string[]
  parentId: number | string
  startDate: string
  xmlbIds: string
}

export interface ProYapMbaSearch {
  busiType: string
  dwId: string
  dwList: DwList[]
  ysnd: string
  indicators: string
  kxpzLists?: string[]
  parentId: number | string
  saveDate: string
  xmlbIds: string
}

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

// 获取数据
export const getDataListByDw = (params: Data): Promise<Result> => {
  return baseService.post('budgetStatistics/getDataListByDw', params)
}

// 获取数据
export const getProYapMbzData = (params: any): Promise<Result> => {
  return baseService.post(`/xmYapMbz/getData`, params)
}

// 获取动态表格
export const getDynamicColumnByDw = (params: Data | ProYapMbaSearch): Promise<Result> => {
  return baseService.post('budgetStatistics/getDynamicColumnByDw', params)
}

interface TbhbParams {
  busiType: string // 业务类型
  dwId: string // 当前登录单位ID
  dwList: DwList[] // 单位列表
  endDate: string // 预算期间结束月份 YYYY-MM
  indicators: string // 指标项
  parentId: number | string // 父级ID
  startDate: string // 预算期间开始月份 YYYY-MM
  xmlbIds: string // 项目类别ID集合，多个用逗号分隔
  searchType: string // 查询类型 1:同比 2:环比
}

type TbhbColumnParams = Pick<TbhbParams, 'busiType' | 'dwId' | 'dwList' | 'searchType' | 'xmlbIds' | 'indicators'>

interface DynamicColumnRow {
  canBeCt: string
  children: DynamicColumnRow[]
  edit: boolean
  field: string
  mergeCell: boolean
  needFormat: boolean
  parentField: string
  style: Record<string, any>
  title: string
  visible: boolean
  width: number
}

// 获取同比环比动态表头
export const getDynamicColumnByDwTbHb = (params: TbhbColumnParams): Promise<Result & { data: DynamicColumnRow[] }> => {
  return baseService.post('budgetStatics/tbhb/getDynamicColumn', params)
}

// 非预安排-获取同比环比数据
export const getTbHbData = (params: TbhbParams): Promise<Result> => {
  return baseService.post('budgetStatics/tbhb/getDataList', params)
}

interface YapTbhbParams {
  busiType: string // 业务类型
  dwId: string // 当前登录单位ID
  dwList: DwList[] // 单位列表
  indicators: string // 指标项
  parentId: number | string // 父级ID
  saveDate: string // 归档时间 YYYY-MM
  searchType: string // 查询类型 1:同比 2:环比
  xmlbIds: string // 项目类别ID集合，多个用逗号分隔
  ysnd: string // 预算年度
}

// 预安排-获取同比环比数据
export const getTbHbDataYap = (params: YapTbhbParams): Promise<Result> => {
  return baseService.post('budgetStatics/tbhb/yap/getDataList', params)
}
