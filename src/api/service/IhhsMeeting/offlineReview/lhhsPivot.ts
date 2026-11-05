import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}
interface Params {
  [key: string]: any
}

// ============ 联合会审评审数据透视分析（/lhhsPivot） ============
// 接口文档：《联合会审评审数据透视分析 接口文档》
// 后端不做聚合以外的取数，透视明细按 meetingIds（会议范围）取，故 meetingIds 必传。
// 明细穿透与两个导出都必须与主查询传同一组 meetingIds：后端无状态，不会记住上次的会议范围。

// 获取字段目录（左侧字段面板：dimensions 维度 + metrics 金额指标）
export const getPivotFields = (params: Params = {}): Promise<Result> => {
  return baseService.post('lhhsPivot/getFields', params)
}

// 透视分析：rowDims 行维度 / colDims 列维度 / metrics 金额指标（至少一个）
export const getPivotData = (params: Params): Promise<Result> => {
  return baseService.post('lhhsPivot/getPivotData', params)
}

// 穿透明细列定义：弹窗列表展示哪些列、按什么顺序，由本接口决定
// （与 exportCtData 导出的 13 列同一处定义，因此页面与导出恒等）
export const getCtColumns = (params: Params = {}): Promise<Result> => {
  return baseService.post('lhhsPivot/getCtColumns', params)
}

// 明细穿透：rowDimValues / colDimValues 为空表示该侧不过滤（合计行、合计列）
export const getPivotCtData = (params: Params): Promise<Result> => {
  return baseService.post('lhhsPivot/getCtData', params)
}

// 透视分析导出：入参与 getPivotData 完全一致，返回 xlsx 文件流
export const exportPivotData = (params: Params): Promise<any> => {
  return baseService.export('lhhsPivot/exportData', params)
}

// 明细穿透导出：入参与 getPivotCtData 一致（page / limit 不用传，后端导出命中全量）
export const exportCtData = (params: Params): Promise<any> => {
  return baseService.export('lhhsPivot/exportCtData', params)
}
