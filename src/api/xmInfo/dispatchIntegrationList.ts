import baseService from '@/service/baseService'

// 导出
export const exportDdxt = (params: any) => {
  return baseService.export(`/ddxt/qdwh/export`, params)
}

// 删除
export const deleteDdxt = (params: any) => {
  return baseService.post(`/ddxt/qdwh/delete`, params)
}

//新增/编辑
export const saveOrUpdate = (params: any) => {
  return baseService.post(`/ddxt/qdwh/saveOrUpdate`, params)
}

//导入
export const importData = (params: any) => {
  return baseService.post(`/ddxt/qdwh/importData`, params.excelFormData)
}

//列表
export const page = (params: any) => {
  return baseService.post(`/ddxt/qdwh/page`, params)
}

//根据项目id获取调度清单列表
export const getDdPageByXmId = (params: any) => {
  return baseService.post(`/ddxt/qdwh/getDdPageByXmId`, params)
}
