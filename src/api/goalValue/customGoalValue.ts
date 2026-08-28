import baseService from '@/service/baseService'

// 注意：以下接口路径为前端临时定义，待后端接口确定后统一替换
interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

// ==================== 配置页 ====================

export interface CustomConfigSaveData {
  id?: string // 编辑时需要传id，新增时不传
  name: string // 配置名称
  nd: string // 年度
  leaf: string
  parentId: string // 父节点ID
  protypeIds: string
  sfqy: string // 是否启用
  sfzgs: string // 是否子公司
  sort: number | string // 排序
}

export interface ConfigItem {
  id: string
  leaf: '0' | '1' // 是否叶子节点
  name: string // 配置名称
  parentId: string // 父节点ID
  nd: string // 年度
  sfqy: string // 是否启用
  sfzgs: string // 是否子公司
  sort: number | string // 排序
}

// 获取配置列表和获取配置树 parentId默认传0，表示获取根节点
export const getConfigList = (nd: string, parentId: string): Promise<Result> => {
  return baseService.get(`/cbxmmbz/config/getChildData?nd=${nd}&parentId=${parentId}`)
}

// 复制配置
export const copyConfig = (sourceNd: string, targetNd: string): Promise<Result> => {
  return baseService.post(`/customGoalValue/getConfigInfo?sourceNd=${sourceNd}&targetNd=${targetNd}`)
}

// 保存配置
export const saveConfig = (params: CustomConfigSaveData): Promise<Result> => {
  return baseService.post(`/cbxmmbz/config/saveData`, params)
}

// 批量删除配置
export const batchDeleteConfig = (ids: string[]): Promise<Result> => {
  return baseService.post(`/cbxmmbz/config/delete`, { ids })
}

// ==================== 目标值维护页 ====================

export interface ValueQueryParams {
  isZgs: string // 是否直属
  nd: string // 年度
  parentId?: string // 获取目标值数据传 默认0
  specialorgid: string // 部门Id
  checkPropackYs?: boolean
}

// 获取动态列
export const getValueColumns = (params: ValueQueryParams): Promise<Result> => {
  return baseService.get(
    `/cbxmmbz/search/getDynamicColumn?nd=${params.nd}&isZgs=${params.isZgs}&specialorgid=${params.specialorgid}&checkPropackYs=${params.checkPropackYs}`
  )
}

// 获取目标值数据
export const getValueData = (params: ValueQueryParams): Promise<Result> => {
  return baseService.get(
    `/cbxmmbz/search/getData?nd=${params.nd}&parentId=${params.parentId}&isZgs=${params.isZgs}&specialorgid=${params.specialorgid}&checkPropackYs=${params.checkPropackYs}`
  )
}
