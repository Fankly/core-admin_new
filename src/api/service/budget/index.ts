import baseService from '@/service/baseService'

interface Result<T = any> {
  code: number
  data: T
  msg: string
  success: boolean
}

interface SearchParams {
  [key: string]: any
}

export const getYsbgByXmId = (ids: string[]): Promise<Result> => {
  return baseService.post('/xmysbg/getYsbgByXmId', {
    ids: ids
  })
}

export const searchData = (params: SearchParams): Promise<Result> => {
  return baseService.post('/xmysbg/getYsbgPage', params)
}

export const saveData = (saveDatas: SearchParams): Promise<Result> => {
  return baseService.post('/xmysbg/saveYsbg', saveDatas)
}

export const searchHistoryData = (id: string): Promise<Result> => {
  return baseService.get(`/xmysbg/getYsbgHistory?xmId=${id}`)
}

//提交(含工作流)
export const submitWf = (params: SearchParams): Promise<Result> => {
  return baseService.post('/workflow/ysbgsh/submitWf', params)
}

// 导出
export const exportData = (params: SearchParams): any => {
  return baseService.export(`/xmysbg/exportYsbg`, params)
}

interface ResendData {
  ids: string[]
}

interface ResendSapData extends ResendData {
  sendType: string
}

// 推送失败补推计划系统
export const resendData = (params: ResendData): any => {
  return baseService.post(`/xmysbg/resend`, params)
}

// 推送SAP
export const resendSap = (params: ResendSapData): any => {
  return baseService.post(`/xmysbg/resendSap`, params)
}

interface BgAttach {
  attachName: string // 附件名称
  fjId: string // 附件id
  id: number // 主键id
  instime: string // 录入时间
  uploadUserId: number // 上传人id
  uploadUserName: string // 上传人姓名
  uuid: string // 附件uuid
  ysbgId: number // 预算变更id
}

interface BgInfo {
  attaches: Record<string, BgAttach[]> // 附件分组(key为分组标识)
  bgAllInvestTax: number // 变更后总投资(含税)
  bgAmount: number // 变更金额
  bgid: string // 变更id
  bglx: string // 变更类型
  bgyy: string // 变更原因
  byx: string // 变更项
  ssnr: string // 实施内容
  xmid: string // 项目id
}

interface GetBgInfoParams {
  xmid: string
  pageType?: string
}

// 根据项目id获取变更页签数据
export const getBgInfo = (params: GetBgInfoParams): Promise<Result & { data: BgInfo }> => {
  return baseService.get('/sjtc/xmysbg/getBgInfo', params)
}

interface GetFjGroupByXmlxParams {
  opType: string
  xmlx: string
}

interface FjColumnDateCalculation {
  endDateField: string // 结束日期字段
  startDateField: string // 开始日期字段
  targetField: string // 目标字段
  unit: string // 计算单位
}

interface FjColumn {
  calculation: string // 计算公式
  children: (FjColumn | null)[] // 子列
  columnIsDate: string // 字段是否为日期
  dateCalculation: FjColumnDateCalculation // 日期计算配置
  defaultValue: string // 默认值
  dependOnColumns: string // 依赖字段
  dependencies: string[] // 依赖项
  showWhen: string // 条件控制表单字段是否隐藏
  sortCode: string // 排序序号
  span: number // 一行占用几列
  sqlDatePattern: string // 日期格式
  stepEnname: string // 步骤英文名
  stepId: string // 所属步骤id
  stepType: string // 步骤类型
  trigger: string // 校验时间点(鼠标移出等)
  type: string // 控件类型
  value: Record<string, any> // 控件值
  xzhxyb: string // 新增回显源表
  xzhxyzd: string // 新增回显源字段
  zdlx: string // 字段类型
}

interface FjGroupByXmlxItem {
  columns: FjColumn[] // 字段列集合
  stepEnname: string // 步骤英文名
  stepId: string // 步骤id
  stepName: string // tab页签名
  stepType: string // tab页签类型(1普通页签2附件页签)
}

type FjGroupByXmlxRes = FjGroupByXmlxItem[]

// 根据项目类别id获取附件分组信息-同需求录入
export const getFjGroupByXmlx = (params: GetFjGroupByXmlxParams): Promise<Result & { data: FjGroupByXmlxRes }> => {
  return baseService.get('/sjtc/xmysbg/getFjGroupByXmlx', params)
}

interface DeleteDto {
  createDeptId: string // 创建部门id
  ids: string[] // 待删除数据的id集合（项目id）
  meetingId: string // 会议id
  nd: string // 年度
  searchCode: string // 查询编码
  shxx: string // 审核信息
}

interface GetYsbgRecordsVo {
  allInvestTax: number // 总预算含税（万元）
  amount: number // 项目总预算不含税（万元）
  attachName: string // 变更说明附件
  bgAmount: number // 最新调整总预算不含税（万元）
  bgDnys: number // 最新调整当年预算不含税（万元）
  bgid: string // 变更id
  bgyy: string // 最新变更原因
  dncwzc: number // 当年财务支出（万元）
  dnljfsz: number // 当年累计完成投资
  dntzjh: number // 当年投资计划（万元）
  dnys: number // 当年预算不含税（万元）
  ejfl: string // 二级分类
  gbdkShStatus: string // 国网待扣审核状态
  gwxmbm: string // 国网项目编码
  je1: number // 金额1
  ljfsz: number // 累计完成投资
  nd: string // 年度
  protypeId: string // 项目类型id
  sfzt: string // 释放状态
  sfztMc: string // 预算释放状态
  sjfl: string // 三级分类
  uuid: string // uuid
  wbsId1: string // wbs id
  wbsName1: string // wbs 名称
  wbsflag: string // wbs 标识
  xmbm: string // 储备编码
  xmid: string // 项目id
  xmmc: string // 项目名称
  yearInvestTax: number // 当年预算含税（万元）
  ztzjh: number // 总投资计划（万元）
}

// 根据项目id集合获取预算变更记录
export const getYsbgRecordsByXmId = (params: DeleteDto): Promise<Result & { data: GetYsbgRecordsVo[] }> => {
  return baseService.post('/sjtc/xmysbg/getYsbgByXmId', params)
}

// 获取预算变更项目列表-入参
interface GetXmysbgPageDto {
  bgStatus?: string[] // 变更审核状态
  bmId?: string // 部门id
  dwId?: string // 单位id
  ejdw?: string // 二级单位
  ejfl?: string // 二级分类
  gwxmbms?: string[] // 国网项目编码
  limit?: number // 每页数据条数
  nd?: string // 年度
  page?: number // 当前页
  roleCode?: string
  roleId?: string // 角色id
  sfgmb?: number // 是否规模包
  sjfl?: string // 三级分类
  userId?: string
  xmbName?: string // 项目包名称
  xmbms?: string[]
  xmjhlx?: string // 项目计划类型
  xmlxCode?: string
  xmlxId?: string // 项目类别id
  xmmc?: string // 项目名称
  xmxz?: string // 项目性质
  yd?: string
  yjdw?: string // 一级单位
  yjfl?: string // 一级分类
  ysly?: string
}

// 预算变更项目列表-行数据
interface XmysbgPageVo {
  allInvestTax: number // 总预算含税（万元）
  amount: number // 申报金额(万元)(不含税)
  attachName: string
  auatusMc: string // 最新变更状态
  bgAllInvestTax: number // 最新调整总预算含税（万元）
  bgAmount: number // 申报金额(万元)(不含税)变更后
  bgDnys: number // 最新调整当年预算不含税（万元）
  bgYearInvestTax: number // 最新调整当年预算含税（万元）
  bgsj: string // 最新变更时间
  bgyy: string // 最新变更原因
  code: string
  csndtzjh: number // 初始年度投资计划（万元）
  dncwzc: number // 当年财务支出（万元）
  dntzjh: number // 当年投资计划（万元）
  dnxmcn: number // 当年项目承诺（万元）
  dnys: number // 当年预算不含税（万元）
  ejdw: string // 二级单位
  ejfl: string // 二级分类
  gbdkShStatus: string
  gkbm: string // 归口部门
  group: boolean
  gwxmbm: string // 国网项目编码
  gwxmfl: string
  ispack: string // 是否打捆
  ljtzcs: number // 累计预算调整次数
  ljxmcn: number // 累计项目承诺（万元）
  ncys: number // 年初预算
  proType: string
  reason: string // 国网校验信息
  remark: string // SAP校验信息
  sftzfdfwn: string // 是否幅度范围内
  sfzt: string
  sfztMc: string
  sjfl: string // 三级分类
  subFlowStatus: string
  subFlowStatusName: string // 变更状态
  tzfd: number // 本次调整幅度
  xmbName: string // 项目包名称
  xmbm: string // 储备编码
  xmid: string
  xmjhlx: string
  xmjhlxName: string // 项目计划类型
  xmmc: string // 项目名称
  xmxz: string // 项目性质
  yearInvestTax: number // 当年预算含税（万元）
  yjdw: string // 一级单位
  yjfl: string // 一级分类
  ystzcs: number // 当年预算调整次数
  ztzjh: number // 总投资计划（万元）
  ditStatus: string
  auditSt: string
}

// 分页结果
interface IPageXmysbgPageVo {
  current: number // 当前页
  hitCount: boolean
  pages: number // 总页数
  records: XmysbgPageVo[] // 数据集合
  searchCount: boolean
  size: number // 每页条数
  total: number // 总条数
}

// 获取预算变更项目列表
export const getYsbgPage = (params: GetXmysbgPageDto): Promise<Result & { data: IPageXmysbgPageVo }> => {
  return baseService.post('/sjtc/xmysbg/getYsbgPage', params)
}

// 保存预算变更-入参
interface SaveYsbgDto {
  bgAllInvestTax: number // 变更后总投资含税（万元）
  bgAmout: number // 变更金额（万元）
  bgid: string // 变更id
  bglx: string // 变更类型
  bgyy: string // 变更原因
  byx: string // 变更项
  gwxmbm: string // 国网项目编码
  ssnr: string // 实施内容
  tzsy: string // 调整事由
  sfcjpsyj: string // 是否出具评审意见
  uuids: string[] // 附件uuid集合
  xmid: string // 项目id
}

// 保存预算变更
export const saveYsbg = (params: SaveYsbgDto): Promise<Result> => {
  return baseService.post('/sjtc/xmysbg/saveYsbg', params)
}

interface DeleteYsbgDto {
  ids: string[] // 待删除数据的id集合（项目id）
  bgids?: string[] // 预算变更id集合
  [key: string]: any
}

// 删除项目调整变更申请单
export const deleteYsbg = (params: DeleteYsbgDto): Promise<Result> => {
  return baseService.post('/sjtc/xmysbg/deleteYsbg', params)
}

// 上传预算变更附件-入参
interface UploadYsbgAttachParams {
  bgid: string // 变更id
  fjId: string // 附件id
  fileNames: string[] // 文件名集合
  files: File[] // 文件集合
}

// 上传预算变更附件
export const uploadYsbgAttach = (params: UploadYsbgAttachParams): Promise<Result> => {
  const formData = new FormData()
  params.files.forEach((file) => formData.append('files', file))
  const queryString = new URLSearchParams({
    bgid: params.bgid,
    fjId: params.fjId,
    fileNames: params.fileNames.join(',')
  }).toString()
  return baseService.post(`/sjtc/xmysbg/uploadAttach?${queryString}`, formData)
}

// 判断是否可以直接纳会 - 返回data
interface CanBeNrhyData {
  '1': string[] // 可以纳会的项目id集合
  '2': string[] // 不可以纳会的项目id集合
}

// 判断是否可以直接纳会 1可以纳会 0不可以纳会
export const canBeNrhy = (ids: string[]): Promise<Result<CanBeNrhyData>> => {
  return baseService.post('/sjtc/xmysbg/canBeNrhy', ids)
}

// 项目直接纳会
export const nrhy = (ids: string[]): Promise<Result> => {
  return baseService.post('/sjtc/xmysbg/nrhy', ids)
}

// 清除老的变更申请单（后端 @RequestParam xmid，需走 query）
export const cleanOldSqd = (params: { xmid: string }): Promise<Result> => {
  return baseService.get(`/sjtc/xmysbg/cleanOldSqd?xmid=${encodeURIComponent(params.xmid)}`)
}
