import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface MaterialTaskPageParams {
  bmId?: string
  dwId?: string
  limit?: number
  page?: number
  roleCode?: string
  roleId?: string
  status?: string
  xmbm?: string
}

interface createTaskParams {
  ejdw: string
  nd: string
  yd: string
  yjdw: string
}

export interface MaterialTaskDetailPageParams {
  bmId?: string
  dwId?: string
  limit?: number
  page?: number
  roleCode?: string
  roleId?: string
  spRoleId?: string
  taskId?: number | string
  maktx?: string // 物料描述
  matnrList?: string[] // 物料编码列表
  mjahr?: string // 物料年度
  post1?: string // 项目描述
  pspidList?: string[] // 项目定义清单
}

export interface MaterialJudgmentIssue {
  taskId?: number | string //任务ID
  userId?: string //用户ID
  specialOrgId?: string //业务组织ID
  detailIdList?: string[]
}
export interface MaterialJudgmentConfirm extends MaterialJudgmentIssue {
  operator?: {
    userId?: string
    userName?: string
  }
}
export interface MaterialJudgmentSubmitDbDetail {
  taskId?: number | string //任务ID
  createorId?: string //创建人ID
}
export interface MaterialTaskDetailtoDoPageParams extends MaterialJudgmentSubmitDbDetail {
  limit?: number
  page?: number //创建人ID
}

export interface ImportData extends MaterialJudgmentSubmitDbDetail {
  excelFormData: any
}

export interface MaterialDbSave extends MaterialJudgmentSubmitDbDetail {
  list: any
}

// 物料判定任务分页查询
export const getMaterialTaskPage = (params: MaterialTaskPageParams): Promise<Result> => {
  return budget.post('material-judgment-task/page', params)
}

//新建任务
export const createTask = (params: createTaskParams): Promise<Result> => {
  return budget.post('material-judgment-task/create', params)
}

// 删除任务
export const removeTask = (taskIdList: string[]): Promise<Result> => {
  return budget.post('material-judgment-task/remove', taskIdList)
}

//重试
export const retryTask = (taskIdList: any[]): Promise<Result> => {
  return budget.post('material-judgment-task/retry', taskIdList)
}

// 物料判定任务明细分页查询
export const getMaterialTaskDetailPage = (params: MaterialTaskDetailPageParams): Promise<Result> => {
  return budget.post('material-judgment-task-detail/page', params)
}

// 物料判定任务明细根据编码获取同源目录对应描述
export const getSourceDirDescByCode = (sourceDirCode: string): Promise<Result> => {
  return budget.post(`material-judgment-task-detail/getSourceDirDescByCode?sourceDirCode=${sourceDirCode}`)
}

// 物料判定任务明细导出
export const exportMaterialTaskDetail = (params: MaterialTaskDetailPageParams): Promise<Result> => {
  return budget.exportFile('material-judgment-task-detail/exportData', params)
}

// 物料判定任务明细-分页查询待办明细
export const getDbDetailPage = (params: MaterialTaskDetailtoDoPageParams): Promise<Result> => {
  return budget.post('material-judgment-task-detail/getDbDetailPage', params)
}

// 物料判定任务明细-提交待办明细
export const submitDbDetail = (params: MaterialJudgmentSubmitDbDetail): Promise<Result> => {
  return budget.post('material-judgment-task-detail/submitDbDetail', params)
}
// 物料判定任务明细-是否有未提交的待办明细
export const hasUnSubmittedDbDetail = (params: MaterialJudgmentSubmitDbDetail): Promise<Result> => {
  return budget.post('material-judgment-task-detail/hasUnSubmittedDbDetail', params)
}

// 物料判定任务明细-确认
export const getMaterialTaskDetailConfirm = (params: MaterialJudgmentConfirm): Promise<Result> => {
  return budget.post(`material-judgment-task-detail/confirm`, params)
}

// 物料判定任务明细-保存
export const getMaterialTaskDetailSave = (params: MaterialDbSave): Promise<Result> => {
  return budget.post('material-judgment-task-detail/save', params)
}

// 物料判定任务明细-下发
export const getMaterialTaskDetailIssue = (params: MaterialJudgmentIssue): Promise<Result> => {
  return budget.post('material-judgment-task-detail/issue', params)
}

// 物料判定任务明细-导入
export const importData = (params: ImportData): Promise<Result> => {
  return budget.post('material-judgment-task-detail/importData', params.excelFormData)
}

// 物料判定任务明细-导出待办明细
export const exportDbDetail = (params: MaterialJudgmentSubmitDbDetail): Promise<Result> => {
  return budget.exportFile('material-judgment-task-detail/exportDbDetail', params)
}

// 日志
export const getLog = (params: { taskId: number | string; limit: number | string; page: number | string }): Promise<Result> => {
  return budget.post('material-judgment-task-detail-log/page', params)
}

interface MaterialTaskPage {
  detailId?: string
  limit?: number
  page?: number
}
interface MaterialTaskImportData extends MaterialTaskPage {
  excelFormData: any
}

// 物料判定任务明细附件-分页查询
export const getMaterialTaskFilePage = (params: MaterialTaskPage): Promise<Result> => {
  return budget.post('material-judgment-task-detail-file/page', params)
}

// 物料判定任务明细附件-上传
export const getMaterialTaskFileUpload = (params: MaterialTaskImportData): Promise<Result> => {
  return budget.post(`material-judgment-task-detail-file/upload?detailId=${params.detailId}`, params.excelFormData)
}

// 物料判定任务明细附件-下载
export const getMaterialTaskFileDownload = (fileId: string): Promise<Result> => {
  return budget.exportFile(`material-judgment-task-detail-file/download?fileId=${fileId}`)
}

//物料判定任务明细附件-删除
export const getMaterialTaskFileRemove = (params: any): Promise<Result> => {
  return budget.post('material-judgment-task-detail-file/remove', params)
}

//物料判定任务明细附件-预览
export const previewMaterialTaskFile = (fileId: string): Promise<Result> => {
  return budget.exportFile(`material-judgment-task-detail-file/preview?fileId=${fileId}`)
}
export interface MaterialTaskDetailParams {
  bmId?: string
  budatMkpfEnd?: string //凭证中的过账日期结束
  budatMkpfStart?: string //凭证中的过账日期开始
  dwId?: string // 单位Id
  ejdwList?: string[] //二级单位列表
  limit?: number | string //每页条数
  maktx?: string // 物料描述
  matnrList?: string[] // 物料编码清单
  mjahr?: string // 物料年度
  page?: number | string //页码
  post1?: string // 项目描述
  ppjg?: string // 匹配结果
  proTypeList?: string[] // 项目类型清单
  pspidList?: string[] // 项目定义清单
  status?: string // 状态
  userId?: string // 用户Id
  yjdw?: string // 一级单位
}

// 物料判断任务明细-查询
export const getMaterialTaskDetail = (params: MaterialTaskDetailParams): Promise<Result> => {
  return budget.post('material-judgment-task-detail/pageAll', params)
}

// 物料判断任务明细-导出
export const exportMaterialTaskDetailAll = (params: MaterialTaskDetailParams): Promise<Result> => {
  return budget.exportFile('material-judgment-task-detail/exportAllData', params)
}
