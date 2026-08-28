import baseService from '@/service/baseService'

export interface SearchData {
  dwId?: string
  ejfl?: string
  limit: number
  page: number
  sjfls?: string[]
  specialorgid: string
  xmlxs: string[]
  yjfl?: string
  zgkbmId: string
  zyssxbm?: string
  zyssxmc: string
  status?: string
}

export interface YssxMsg {
  gkbmId: string
  protypeId: string
  yssxId: string
}

export interface SaveYssxMsg {
  createTime?: string
  ejfl: string
  id?: string
  remark: string
  sjfl: string
  xmlx: string
  yjfl: string
  yslxctId: string
  zgkbmId: string
  zyssxbm: string
  zyssxmc: string
  status: string
  zyfjftrtjfw: string
  isDispatch: string
  aqscfylx: string
  sfaqsc: string
  nd: string
  ysly?: string
  sfxysgksp?: string
  cwpsyd?: string
  jhlx?: string
  gkcsId?: string
}

export interface SaveSdkzybmbzMsg {
  id?: string
  code: string
  name: string
  dwxz: string
  zlzclx: string
}

export interface SaveXmxxbcMsg {
  FZRBH?: string
  XMSZD: string
  ALL_INVEST_TAX: string
  ALL_INVEST_TAX_FREE: string
}

export interface SaveYsdwMsg {
  code?: string
  name: string
  sx?: string
  sgscydwCode: string
  sgscydwName: string
  xgsgddwCode: string
  xgsgddwName: string
  sgsgddwCode: string
  sgsgddwName: string
  xgsgddwAudit: string
  sgsgddwAudit: string
  sgscydwAudit: string
  bukrs: string
}

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

interface YssxBasicList {
  gkbmId: string
  protypeId: string
}

export interface GetYssxByZdtxParams {
  zdtxId?: string
  yssxName?: string
  nd: string
}

//删除
export const deleteMatterBasicData = (ids: string[] | number[]): Promise<Result> => {
  return baseService.post('/yssxBasic/delete', {
    ids: ids
  })
}

// 导出
export const exportMatterBasicData = (params: SearchData): Promise<Result> => {
  return baseService.export('/yssxBasic/export', params)
}

//根据id获取预算事项信息
export const getById = (params: YssxMsg): Promise<Result> => {
  return baseService.post('/yssxBasic/getById', params)
}

//根据id获取预算事项信息
export const getChildFl = (parentCode: string): Promise<Result> => {
  return baseService.get(`/yssxBasic/getChildFl?parentCode=${parentCode}`)
}

//根据项目类别id获取一二三级分类
export const getFlByProtypeId = (protypeId: string): Promise<Result> => {
  return baseService.get(`/yssxBasic/getFlByProtypeId?protypeId=${protypeId}`)
}

//获取分页列表
export const getMatterBasicData = (params: SearchData): Promise<Result> => {
  return baseService.post(`/yssxBasic/getPage`, params)
}

//根据省归口部门和项目类别获取预算事项基础数据列表
export const getYssxBasicList = (params: YssxBasicList): Promise<Result> => {
  return baseService.post(`/yssxBasic/getYssxBasicList`, params)
}

//根据重点投向获取预算事项列表
export const getYssxByZdtx = (params: GetYssxByZdtxParams): Promise<Result> => {
  const { zdtxId = '', yssxName = '', nd } = params
  return baseService.get(`/yssxBasic/getYssxByZdtx?zdtxId=${zdtxId}&yssxName=${yssxName}&nd=${nd}`)
}

//新增或修改
export const saveMatterBasicData = (params: SaveYssxMsg): Promise<Result> => {
  return baseService.post(`/yssxBasic/save`, params)
}

// 产业单位与供电单位组织配置-获取分页列表
export const getMatterDwpzData = (params: SearchData): Promise<Result> => {
  return baseService.post(`/zlxqdwpz/getPage`, params)
}

// 产业单位与供电单位组织配置-新增或修改
export const saveMatterDwpzData = (params: SaveYsdwMsg): Promise<Result> => {
  return baseService.post(`/zlxqdwpz/save`, params)
}

// 产业单位与供电单位组织配置-导出
export const exportMatterDwpzData = (params: SearchData): Promise<Result> => {
  return baseService.export('/zlxqdwpz/export', params)
}

// 产业单位与供电单位组织配置-删除
export const deleteMatterDwpzData = (ids: string[] | number[]): Promise<Result> => {
  return baseService.post('/zlxqdwpz/delete', {
    ids: ids
  })
}

// 租赁需求省对口专业部门配置-获取分页列表
export const getZlsdkzybmzclbpzData = (params: SearchData): Promise<Result> => {
  return baseService.post(`/zlsdkzybmzclbpz/getPage`, params)
}

// 租赁需求省对口专业部门配置-新增或修改
export const saveZlsdkzybmclbpz = (params: SaveSdkzybmbzMsg): Promise<Result> => {
  return baseService.post(`/zlsdkzybmzclbpz/save`, params)
}

// 租赁需求省对口专业部门配置-导出
export const exportZlsdkzybmclbpzData = (params: SearchData): Promise<Result> => {
  return baseService.export('/zlsdkzybmzclbpz/export', params)
}

// 租赁需求省对口专业部门配置-删除
export const deleteZlsdkzybmclbpzData = (ids: string[] | number[]): Promise<Result> => {
  return baseService.post('/zlsdkzybmzclbpz/delete', {
    ids: ids
  })
}

// 租赁明细查询-项目信息补充
export const saveZlxmbc = (params: {}): Promise<Result> => {
  return baseService.post(`/zlxqszynew/zlxmbc`, params)
}

// 供应商配置-获取分页列表
export const getList = (params: SearchData): Promise<Result> => {
  return baseService.post(`/zlgys/getList`, params)
}

// 供应商配置-新增或修改
export const saveOrUpdate = (params: SaveYssxMsg): Promise<Result> => {
  return baseService.post(`/zlgys/saveOrUpdate`, params)
}

// 供应商配置-删除
export const gyspzDelete = (ids: string[] | number[]): Promise<Result> => {
  return baseService.post('/zlgys/delete', {
    lifnrs: ids
  })
}

export const getYESJFL = (searchDataCode: string, xmlxId: string, parentCode?: string): Promise<Result> => {
  return baseService.get(`/yssxBasic/getYESJFL?searchDataCode=${searchDataCode}&xmlxId=${xmlxId}&parentCode=${parentCode}`)
}

interface UploadAttachParams {
  fileNames: string[]
  yssxIds: string[]
  formData: FormData
}

// 上传附件
export const uploadAttach = (params: UploadAttachParams): Promise<Result> => {
  return baseService.post(`/yssxBasic/uploadAttach?fileNames=${params.fileNames}&yssxIds=${params.yssxIds}`, params.formData)
}

interface AttachList {
  attachName: string // 附件名称
  id: string // 附件id
  uploadTime: string // 上传时间
  uploadUser: string // 上传人
  uploadUserName: string // 上传人姓名
  uuid: string // 附件uuid
  yssxId: string // 预算事项id
}

interface GetPsydAndfjByYssxIdResult {
  aqscfylx: string // 安全生产费用类型
  attachLists: AttachList[] // 附件列表
  createTime: string // 创建时间
  cwpsyd: string // 财务评审要点
  ejfl: string // 二级分类
  gkcsId: string // 归口处室id
  id: string // id
  isDispatch: string // 是否调度端
  jhlx: string // 计划类型
  nd: string // 年度
  remark: string // 预算事项说明
  sfaqsc: string // 是否安全生产
  sfxysgksp: string // 是否需要省归口审批
  sjfl: string // 三级分类
  status: string // 状态
  uuids: string[] // 附件uuid列表
  xmlx: string // 项目类型
  yjfl: string // 一级分类
  yslxctId: string // 预算事项ID
  ysly: string // 预算来源
  zgkbmId: string // 归口部门id
  zyfjftrtjfw: string // 研发经费投入统计范围
  zyssxbm: string // 预算事项编码
  zyssxmc: string // 预算事项名称
}

// 查询附件
export const getPsydAndfjByYssxId = (yssxId: string): Promise<Result & { data: GetPsydAndfjByYssxIdResult }> => {
  return baseService.get(`/yssxBasic/getPsydAndfjByYssxId?yssxId=${yssxId}`)
}

interface DeleteParams {
  ids: string[] // 附件id列表
}

// 删除附件
export const deleteAttach = (params: DeleteParams): Promise<Result> => {
  return baseService.post(`/yssxBasic/deleteAttach`, params)
}
