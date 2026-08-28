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
interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}
interface ImportData {
  expertId: any
  meetingId: any
  excelFormData: any
}

// 项目清单-新增、编辑
export const saveOrUpdateHandler = (params: any): Promise<Result> => {
  return baseService.post(`zxcsBasic/saveOrUpdateHandler`, params)
}

// 项目清单-查询
export const query = (params: any): Promise<Result> => {
  return baseService.post(`zxcsBasic/query`, params)
}

// 项目清单-根据id查询
export const queryById = (params: any): Promise<Result> => {
  return baseService.post(`zxcsBasic/queryById`, params)
}

// 项目清单-删除
export const deleteHandler = (params: any): Promise<Result> => {
  return baseService.post(`zxcsBasic/deleteHandler`, params)
}

//项目清单-模板下载
export const getImportTemplate = (params: Params): any => {
  return baseService.export(`zxcsBasic/getImportTemplate`, params)
}

// 项目清单-导入
export const importExcel = (params: ImportData): any => {
  return baseService.post(`zxcsBasic/importExcel`, params.excelFormData)
}

//项目清单-动因模板下载
export const getImportTemplateByDy = (params: Params): any => {
  return baseService.export(`zxcsBasic/getImportTemplateByDy`, params)
}

// 项目清单-动因导入
export const importExcelByDy = (params: ImportData): any => {
  return baseService.post(`zxcsBasic/importExcelByDy`, params.excelFormData)
}

//项目清单-导出
export const exportExcel = (params: Params): Promise<Result> => {
  return baseService.export(`zxcsBasic/exportExcel`, params)
}

// 查询人工机械列表
export const queryRgJxList = (): any => {
  return baseService.post(`zxcsBasic/queryRgJxList`, {})
}

// 上传附件
export const uploadZxcsAttach = (params: any): Promise<Result> => {
  const attachType = params.attachType ? `&attachType=${params.attachType}` : ''
  return baseService.post(`zxcsBasic/uploadZxcsAttach?attachNames=${params.attachNames}&xmIds=${params.xmIds}${attachType}`, params.excelFormData)
}

// 获取附件列表
export const getZxcsAttach = (params: Params): any => {
  return baseService.get(`zxcsBasic/getZxcsAttach?xmId=${params.xmId}&attachType=${params.attachType}`)
}

// 删除附件
export const deleteZxcsAttach = (params: Params): any => {
  return baseService.post(`zxcsBasic/deleteZxcsAttach`, params)
}

// 删除动因
export const deleteDyHandler = (params: Params): any => {
  return baseService.post(`zxcsBasic/deleteDyHandler`, params)
}

// 校验动因和附件类型
export const checkProjectDyAndAttach = (params: Params): any => {
  return baseService.post(`zxcsBasic/checkProjectDyAndAttach?xmId=${params.xmId}`)
}

//项目清单-工作量及内容导入模板下载
export const getImportTemplateByDyGzljnr = (params: Params): any => {
  return baseService.export(`zxcsBasic/getImportTemplateByDyGzljnr`, params)
}

// 项目清单-工作量及内容导入
export const importExcelGzljnr = (params: any): any => {
  return baseService.post(`zxcsBasic/importExcelGzljnr?dyid=${params.dyid}`, params.excelFormData)
}

// 删除工作量及内容
export const deleteGzljnrHandler = (params: Params): any => {
  return baseService.post(`zxcsBasic/deleteGzljnrHandler`, params)
}

// 通过动因ID查询工作量及内容
export const queryGzljnrByDyid = (dyid: any): any => {
  return baseService.get(`zxcsBasic/queryGzljnrByDyid?dyid=${dyid}`)
}

// 确认，取消确认
export const confirmedHandler = (params: any): any => {
  return baseService.post(`zxcsBasic/confirmedHandler?zxcsstatus=${params.zxcsstatus}`, params.xmidList)
}

// 根据ID更新模板类型
export const updateMblx = (params: any): any => {
  return baseService.post(`zxcsBasic/updateMblx?id=${params.id}&mblx=${params.mblx}`, params)
}

// 在线测算项目审批-查询
export const zxcsSpBasicQuery = (params: any): Promise<Result> => {
  return baseService.post(`zxcsSpBasic/query`, params)
}

//在线测算项目审批-导出
export const exportExcelZzb = (params: Params): Promise<Result> => {
  return baseService.export(`zxcsBasic/exportExcelByConfirmed`, params)
}

// 在线测算项目审批-在线测算审批分页查询
export const getZxcsSpPage = (params: any): Promise<Result> => {
  return baseService.post(`zxcsSpBasic/getZxcsSpPage`, params)
}
//在线测算项目审批-在线测算审批导出
export const exportZxcsSp = (params: Params): Promise<Result> => {
  return baseService.export(`zxcsSpBasic/exportZxcsSp`, params)
}

// 在线测算项目审批-在线测算审批(观察)分页查询
export const getZxcsSpGcPage = (params: any): Promise<Result> => {
  return baseService.post(`zxcsSpBasic/getZxcsSpGcPage`, params)
}
//在线测算项目审批-在线测算审批(观察)导出
export const exportZxcsSpGc = (params: Params): Promise<Result> => {
  return baseService.export(`zxcsSpBasic/exportZxcsSpGc`, params)
}

// 在线测算项目审批-权限查询
export const queryQx = (params: any): Promise<Result> => {
  return baseService.post(`zxcsSpBasic/queryQx`, params)
}

// 在线测算项目审批-人员配置-人员设置
export const staffArrangementList = (params: any): Promise<Result> => {
  return baseService.post(`staffArrangement/list`, params)
}

// 在线测算项目审批-人员配置-保存
export const staffArrangementSave = (params: Params): any => {
  return baseService.post(`staffArrangement/save`, params)
}

// 在线测算项目审批-人员配置-删除
export const staffArrangementRemove = (id: string): any => {
  return baseService.delete(`staffArrangement/remove/${id}`)
}

// 在线测算项目审批-人员配置-列表
export const staffArrangementListGroupByDept = (params: Params): any => {
  return baseService.post(`staffArrangement/listGroupByDept`, params)
}

// 在线测算项目审批-人员配置-删除绑定关系
export const bindStaffSaveDelete = (params: Params): any => {
  return baseService.post(`zxcs/bindStaff/delete`, params)
}

// 在线测算项目审批-人员配置-获取项目已绑定人员列表
export const getStaffByXmId = (params: Params): any => {
  return baseService.get(`zxcs/bindStaff/getStaffByXmId`, params)
}
// 在线测算项目审批-人员配置-保存绑定关系
export const bindStaffSave = (params: Params): any => {
  return baseService.post(`zxcs/bindStaff/save`, params)
}

// 人员评审意见维护-根据当前用户id获取关联的项目列表
export const getBindXmByUser = (params: Params): any => {
  return baseService.get(`zxcs/psyjwh/getBindXmByUser`, params)
}

// 人员评审意见维护-查看意见
export const getWhyj = (params: Params): any => {
  return baseService.post(`zxcs/psyjwh/save`, params)
}

// 人员评审意见维护-维护意见
export const whyj = (params: Params): any => {
  return baseService.post(`zxcs/psyjwh/whyj`, params)
}

// 人员评审意见维护-驳回
export const zxcsSpReject = (params: Params): any => {
  return baseService.post(`zxcsSpBasic/zxcsSpReject`, params)
}

// 人员评审意见维护-提交
export const zxcsSpSubmit = (params: Params): any => {
  return baseService.post(`zxcsSpBasic/zxcsSpSubmit`, params)
}

// 观察人员维护评审意见-根据当前用户id获取关联的项目列表
export const reviewGetBindXmByUser = (params: Params): any => {
  return baseService.get(`gcry/review/getBindXmByUser`, params)
}

// 观察人员维护评审意见-维护意见
export const reviewWhyj = (params: Params): any => {
  return baseService.post(`gcry/review/whyj`, params)
}

// 评审查询(观察)-观察人员配置-删除绑定关系
export const gcDelete = (params: Params): any => {
  return baseService.post(`gcry/staff/delete`, params)
}

// 评审查询(观察)-观察人员配置-获取项目已绑定人员列表
export const gcGetStaffPage = (params: Params): any => {
  return baseService.post(
    `gcry/staff/getStaffPage?dwType=${params.dwType}&page=${params.page}&size=${params.size}&yjdw=${params.yjdw}&ejdw=${params.ejdw}`,
    params
  )
}
// 评审查询(观察)-观察人员配置-保存绑定关系
export const gcSaveOrUpdate = (params: Params): any => {
  return baseService.post(`gcry/staff/saveOrUpdate`, params)
}

// 评审查询(观察)-观察人员配置-删除绑定关系
export const gcSaveDelete = (params: Params): any => {
  return baseService.post(`/gcry/xm/delete`, params)
}

// 评审查询(观察)-观察人员配置-获取项目已绑定人员列表
export const gcStaffByXmId = (params: Params): any => {
  return baseService.get(`/gcry/xm/getStaffByXmId`, params)
}
// 评审查询(观察)-观察人员配置-保存绑定关系
export const gcStaffSave = (params: Params): any => {
  return baseService.post(`/gcry/xm/save`, params)
}

// 评审查询(观察)-更新项目单位类型
export const updateDwType = (params: Params): any => {
  return baseService.post(`/gcry/xm/updateDwType`, params)
}

// 更新项目创建人和创建人账号
export const updateCreator = (params: Params): any => {
  return baseService.post(`/gcry/xm/updateCreator`, params)
}

// 更新406号文金额
export const updateFourZeroSixWcsjg = (params: Params): any => {
  return baseService.post(`/gcry/xm/updateFourZeroSixWcsjg`, params)
}

// 根据项目id更新项目名称
export const updateXmmc = (params: Params): any => {
  return baseService.post(`/gcry/xm/updateXmmc`, params)
}
