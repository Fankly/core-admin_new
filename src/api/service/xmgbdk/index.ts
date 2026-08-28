import baseService from '@/service/baseService'

interface Result {
  header?: any
  data: any
  msg: string
  success: boolean
  code: number
}

interface Params {
  bmId: string // 部门id
  circul_status: string // 项目执行状态
  dwId: string // 单位id
  dw_com: string // 一二级单位
  dydj: string // 电压等级
  ejdw: string // 二级单位
  ejdws: string[] // 二级单位
  ejfl: string // 二级分类
  gbdk_status: string // 项目打开关闭状态
  gwxmbm: string // 国网项目编码
  gwxmbms: string[] // 国网项目编码
  ispack: string // 是否打捆
  limit: number // 每页数据条数
  nd: string // 年度
  ndyswcl_end_num: string // 年度预算完成率（%）
  ndyswcl_end_qj: string // 年度预算完成率（%）
  ndyswcl_start_num: string // 年度预算完成率（%）
  ndyswcl_start_qj: string // 年度预算完成率（%）
  page: string // 当前页
  publisetime_start: string // 出库时间
  publisetime_end: string // 出库时间
  sjfl: string // 三级分类
  xmbm: string // 储备编码
  xmbmc: string // 项目包名称
  xmbms: string[] // 项目包名称
  xmljwcl_end_num: string // 项目累计完成率（%）
  xmljwcl_end_qj: string // 项目累计完成率（%）
  xmljwcl_start_num: string // 项目累计完成率（%）
  xmljwcl_start_qj: string // 项目累计完成率（%）
  xmlx_id: string // 项目类型
  xmlx_ids: string[] // 项目类型
  xmmc: string // 项目名称
  xmxz: string // 项目性质
  xmxzs: string[] // 项目性质
  yd_end: string // 结束月度
  yd_start: string // 开始月度
  yjdw: string // 一级单位
  yjdws: string[] // 一级单位
  yjfl: string // 一级分类
  ysqj_end: string // 预算期间
  ysqj_start: string // 预算期间
  yssfzt: string // 预算释放状态
}

//  获取列表
export const getPageData = (params: Params): Promise<Result> => {
  return baseService.post(`/xmgbdk/query`, params)
}

// 校验isOpenPMSXmCloseValidate
export const isOpenPMSXmCloseValidate = (): Promise<Result> => {
  return baseService.post(`/xmgbdk/isOpenPMSXmCloseValidate`)
}

// processPMSXmCloseValidate
export const processPMSXmCloseValidate = (params: any[]): Promise<Result> => {
  return baseService.post(`/xmgbdk/processPMSXmCloseValidate`, params)
}

// checkXjjzExistence
export const checkXjjzExistence = (gwxmbm: string, nd: string): Promise<Result> => {
  return baseService.post(`/xmgbdk/checkXjjzExistence?gwxmbm=${gwxmbm}&nd=${nd}`)
}

// validationPro
export const validationPro = (pspids: string, zztbs: string, xmIds: string): Promise<Result> => {
  return baseService.post(`/xmgbdk/validationPro`, {
    pspids: pspids,
    zztbs: zztbs,
    xmIds: xmIds
  })
}

interface ValidationFjParams {
  ids: string
  zztbs: string
}

export const validationFj = (params: ValidationFjParams): Promise<Result> => {
  return baseService.post(`/xmgbdk/validationFj?ids=${params.ids}&zztbs=${params.zztbs}`)
}

//  导出项目
export const exportData = (uuid: string): Promise<Result> => {
  return baseService.export(`/xmgbdk/downloadAttach?uuid=${uuid}`)
}

export const exportPageData = (params: Params): Promise<Result> => {
  return baseService.export(`/xmgbdk/exportXmgbdk`, params)
}

export const searchHistoryPageData = (params: any): Promise<Result> => {
  return baseService.post(`/xmgbdk/queryPushRecords`, params)
}

// 异常处理
export const exceptionHandling = (ids: string[]): Promise<Result> => {
  return baseService.post(`/xmgbdk/exceptionHandling?idList=${ids}`)
}
