import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.lygBudget

interface infoPageParams {
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  userId: string
  page: number
  limit: number
  [key: string]: any
}

interface infoPageExportParams {
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  userId: string
  [key: string]: any
}

interface progressParams {
  nd: string
  yd?: string
  dwId?: string
  cxjb?: string
}

interface ImportData {
  expertId: any
  meetingId: any
  excelFormData: any
}

interface batchUpdate {
  idList: string[]
  projectManagerId: string
  projectManagerName: string
  directorId: string
  directorName: string
  serviceBidType: string
  materialBidType: string
  jsfs: string
}

interface Params {
  [key: string]: any
}

// 项目全生命周期进度管控总览-获取项目进度
export const getProjectProgress = (params: progressParams): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getProjectProgress', params, {}, false)
}

// 项目全生命周期进度管控总览-获取目标值完成值等数据
export const getMbzWczData = (params: progressParams): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getMbzWczData', params, {}, false)
}

// 项目全生命周期进度管控总览-获取本部及各区县的目标值、完成值、完成率
export const getRegionYszxgk = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getRegionYszxgk', params, {}, false)
}

// 项目全生命周期进度管控总览-获取单位预算执行概览完成率前三名
export const getDwYszxgkTop3 = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getDwYszxgkTop3', params, {}, false)
}

// 项目全生命周期进度管控总览-按分项目大类查询各部门的目标值、完成值、完成率及完成率排名
export const getDeptYszxgk = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getDeptYszxgk', params, {}, false)
}

// 项目全生命周期进度管控总览-获取已出库各阶段项目数及累计已出库项目数
export const getCkjdXms = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getCkjdXms', params, {}, false)
}

// 预算项目全过程监控中心-获取各预警环节提醒/预警/警告项目数
export const getYjhjTj = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getYjhjTj', params, {}, false)
}

// 预算项目全过程监控中心-按连云港统计指定预警环节提醒/预警/警告项目数")
export const getYjhjRegionTj = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getYjhjRegionTj', params, {}, false)
}

// 预算项目全过程监控中心-按市归口部门统计指定预警环节提醒/预警/警告项目数")
export const getYjhjSgbmTj = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getYjhjSgbmTj', params, {}, false)
}

// 预算项目全过程监控中心-预警项目明细查询
export const getYjxmDetail = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getYjxmDetail', params, {}, false)
}

// 预算项目全过程监控中心-预警项目明细查询
export const getSubProtypeTreeByXmlx = (params: Params): Promise<Result> => {
  return budget.get('protypeTree/getSubProtypeTreeByXmlx', params, {}, false)
}

// 预算项目全过程监控中心-预警项目执行关键节点明细查询（按预警环节返回不同字段及超期天数）
export const getYjxmKeyNodeDetail = (params: Params): Promise<Result> => {
  return budget.post('project-lifecycle-overview/getYjxmKeyNodeDetail', params, {}, false)
}

// 预算项目全过程监控中心-预警项目执行关键节点明细导出
export const exportYjxmKeyNodeDetail = (params: Params): Promise<Result> => {
  return budget.exportFile('project-lifecycle-overview/exportYjxmKeyNodeDetail', params, {}, false)
}

// 项目全生命周期进度管控总览-导出超期未立项项目明细
export const exportCqwlxXmmx = (params: progressParams): Promise<Result> => {
  return budget.exportFile('xmqgc-info/exportCqwlxXmmx', params)
}
// 项目全生命周期进度管控总览-超期未立项项目明细分页查询
export const getCqwlxXmmxPage = (params: progressParams): Promise<Result> => {
  return budget.post('xmqgc-info/getCqwlxXmmxPage', params)
}
// 项目全生命周期进度管控总览-导出超期未签订合同项目明细
export const exportCqwqdhtXmmx = (params: progressParams): Promise<Result> => {
  return budget.exportFile('xmqgc-info/exportCqwqdhtXmmx', params)
}
// 项目全生命周期进度管控总览-超期未签订合同项目明细分页查询
export const getCqwqdhtXmmxPage = (params: progressParams): Promise<Result> => {
  return budget.post('xmqgc-info/getCqwqdhtXmmxPage', params)
}
// 项目全生命周期进度管控总览-导出超期未提需求计划项目明细
export const exportCqwtxqjhXmmx = (params: progressParams): Promise<Result> => {
  return budget.exportFile('xmqgc-info/exportCqwtxqjhXmmx', params)
}
// 项目全生命周期进度管控总览-超期未提需求计划项目明细分页查询
export const getCqwtxqjhXmmxPage = (params: progressParams): Promise<Result> => {
  return budget.post('xmqgc-info/getCqwtxqjhXmmxPage', params)
}

// 项目全过程信息表-分页查询
export const xmqgcInfoPage = (params: infoPageParams): Promise<Result> => {
  return budget.post('xmqgc-info/page', params)
}

// 项目全过程信息表-同步数据
export const xmqgcInfoSyncData = (zyear: string): Promise<Result> => {
  return budget.post(`xmqgc-info/syncData?zyear=${zyear}`)
}

// 项目全过程信息表-批量更新
export const batchUpdate = (params: batchUpdate): Promise<Result> => {
  return budget.post(`xmqgc-info/batchUpdate`, params)
}

// 项目全过程信息表-导出数据
export const xmqgcInfoExport = (params: infoPageExportParams): Promise<Result> => {
  return budget.exportFile(`xmqgc-info/export`, params)
}

// 项目全过程信息表-导入项目信息补充
export const importXmxxbc = (params: ImportData): any => {
  return budget.post(`xmqgc-info/importXmxxbc`, params.excelFormData)
}

// 项目全过程信息表-获取项目信息补充导入模板
export const getXmxxbcImportTemplate = (params: infoPageExportParams): Promise<Result> => {
  return budget.exportFile(`xmqgc-info/getXmxxbcImportTemplate`, params)
}

// 项目全过程信息表-更改是否取消预警
export const changeSfqxyj = (params: Params): any => {
  return budget.post(`xmqgc-info/changeSfqxyj`, params)
}

// 预警阈值-分页查询
export const yjyzPage = (params: Params): Promise<Result> => {
  return budget.post(`yjyz/page`, params)
}

// 预警阈值-保存
export const yjyzSave = (params: Params): Promise<Result> => {
  return budget.post(`yjyz/save`, params)
}

// 预警阈值-删除
export const yjyzRemove = (params: Params): Promise<Result> => {
  return budget.post(`yjyz/remove`, params)
}

//招标批次-查询
export const zbpcxxPage = (params: Params): Promise<Result> => {
  return budget.post(`zbpc/page`, params)
}
//招标批次-新增/编辑
export const zbpcxxSave = (params: Params): Promise<Result> => {
  return budget.post(`zbpc/save`, params)
}
//招标批次-删除
export const zbpcxxRemove = (params: any): Promise<Result> => {
  return budget.post(`zbpc/remove`, params)
}

// 招标批次-模板下载
export const zbpcxxGetImportTemplate = (params: any): any => {
  return budget.exportFile(`zbpc/getImportTemplate`, params)
}

// 招标批次-上传附件
export const zbpcxxImportExcel = (params: any): any => {
  return budget.post(`zbpc/importExcel`, params.excelFormData)
}

// 招标批次-导出
export const zbpcxxExportExcel = (params: any): any => {
  return budget.exportFile(`zbpc/exportExcel`, params)
}

//市归口部门与项目类型对应关系配置-查询
export const configPage = (params: Params): Promise<Result> => {
  return budget.post(`sgbm-protype-config/page`, params)
}
//市归口部门与项目类型对应关系配置-新增/编辑
export const configSave = (params: Params): Promise<Result> => {
  return budget.post(`sgbm-protype-config/save`, params)
}
//市归口部门与项目类型对应关系配置-删除
export const configRemove = (params: any): Promise<Result> => {
  return budget.post(`sgbm-protype-config/remove`, params)
}

//市归口部门配置-查询
export const sgbmConfigPage = (params: Params): Promise<Result> => {
  return budget.post(`sgbm-config/page`, params)
}
//市归口部门配置-新增/编辑
export const sgbmConfigSave = (params: Params): Promise<Result> => {
  return budget.post(`sgbm-config/save`, params)
}
//市归口部门配置-删除
export const sgbmConfigRemove = (params: any): Promise<Result> => {
  return budget.post(`sgbm-config/remove`, params)
}

//市归口部门配置-获取预算统计配置清单
export const listYsStatConfig = (nd: string): Promise<Result> => {
  return budget.post(`sgbm-config/listYsStatConfig?nd=${nd}`)
}

// 预警审批流程-提交
export const submit = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/submit`, params)
}

// 预警审批流程-列
export const getDynamicColumn = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/getDynamicColumn?yjBizCode=${params.yjBizCode}`, params)
}

// 预警审批流程-数据
export const getTableData = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/getTableData`, params)
}

// 预警审批流程-通过
export const finishWf = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/finish`, params)
}

// 预警审批流程-驳回
export const reject = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/reject`, params)
}

// 预警审批流程-判断有没有下一步
export const hasNextBizTime = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/hasNextBizTime`, params)
}

// 预警审批流程-更新原因说明
export const updateReason = (params: Params): Promise<Result> => {
  return budget.post(`yj-sp-wf/updateReason`, params)
}
