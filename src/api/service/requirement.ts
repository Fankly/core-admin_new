import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

interface Params {
  [key: string]: any
}

interface ProtypeTreeYear {
  nd: string
  parentId: string
}

export const getProtypeTreeByGkbmId = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeTree/getProtypeTreeByGkbmId`, {
    ...params
  })
}

export const getProtypeTreeYear = (params: ProtypeTreeYear): Promise<Result> => {
  return baseService.post(`/protypeTree/getProtypeTreeYear`, params)
}

export const getProtypeTreeNoMiddle = (): Promise<Result> => {
  return baseService.post(`/protypeTree/getProtypeTreeNoMiddle`)
}

export const getYssxBasicList = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxBasic/getYssxBasicList`, params)
}

export const getFromXqlr = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxBasic/getFromXqlr`, params)
}

export const getGkbmInProvince = (): Promise<Result> => {
  return baseService.post(`/commonCode/getGkbmInProvince`)
}

// 根据id获取预算事项信息
export const getById = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxBasic/getById`, params)
}

// 获取列表
export const getList = (id: string): Promise<Result> => {
  return baseService.get(`/xmAttributeConfig/getList?id=${id}`)
}

// 获取物料资成本问题说明附件
export const getFjListByXmIdAndFjId = (id: string, type: string): Promise<Result> => {
  return baseService.get(`/xmAttributeConfig/getFjListByXmIdAndFjId?xmId=${id}&fjId=${type}`)
}

// 附件预览
export const downloadAttachByView = (uuid: string, isLhhs?: string): Promise<Result> => {
  if (isLhhs) {
    return baseService.export(`/xmAttributeConfig/downloadAttachByView?uuid=${uuid}&isLhhs=${isLhhs}`)
  }
  return baseService.export(`/xmAttributeConfig/downloadAttachByView?uuid=${uuid}`)
}

// 获取同源目录源文件
export const getTymlywj = (): Promise<Result> => {
  return baseService.get(`/xmAttributeConfig/getTymlywj`)
}

// 获取物料资成本问题说明附件类型
export const getWlzcbById = (protypeId: string): Promise<Result> => {
  return baseService.get(`/protypeConfig/getWlzcbById?protypeId=${protypeId}`)
}

interface CreateDeptEditData {
  ids: string[]
  createDeptId: string
}

// 创建部门修改
export const createDeptEditData = (params: CreateDeptEditData) => {
  return baseService.post('/xmAttributeConfig/updateCreateDept', params)
}

// 二级单位
export const getBmByEjdw = (ejdw: string) => {
  return baseService.get(`/xmAttributeConfig/getBmByEjdw?ejdw=${ejdw}`)
}

// 获取项目信息
export const getXmInfo = (xmId: string): Promise<Result> => {
  return baseService.get(`/xmAttributeConfig/getXmInfo?xmId=${xmId}`)
}

// 保存项目信息
export const saveXmInfo = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/saveXmInfo`, params)
}

// 暂存项目信息
export const saveInfoData = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/saveXmInfoTmp`, params)
}

// 获取项目编码
export const getXmbm = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getXmbm`, params)
}
// 获取市归口部门
export const getSgbm = (params: Params): Promise<Result> => {
  return baseService.post(`/commonCode/getSgbm`, params)
}

// 获取预算来源
export const getYslyByXmlxId = (protypeId: string): Promise<Result> => {
  return baseService.get(`/xmAttributeConfig/getYslyByXmlxId?protypeId=${protypeId}`)
}
// 获取预算来源
export const getGmb = (params: Params): Promise<Result> => {
  return baseService.post(`/commonCode/getGmb`, params)
}
export const getZlDwpz = (protypeId: string): Promise<Result> => {
  return baseService.get(`/workflow/zl/zlxqsh/getZlDwpz?id=${protypeId}`)
}

export const getTabColumns = (params: Params): Promise<Result> => {
  const queryParams = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key])
    }
  }
  return baseService.get(`/xmAttributeConfig/getTabColumns?${queryParams.toString()}`)
}

// 上传附件
export const uploadAttachBatch = (formData: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/uploadAttach`, formData)
}

// 导出
export const exportXm = (formData: Params): Promise<Result> => {
  return baseService.export(`/xmAttributeConfig/exportXm`, formData)
}

// 获取暂存数量
export const getXqlrNum = (params: Params): Promise<Result> => {
  const queryParams = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key])
    }
  }
  return baseService.get(`/xmAttributeConfig/getXqlrNum?${queryParams.toString()}`)
}

// 查询集中修改列表
export const getXqlrPage = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getXqlrPage`, params)
}

// 租赁查询
export const zlxqszySearch = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszy/zlxqmxcx`, params)
}

// 租赁查询-新
export const zlxqszySearchNew = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszynew/zlxqmxcx`, params)
}

// 租赁查询-推送-新
export const zlxmlx = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszynew/zlxmlx`, params)
}

// 租赁导出
export const zlxqmxcxExport = (params: Params): Promise<Result> => {
  return baseService.export(`/zlxqszy/zlxqmxcxExport`, params)
}

// 租赁导出
export const zlxqmxcxNewExport = (params: Params): Promise<Result> => {
  return baseService.export(`/zlxqszynew/zlxqmxcxExport`, params)
}

// 项目需求审核待办查询列表
export const getXmxqshListPage = (params: Params): Promise<Result> => {
  return baseService.post(`/workflow/cbxqsh/getXmxqshListPage`, params)
}

//提交(含工作流)
export const submitCbxqsh = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/cbxqsh/submitWf', params)
}

//提交(含工作流)
export const submitZLxqsh = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/zlxqsh/submitWf', params)
}

//提交(含工作流)
export const submitZLxqshNew = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/zl/zlxqsh/submitWf', params)
}

//提交(含工作流)
export const submit = (ids: string[]): Promise<Result> => {
  return baseService.post('/xmAttributeConfig/submit', {
    ids: ids
  })
}

export type InitParams = {
  specialorgid: string
  roleCode: string
  tabType?: number
  sfxg?: string
}

// 获取列表查询条件
export const getDynamicSearchColumn = (params: Params): Promise<Result> => {
  const queryParams = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key])
    }
  }
  return baseService.get(`/xmSearchConfig/getDynamicSearchColumn?${queryParams.toString()}`)
}

// 获取集中修改页面动态配置
export const getDynamicTableByUser = (params: Params): Promise<Result> => {
  const queryParams = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key])
    }
  }
  return baseService.get(`/xmSearchConfig/getDynamicTableByUser?${queryParams.toString()}`)
}

// 获取用户的配置查询条件
export const getSearchColumn = (params: Params): Promise<Result> => {
  const queryParams = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key])
    }
  }
  return baseService.get(`/xmSearchConfig/getSearchColumn?${queryParams.toString()}`)
}

// 用户更新查询条件
export const updateSearchColumn = (params: Params): Promise<Result> => {
  return baseService.post(`/xmSearchConfig/updateSearchColumn`, params)
}

// 删除
export const deleteXm = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/deleteXm`, params)
}

// 业扩项目退回
export const ykxmBack = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/ykxmBack`, params)
}

// 关联事项
export const linkYssx = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/linkYssx`, params)
}

// 查询省财务预审列表
export const getXqjdDataByRole = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getXqjdDataByRole`, params)
}
// 通过
export const pass = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/pass`, params)
}

// 审批
export const reject = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/reject`, params)
}

// 导出
export const exportXqjdDataByRole = (params: Params): Promise<Result> => {
  return baseService.export(`/xmAttributeConfig/exportXqjdDataByRole`, params)
}

// 校验
export const checkByStep = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/checkByStep`, params)
}

// 附件下载
export const downloadAttach = (uuid: string, isLhhs?: string): Promise<Result> => {
  if (isLhhs) {
    return baseService.export(`/xmAttributeConfig/downloadAttach?uuid=${uuid}&isLhhs=${isLhhs}`)
  }
  return baseService.export(`/xmAttributeConfig/downloadAttach?uuid=${uuid}`)
}

// 获取待确认项目类别列表
export const getTbcPage = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getTbcPage`, params)
}

// 根据项目id获取待确认项目类别列表
export const getTbcxmlxListByxmId = (xmId: string): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/getTbcxmlxListByxmId?xmId=${xmId}`)
}

// 项目类别确认
export const confimXmlx = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/confimXmlx?protypeId=${params['protypeId']}&xmId=${params['xmId']}`)
}

// 获取用户的配置查询条件
export const getSbzcInfoByXmId = (xmId: string | null): Promise<Result> => {
  return baseService.get(`/xmSbzc/getSbzcInfoByXmId?xmId=${xmId}`)
}
// 获取设备检修
export const getYfsbzcByXmid = (xmId: string | null): Promise<Result> => {
  return baseService.get(`/xmSbzc/getYfsbzcByXmid?xmid=${xmId}`)
}

// 获取用户的配置查询条件
export const getZcByZcbm = (gsdm: string, zcbm: string): Promise<Result> => {
  return baseService.get(`/xmSbzc/getZcByZcbm?gsdm=${gsdm}&zcbm=${zcbm}`)
}

// 标签审核
export const getBqshFlag = (xmIds: string, dwId: string): Promise<Result> => {
  return baseService.get(`/bqsh/getBqshFlag?xmIds=${xmIds}&dwId=${dwId}`)
}

export const getRepairByXmid = (xmId: string | null): Promise<Result> => {
  return baseService.get(`/api/receivexlyw/getRepairByXmid?xmid=${xmId}`)
}

// 获取数据(项目查看)
export const getDataForXmView = (projectId: string | null): Promise<Result> => {
  return baseService.post(`/gss/getDataForXmView?projectId=${projectId}`)
}

// 获取物料资成本属性对比
export const getMatAttrComp = (projectId: string | null): Promise<Result> => {
  return baseService.post(`/gss/getMatAttrComp?projectId=${projectId}`)
}
// 校验(提交项目)
export const checkWhenSubmitXm = (projectIdList: any[]): Promise<Result> => {
  return baseService.post(`/gss/checkWhenSubmitXm`, projectIdList)
}

// 提交前预审校验(发起工作流前)
export const preAudit = (proIds: Array<string | number>): Promise<Result> => {
  return baseService.post(`/pre-audit-task/preAudit`, proIds)
}

export const getMaintenanceByXmid = (xmId: string | null): Promise<Result> => {
  return baseService.get(`/api/receivexlyw/getMaintenanceByXmid?xmid=${xmId}`)
}

// 需求库管理-退回
export const getXqkglth = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/xqkglth`, params)
}

// 筛选联合会退回和不通过的数据id
export const filterLhhsXmId = (params: any): Promise<Result> => {
  return baseService.post(`/leaderReview/filterLhhsXmId`, params)
}

// 纳入会审跳过流程
export const nrhsBySkipFlow = (params: any): Promise<Result> => {
  return baseService.post(`/leaderReview/nrhsBySkipFlow`, params)
}

//是否跳过联合会审
export const isNeedCheck = (params: any): Promise<Result> => {
  return baseService.post(`/workflow/cbxqsh/isNeedCheck`, params)
}

//流程最后一步业务处理
export const finishHandleOperations = (params: any): Promise<Result> => {
  return baseService.post(`/workflow/cbxqsh/finishHandleOperations`, params)
}

// 获取供应商
export const qryGysData = (params: any): Promise<Result> => {
  return baseService.post(`/zlxqszynew/qryGysData`, params)
}

// 租赁合同台账管理-列表查询
export const searchCsParamList = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/searchCsParamList`, params)
}

// 租赁合同台账管理-获取租金计划列表数据
export const searchPayDayList = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/searchPayDayList`, params)
}

// 租赁合同台账管理-验证合同编号唯一性
export const checkCsSave = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/checkCsSave`, params)
}

// 租赁合同台账管理-暂存
export const csParamSave = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/csParamSave`, params)
}

// 租赁合同台账管理-根据合同ID查询基本信息
export const htDetail = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/htDetail`, params)
}

// 租赁合同台账管理-租金计划-删除
export const payDayDelete = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/payDayDelete`, params)
}

// 租赁合同台账管理-列表导出
export const exportCsParam = (params: Params): Promise<Result> => {
  return baseService.export(`/zlht/exportCsParam`, params)
}

// 租赁合同台账管理-列表删除
export const csParamDelete = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/csParamDelete`, params)
}

// 租赁合同台账管理-获取合同附件列表数据
export const getZlhtfjList = (params: any): Promise<Result> => {
  return baseService.post(`/zlhtfj/getList`, params)
}

//  租赁合同台账管理-合同附件下载附件
export const getDownloadUrl = (uuid: string): Promise<Result> => {
  return baseService.get(`/processFile/getDownloadUrl?uuid=${uuid}`)
}

export const getPageForZlxq = (params: any): Promise<Result> => {
  return baseService.post(`/zlht/getPageForZlxq`, params)
}

interface exportXmAttachParams {
  ids: []
  fjId: string
}

// 批量导出项目附件
export const exportXmAttach = (params: exportXmAttachParams): Promise<Result> => {
  return baseService.export(`/xmAttributeConfig/exportXmAttach`, params)
}

// 页签-专家评审校验
export const checkPsyj = (ids: string[]): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/checkPsyj`, { ids })
}

// 获取工作流编码
export const getWfCodeByXmId = (id: string): Promise<Result & { data: string }> => {
  return baseService.get(`/xmAttributeConfig/getWfCodeByXmId?id=${id}`)
}
