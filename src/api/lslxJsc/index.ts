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
export interface ImportOther {
  excelFormData: any
}

//目标值两上两下版本管理(省公司)-版本列表查询
export const pageForProvince = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/pageForProvince`, params)
}
//目标值两上两下版本管理(省公司)-新增
export const add = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/add`, params)
}
//目标值两上两下版本管理(省公司)-编辑
export const edit = (params: Params): Promise<Result> => {
  return baseService.put(`mbzlslxVersion/edit`, params)
}
//目标值两上两下版本管理(省公司)-版本下发单位
export const issue = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/issue`, params)
}


//目标值两上两下版本管理(省公司)-版本删除
export const remove = (versionId: String): Promise<Result> => {
  return baseService.delete(`mbzlslxVersion/remove/${versionId}`)
}
//目标值两上两下版本管理(省公司)-获取业务组织树
export const getDwTreeYs = (dwId: any): Promise<Result> => {
  return baseService.post(`/mbzlslxVersion/getDwTree?dwId=${dwId}`)
}
//目标值两上两下版本管理(省公司)-查询下发单位
export const pageDwYs = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/pageDw`, params)
}

//目标值两上两下版本管理(省公司)-保存下发单位
export const saveDwYs = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/saveDw`, params)
}
//目标值两上两下版本管理(省公司)-删除下发单位
export const removeDwYs = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/removeDw`, params)
}
//目标值两上两下版本管理(省公司)-下发单位排序
export const updateDispOrderYs = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/updateDispOrder`, params)
}

//目标值两上两下版本管理(省公司)-下发类型管理
export const getProtypeTree = (params: any): Promise<Result> => {
  return baseService.post(`mbzysProtype/getProtypeTree?nd=${params}`)
}

//目标值两上两下版本管理(省公司)-下发类型保存
export const getProtypeSave = (params: any): Promise<Result> => {
  return baseService.post(`mbzysProtype/save`, params)
}

//目标值两上两下版本管理(省公司)-下发类型排除管理
export const excludegetProtypeTree = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxExcludeProtype/getProtypeTree?nd=${params}`)
}

//目标值两上两下版本管理(省公司)-下发排除类型保存
export const excludeSave = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxExcludeProtype/save`, params)
}








//目标值两上两下版本管理(省公司)-版本下发类型管理
export const getProtypeTreeVer = (params: any): Promise<Result> => {
  return baseService.post(`mbzysProtypeVer/getProtypeTree?versionId=${params}`)
}

//目标值两上两下版本管理(省公司)-版本下发类型保存
export const getProtypeSaveVer = (params: any): Promise<Result> => {
  return baseService.post(`mbzysProtypeVer/save`, params)
}

//目标值两上两下版本管理(省公司)-版本下发类型排除管理
export const excludegetProtypeTreeVer = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxExcludeProtypeVer/getProtypeTree?versionId=${params}`)
}

//目标值两上两下版本管理(省公司)-版本下发排除类型保存
export const excludeSaveVer = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxExcludeProtypeVer/save`, params)
}






//目标值一上预算上报-获取单位信息
export const getDwInfo = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/getDwInfo`, params)
}

// 目标值一上预算上报-分页查询(单位一上上报)
export const pageForDwYssb = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/pageForDwYssb`, params)
}
// 目标值一上预算上报-获取动态表头(一上)
export const getDynamicColumnForYs = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/getDynamicColumnForYs`, params)
}
// 目标值一上预算上报-获取表格数据(一上)
export const getTableDataForYs = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/getTableDataForYs`, params)
}

// 目标值一上预算上报-保存一上规模
export const saveYsgm = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/saveYsgm`, params)
}
// 目标值一上预算上报-获取导入模板(一上)
export const getImportTemplateForYs = (params: any): any => {
  return baseService.export(`/mbzlslxYssb/getImportTemplateForYs`, params)
}

// 目标值一上预算上报-导入一上规模
export const importYsgm = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/importYsgm`, params.excelFormData)
}

// 目标值一上预算上报-导出(一上)
export const exportForYs = (params: any): any => {
  return baseService.export(`/mbzlslxYssb/exportForYs`, params)
}

//目标值一上预算上报-提交审核(含工作流)
export const submitWf = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzys/submitWf', params)
}
// 目标值两上两下数据核定(省公司)-收集进度查询
export const getCollectionProgress = (versionId: any): any => {
  return baseService.post(`/mbzlslxYssb/getCollectionProgress?versionId=${versionId}`)
}

// 目标值两上两下数据核定(省公司)-通过(一上)
export const passForYs = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/passForYs`, params)
}

// 目标值两上两下数据核定(省公司)-驳回(一上)
export const rejectForYs = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/rejectForYs`, params)
}

// 目标值两上两下数据核定(省公司)-通过(二上)
export const passForEs = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/passForEs`, params)
}

// 目标值两上两下数据核定(省公司)-驳回(二上)
export const rejectForEs = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/rejectForEs`, params)
}

// 目标值一下预算核定-获取动态表头(一下)
export const getDynamicColumnForYx = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/getDynamicColumnForYx`, params)
}

// 目标值一下预算核定-获取表格数据(一下)
export const getTableDataForYx = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/getTableDataForYx`, params)
}

// 目标值一下预算核定-获取一下规模汇总数据
export const getYxGmSumData = (params: any): any => {
  return baseService.post(
    `/mbzlslxYssb/getYxGmSumData?versionId=${params.versionId}&nd=${params.nd}`
  )
}

// 目标值一下预算核定-保存一下规模
export const saveYxgm = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/saveYxgm`, params)
}

// 目标值一下预算核定-保存数据（一下）
export const saveDataForYx = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/saveDataForYx`, params)
}

// 目标值一下预算核定-获取导入模板(一下)
export const getImportTemplateForYx = (params: any): any => {
  return baseService.export(
    `/mbzlslxYssb/getImportTemplateForYx?versionId=${params.versionId}&nd=${params.nd}`
  )
}

// 目标值一下预算核定-导入一下规模
export const importYxgm = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/importYxgm`, params.excelFormData)
}

// 目标值一下预算核定-导出(一下)
export const exportForYx = (params: any): any => {
  return baseService.export(`/mbzlslxYssb/exportForYx`, params)
}

// 目标值一下预算核定-保存一下全省总规模
export const saveYxqszgm = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/saveYxqszgm`, params)
}

// 目标值一下预算核定-一下核定
export const yxhd = (versionId: any): any => {
  return baseService.post(`/mbzlslxYssb/yxhd?versionId=${versionId}`)
}

// 目标值两上两下拟出库-分页查询项目信息(一上)
export const pageXmInfoForYs = (params: any): any => {
  return baseService.post(`/mbzlslxNck/pageXmInfoForYs`, params)
}

// 目标值两上两下拟出库-导出项目信息(一上)
export const exportXmInfoForYs = (params: any): any => {
  return baseService.export(`/mbzlslxNck/exportXmInfoForYs`, params)
}

// 目标值两上两下拟出库-分页查询项目信息(二上)
export const pageXmInfoForEs = (params: any): any => {
  return baseService.post(`/mbzlslxNck/pageXmInfoForEs`, params)
}

// 目标值两上两下拟出库-导出项目信息(二上)
export const exportXmInfoForEs = (params: any): any => {
  return baseService.export(`/mbzlslxNck/exportXmInfoForEs`, params)
}

// 目标值两上两下拟出库-提交
export const mbzlslxNckSubmit = (params: any): any => {
  return baseService.post(`/mbzlslxNck/submit`, params)
}

// 目标值两上两下拟出库-提交
export const mbzlslxNckPass = (params: any): any => {
  return baseService.post(`/mbzlslxNck/pass`, params)
}

// 目标值两上两下拟出库-提交
export const mbzlslxNckReject = (params: any): any => {
  return baseService.post(`/mbzlslxNck/reject`, params)
}

// 目标值一上预算上报-获取二上限额
export const getEsLimit = (params: any): any => {
  return baseService.post(
    `/mbzlslxYssb/getEsLimit?versionId=${params.versionId}&dwId=${params.dwId}`
  )
}

// 目标值一上预算上报-分页查询(单位二上上报)
export const pageForDwEssb = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxVersion/pageForDwEssb`, params)
}

// 目标值二上预算上报-获取动态表头(一上)
export const getDynamicColumnForEs = (params: any): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/getDynamicColumnForEs`, params)
}
// 目标值二上预算上报-获取表格数据(一上)
export const getTableDataForEs = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/getTableDataForEs`, params)
}

// 目标值二上预算上报-保存市域统筹金额
export const saveSytcje = (params: Params): Promise<Result> => {
  return baseService.post(`mbzlslxYssb/saveSytcje`, params)
}
// 目标值二上预算上报-获取导入模板(二上)
export const getImportTemplateForEs = (params: any): any => {
  return baseService.export(`/mbzlslxYssb/getImportTemplateForEs`, params)
}

// 目标值二上预算上报-导入市域统筹金额
export const importSytcje = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/importSytcje`, params.excelFormData)
}

// 目标值二上预算上报-导出(二上)
export const exportForEs = (params: any): any => {
  return baseService.export(`/mbzlslxYssb/exportForEs`, params)
}

//目标值二上预算上报-提交审核(含工作流)
export const mbzesSubmitWf = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzes/submitWf', params)
}

// 目标值二下预算核定-获取动态表头(二下)
export const getDynamicColumnForEx = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/getDynamicColumnForEx`, params)
}

// 目标值二下预算核定-获取表格数据(二下)
export const getTableDataForEx = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/getTableDataForEx`, params)
}

// 目标值二下预算核定-保存二下核定金额
export const saveExhdje = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/saveExhdje`, params)
}

// 目标值二下预算核定-获取导入模板(二下)
export const getImportTemplateForEx = (params: any): any => {
  return baseService.export(
    `/mbzlslxYssb/getImportTemplateForEx?versionId=${params.versionId}&nd=${params.nd}`
  )
}

// 目标值二下预算核定-导入二下核定金额
export const importExhdje = (params: any): any => {
  return baseService.post(`/mbzlslxYssb/importExhdje`, params.excelFormData)
}

// 目标值二下预算核定-导出(二下)
export const exportForEx = (params: any): any => {
  return baseService.export(`/mbzlslxYssb/exportForEx`, params)
}

// 目标值二下预算核定-二下核定
export const exhd = (versionId: any): any => {
  return baseService.post(`/mbzlslxYssb/exhd?versionId=${versionId}`)
}