import ServiceApi from '@/api/base/ServiceApi'
import { IObject } from '@/types/interface'
import { Result } from './types'
import { ValidateMessage, VersionPage } from './types/provinceTarget'

const targetBudget = ServiceApi.targetBudget

// 省级统筹目标值调整

interface MaintainDetailQueryParams {
  versionId?: string
  dwId?: string
  dataType?: string | string[]
}

interface ImportDataParams {
  versionId: string
  excelFormData: FormData
}

interface SummaryPageQueryParams {
  versionId: string
  page?: number | string
  limit?: number | string
}

interface DetailPageQueryParams extends SummaryPageQueryParams {
  bmId?: string
  dwId?: string
  roleCode?: string
  roleId?: string
}

const serializeMaintainDataType = (dataType?: string | string[]) => {
  if (Array.isArray(dataType)) return dataType.filter(Boolean).join(',')
  return String(dataType || '').trim()
}

const buildMaintainQueryString = ({ versionId, dataType, dwId }: MaintainDetailQueryParams) => {
  const queryList: string[] = []
  if (String(versionId || '').trim()) {
    queryList.push(`versionId=${encodeURIComponent(String(versionId))}`)
  }
  if (String(dwId || '').trim()) {
    queryList.push(`dwId=${encodeURIComponent(String(dwId))}`)
  }
  const dataTypeValue = serializeMaintainDataType(dataType)
  if (dataTypeValue) {
    queryList.push(`dataType=${encodeURIComponent(dataTypeValue)}`)
  }
  return queryList.join('&')
}

//省级统筹目标值版本创建/修改
export const provinceTargetCreateOrEdit = (params: IObject): Promise<Result> => {
  return targetBudget.post('/sjtcmbztz/createVersion', params, {}, false)
}

//省级统筹目标值版本删除
export const provinceTargetDeleteVersion = (ids: string[] | number[]): Promise<Result> => {
  return targetBudget.post('/sjtcmbztz/deleteVersion', {
    ids: ids
  })
}

//省级统筹目标值版本列表
export const getVersionPage = (versionPageParams: VersionPage): Promise<Result> => {
  return targetBudget.post('/sjtcmbztz/getVersionPage', versionPageParams)
}

//一些信息、校验
export const validateMessage = (validateParams: ValidateMessage, showLoading = true): Promise<Result> => {
  return targetBudget.get('/sjtcmbztz/getInitData', validateParams, {}, showLoading)
}

//版本详情表头
export const getDynamicColumn = (params: MaintainDetailQueryParams = {}): Promise<Result> => {
  console.log(params)
  const queryString = buildMaintainQueryString(params)
  const url = queryString ? `/sjtcmbztz/getDynamicColumn?${queryString}` : '/sjtcmbztz/getDynamicColumn'
  return targetBudget.post(url, {}, {}, false)
}

//版本详情数据
export const getVersionDetail = (params: string | MaintainDetailQueryParams): Promise<Result> => {
  const queryParams = typeof params === 'string' ? { versionId: params } : params
  const queryString = buildMaintainQueryString(queryParams)
  return targetBudget.post(`/sjtcmbztz/getVersionDetail?${queryString}`, undefined, {}, false)
}

// 导入模板
export const getImportTemplate = (params: IObject) => {
  return targetBudget.exportFile(`/sjtcmbztz/getImportTemplate?versionId=${params.versionId}`, undefined, {}, false)
}

// 导入
export const importData = (params: IObject) => {
  return targetBudget.post(`/sjtcmbztz/importData?versionId=${params.versionId}`, params.excelFormData, {}, false)
}

// 导出
export const exportData = (params: MaintainDetailQueryParams) => {
  const queryString = buildMaintainQueryString(params)
  return targetBudget.exportFile(`/sjtcmbztz/exportData?${queryString}`, undefined, {}, false)
}

// 项目调整幅度汇总动态表头
export const getSummaryColumn = (versionId: string) => {
  return targetBudget.post(`/sjtcmbztz/xmSum/getDynamicColumn?versionId=${versionId}`, undefined, {}, false)
}

// 项目调整幅度汇总列表
export const getSummaryDataList = (versionId: string) => {
  return targetBudget.post(`/sjtcmbztz/xmSum/getPage?versionId=${versionId}`, undefined, {}, false)
}

// 项目调整幅度汇总导出
export const exportSummaryData = (versionId: string) => {
  return targetBudget.exportFile(`/sjtcmbztz/xmSum/exportSum?versionId=${versionId}`, undefined, {}, false)
}

// 项目明细清单导出
export const exportDetailDataList = (params: DetailPageQueryParams) => {
  return targetBudget.exportFile(`/sjtcmbztz/xmDetail/exportXmDetail`, params, {}, false)
}

// 项目明细清单列表
export const getDetailDataList = (params: DetailPageQueryParams) => {
  return targetBudget.post(`/sjtcmbztz/xmDetail/getPage`, params, {}, false)
}

// 项目明细清单导入模板
export const getDetailImportTemplate = (versionId?: string) => {
  const queryString = versionId ? `?versionId=${encodeURIComponent(versionId)}` : ''
  return targetBudget.exportFile(`/sjtcmbztz/xmDetail/getImportXmDetailTmplate${queryString}`, undefined, {}, false)
}

// 项目明细清单导入
export const importDetailData = (params: ImportDataParams) => {
  return targetBudget.post(`/sjtcmbztz/xmDetail/importXmDetail?versionId=${params.versionId}`, params.excelFormData, {}, false)
}

// 项目明细清单删除
export const deleteDetailData = (ids: string[]) => {
  return targetBudget.post(
    `/sjtcmbztz/xmDetail/deleteXmDetail`,
    {
      ids: ids
    },
    {},
    false
  )
}

interface SaveDataParams {
  versionId: string
  saveDatas: IObject[]
  tzsm?: string
}

// 保存数据
export const saveData = (saveDataParams: SaveDataParams) => {
  return targetBudget.post(`/sjtcmbztz/saveData`, saveDataParams, {}, false)
}

// 项目明细清单保存
export const saveDetailData = (saveDatas: IObject[]) => {
  return targetBudget.post(`/sjtcmbztz/xmDetail/save`, saveDatas, {}, false)
}

// 项目明细清单更新
export const updateDetailData = (saveDatas: IObject[]) => {
  return targetBudget.post(`/sjtcmbztz/xmDetail/update`, saveDatas, {}, false)
}

// 提交审核
export const submitReview = (submitData: IObject) => {
  return targetBudget.post(`/sjtcmbztz/submit`, submitData, {}, false)
}

// 驳回审核
export const withdrawReview = (withdrawData: IObject) => {
  return targetBudget.post(`/sjtcmbztz/reject`, withdrawData, {}, false)
}

// 通过审核
export const approveReview = (approveData: IObject) => {
  return targetBudget.post(`/sjtcmbztz/pass`, approveData, {}, false)
}

// 工作流校验
export const checkFromWf = (versionId: string | number, type = '2') => {
  return targetBudget.post(`/sjtcmbztz/checkFromWf?versionId=${versionId}&type=${type}`, undefined, {}, false)
}

// 目标值重置
export const targetValueResetData = (versionId: string) => {
  return targetBudget.post(`/sjtcmbztz/reset?versionId=${versionId}`, undefined, {}, false)
}

// 校验本部门未激活数量
export const checkByUserDept = (bmId: string, nd: string) => {
  return targetBudget.get(`/sjtcmbztz/checkByUserDept?bmId=${bmId}&nd=${nd}`, undefined, {}, false)
}

// 获取未激活省级统筹平衡调整版本数量
export const getWjhNum = (nd: string) => {
  return targetBudget.get(`/sjtcmbztz/getWjhNum?nd=${nd}`, undefined, {}, false)
}

// 获取版本比对列表
export const getCompareData = (versionIds: string) => {
  return targetBudget.post(`/sjtcmbztz/getCompareData?versionIds=${versionIds}`, undefined, {}, false)
}

// 省级统筹目标值平衡调整版本比对动态表头
export const getCompareColumn = (versionIds: string) => {
  return targetBudget.post(`/sjtcmbztz/getCompareColumn?versionIds=${versionIds}`, undefined, {}, false)
}

// 获取调整说明
export const getTzsmByVersionId = (versionId: string) => {
  return targetBudget.get(`/sjtcmbztz/getTzsmByVersionId?versionId=${versionId}`, undefined, {}, false)
}

interface WqrDetailPageQueryParams {
  bmId: string
  dwId: string
  versionId: string
  roleCode: string
  roleId: string
  page: number | string
  limit: number | string
  flowStatus?: string[]
  nd?: string
  tzlx?: string
  xmbms?: string[]
  xmlxs?: string[]
}

export const getWqrDetailDataList = (params: WqrDetailPageQueryParams) => {
  return targetBudget.post(`/sjtcmbztz/xmDetail/getXmDetailNew`, params, {}, false)
}

export const exportWqrDetailDataList = (params: WqrDetailPageQueryParams) => {
  return targetBudget.exportFile(`/sjtcmbztz/xmDetail/getXmDetailTemplateNew`, params, {}, false)
}

export interface ZkzAndDfjData {
  xmdl: string // 项目大类
  xmdlName: string // 项目大类名称
  protypeId: string // 项目类型Id
  protypeName: string // 项目类型名称
  tzqYsje: string // 调整前目标总控值
  tzqDfj: string // 调整前待分解
  tzqDwSum: string // 各单位目标值合计
  bcsqDfj: string // 本次申请待分解
  bcsqYsje: string // 本次申请目标总控值
  bcsqDwSum: string // 本次申请各单位目标值合计
  bcxgDfj: string // 本次修改待分解
  bcxgYsje: string // 本次修改目标总控值
  bcxgDwSum: string // 本次修改各单位目标值合计
}

// 获取可修改总控制项目列表
export const getZkzAndDfjData = (versionId: string): Promise<Result & { data: ZkzAndDfjData[] }> => {
  return targetBudget.get<ZkzAndDfjData[]>(`/sjtcmbztz/getZkzAndDfjData`, { versionId }, {}, false)
}

export interface ZkzAndDfjParams {
  protypeId: string // 项目类型Id
  ysje: string // 目标总控值也就是本次修改目标总控值
}

export interface ZkzAndDfjParamsList {
  datas: ZkzAndDfjParams[]
  versionId: string
}

// 目标值总控值、待分解值数据修改
export const modifyZkzAndDfjData = (params: ZkzAndDfjParamsList): Promise<Result> => {
  return targetBudget.post(`/sjtcmbztz/modifyZkzAndDfj`, params, {}, false)
}
