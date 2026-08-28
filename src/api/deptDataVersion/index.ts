import baseService from '@/service/baseService'

interface Params {
    [key: string]: any
}

// 版本查询
export function getPage(params: Params) {
    return baseService.post(`dyVer/getPage`, params)
}
// 版本新增
export function add(params: Params) {
    return baseService.post(`dyVer/add`, params)
}

// 版本修改
export function edit(params: Params) {
    return baseService.post(`dyVer/edit`, params)
}
// 版本删除
export function remove(params: Params) {
    return baseService.post(`dyVer/remove/${params.versionId}`)
}

// 版本下发
export function issue(params: Params) {
    return baseService.post(`dyVer/issue/${params.versionId}`)
}

// 新增
export function commonSave(params: Params) {
    return baseService.post(`dy/common/save`, params)
}

// 查看
export function commonGetInfo(params: Params) {
    return baseService.get(`dy/common/getInfo`, params)
}

// 提交
export function commonSubmit(params: Params) {
    return baseService.post(`dy/common/submit`, params)
}

// 删除
export function commonRemove(params: Params) {
    return baseService.post(`dy/common/remove`, params)
}

// 审批通过
export function commonApprove(params: Params) {
    return baseService.post(`dy/common/approve`, params)
}

// 审批驳回
export function commonReject(params: Params) {
    return baseService.post(`dy/common/reject`, params)
}

// 归档
export function commonFiled(params: Params) {
    return baseService.post(`dy/common/filed/${params.versionId}`, )
}
