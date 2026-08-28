import baseService from '@/service/baseService'
import { BaseMethod } from '../base/BaseMethod'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface Results {
  code: number
  data: string
  msg: string
  success: boolean
}

interface Params {
  [key: string]: any
}

interface CalParams {
  expression: any
  xwsw: string
}

interface CodeParams {
  codes: string[]
}

interface BizOrgXzTreeData {
  dwId: string
  nodeType?: string
  parentId: string
  roleCode?: string
  bmid?: string
}

interface ResParams {
  [key: string]: any
}

interface PublicCode {
  code: string
  parentCode: string
}

interface ProtypeTreeYear {
  bmId: string
  nd: string
  parentId: string
}

interface WorkFlowParams {
  dwId: string
  spOrgId: string
}

const budget = new BaseMethod('budget')

interface ProcessParams {
  id: string
}

// 流程履历
export const getProcessMessage = (params: ProcessParams) => {
  return budget.get('/lcll/getLcllByMbz', params, {}, false)
}

// 获取发起组织和单位类型
export const getXmgbdkFlag = (params: WorkFlowParams) => {
  return baseService.get('/xmgbdk/getXmgbdkFlag', params)
}

// 获取项目类别年度(全量、懒加载)
export const getProtypeTreeYear = (params: ProtypeTreeYear): Promise<Result> => {
  return baseService.post(`/protypeTree/getProtypeTreeYear/`, params)
}

// 获取项目类别年度(全量)
export const getProtypeTreeYearAll = (nd: string): Promise<Result> => {
  return baseService.get(`/protypeTree/getProtypeTreeYearAll`, { nd: nd })
}

// 获取code获取公共代码
export const getPublicCodeList = (params: CodeParams): Promise<Result> => {
  return baseService.post(`/process40/getComCodeByCode/`, params)
}

// 获取依赖关系的公共代码
export const getPublicCodesList = (params: CodeParams): Promise<Result> => {
  return baseService.post(`/commonCode/getCommonCode/`, params)
}

interface ssbmParams {
  dwId: string
  bmid: string
  codes: string[]
}
// 获取实施部门的公共代码
export const getSsbmCodesList = (params: ssbmParams): Promise<Result> => {
  return baseService.post(`/commonCode/getCommonCode/`, params)
}

// 获取参数配置
export const getParamValueMulti = (params: string[]): Promise<Result> => {
  return baseService.post(`/sysParam/getParamValueMulti/`, params)
}

// 获取依赖关系的公共代码
export const getCommonCodeByParentCode = (params: PublicCode): Promise<Result> => {
  return baseService.post(`/commonCode/getCommonCodeByParentCode/`, params)
}

// 获取包含单位性质的业务组织树(排除部门)
export const getBizOrgXzTreeExcludeBm = (params: BizOrgXzTreeData): Promise<Result> => {
  if (params.roleCode) {
    return baseService.get(
      `bizOrgTree/getBizOrgXzTreeExcludeBm?parentId=${params.parentId}&dwId=${params.dwId}&nodeType=${params.nodeType}&roleCode=${params.roleCode}&bmid=${params.bmid}`
    )
  } else if (params.nodeType) {
    return baseService.get(`bizOrgTree/getBizOrgXzTreeExcludeBm?parentId=${params.parentId}&dwId=${params.dwId}&nodeType=${params.nodeType}`)
  } else {
    return baseService.get(`bizOrgTree/getBizOrgXzTreeExcludeBm?parentId=${params.parentId}&dwId=${params.dwId}`)
  }
}

// 获取三级分类
export const getSjflList = (parentId: string | number): Promise<Result> => {
  return baseService.post(`/process40/getComCodeByParent/`, {
    parentId: parentId
  })
}

// 获取一级分类
export const getYjflList = (rootCode: string): Promise<Result> => {
  return baseService.post(`/process40/getRootComCode/`, {
    rootCode: rootCode
  })
}

// 获取code获取公共代码分页
export const pageCommonCode = (params: Params): Promise<Result> => {
  return baseService.post(`/commonCode/pageCommonCode`, params)
}

// 获取code获取公共代码
export const getPublicData = (code: string): Promise<Result> => {
  return baseService.get(`/commonCode/getData?code=${code}`)
}

// 获取二三级分类
export const getESJfl = (codes: string): Promise<Result> => {
  return baseService.get(`/commonCode/getESJfl?codes=${codes}`)
}

// 获取code获取公共代码
export const getDataByParent = (code: string): Promise<Result> => {
  return baseService.get(`/commonCode/getDataByParent?code=${code}`)
}

export const getDeptData = (params: Params): Promise<Result> => {
  return baseService.post('process40/getTreeNodeCbzx', params)
}

// 获取流程履历信息
export const getLcll = (params: Params): Promise<Result> => {
  return baseService.get(`lcll/getLcll?id=${params.id}&limit=${params.limit}&page=${params.page}`)
}

// 获取流程履历信息-新
export const getLcllForZl = (params: Params): Promise<Result> => {
  return baseService.get(`lcll/getLcllForZl?id=${params.id}&limit=${params.limit}&page=${params.page}`)
}

// 获取流程履历信息-市级联合会审评审报告获取流程履历信息
export const getLcllByCityLhhsPsbg = (params: Params): Promise<Result> => {
  return baseService.get(`lcll/getLcllByCityLhhsPsbg?meetingId=${params.meetingId}&limit=${params.limit}&page=${params.page}`)
}

// 获取项目类型调整
export const getYssxForZl = (params: Params): Promise<Result> => {
  return baseService.post('zlxqszynew/getYssxForZl', params)
}

// 修改项目类型
export const zlxmXgXmlx = (params: Params): Promise<Result> => {
  return baseService.post('zlxqszynew/zlxmXgXmlx', params)
}

// 获取流程履历信息
export const getParamValue = (paramGroup: string, paramCode: string): Promise<Result> => {
  return baseService.get(`sysParam/getParamValue?paramGroup=${paramGroup}&paramCode=${paramCode}`)
}

// 获取业务组织树
export const getBizOrgXzTree = (params: BizOrgXzTreeData): Promise<Result> => {
  if (params.roleCode) {
    return baseService.get(
      `bizOrgTree/getBizOrgXzTree?parentId=${params.parentId}&dwId=${params.dwId}&nodeType=${params.nodeType}&roleCode=${params.roleCode}&bmid=${params.bmid}`
    )
  } else if (params.nodeType) {
    return baseService.get(`bizOrgTree/getBizOrgXzTree?parentId=${params.parentId}&dwId=${params.dwId}&nodeType=${params.nodeType}`)
  } else {
    return baseService.get(`bizOrgTree/getBizOrgXzTree?parentId=${params.parentId}&dwId=${params.dwId}`)
  }
}
// 业务组织单位无权限过滤
export const getBizOrgTreeNoPermission = (parentId: string): Promise<Result> => {
  return baseService.get(`bizOrgTree/getBizOrgTreeNoPermission?parentId=${parentId}`)
}

// 根据当前用户获取业务组织树
export const getSysOrgByCurrentUser = (dwId: string, parentId: string): Promise<Result> => {
  return baseService.post(`bizOrgTree/getSysOrgByCurrentUser?parentId=${parentId}&dwId=${dwId}`)
}

// 业务组织单位无权限过滤无部门无懒加载
export const getBizOrgXzTreeExcludeBmNoPermissionNoLazy = (): Promise<Result> => {
  return baseService.get(`bizOrgTree/getBizOrgXzTreeExcludeBmNoPermissionNoLazy`)
}

// 获取业务组织树
export const getBizOrgTree = (parentId: string, specialorgid: string): Promise<Result> => {
  return baseService.get(`bizOrgTree/getBizOrgTree?parentId=${parentId}&specialorgid=${specialorgid}`)
}

// 获取项目类型树(包含子类型和虚拟类型)
export const getAllProtypeTree = (): Promise<Result> => {
  return baseService.get(`protypeTree/getAllProtypeTree`)
}

// 获取项目类型树(包含子类型和虚拟类型)(不过滤停用项目)
export const getAllProtypeTreeNew = (): Promise<Result> => {
  return baseService.get(`protypeTree/getAllProtypeTreeNew`)
}

interface ProtypeYearTreeB {
  bmId: string
  nd: string
  parentId: string | number
}

// 获取项目类型树(B计划专用)
export const getProtypeYearTreeB = (params: ProtypeYearTreeB): Promise<Result> => {
  return baseService.post(`protypeTree/getProtypeYearTreeB`, params)
}

// 获取项目类型树
export const getProtypeYearTreeCb = (params: ProtypeYearTreeB): Promise<Result> => {
  return baseService.post(`protypeTree/getProtypeYearTreeCb`, params)
}

// 获取项目类型
export const getSubProtypeTree = (): Promise<Result> => {
  return baseService.get(`protypeTree/getSubProtypeTree`)
}

// 根据归口部门获取项目类型树(包含子类型)
export const getProtypeTreeByGkbm = (gkbmId: string): Promise<Result> => {
  return baseService.get(`protypeTree/getProtypeTreeByGkbm?gkbmId=${gkbmId}`)
}

// 根据归口部门获取项目类型树(不包含子类型)
export const getProtypeTree = (): Promise<Result> => {
  return baseService.get(`protypeTree/getProtypeTree`)
}

// 项目类型配置
export const getGkbmByProtypeId = (protypeId: number): Promise<Result> => {
  return baseService.get(`protypeLink/getGkbmByProtypeId?protypeId=${protypeId}`)
}

// 根据省业务归口部门获取项目类型
export const getProtypeByGkbmId = (gkbmId: string, nd: string) => {
  return baseService.get(`sjtcmbztz/getProtypeByGkbmId?gkbmId=${gkbmId}&nd=${nd}`)
}

// 保存
export const xmxlConfigSave = (gkbmIds: number[], protypeId: number, pwd: string): Promise<Result> => {
  return baseService.post(`protypeLink/save`, {
    gkbmIds: gkbmIds,
    protypeId: protypeId,
    pwd: pwd
  })
}

// 获取年份
export const getYearData = (): Promise<Result> => {
  return baseService.post(`comPz/getNdTreeNode`)
}

// 获取预算科目
export const getYskmTree = (kmlx: string, nd: string, parentId: string, xsws: string): Promise<Result> => {
  return baseService.get(`/comPz/getYskmTree?kmlx=${kmlx}&nd=${nd}&parentId=${parentId}&xsws=${xsws}`)
}

// 获取预算科目
export const getYskmTreeData = (nd: string, parentId: string): Promise<Result> => {
  return baseService.get(`/comPz/getYskmTree?nd=${nd}&parentId=${parentId}`)
}

// 获取科目事项树
export const getKmsxTree = (kmlx: string, nd: string, parentId: string): Promise<Result> => {
  return baseService.get(`/comPz/getKmsxTree?kmlx=${kmlx}&nd=${nd}&parentId=${parentId}`)
}

// 获取角色信息
export const getUserInfo = (userId: string, busicode: string): Promise<Result> => {
  return baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${busicode}`)
}

// 获取按钮对象权限
export const getButtonListNew = (menuId: string, spRoleId: string): Promise<Result> => {
  return baseService.get(`/sysMenu/getButtonListNew?menuCode=${menuId}&spRoleId=${spRoleId}`)
}

// 获取按钮CODE权限
export const getButtonList = (menuId: string, spRoleId: string): Promise<Result> => {
  return baseService.get(`/sysMenu/getButtonList?menuCode=${menuId}&spRoleId=${spRoleId}`)
}

// 计算表达式
export const canculate = (value: CalParams): Promise<Result> => {
  return baseService.post(`/canculate/`, value)
}

// 承诺项
export const getCnxTree = (pid: string): Promise<Result> => {
  return baseService.get(`/cnxTree/getCnxTree?pid=${pid}`)
}

// 获取省归口部门(新)
export const getGkbmInProvince = (): Promise<Result> => {
  return baseService.post(`/commonCode/getGkbmInProvince`)
}

// 根据省归口部门获取省公司归口处室
export const getGkcsByGkbm = (gkbmId: string): Promise<Result> => {
  return baseService.get(`/commonCode/getGkcsByGkbm?gkbmId=${gkbmId}`)
}

// 获取市归口部门
export const getSgbm = (params: Params) => {
  return baseService.post('/commonCode/getSgbm', params)
}

// 根据当前用户获取一级单位(新)
export const getYjdwFromCm = (): Promise<Result> => {
  return baseService.get(`/commonCode/getYjdwFromCm`)
}

// 根据当前用户获取一级单位(新)
export const getYjdwNew = (specialorgid: string): Promise<Result> => {
  return baseService.get(`/commonCode/getYjdwNew?specialorgid=${specialorgid}`)
}

// 获取参数配置信息
export const getParamConfig = (paramKey: string): Promise<Results> => {
  return baseService.get(`/workflow/declare/getParamValue?paramKey=${paramKey}`)
}

// 根据一级单位获取二级单位(新)
export const getEjdwByYjdw = (yjdw: string): Promise<Result> => {
  return baseService.get(`/commonCode/getEjdwByYjdw?yjdw=${yjdw}`)
}

//无权限-一级单位
export const getYjdwData = (): any => {
  return baseService.get(`/xmExpert/getYjdwData`)
}
//无权限-根据一级单位获取二级单位
export const getEjdwData = (id: any): Promise<Result> => {
  return baseService.get(`/xmExpert/getEjdwData?parentId=${id}`)
}


// 根据项目类型获取重点投向
export const getZdtxByXmlx = (xmlxs: string[]): Promise<Result> => {
  return baseService.post(`/commonCode/getZdtxByXmlx`, xmlxs)
}

// 获取用户
export const getAppframeResponse = (params: ResParams): Promise<Result> => {
  const queryParams = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key])
    }
  }
  return baseService.post(`/appframe/getAppframeResponse?${queryParams.toString()}`)
}

// 获取wbs树形结构
export const getXmWbsTree = (parentId: string): Promise<Result> => {
  return baseService.post(`wbsTree/getXmWbsTree?parentId=${parentId}`)
}

// 获取单位
export const getYjdw = (params: Params) => {
  return baseService.post('bizOrgTree/getYjdw', params)
}

// 获取单位
export const commonCodeYjdw = () => {
  return baseService.get('commonCode/getYjdw')
}

export const getEjdw = (params: Params) => {
  return baseService.post('bizOrgTree/getEjdw', params)
}

export const getSysObjByBusicode = (busiCode: string) => {
  return baseService.get(`sys/getSysObjByBusicode?busiCode=${busiCode}`)
}

// 获取专业部门
export const getBmInfo = (bmId: string) => {
  return baseService.get(`bizOrgTree/getBmInfoByBmId?bmId=${bmId}`)
}

// 下载链接
export const downloadAttach = (uuid: string) => {
  return baseService.post(`/budget/attach/downloadAttach?uuid=${uuid}`)
}

// 获取成本中心
export const getCbzx = (params: Params) => {
  return baseService.post(`/bizOrgTree/getCbzx`, params)
}

interface DwAndBmInfo {
  bmId: string // 部门ID
  bmxz: string // 部门性质
  dwId: string // 单位ID
  dwsx: string // 单位属性
  orgFlag: string // 单位性质 PROVINCE(省级单位) CITY(市级单位) COUNTY(县级单位)
  roleCode: string // 角色编码
  roleId: string // 角色ID
}

interface DwAndBmResult {
  code: number
  data: DwAndBmInfo
  msg: string
  success: boolean
}

// 获取单位、部门信息
export const getDwAndBmInfo = (dwId: string, bmId: string, roleId: string): Promise<DwAndBmResult> => {
  return baseService.get(`common/specialorg/getDwAndBmInfo?dwId=${dwId}&bmId=${bmId}&roleId=${roleId}`)
}

interface CommonDictResult {
  code: string
  id: string
  name: string
  note: string
  sort: string
  unicode: string
}

// 获取公共字典
export const getCommonDict = (code: string, pCode?: string): Promise<Result & { data: CommonDictResult[] }> => {
  return budget.get('commonCode/listCommonCode/', { code, pCode })
}
