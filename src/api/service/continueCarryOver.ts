import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

interface SearchForm {
  applyCenter: string
  bmId: string
  bmxz: string
  dwId: string
  ejdw: string
  ejfl: string
  gwStatus: string
  gwxmbms: string[]
  limit: number
  nd: string
  page: number
  protypeId: string
  roleId: string
  sjfl: string
  xmFlowStatus: string
  xmbmc: string
  xmbms: string[]
  xmmc: string
  xmxz: string
  yd: string
  yjdw: string
  yjfl: string
}

// 获取待续建
export const getChoosePage = (params: any): Promise<Result> => {
  return baseService.post(`/xjjz/getChoosePage`, params)
}

interface SaveXjjzData {
  sqdType: string
  protypeId: string | number
  saveDatas: any[]
}

// 保存
export const saveXjjzRecord = (params: SaveXjjzData): Promise<Result> => {
  return baseService.post(`/xjjz/saveXjjzRecord`, params)
}

// 查询
export const queryXjjzPage = (params: SearchForm): Promise<Result> => {
  return baseService.post(`/xjjz/queryXjjzPage`, params)
}

// 撤回
export const resetRecords = (params: string[]): Promise<Result> => {
  return baseService.post(`/xjjz/resetRecords`, {
    ids: params
  })
}

// 导出
export const exportData = (params: SearchForm): Promise<Result> => {
  return baseService.export(`/xjjz/export`, params)
}

// 导入模板
export const getImportTemplate = (params: SearchForm): Promise<Result> => {
  return baseService.export(`/xjjz/getImportTemplate`, params)
}

// 导入
export const importPageData = (params: any): Promise<Result> => {
  return baseService.post(`/xjjz/importData?proType=${params.protypeId}`, params.excelFormData)
}

// 上传附件
export const uploadAttach = (fileName: string, xmIds: string, file: FormData): Promise<Result> => {
  return baseService.post(`/xjjz/uploadAttach?fileName=${fileName}&xmIds=${xmIds}`, file)
}

interface DeleteAttach {
  ids: string[]
  uuid?: string
}

// 删除附件
export const deleteAttach = (params: DeleteAttach): Promise<Result> => {
  return baseService.post(`/xjjz/deleteAttach`, params)
}

interface CheckData {
  gwxmbm: string
  isPack: string
  xmId: string
  xmxz: string
  ysbzId: string
}

// 校验数据
export const checkBeforeSubmit = (params: CheckData[]): Promise<Result> => {
  return baseService.post(`/xjjz/checkBeforeSubmit`, params)
}

// 发送SAP
export const sendSapData = (xmIds: string[]): Promise<Result> => {
  return baseService.post(`/xjjz/fbxmToSap`, {
    ids: xmIds
  })
}

//  下载附件
export const downloadAttach = (uuid: string): Promise<Result> => {
  return baseService.export(`/xjjz/download?uuid=${uuid}`)
}
