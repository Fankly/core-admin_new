import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface XmAttachTaskParams {
  xmbm?: string // 项目编码
  xmmc?: string // 项目名称
  proTypes?: string[] // 项目类型
  jhssnd?: string // 计划实施年度
  yjdw?: string // 一级单位
  attachName?: string // 附件名称
  attachType?: string // 附件类型
  priority?: string // 优先级(1 高 2 中 3 低)
  transcodeStatus?: string // 转码状态(1 未开始 2 处理中 3 已完成 4 处理失败)
  extractStatus?: string // 提取状态(1 未开始 2 处理中 3 已完成 4 处理失败)
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

// 修改项目附件任务优先级
export const updateXmAttachTaskPriority = (attachIds: string[], priority: string): Promise<Result> => {
  return budget.post('ai/xmAttachTask/modifyPriority', { attachIds, priority }, {}, false)
}

// 重新执行项目附件预处理任务
export const redoXmAttachTask = (id: string): Promise<Result> => {
  return budget.post(`ai/xmAttachTask/redoPreDeal?id=${encodeURIComponent(id)}`, {}, {}, false)
}

// 异步执行项目附件预处理任务（与重新执行参数一致，接口不同）
export const syncRedoPreDeal = (id: string): Promise<Result> => {
  return budget.post(`ai/xmAttachTask/syncRedoPreDeal?id=${encodeURIComponent(id)}`, {}, {}, false)
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

// 批量更新知识库
export const updateKbBatch = (attachIdList: string[]): Promise<Result> => {
  return budget.post('ai/xmAttachTask/updateKbBatch', attachIdList, {}, false)
}
