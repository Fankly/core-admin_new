import { shallowRef } from 'vue'
import { getPublicData } from '@/api/common'
import { getRuleReviewInfo } from '@/api/ai/smartTaskAudit'
import { normalizeOptionList } from '../../smartTaskAudit/utils'
import type { ReviewRule, WorkbenchClassifyOption } from '../types'

const RULE_CLASSIFY_PUBLIC_CODE = 'AI_AUDIT_RULE_CLASSIFY_COM'

/** 公共代码为静态字典，进程内缓存一次成功结果即可，避免每次打开工作台重复请求 */
let classifyDictCache: WorkbenchClassifyOption[] | null = null
let classifyDictPromise: Promise<WorkbenchClassifyOption[]> | null = null

const normalizeClassifyOptions = (data: any[]): WorkbenchClassifyOption[] => {
  return normalizeOptionList(data || [])
    .filter((item) => item.code)
    .map((item) => ({ code: String(item.code), name: item.name || String(item.code) }))
}

const loadClassifyDict = (): Promise<WorkbenchClassifyOption[]> => {
  if (classifyDictCache) return Promise.resolve(classifyDictCache)
  if (classifyDictPromise) return classifyDictPromise

  classifyDictPromise = getPublicData(RULE_CLASSIFY_PUBLIC_CODE)
    .then((res) => {
      if (!res.success) return []
      const options = normalizeClassifyOptions(res.data || [])
      if (options.length) classifyDictCache = options
      return options
    })
    .catch(() => [])
    .finally(() => {
      classifyDictPromise = null
    })

  return classifyDictPromise
}

const getRuleKey = (item: { detailId?: any; ruleId?: any }) => String(item.detailId || item.ruleId || '')

/**
 * 按分类字典顺序排列规则，保证列表首条与分类页签第一项一致。
 * 存在未命中字典的规则时列表会退回不分组展示，此时保持接口返回顺序。
 */
const sortRulesByClassify = (rules: ReviewRule[], classifies: WorkbenchClassifyOption[]) => {
  const orderMap = new Map(classifies.map((classify, index) => [classify.code, index]))
  if (!rules.every((rule) => orderMap.has(String(rule.ruleClassify || '')))) return rules
  // sort 稳定，同一分类内仍保持接口返回顺序
  return rules.slice().sort((a, b) => orderMap.get(String(a.ruleClassify))! - orderMap.get(String(b.ruleClassify))!)
}

interface ApplyRuleClassifiesOptions {
  taskId: string
  /** 与规则列表主请求一致的审核意见筛选，保证按分类补拉时命中同一批规则 */
  reviewOpinions?: string
  getRules: () => ReviewRule[]
  setRules: (rules: ReviewRule[]) => void
  /** 会话是否仍然有效（弹窗未关闭、任务未切换） */
  isActive: () => boolean
}

/**
 * 规则分类维度。
 *
 * 规则列表主请求（ruleClassify 传空）已经是列表数据源，这里只做「分类标注」：
 * 1. 加载分类字典，供分组展示排序；
 * 2. 列表项若已带 ruleClassify，直接使用，不产生额外请求；
 * 3. 否则按字典并行补拉各分类的规则列表，建立 detailId → 分类 映射后回填。
 *
 * 规则列表等待分类解析完成后再展示，避免先平铺全部规则再切换为分类视图。
 * 解析完成后按字典顺序重排列表，调用方取首条即落在第一个分类页签上。
 * 任一步骤失败都回到「不分组」的既有表现。
 */
export const useRuleClassifies = () => {
  const ruleClassifies = shallowRef<WorkbenchClassifyOption[]>([])
  let applySeq = 0

  const resetRuleClassifies = () => {
    applySeq += 1
    ruleClassifies.value = []
  }

  const commitSortedRules = (options: ApplyRuleClassifiesOptions, rules: ReviewRule[], classifies: WorkbenchClassifyOption[]) => {
    const sorted = sortRulesByClassify(rules, classifies)
    if (sorted.some((rule, index) => rule !== rules[index])) options.setRules(sorted)
  }

  const resolveClassifyMap = async (options: ApplyRuleClassifiesOptions, classifies: WorkbenchClassifyOption[]) => {
    const results = await Promise.allSettled(
      classifies.map((classify) =>
        getRuleReviewInfo({
          taskId: options.taskId,
          ruleClassify: classify.code,
          reviewOpinions: String(options.reviewOpinions || '').trim()
        })
      )
    )

    const classifyMap = new Map<string, string>()
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled' || !result.value.success) return
      const list = Array.isArray(result.value.data) ? result.value.data : []
      list.forEach((item) => {
        const key = getRuleKey(item)
        if (key && !classifyMap.has(key)) classifyMap.set(key, classifies[index].code)
      })
    })
    return classifyMap
  }

  const applyRuleClassifies = async (options: ApplyRuleClassifiesOptions) => {
    const seq = ++applySeq
    const isCurrent = () => seq === applySeq && options.isActive()
    if (!options.taskId || !isCurrent()) return

    const classifies = await loadClassifyDict()
    if (!isCurrent() || !classifies.length) return
    ruleClassifies.value = classifies

    const rules = options.getRules()
    if (!rules.length) return
    // 列表接口已下发分类时无需补拉，仅按字典顺序重排
    if (rules.every((rule) => String(rule.ruleClassify || ''))) {
      commitSortedRules(options, rules, classifies)
      return
    }

    const classifyMap = await resolveClassifyMap(options, classifies)
    if (!isCurrent() || !classifyMap.size) return

    const nextRules = options.getRules().map((rule) => {
      if (String(rule.ruleClassify || '')) return rule
      const classify = classifyMap.get(getRuleKey(rule))
      return classify ? { ...rule, ruleClassify: classify } : rule
    })
    options.setRules(sortRulesByClassify(nextRules, classifies))
  }

  return {
    ruleClassifies,
    applyRuleClassifies,
    resetRuleClassifies
  }
}
