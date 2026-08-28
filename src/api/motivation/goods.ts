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
// 注册库查询
export function zckxxPage(params: Params) {
    return baseService.post(`dy/zckxx/page`, params)
}
// 注册库详情
export function zckxxInfo(params: Params) {
    return baseService.get(`dy/zckxx/getInfo`, params)
}
// 注册库添加or修改
export function zckxxSave(params: Params) {
    return baseService.post(`dy/zckxx/save`, params)
}
// 注册库删除
export function zckxxRemove(params: Params) {
    return baseService.post(`dy/zckxx/remove`, params)
}

// 注册库提交
export function zckxxSubmit(params: Params) {
    return baseService.post(`dy/zckxx/submit`, params)
}

// 注册库导入
export function zckxxImportExcel(params: Params) {
    return baseService.post(`dy/zckxx/importExcel`, params.excelFormData)
}

// 注册库导出
export function zckxxExportExcel(params: Params) {
    return baseService.export(`dy/zckxx/exportExcel`, params)
}

// 导入模板下载
export function zckxxGetImportTemplate(params: Params) {
    return baseService.export(`dy/zckxx/getImportTemplate`, params)
}

export function zycxxPage(params: Params) {
    return baseService.post(`dy/zycxx/page`, params)
}
// 注册库详情
export function zycxxInfo(params: Params) {
    return baseService.get(`dy/zycxx/getInfo`, params)
}
// 注册库添加or修改
export function zycxxSave(params: Params) {
    return baseService.post(`dy/zycxx/save`, params)
}
// 注册库删除
export function zycxxRemove(params: Params) {
    return baseService.post(`dy/zycxx/remove`, params)
}

// 注册库提交
export function zycxxSubmit(params: Params) {
    return baseService.post(`dy/zycxx/submit`, params)
}

// 注册库导入
export function zycxxImportExcel(params: Params) {
    return baseService.post(`dy/zycxx/importExcel`, params.excelFormData)
}

// 注册库导出
export function zycxxExportExcel(params: Params) {
    return baseService.export(`dy/zycxx/exportExcel`, params)
}

// 导入模板下载
export function zycxxGetImportTemplate(params: Params) {
    return baseService.export(`dy/zycxx/getImportTemplate`, params)
}