import { Result } from '@/api/types'
import baseService from '@/service/baseService'

/**
 * 要点自动提取（预算AI / 审核要点知识管理）
 *
 * 注意：attachId / pointId 是后端 int64，经 http 层的 jsonBigstring 解析后是**字符串**，
 * 类型都用 string | number 承接，不要 Number() 转换（会丢精度）。
 */

/** MyBatis-Plus 分页信封 */
export interface PageResult<T> {
  records: T[]
  total: string | number
  size: string | number
  current: string | number
  pages: string | number
}

/** 部门分布（卡片 1 图例） */
export interface DeptDistribution {
  /** 部门名称 */
  name: string
  /** 文件数量（接口返回字符串，前端 toNumber 兜底） */
  cnt: string | number
  /** 占比，如 33% */
  rate: string
}

/** 分布明细项（卡片 2 图例）：来源维度的 name 是名称（制度文件 / 经验知识），状态维度的 name 是中文状态名 */
export interface DistributeItem {
  name: string
  cnt: string | number
  rate: string
}

/** 审核要点分布（卡片 2，按来源 / 按状态两个维度） */
export interface PointDistribute {
  /** 要点总数 */
  total: string | number
  /** 后端指定的默认维度：source 按来源 / status 按状态 */
  defaultGroupBy?: 'source' | 'status'
  /** 按来源 */
  bySource: {
    total: string | number
    distribution: DistributeItem[]
  }
  /** 按状态（附带确认数、确认率，与卡片原有文案一致） */
  byStatus: {
    total: string | number
    confirmCnt: string | number
    waitConfirmCnt: string | number
    confirmRate: string
    distribution: DistributeItem[]
  }
}

/** 统计：文件解析 / 要点分布 / 转译 / 实现 */
export interface StatisticsData {
  fileParse: {
    /** 已上传文件总数 */
    total: number
    deptDistribution: DeptDistribution[]
  }
  /** 审核要点分布（卡片 2；原 pointExtract 结构已由后端替换为本节点） */
  pointDistribute: PointDistribute
  pointTranslate: {
    /** 已转译数 */
    solidifyCnt: number
    /** 未转译数 */
    notSolidifyCnt: number
    /** 转译率，如 40% */
    translateRate: string
  }
  pointImplement: {
    /** 已实现数 */
    implementCnt: number
    /** 未实现数 */
    notImplementCnt: number
    /** 实现率，如 50% */
    implementRate: string
  }
}

/** 文件列表分页 / 导出筛选参数 */
export interface KnowledgeFilePageDTO {
  /** 页码（导出时忽略） */
  page?: number
  /** 每页条数（导出时忽略） */
  limit?: number
  /** 文件名称（模糊） */
  attachName?: string
  /** 文号（模糊） */
  wjzh?: string
  /** 发布年度 */
  fwYear?: string
  /** 发布部门 */
  fwbm?: string
  /** 提取状态（1 待提取 2 提取中 3 已提取 4 提取失败） */
  extractStatus?: string
}

/** 文件列表行 */
export interface KnowledgeFileVO {
  /** 附件ID */
  attachId: string | number
  /** 附件 UUID（预览 / 下载用） */
  uuid?: string
  /** 文件名称 */
  attachName: string
  /** 文号 */
  wjzh: string
  /** 发布年度 */
  fwYear: string
  /** 发布部门 */
  fwbm: string
  /** 提取状态编码 */
  extractStatus: string
  /** 提取状态名称（已提取/未提取） */
  extractStatusName: string
  /** 解析时间 */
  extractTime: string
  /** 提取审核要点数 */
  pointCnt: string | number
  /** 确认审核要点数 */
  confirmCnt: string | number
  /** 转译AI要点数 */
  solidifyCnt: string | number
  /** 系统已实现要点数 */
  implementCnt: string | number
}

/** 知识管理分页 / 导出筛选参数 */
export interface KnowledgePointPageDTO {
  /** 页码（导出时忽略） */
  page?: number
  /** 每页条数（导出时忽略） */
  limit?: number
  /**
   * 来源文件ID（附件主键）
   * 注：接口文档未列该字段，按需求与 sourceFile 一并透传，后端支持后即按文件精确过滤
   */
  attachId?: string | number
  /** 审核要点名称（模糊） */
  pointName?: string
  /** 审核要点来源（查询用编码：1 制度文件 / 2 经验知识；响应里该字段给的是名称） */
  pointSource?: string
  /** 来源文件名称（模糊） */
  sourceFile?: string
  /** 来源文件发布部门 */
  fwbm?: string
  /** 来源文件发布年度 */
  fwYear?: string
  /** 是否已确认（1 已确认 0 待确认） */
  isConfirm?: string
  /** 是否已转译AI审核要点（1 已转译 0 未转译） */
  isSolidify?: string
  /** 系统是否已实现（1 已实现 0 未实现） */
  isImplement?: string
  /** 审核要点生效状态（1 失效 其余 生效中） */
  effectiveStatus?: string
}

/** 知识管理行 / 审核要点详情 */
export interface KnowledgePointVO {
  /** 审核要点ID */
  pointId: string | number
  /** 审核要点 */
  pointName: string
  /** 审核要点判断规则 */
  judgementRuleDesc: string
  /** 数据来源 */
  dataSource?: string | null
  /** 审核要点描述 */
  pointDescription?: string | null
  /**
   * 审核要点来源
   * 注：列表/统计返回名称（制度文件 / 经验知识），pointDetail 原样返回码值（如 "2"）；
   * 查询 / 提交时该字段要用码值（1 制度文件 / 2 经验知识），
   * 字典走公共代码 AI_AUDIT_POINT_SOURCE_COM，见页面 hooks/usePointSourceDict.ts
   */
  pointSource?: string | null
  /**
   * 审核要点来源编码（后端新增，稳定码值：1 制度文件 / 2 经验知识）
   * 名称可能调整，业务判断（如左侧是否展示来源文件预览）优先用该字段；
   * 旧数据没有该字段时，前端再回退到 pointSource 的名称/码值判断。
   */
  pointSourceCode?: string | null
  /** 原文出处 */
  originalEvidence: string
  /** 来源文件 */
  sourceFile: string
  /**
   * 来源文件 UUID（预览 / 下载用）
   * 注：接口文档未列该字段；当前列表/详情未返回时，确认弹窗按
   * sourceFile + fwYear + fwbm 回查文件分页接口补 uuid
   */
  uuid?: string
  /** 来源文件发布年度 */
  fwYear: string
  /** 来源文件发布部门 */
  fwbm: string
  /** 生效状态编码（1 失效 其余 生效中） */
  effectiveStatus: string
  /** 生效状态名称 */
  effectiveStatusName: string
  /** 是否已确认编码 */
  isConfirm: string
  /** 是否已确认名称 */
  isConfirmName: string
  /** 确认时间 */
  confirmTime: string
  /** 是否已转译编码 */
  isSolidify: string
  /** 是否已转译名称 */
  isSolidifyName: string
  /** 系统是否已实现编码 */
  isImplement: string
  /** 系统是否已实现名称 */
  isImplementName: string
  /** 审核要点编码 */
  auditPointCode?: string
  /** 规则编码 */
  ruleCode?: string
  /** 规则名称 */
  ruleName?: string
}

/** 文件选择列表查询参数 */
export interface KnowledgePickerQueryDTO {
  /** 快速搜索：文件名称 / 文号 / 发布部门 */
  keyword?: string
  /** 发布部门 */
  fwbm?: string
  /** 发布年度 */
  fwYear?: string
}

/** 文件选择列表行 */
export interface KnowledgePickerFileVO {
  /** 来源文件ID */
  attachId: string | number
  /** 文件名称 */
  attachName: string
  /** 文号 */
  wjzh: string
  /** 发布年度 */
  fwYear: string
  /** 发布部门 */
  fwbm: string
  /** 文件后缀（pdf/doc/docx…） */
  fileSuffix: string
}

/** 开始提取入参 */
export interface KnowledgeExtractDTO {
  /** 选中的来源文件ID 列表 */
  attachIds: Array<string | number>
}

/** 确认 / 保存 / 删除审核要点入参 */
export interface KnowledgePointOperateDTO {
  /** 审核要点ID（新建经验知识时不传，由后端生成） */
  pointId?: string | number
  /** 审核要点 */
  pointName?: string
  /** 审核要点判断规则 */
  judgementRuleDesc?: string
  /** 数据来源 */
  dataSource?: string | null
  /** 审核要点描述 */
  pointDescription?: string | null
  /** 审核要点来源（提交用编码：1 制度文件 / 2 经验知识） */
  pointSource?: string | null
  /** 原文出处 */
  originalEvidence?: string
  /** 是否固化为AI审核要点（1 是 0 否） */
  isSolidify?: string
  /** 是否确认（1：确认 0：取消确认；不传保持原值）—— 对应确认弹窗的「是否为有效审核要点」，是 = 确认 */
  isConfirm?: string
  /** 生效状态编码（1 失效 其余 生效中） */
  effectiveStatus?: string
}

/** 统计：文件解析 / 要点提取 / 转译 / 实现 */
export const getKnowledgeStatistics = (): Promise<Result & { data: StatisticsData }> => baseService.get('/attachPointKnowledge/statistics')

/** 文件列表分页 */
export const getKnowledgeFilePage = (params: KnowledgeFilePageDTO): Promise<Result & { data: PageResult<KnowledgeFileVO> }> =>
  baseService.post('/attachPointKnowledge/filePage', params)

/** 知识管理分页 */
export const getKnowledgePointPage = (params: KnowledgePointPageDTO): Promise<Result & { data: PageResult<KnowledgePointVO> }> =>
  baseService.post('/attachPointKnowledge/pointPage', params)

/** 文件选择-列表（排除已建任务） */
export const getPickerFileList = (params: KnowledgePickerQueryDTO): Promise<Result & { data: KnowledgePickerFileVO[] }> =>
  baseService.post('/attachPointKnowledge/picker/fileList', params)

/** 开始审核要点提取（入队），返回入队条数 */
export const startExtract = (params: KnowledgeExtractDTO): Promise<Result & { data: number }> =>
  baseService.post('/attachPointKnowledge/startExtract', params)

/** 审核要点详情 */
export const getPointDetail = (pointId: string | number): Promise<Result & { data: KnowledgePointVO }> =>
  baseService.get('/attachPointKnowledge/pointDetail', { pointId })

/** 确认审核要点 */
export const confirmPoint = (params: KnowledgePointOperateDTO): Promise<Result & { data: boolean }> =>
  baseService.post('/attachPointKnowledge/confirm', params)

/**
 * 新增经验知识审核要点（经验知识维护弹窗保存）
 * 后端接口：POST /attachPointKnowledge/saveExperiencePoint（入参与 confirm 同一套「编辑参数」，
 * 来源由后端固定为「经验知识」），返回新增的要点ID（int64，字符串安全）
 */
export const saveExperiencePoint = (params: KnowledgePointOperateDTO): Promise<Result & { data: string | number }> =>
  baseService.post('/attachPointKnowledge/saveExperiencePoint', params)

/** 删除审核要点 */
export const deletePoint = (pointId: string | number): Promise<Result & { data: boolean }> =>
  baseService.post('/attachPointKnowledge/deletePoint', { pointId })

/** 删除文件（按附件ID） */
export const deleteKnowledgeFile = (attachId: string | number): Promise<Result & { data: boolean }> =>
  baseService.post('/attachPointKnowledge/fileDelete', { attachId })

/** 导出-知识管理（Excel 文件流） */
export const exportPoint = (params: KnowledgePointPageDTO): Promise<any> => baseService.export('/attachPointKnowledge/exportPoint', params)

/** 导出-文件列表（Excel 文件流） */
export const exportFile = (params: KnowledgeFilePageDTO): Promise<any> => baseService.export('/attachPointKnowledge/exportFile', params)
