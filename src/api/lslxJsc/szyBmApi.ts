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

//目标值两上两下版本管理(省公司)-版本下发省专业部门
export const issueZgkbm = (params: any): Promise<Result> => {
    return baseService.post(`mbzlslxVersion/issueZgkbm`, params)
}

//目标值两上两下版本管理(省公司)-查询下发省专业部门
export const pageZgkbm = (params: any): Promise<Result> => {
    return baseService.post(`mbzlslxVersion/pageZgkbm`, params)
}

//目标值两上两下版本管理(省公司)-保存下发省专业部门
export const saveZgkbm = (params: any): Promise<Result> => {
    return baseService.post(`mbzlslxVersion/saveZgkbm`, params)
}
//目标值两上两下版本管理(省公司)-删除下发省专业部门
export const removeZgkbm = (params: any): Promise<Result> => {
    return baseService.post(`mbzlslxVersion/removeZgkbm`, params)
}

// 目标值一上省专业部门预算上报-分页查询(省专业部门一上上报)
export const pageForZgkbmYssb = (params: Params): Promise<Result> => {
    return baseService.post(`mbzlslxVersion/pageForZgkbmYssb`, params)
}

// 目标值一上省专业部门预算上报-获取动态表头(省专业部门一上)
export const getDynamicColumnForZgkbmYs = (params: any): Promise<Result> => {
    return baseService.post(`mbzlslxYssb/getDynamicColumnForZgkbmYs`, params)
}

// 目标值一上省专业部门预算上报-获取表格数据(省专业部门一上)
export const getTableDataForZgkbmYs = (params: Params): Promise<Result> => {
    return baseService.post(`mbzlslxYssb/getTableDataForZgkbmYs`, params)
}


// 目标值一上省专业部门预算上报-获取导入模板(省专业部门一上)
export const getZgkbmNckXmImportTemplate = (params: any): any => {
    return baseService.export(`/mbzlslxYssb/getZgkbmNckXmImportTemplate`, params)
}

// 目标值一上省专业部门预算上报-导入一上规模
export const importZgkbmNckXm = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/importZgkbmNckXm`, params.excelFormData)
}

// 目标值一上省专业部门预算上报-分页查询已关联拟出库项目信息(省归口部门一上)
export const pageLinkedNckXmInfoForZgkbmYs = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/pageLinkedNckXmInfoForZgkbmYs`, params)
}

// 目标值一上省专业部门预算上报-保存已关联拟出库项目信息(省归口部门一上)
export const updateZgkbmNckXm = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/updateZgkbmNckXm`, params)
}

// 目标值一上省专业部门预算上报-导出已关联拟出库项目信息(省归口部门一上)
export const exportLinkedNckXmInfoForZgkbmYs = (params: any): any => {
    return baseService.export(`/mbzlslxYssb/exportLinkedNckXmInfoForZgkbmYs`, params)
}

// 目标值一上省专业部门预算上报-删除省归口部门拟出库项目(省归口部门一上)
export const removeZgkbmNckXm = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/removeZgkbmNckXm`, params)
}

// 目标值一上省专业部门预算上报-分页查询未关联拟出库项目信息(省归口部门一上)
export const pageUnLinkedNckXmInfoForZgkbmYs = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/pageUnLinkedNckXmInfoForZgkbmYs`, params)
}

// 目标值一上省专业部门预算上报-添加未关联拟出库项目信息到已关联中(省归口部门一上)
export const addZgkbmNckXm = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/addZgkbmNckXm`, params)
}

//目标值一上省专业部门预算上报-提交审核(含工作流)
export const submitWf = (params: Params): Promise<Result> => {
    return baseService.post('/workflow/mbzys/zgkbm/submitWf', params)
}


// 目标值一上省专业部门预算核定-收集进度查询
export const getZgkbmCollectionProgress = (versionId: any): any => {
    return baseService.post(`/mbzlslxYssb/getZgkbmCollectionProgress?versionId=${versionId}`)
  }
  
  // 目标值一上省专业部门预算核定-通过(省归口部门一上)
  export const passForZgkbmYs = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/passForZgkbmYs`, params)
  }
  
  // 目标值一上省专业部门预算核定-驳回(省归口部门一上)
  export const rejectForZgkbmYs = (params: any): any => {
    return baseService.post(`/mbzlslxYssb/rejectForZgkbmYs`, params)
  }




