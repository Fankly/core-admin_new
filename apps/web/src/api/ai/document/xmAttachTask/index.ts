import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'
import baseService from '@/service/baseService'

export const budget = ServiceApi.budget

interface XmAttachTaskParams {
  xmbm?: string // 项目编码（单个，兼容旧调用）
  xmbmList?: string[] // 项目编码列表（批量查询）
  xmmc?: string // 项目名称
  proTypes?: string[] // 项目类型
  jhssnd?: string // 计划实施年度
  yjdw?: string // 一级单位
  zt?: string[] // 项目状态(流程状态code列表)
  attachName?: string // 附件名称
  attachType?: string // 附件类型
  priority?: string // 优先级(1 高 2 中 3 低)
  transcodeStatus?: string // 转码状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  transcodeStartTime?: string // 转码开始时间(yyyy-MM-dd)
  transcodeFinishTime?: string // 转码结束时间(yyyy-MM-dd)
  extractStatus?: string // 提取状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  extractStartTime?: string // 提取开始时间(yyyy-MM-dd)
  extractFinishTime?: string // 提取结束时间(yyyy-MM-dd)
  current: number | string // 页码
  size: number | string // 每页条数
}

interface XmAttachTaskResult {
  id: string // 附件id
  proId: string // 项目id
  priority: string // 优先级(1 高 2 中 3 低)
  content: string // 文本内容
  wordCount: number // 字数
  transcodeStatus: string // 转码状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  transcodeStartTime: string // 转码开始时间
  transcodeEndTime: string // 转码结束时间
  transcodeMessage: string // 转码错误信息
  extractJson: string // 提取结果json字符串
  extractStatus: string // 提取状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  extractStartTime: string // 提取开始时间
  extractEndTime: string // 提取结束时间
  extractMessage: string // 提取错误信息
  createTime: string // 创建时间
  priorityName: string // 优先级名称
  transcodeStatusName: string // 转码状态名称
  extractStatusName: string // 提取状态名称
  attachName: string // 附件名称
  fjId: string // 附件类型id
  fjName: string // 附件类型名称
  xmbm: string // 项目编码
  xmmc: string // 项目名称
  proType: string // 项目类型
  proTypeName: string // 项目类型名称
  jhssnd: string // 计划实施年度
  nd: string // 年度
  yjdw: string // 一级单位
  yjdwName: string // 一级单位名称
}

// 获取项目附件任务分页列表
export const getXmAttachTaskPage = (params: XmAttachTaskParams): Promise<Result> => {
  return budget.post('ai/xmAttachTask/page', params, {}, false)
}

interface XmAttachTaskDetailResult {
  attachId: string // 附件id
  proId: string // 项目id
  priority: string // 优先级(1 高 2 中 3 低)
  content: string // 文本内容
  wordCount: number // 字数
  transcodeStatus: string // 转码状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  transcodeStartTime: string // 转码开始时间
  transcodeEndTime: string // 转码结束时间
  transcodeMessage: string // 转码错误信息
  extractJson: string // 提取结果json字符串
  extractStatus: string // 提取状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  extractStartTime: string // 提取开始时间
  extractEndTime: string // 提取结束时间
  extractMessage: string // 提取错误信息
  createTime: string // 创建时间
}

// 获取项目附件任务详情
export const getXmAttachTaskDetail = (id: string): Promise<Result> => {
  return budget.get(`ai/xmAttachTask/getInfo`, { id }, {}, false)
}

// 删除任务-支持批量
export const removeXmAttachTask = (attachIdList: string[]): Promise<Result> => {
  return budget.post('ai/xmAttachTask/removeXmAttachTask', attachIdList, {}, false)
}

// 修改项目附件任务优先级
export const updateXmAttachTaskPriority = (attachIds: string[], priority: string): Promise<Result> => {
  return budget.post('ai/xmAttachTask/modifyPriority', { attachIds, priority }, {}, false)
}

// 重新执行项目附件预处理任务
export const redoXmAttachTask = (id: string): Promise<Result> => {
  return budget.post(`ai/xmAttachTask/redoPreDeal?id=${encodeURIComponent(id)}`, {}, {}, false)
}

// 异步执行项目附件预处理任务-支持批量
export const syncRedoPreDeal = (ids: string[]): Promise<Result> => {
  return budget.post('ai/xmAttachTask/syncRedoPreDeal', { ids }, {}, false)
}

// 根据项目创建附件预处理任务
export const addXmAttachProjectTasks = (proIdList: string[]): Promise<Result> => {
  return budget.post('ai/xmAttachTask/addProjectTasks', proIdList, {}, false)
}

interface DocumentParams {
  attachId?: string // 附件id
  content?: string // 文本内容
  createTime?: string // 创建时间
  extractFinishTime?: string // 提取完成时间
  extractJson?: string // 提取json
  extractMessage?: string // 提取错误信息
  extractSchema?: string // 提取schema
  extractStartTime?: string
  extractStatus?: string // 提取状态 1：待处理 2：处理中 3：已完成 4：处理失败
  priority?: string // 优先级 1：高 2：中 3：低
  proId?: string // 项目id
  transcodeFinishTime?: string
  transcodeJobId?: string // 转码JOBID
  transcodeJobStatus?: string // 转码JOB状态
  transcodeMessage?: string // 转码错误信息
  transcodeStartTime?: string // 转码开始时间
  transcodeStatus?: string // 转码状态 1：待处理 2：处理中 3：已完成 4：处理失败
  wordCount?: string // 文字字数
}

// 编辑项目附件任务
export const editDocument = (params: DocumentParams): Promise<Result> => {
  return budget.post('ai/xmAttachTask/edit', params, {}, false)
}

// 更新建议书
export const updateExtractData = (params: { attachId: string }): Promise<Result> => {
  return budget.post('ai/xmAttachTask/updateExtractData?' + new URLSearchParams(params).toString(), {}, {}, false)
}

/* ---------------------------------------------------------------------------
 * 文档预处理：建议书 / 可研报告 / 估算书 的结构化编辑
 * 接口协议见 docs/文档预处理任务接口协议.md（fjId：1 建议书 / 2 可研报告 / 38 估算书）
 * ------------------------------------------------------------------------- */

/** 三类文档详情接口的入参（附件ID + 项目ID） */
export interface AttachDocDetailParams {
  proId?: string
  attachId?: string
}

export interface JysAttachPayload {
  id?: string // 主键（修改必传）
  proId?: string
  attachId?: string
  projectName?: string // 项目名称
  projectCom?: string // 项目单位
  projectLifecycle?: string // 项目实施起止时间
  implementPurpose?: string // 项目实施目的
  basicInfo?: string // 基本情况
  existingProblems?: string // 存在问题及实施必要性
  projectJustification?: string // 立项依据
  technologyImplementPlan?: string // 技术实施方案
  powerOutageImplementPlan?: string // 停电实施方案
  effect?: string // 环境影响及经济或社会效益
  disposalProposals?: string // 拆除物资处置建议
  benefitAnalysis?: string // 效益分析
  amount?: number // 总投资不含税（万元）
  allInvestTax?: number // 总投资含税（万元）
  economyContent?: string // 经济性
  complianceContent?: string // 合规性
}

export interface KybgAttachPayload {
  id?: string // 主键（修改必传）
  proId?: string
  attachId?: string
  projectName?: string // 项目名称
  projectCom?: string // 项目单位
  projectBackground?: string // 项目背景
  existingProblems?: string // 必要性
  economyCompliance?: string // 经济性与财务合规性
  technologyImplementPlan?: string // 技术实施方案
  deploymentContent?: string // 建设/检修/实施内容
  benefitAnalysis?: string // 效益分析
  amount?: number // 总投资不含税（万元）
  allInvestTax?: number // 总投资含税（万元）
}

export interface GssAttachPayload {
  projectId?: string // 项目ID（修改必传，后端字段名不是 proId）
  attachId?: string
  projectName?: string // 项目名称
  projectDesc?: string // 项目描述
  totalInvestTaxIn?: number // 含税总投资金额
  totalInvestTaxEx?: number // 不含税总投资金额
  gcTotalInvestTaxIn?: number // 工程总费用含税金额
  cbgjTotalInvestTaxIn?: number // 成本归集总计行合计值
}

// 查询建议书文档详情
export const getJysAttachDetail = (params: AttachDocDetailParams): Promise<Result> => {
  return budget.post('ai/xmAttachTask/getJysAttachDetail', params, {}, false)
}

// 修改建议书文档
export const updateJysAttach = (params: JysAttachPayload): Promise<Result> => {
  return budget.post('ai/xmAttachTask/updateJysAttach', params, {}, false)
}

// 查询可研报告文档详情
export const getKybgAttachDetail = (params: AttachDocDetailParams): Promise<Result> => {
  return budget.post('ai/xmAttachTask/getKybgAttachDetail', params, {}, false)
}

// 修改可研报告文档
export const updateKybgAttach = (params: KybgAttachPayload): Promise<Result> => {
  return budget.post('ai/xmAttachTask/updateKybgAttach', params, {}, false)
}

// 查询估算书文档详情（入参 proId + attachId）
export const getGssAttachDetail = (params: AttachDocDetailParams): Promise<Result> => {
  return budget.post('ai/xmAttachTask/getGssAttachDetail', params, {}, false)
}

// 修改估算书文档（主键字段名是 projectId）
export const updateGssAttach = (params: GssAttachPayload): Promise<Result> => {
  return budget.post('ai/xmAttachTask/updateGssAttach', params, {}, false)
}

// 批量更新知识库
export const updateKbBatch = (attachIdList: string[]): Promise<Result> => {
  return budget.post('ai/xmAttachTask/updateKbBatch', attachIdList, {}, false)
}

// 导出文档预处理任务列表（筛选条件与分页查询一致，返回 Excel 文件流）
export const exportXmAttachTask = (params: Omit<XmAttachTaskParams, 'current' | 'size'>): Promise<Result> => {
  return budget.exportFile('ai/xmAttachTask/exportTask', params, {}, false)
}

/**
 * 按附件ID下载附件。
 * POST /budget-process/xmAttributeConfig/downloadAttachById?id={附件ID}
 * 返回文件流（blob），由 baseService.download 自动创建 <a> 触发浏览器下载。
 */
export const downloadAttachById = (attachId: string, fileName?: string): Promise<void> => {
  return baseService.download(`xmAttributeConfig/downloadAttachById?id=${encodeURIComponent(attachId)}`, undefined, fileName, 'post')
}
