/**
 * 要点自动提取 页面类型定义
 *
 * 业务数据直接复用接口类型（src/api/ai/automaticExtractionPoints），
 * 这里只放页面自身的展示/交互类型。
 */
import { KnowledgeFileVO, KnowledgePointVO } from '@/api/ai/automaticExtractionPoints'

/** 文件列表行 = 接口 KnowledgeFileVO */
export type FileRow = KnowledgeFileVO

/** 知识管理行 = 接口 KnowledgePointVO */
export type KnowledgeRow = KnowledgePointVO

/** 列表页签 */
export type ListTab = 'file' | 'knowledge'

/**
 * 文件列表查询条件（字段名与接口 filePage 入参一致，便于直接展开传参）
 * UI 只暴露 3 项：文件名称 / 发布年度 / 发布部门
 */
export interface FileFilters {
  /** 文件名称（模糊） */
  attachName: string
  /** 发布年度 */
  fwYear: string
  /** 发布部门 */
  fwbm: string
}

/**
 * 知识管理查询条件（字段名与接口 pointPage 入参一致）
 * UI 8 项与接口一一对应
 */
export interface KnowledgeFilters {
  /** 来源文件名称（模糊） */
  sourceFile: string
  /** 来源文件发布年度 */
  fwYear: string
  /** 来源文件发布部门 */
  fwbm: string
  /** 审核要点名称（模糊） */
  pointName: string
  /** 审核要点来源（查询用编码：1 制度文件 / 2 经验知识，接口按编码过滤） */
  pointSource: string
  /** 是否已确认（1 已确认 0 待确认） */
  isConfirm: string
  /** 是否已转化AI审核要点（1 已转化 0 未转化） */
  isSolidify: string
  /** 系统是否已实现（1 已实现 0 未实现） */
  isImplement: string
}

/**
 * 审核要点来源（接口字段 pointSource）
 *
 * 真实接口的取值规律（实测：同一套字典，响应与查询用的形式不同）：
 * - **响应给名称**：列表行的 pointSource、统计 bySource.distribution[].name 都是「制度文件 / 经验知识」，
 *   而 pointDetail 原样返回码值（如 "2"）；
 * - **查询/提交/落库用码值**：pointPage 的 pointSource 传名称查不到数据（0 条），传 1 / 2 才命中。
 *
 * 因此页面统一约定：**展示用名称、查询/下钻/提交用码值**，
 * 字典（1 制度文件 / 2 经验知识）由 `hooks/usePointSourceDict.ts` 从公共代码接口
 * `/commonCode/getData?code=AI_AUDIT_POINT_SOURCE_COM` 获取，默认码值 2（经验知识）。
 */

/** 指标卡下钻类型 */
export type CardDrillType = 'parse' | 'extract' | 'translate' | 'implement'

/** 部门分布统计（文件智能解析卡片图例） */
export interface DeptStat {
  dept: string
  count: number
  /** 占比（百分比数值，用于环形图） */
  percent: number
  /** 图示色（按设计稿六色） */
  color: string
}

/** 双段进度条数据（各卡片的图例行） */
export interface TrackStat {
  label: string
  count: number
  /** 百分比数值（用于进度条宽度，卡片内直接展示个数） */
  percent: number
  /** 图例圆点颜色 */
  color: string
  /** 进度条背景（设计稿为渐变） */
  barColor: string
  /** 点击图例时的筛选字段 */
  field: 'pointSource' | 'isConfirm' | 'isSolidify' | 'isImplement'
  /** 点击图例时的筛选值（接口编码：状态 1/0、来源 1/2） */
  value: string
  /** 附加筛选：卡片统计口径隐含的前置条件（转化只统计已确认、实现只统计已转化） */
  extra?: LegendDrillExtra
}

/** 图例点击下钻（卡片图例 → 列表筛选联动，值取接口编码：状态 1/0、来源 1/2） */
export interface LegendDrillPayload {
  /** 目标页签 */
  tab: ListTab
  /** 筛选字段（pointSource 为审核要点来源，取编码 1 / 2） */
  field: 'fwbm' | 'pointSource' | 'isConfirm' | 'isSolidify' | 'isImplement'
  /** 筛选值 */
  value: string
  /** 附加筛选：与 value 一起套到列表查询上（来源/状态图例不传） */
  extra?: LegendDrillExtra
  /** 提示文案 */
  label: string
}

/**
 * 图例下钻的附加筛选
 * 「审核要点转化」卡片只统计已确认的要点（base = 已确认）、
 * 「审核要点实现」卡片只统计已转化的要点（base = 已转化），
 * 图例下钻时要带上这层前置条件，条数才能与卡片数字一致
 */
export type LegendDrillExtra = Partial<Pick<KnowledgeFilters, 'isConfirm' | 'isSolidify' | 'isImplement'>>

/**
 * 审核要点确认弹窗左侧来源文件预览入参
 *
 * 预览本身只认 uuid + 文件名（与文件列表预览同一套）。
 * 知识要点接口只返回 sourceFile/fwYear/fwbm，拿不到 uuid 时由弹窗按
 * 「文件名 + 发布年度 + 发布部门」回查文件分页接口补 uuid。
 */
export interface ConfirmPreviewFile {
  /** 文件 UUID（接口已返回时直接用，避免回查） */
  uuid?: string
  /** 文件名（来源文件名，必填；经验知识为空则不展示预览） */
  attachName: string
  /** 发布年度（回查文件时缩小范围） */
  fwYear?: string
  /** 发布部门（回查文件时缩小范围） */
  fwbm?: string
}

/**
 * 文件列表计数药丸（提取/确认/转化/已实现）→ 知识列表弹窗的带入条件
 * 弹窗内容一致，差别只在带入的过滤条件
 */
export interface KnowledgeListQuery {
  /** 来源文件ID（接口文档未列该字段，先透传，后端支持后按文件精确过滤） */
  attachId: string | number
  /** 来源文件名称（当前按名称过滤） */
  sourceFile: string
  /** 该列对应的条件字段（'' = 不带状态条件，取该文件全部要点） */
  field: '' | 'isConfirm' | 'isSolidify' | 'isImplement'
  /** 条件值（接口 1/0 编码，取 1） */
  value: string
  /** 条件文案（弹窗副标题展示） */
  label: string
}
