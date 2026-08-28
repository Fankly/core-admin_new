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
// 通信线路查询
export function txxlxxPage(params: Params) {
    return baseService.post(`dy/txxlxx/page`, params)
}
// 通信线路详情
export function txxlxxInfo(params: Params) {
    return baseService.get(`dy/txxlxx/getInfo`, params)
}
// 通信线路添加or修改
export function txxlxxSave(params: Params) {
    return baseService.post(`dy/txxlxx/save`, params)
}
// 通信线路删除
export function txxlxxRemove(params: Params) {
    return baseService.post(`dy/txxlxx/remove`, params)
}

// 通信线路提交
export function txxlxxSubmit(params: Params) {
    return baseService.post(`dy/txxlxx/submit`, params)
}

// 通信线路导入
export function txxlxxImportExcel(params: Params) {
    return baseService.post(`dy/txxlxx/importExcel`, params.excelFormData)
}

// 通信线路导出
export function txxlxxExportExcel(params: Params) {
    return baseService.export(`dy/txxlxx/exportExcel`, params)
}

// 通信线导入模板下载
export function txxlxxGetImportTemplate(params: Params) {
    return baseService.export(`dy/txxlxx/getImportTemplate`, params)
}
// 通信站点查询
export function txzdxxPage(params: Params) {
    return baseService.post(`dy/txzdxx/page`, params)
}
// 通信站点详情
export function txzdxxInfo(params: Params) {
    return baseService.get(`dy/txzdxx/getInfo`, params)
}
// 通信站点添加or修改
export function txzdxxSave(params: Params) {
    return baseService.post(`dy/txzdxx/save`, params)
}
// 通信站点删除
export function txzdxxRemove(params: Params) {
    return baseService.post(`dy/txzdxx/remove`, params)
}

// 通信站点提交
export function txzdxxSubmit(params: Params) {
    return baseService.post(`dy/txzdxx/submit`, params)
}

// 通信站点导入
export function txzdxxImportExcel(params: Params) {
    return baseService.post(`dy/txzdxx/importExcel`, params.excelFormData)
}

// 通信站点导出
export function txzdxxExportExcel(params: Params) {
    return baseService.export(`dy/txzdxx/exportExcel`, params)
}

// 通信站点导入模板下载
export function txzdxxGetImportTemplate(params: Params) {
    return baseService.export(`dy/txzdxx/getImportTemplate`, params)
}

// 通信站点查询
export function txqtxxPage(params: Params) {
    return baseService.post(`dy/txqtxx/page`, params)
}
// 通信站点详情
export function txqtxxInfo(params: Params) {
    return baseService.get(`dy/txqtxx/getInfo`, params)
}
// 通信站点添加or修改
export function txqtxxSave(params: Params) {
    return baseService.post(`dy/txqtxx/save`, params)
}
// 通信站点删除
export function txqtxxRemove(params: Params) {
    return baseService.post(`dy/txqtxx/remove`, params)
}

// 通信站点提交
export function txqtxxSubmit(params: Params) {
    return baseService.post(`dy/txqtxx/submit`, params)
}

// 通信站点导入
export function txqtxxImportExcel(params: Params) {
    return baseService.post(`dy/txqtxx/importExcel`, params.excelFormData)
}

// 通信站点导出
export function txqtxxExportExcel(params: Params) {
    return baseService.export(`dy/txqtxx/exportExcel`, params)
}

// 通信站点导入模板下载
export function txqtxxGetImportTemplate(params: Params) {
    return baseService.export(`dy/txqtxx/getImportTemplate`, params)
}