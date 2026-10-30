import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'
/**
 * 智能成本项目评审工作台（三）· 取数与角色
 *
 * 职责划分：本文件只管「角色 → 接口 → 视图模型」，页面的交互状态（日期区间、折叠筛选、
 * 点柱联动、条件标签）留在 index.vue。接口契约见 docs/评审工作台文档.docx。
 *
 * 与文档的两个约定（都已在接口层注明）：
 * - 前三个接口（指标 / 归口部门 / 清单）要 dwId + bmId，权限由后端按它们推导，
 *   所以取数必须等 UserRoleSelector 把角色写进 currentUserRole 之后才能发生。
 * - 后三个接口（结果分布 / 异常排名 / 不通过占比）只要时间区间与状态清单，不要权限入参。
 */
import { computed, nextTick, provide, ref, unref } from 'vue'
import { ElMessage } from 'element-plus'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { getDataByParent, getPublicData, getSubProtypeTree, getYearData } from '@/api/common'
import { getEjdwList, getFlowStatusList, getYjdwList } from '@/api/ai/smartTaskAudit'
import {
  getAuditProblemTask,
  getAuditProStatByZgkbm,
  getIndicatorStat,
  getManualReviewRule,
  getTaskAbnormalRanking,
  getTaskPage
} from '@/api/ai/smartReviewHomeThree'
import type { IndicatorData, TaskPageParams } from '@/api/ai/smartReviewHomeThree'
import { BAR_GRADIENTS, buildMetricCards, toAuditRow } from '../data'
import type { AuditRow, BarItem, DeptBar, MetricCard, PointReviewBar, ResultItem } from '../data'

/** 下拉选项 */
export interface OptionItem {
  code: string
  name: string
}

/** 时间区间（两个 project-review 接口用 startTime/endTime，指标与清单也用同一区间） */
export interface RangeParams {
  startDate?: string
  endDate?: string
}

/**
 * 字典/单位接口偶尔回字符串或树，统一拍平成 {code,name}。
 * ⚠️ 项目类型树（protypeTree/getSubProtypeTree）的码值字段是 **middleId**，不是 code/id，
 *    少读它会让该下拉的所有 option 值都变成空串（选不中、也筛不出来）。
 */
const normalizeOptions = (data: unknown): OptionItem[] => {
  if (!Array.isArray(data)) return []
  return data
    .map((item: any) => ({
      code: String(item?.code ?? item?.id ?? item?.middleId ?? item?.value ?? ''),
      name: String(item?.name ?? item?.label ?? '')
    }))
    .filter((item) => item.code && item.name)
}

/**
 * 树形字典（项目状态 commonCode/getFlowStatusTree）的规范化：与 normalizeOptions 同口径，
 * 但**保留 children** —— 页面用 ElTreeSelect 多选渲染，拍平会把子节点丢掉。
 */
const normalizeTreeOptions = (data: unknown): any[] => {
  if (!Array.isArray(data)) return []
  return data
    .map((item: any) => ({
      ...item,
      code: String(item?.code ?? item?.id ?? item?.middleId ?? item?.value ?? ''),
      name: String(item?.name ?? item?.label ?? ''),
      children: Array.isArray(item?.children) ? normalizeTreeOptions(item.children) : item.children
    }))
    .filter((item) => item.code && item.name)
}

/** 取数失败时的统一提示（静默刷新时不弹，避免网络抖动刷屏） */
const unwrap = async <T>(task: Promise<{ success?: boolean; msg?: string; data?: T }>, label: string, silent = false): Promise<T | null> => {
  try {
    const res = await task
    if (res?.success === false) {
      if (!silent) ElMessage.error(res.msg || `${label}获取失败`)
      return null
    }
    return (res?.data ?? null) as T | null
  } catch (error: any) {
    if (!silent) ElMessage.error(error?.message || `${label}获取失败`)
    return null
  }
}

export const useSmartReviewHomeThree = () => {
  /* ---------------- 角色 ---------------- */

  const isShowPage = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const currentUserRole = ref<UserRole>({
    bmName: '',
    dwName: '',
    bmId: '',
    roleId: '',
    roleCode: '',
    dwId: '',
    specialOrgCode: '',
    spRoleId: ''
  })
  provide(CurrentUserRoleInjectionKey, currentUserRole)

  /* ---------------- 页面数据 ---------------- */

  const metrics = ref<MetricCard[]>([])
  const deptBars = ref<DeptBar[]>([])
  const rankRows = ref<BarItem[]>([])
  /**
   * 卡2「AI识别异常项目」的两个汇总数 + 饼图数据（接口四 getAuditProblemTask）。
   * 饼图按**归口部门**统计问题任务数（协议 4 的说明），扇区点击筛清单传的是 gkbmId。
   */
  const problemStat = ref<{ count: number; ratioText: string }>({ count: 0, ratioText: '0' })
  const problemSlices = ref<ResultItem[]>([])
  /**
   * 卡4「审核要点复核情况」：人工复核总数 / 复核率 + 按**审核要点**统计的复核数量与复核率
   * （接口五 getManualReviewRule，两条量纲都在行上，切换维度由页面换读字段、不再请求）。
   */
  const manualReviewStat = ref<{ count: string; rate: string }>({ count: '0', rate: '0' })
  const pointReviewBars = ref<PointReviewBar[]>([])
  const auditRows = ref<AuditRow[]>([])
  const auditTotal = ref(0)
  /** 表格请求中（与看板整体的 loading 分开，避免翻页时整页闪） */
  const tableLoading = ref(false)
  const boardLoading = ref(false)

  /* ---------------- 下拉选项 ---------------- */

  const yjdwOptions = ref<OptionItem[]>([])
  const ejdwOptions = ref<OptionItem[]>([])
  const gkbmOptions = ref<OptionItem[]>([])
  const conclusionOptions = ref<OptionItem[]>([])
  /** AI 预审意见（字典 AI_AUDIT_TASK_RESULT_COM，清单筛选条件 result 的选项） */
  const auditResultOptions = ref<OptionItem[]>([])
  /** 项目状态（树形字典 commonCode/getFlowStatusTree，需求 2026-09-30 加的清单筛选条件，多选） */
  const flowStatusOptions = ref<any[]>([])
  /** 计划实施年度（comPz/getNdTreeNode，需求加的清单筛选条件 jhssnd） */
  const yearOptions = ref<OptionItem[]>([])

  /** 角色上下文入参：清单/看板/导出都要带（dwId/bmId 决定数据范围，roleId 决定按钮权限口径） */
  const roleParams = () => ({
    dwId: currentUserRole.value.dwId,
    bmId: currentUserRole.value.bmId,
    roleId: currentUserRole.value.roleId
  })

  /** 加载下拉项：单位走 bizOrgTree、归口部门与审核结论走公共代码、项目类型走类型树 */
  /**
   * 下拉项：单位走 bizOrgTree、归口部门与审核结论走公共代码、项目类型走类型树。
   *
   * 归口部门按需求方 2026-10-14 的口径走 `commonCode/getDataByParent`（取值口径与 `/commonCode/getData`
   * 相同：入参都是 `code=QMYS_ZZJG`，只换接口），所以这里用 getDataByParent。
   * 二级单位**不在这里加载**：它必须由所选一级单位带出来，见 loadEjdwOptions。
   * 与智能审核任务管理（views/ai/smartTaskAudit）的取数方式保持一致。
   */
  const loadOptions = async () => {
    const [yjdw, gkbm, conclusion, flowStatus, year, auditResult] = await Promise.all([
      unwrap<any>(getYjdwList(roleParams()) as any, '一级单位', true),
      unwrap<any>(getDataByParent('QMYS_ZZJG') as any, '归口部门', true),
      unwrap<any>(getPublicData('AI_AUDIT_TASK_REVIEW_OPINION_COM') as any, '审核结论', true),
      unwrap<any>(getFlowStatusList(roleParams()) as any, '项目状态', true),
      unwrap<any>(getYearData() as any, '计划实施年度', true),
      // AI 预审意见（清单筛选条件 result 的选项，字典 AI_AUDIT_TASK_RESULT_COM）
      unwrap<any>(getPublicData('AI_AUDIT_TASK_RESULT_COM') as any, 'AI预审意见', true)
    ])
    yjdwOptions.value = normalizeOptions(yjdw)
    gkbmOptions.value = normalizeOptions(gkbm)
    conclusionOptions.value = normalizeOptions(conclusion)
    auditResultOptions.value = normalizeOptions(auditResult)
    flowStatusOptions.value = normalizeTreeOptions(flowStatus)
    // 年度接口的码值字段是 yearCode（与 views/ai/document 的 normalizeYearList 同一口径）
    yearOptions.value = (Array.isArray(year) ? year : [])
      .map((item: any) => ({
        code: String(item?.yearCode ?? item?.code ?? item?.value ?? ''),
        name: String(item?.yearName ?? item?.name ?? item?.label ?? item?.yearCode ?? item?.code ?? '')
      }))
      .filter((item) => item.code && item.name)
    await loadProTypeTree()
  }

  /**
   * 项目类型树：与 `views/ai/document` 的查询控件同源 —— `protypeTree/getSubprotypeTree`，
   * 节点是 `{ middleId, name, children? }`（值取 middleId，就是任务行的 proType 那套码值）。
   * 参考页会在「年度」变化时整树重载；本页没有年度条件，故只在进入页面时取一次。
   */
  const proTypeTree = ref<any[]>([])
  const loadProTypeTree = async () => {
    const data = await unwrap<any[]>(getSubProtypeTree() as any, '项目类型', true)
    proTypeTree.value = Array.isArray(data) ? data : []
  }

  /**
   * 二级单位：按所选一级单位联动加载。
   *
   * 与智能审核任务管理（useAiSmartTaskAuditPage 的 searchYjdwChangeHandle）同一套写法：
   * - 先清空已选的二级单位与现有选项，避免选完一级单位后残留上一级的二级单位；
   * - 一级单位为空则不发请求（选项保持空）；
   * - 入参同时带 `YJDW` 与 `parentCode`（后端两种口径都在用）；
   * - 用请求序号做竞态保护：连点时只认最后一次，且 `isStillCurrent()` 为真才落数据。
   *   `isStillCurrent` 由页面给（它才知道当前选的是哪个一级单位），缺省视为始终有效。
   */
  let ejdwRequestSeq = 0
  const loadEjdwOptions = async (yjdw: string, isStillCurrent: () => boolean = () => true) => {
    const seq = ++ejdwRequestSeq
    ejdwOptions.value = []
    if (!yjdw) return
    try {
      const res = await getEjdwList({ ...roleParams(), YJDW: yjdw, parentCode: yjdw } as any)
      if (seq !== ejdwRequestSeq || !isStillCurrent()) return
      if (res?.success === false) {
        ElMessage.error(res.msg || '二级单位获取失败')
        return
      }
      ejdwOptions.value = normalizeOptions(res?.data)
    } catch (error: any) {
      if (seq === ejdwRequestSeq && isStillCurrent()) {
        ElMessage.error(error?.message || '二级单位获取失败')
      }
    }
  }

  /** 清空二级单位的选项（重置、或一级单位被清掉时用） */
  const clearEjdwOptions = () => {
    ejdwRequestSeq += 1
    ejdwOptions.value = []
  }

  /* ---------------- 看板（指标 + 四个面板） ---------------- */

  const loadMetrics = async (range: RangeParams, silent = false) => {
    const data = await unwrap<{ currentData: IndicatorData | null; weekData: IndicatorData | null }>(
      getIndicatorStat({ ...roleParams(), ...range }),
      '指标统计',
      silent
    )
    if (!data) return
    metrics.value = buildMetricCards(data.currentData, data.weekData)
  }

  /** 归口部门柱状：两个维度各取一次，切换维度时不再请求 */
  const loadDeptBars = async (range: RangeParams, silent = false) => {
    const [byCount, byAmount] = await Promise.all([
      unwrap<any[]>(getAuditProStatByZgkbm({ ...roleParams(), ...range, mode: 1 }), '归口部门统计', silent),
      unwrap<any[]>(getAuditProStatByZgkbm({ ...roleParams(), ...range, mode: 2 }), '归口部门统计', silent)
    ])
    if (!byCount && !byAmount) return
    // 键名是小写 + 下划线（后端已全量改过，见 ZgkbmStatItem 的注释）
    const amountMap = new Map<string, number>()
    ;(byAmount || []).forEach((item: any) => amountMap.set(String(item?.zgkbm_name ?? ''), Number(item?.value) || 0))
    deptBars.value = (byCount || []).map((item: any) => {
      const name = String(item?.zgkbm_name ?? '')
      const count = Number(item?.value) || 0
      const amount = amountMap.get(name) ?? 0
      return {
        // 归口部门 id 一并带出去：点柱子筛列表时 getTaskPage 的 gkbm 用的就是它
        id: String(item?.zgkbm_id ?? ''),
        name,
        count,
        amount,
        countText: count.toLocaleString('zh-CN'),
        // 接口返回的金额**已经是万元**，直接渲染，别再除 10000（此前除过一次，柱图上的数字比实际小四个数量级）
        amountText: amount.toLocaleString('zh-CN')
      }
    })
  }

  /** 四个看板面板：时间区间 + 角色上下文（dwId / bmId / roleId） */
  const loadProjectReviewPanels = async (range: RangeParams, silent = false) => {
    // 角色上下文与 getAuditProStatByZgkbm **完全一致**：整份 roleParams() 展开（dwId/bmId/roleId 都带）。
    // ⚠️ 别再只挑其中几个键——少一个 dwId，后端就按「无单位」过滤，数据静默变多且很难发现。
    const params = { ...roleParams(), startDate: range.startDate, endDate: range.endDate }
    const [problem, ranking, review] = await Promise.all([
      // 卡2「AI识别异常项目」：问题任务数 / 不通过率 + 按归口部门的饼图数据（协议四）
      unwrap<any>(getAuditProblemTask(params), 'AI识别问题项目', silent),
      // 卡3「审核要点异动排名」：**仍是原来的接口**（getTaskAbnormalRanking），v0.3 只换了标题与统计口径
      unwrap<any[]>(getTaskAbnormalRanking(params), '要点异动排名', silent),
      // 卡4「审核要点复核情况」：人工复核总数 / 复核率 + 按要点的柱图数据（协议五）
      unwrap<any>(getManualReviewRule(params), '复核要点复核情况', silent)
    ])

    // 卡2：饼图按**归口部门**统计（协议 4 的说明；下拉文案沿用设计的「按专业」），
    // 扇区 code 存 gkbmId —— 点扇区/图例筛清单时当「归口部门」传给 getTaskPage（与卡1 柱子同一套 id）。
    if (problem) {
      problemStat.value = {
        count: Number(problem.problemCnt) || 0,
        // 不通过率：后端给的是不带百分号的数值（保留 3 位小数）
        ratioText: String(problem.unpassRatio ?? '0')
      }
      problemSlices.value = (Array.isArray(problem.gkbmpieChartData) ? problem.gkbmpieChartData : []).map((item: any, index: number) => {
        const pair = BAR_GRADIENTS[index % BAR_GRADIENTS.length]
        return {
          name: String(item?.gkbmName ?? ''),
          code: String(item?.gkbmId ?? ''),
          count: Number(item?.cnt) || 0,
          color: pair.deep,
          light: pair.light
        }
      })
    }

    // 卡3 异动排名：按要点统计规则数量，行是要点名
    if (ranking) {
      rankRows.value = ranking.map((item: any, index: number) => {
        const color = BAR_GRADIENTS[index % BAR_GRADIENTS.length]
        return {
          name: String(item?.auditPointName ?? item?.ruleId ?? ''),
          value: Number(item?.cnt) || 0,
          from: color.light,
          to: color.deep,
          hint: `规则数：${Number(item?.cnt) || 0}`,
          // 点条筛清单用 id（名称可能重复/被截断，且接口按 id 查）
          ruleId: String(item?.ruleId ?? '')
        }
      })
    }

    // 卡4：汇总两格 + 按要点的柱图数据（两条量纲都留着，切换下拉只换读哪个字段）
    if (review) {
      manualReviewStat.value = {
        count: String(review.manualReviewCount ?? '0'),
        rate: String(review.manualReviewRate ?? '0')
      }
      pointReviewBars.value = (Array.isArray(review.barchartData) ? review.barchartData : []).map((item: any, index: number) => {
        const color = BAR_GRADIENTS[index % BAR_GRADIENTS.length]
        const count = Number(item?.cnt) || 0
        const rate = Number(item?.reviewRate) || 0
        return {
          name: String(item?.auditPointName ?? item?.ruleId ?? ''),
          ruleId: String(item?.ruleId ?? ''),
          // 点条筛清单改用后端给的这一组任务 id（2026-10-14）；接口没给时退回空数组 = 不发这个条件
          taskIdList: Array.isArray(item?.taskIdList) ? item.taskIdList.map((id: any) => String(id)) : [],
          count,
          rate,
          countText: count.toLocaleString('zh-CN'),
          rateText: `${rate}%`,
          from: color.light,
          to: color.deep,
          hint: `复核数量：${count} 个 · 复核率：${rate}%`
        }
      })
    }
  }

  /** 清单：入参由页面把筛选条件拼好传进来 */
  const loadAuditRows = async (params: Omit<TaskPageParams, 'dwId' | 'bmId' | 'roleId'>, silent = false) => {
    tableLoading.value = true
    try {
      const data = await unwrap<{ records: any[]; total: number }>(getTaskPage({ ...roleParams(), ...params }) as any, '审核项目清单', silent)
      if (!data) return
      auditRows.value = (Array.isArray(data.records) ? data.records : []).map((row, index) => toAuditRow(row, index))
      auditTotal.value = Number(data.total) || 0
    } finally {
      tableLoading.value = false
    }
  }

  /** 一次拉齐看板（指标 + 四个面板），清单另走 loadAuditRows */
  const loadBoard = async (range: RangeParams, silent = false) => {
    if (!silent) boardLoading.value = true
    try {
      await Promise.all([loadMetrics(range, silent), loadDeptBars(range, silent), loadProjectReviewPanels(range, silent)])
    } finally {
      boardLoading.value = false
    }
  }

  /** 角色确认后才渲染页面并取数（UserRoleSelector 会把 dwId/bmId/roleId 写进 currentUserRole） */
  const getRoleHandle = async () => {
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) return
    await nextTick()
    await loadOptions()
  }

  /** 角色就绪的判定：三个必填 id 都有了 */
  const roleReady = computed(() => Boolean(currentUserRole.value.dwId && currentUserRole.value.bmId))

  return {
    isShowPage,
    roleReady,
    userRoleSelectorRef,
    currentUserRole,
    getRoleHandle,
    // 数据
    metrics,
    deptBars,
    problemStat,
    problemSlices,
    rankRows,
    manualReviewStat,
    pointReviewBars,
    auditRows,
    auditTotal,
    tableLoading,
    boardLoading,
    // 选项
    yjdwOptions,
    ejdwOptions,
    gkbmOptions,
    conclusionOptions,
    auditResultOptions,
    flowStatusOptions,
    yearOptions,
    proTypeTree,
    // 动作
    roleParams,
    loadOptions,
    loadEjdwOptions,
    clearEjdwOptions,
    loadBoard,
    loadAuditRows
  }
}
