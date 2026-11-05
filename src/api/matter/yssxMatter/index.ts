import baseService from '@/service/baseService'

interface Params {
  [key: string]: any
}

// 提交
export const submit = (ids: string[]): any => {
  return baseService.post('/yssx/submit', ids)
}

// 提交并发起工作流程
export const submitDec = (params: Params): any => {
  return baseService.post('/workflow/declare/submitWf', params)
}

// 新增/修改
export const addorEditMsg = (params: Params): any => {
  return baseService.post('/yssx/add', params)
}

// 删除
export const delMsg = (ids: string[]): any => {
  return baseService.post('/yssx/delete', { ids: ids })
}

// 删除附件
export const deleteAttach = (params: Params): any => {
  return baseService.post('/yssx/deleteAttach', { ids: params.ids, jd: params.jd })
}

// 附件下载
export const downloadAttach = (uuid: string): any => {
  return baseService.export(`/yssx/downloadAttach?uuid=${uuid}`)
}

// 附件下载(返回下载地址)
export const downloadAttachByUrl = (uuid: string): any => {
  return baseService.post(`/yssx/downloadAttachByUrl?uuid=${uuid}`)
}

// 导出
export const exportMsg = (params: Params): any => {
  return baseService.export(`/yssx/export`, params)
}

// 附件列表
export const getAttach = (yssxbm: string, jd: string): any => {
  return baseService.get(`/yssx/getAttach?yssxbm=${yssxbm}&jd=${jd}`)
}

// 根据预算事项id获取子单位数据(jd:1储备2出库3下达)
export const getChildData = (params: Params): any => {
  return baseService.get(`/yssx/getChildData?id=${params.id}&jd=${params.jd}&yssxId=${params.yssxId}&specialorgid=${params.specialorgid}`)
}

// 获取处室(只有资金来源=0时,传参为归口部门的ID)
export const getCsByBm = (bmid: string): any => {
  return baseService.get(`/yssx/getCsByBm?bmid=${bmid}`)
}

// 获取预算归口部门
export const getGkbmByEjdw = (ejdw: string): any => {
  return baseService.get(`/yssx/getGkbmByEjdw?ejdw=${ejdw}`)
}

// 获取分页列表
export const getPage = (params: Params): any => {
  return baseService.post('/yssx/getPage', params)
}

// 新增页面获取实施单位
export const getSsdw = (params: Params): any => {
  return baseService.get(`/yssx/getSsdw?ejdw=${params.ejdw}&specialorgid=${params.specialorgid}`)
}

// 获取列表查询页状态
export const getYssxZt = (): any => {
  return baseService.get(`/yssx/getYssxZt`)
}

// 根据二级单位获取资金来源
export const getZjly = (ejdw: string): any => {
  return baseService.get(`/yssx/getZjly?ejdw=${ejdw}`)
}

// 上传附件
export const uploadAttach = (params: Params): any => {
  return baseService.post(`/yssx/uploadAttach?yssxbm=${params.yssxbm}&jd=${params.jd}&name=${params.name}`, params.formData)
}

// 附件预览
export const viewAttach = (uuid: string): any => {
  return baseService.post(`/yssx/viewAttach?uuid=${uuid}`)
}

// 获取重点投向
export const getYslxct = (bmId?: string, protypeId?: string): any => {
  if (!bmId) bmId = ''
  if (!protypeId) protypeId = ''
  return baseService.get(`/processYssxctgl/getList?bmId=${bmId}&protypeId=${protypeId}`)
}

// 导入模板
export const getImportTemplate = () => {
  return baseService.export(`/yssx/getImportTemplate`)
}
// 导入
export const importData = (params: any): any => {
  return baseService.post(`/yssx/importData?specialorgid=${params.specialorgid}`, params.excelFormData)
}
