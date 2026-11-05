import { shallowRef } from 'vue'
import type { ReviewRule, WorkbenchClassifyOption } from '../types'

/**
 * 规则分类维度——按 listCategoryRuleReview 返回的 ruleClassifyName 分组。
 *
 * 规则列表接口已直接下发 ruleClassifyName，无需补拉子查询或请求分类字典。
 * 这里只负责：从规则列表汇总分类选项、保证按首次出现顺序排序。
 */
const sortRulesByClassify = (rules: ReviewRule[], classifies: WorkbenchClassifyOption[]) => {
  const orderMap = new Map(classifies.map((classify, index) => [classify.code, index]))
  if (!rules.every((rule) => orderMap.has(String(rule.ruleClassifyName || '')))) return rules
  return rules.slice().sort((a, b) => orderMap.get(String(a.ruleClassifyName))! - orderMap.get(String(b.ruleClassifyName))!)
}

interface ApplyRuleClassifiesOptions {
  taskId: string
  /** 兼容签名，不再使用 */
  reviewOpinions?: string
  getRules: () => ReviewRule[]
  setRules: (rules: ReviewRule[]) => void
  /** 会话是否仍然有效（弹窗未关闭、任务未切换） */
  isActive: () => boolean
}

export const useRuleClassifies = () => {
  const ruleClassifies = shallowRef<WorkbenchClassifyOption[]>([])
  let applySeq = 0

  const resetRuleClassifies = () => {
    applySeq += 1
    ruleClassifies.value = []
  }

  const applyRuleClassifies = async (options: ApplyRuleClassifiesOptions) => {
    const seq = ++applySeq
    const isCurrent = () => seq === applySeq && options.isActive()
    if (!options.taskId || !isCurrent()) return

    const rules = options.getRules()
    if (!rules.length) return

    // 按首次出现顺序汇总分类，code 与 name 均取 ruleClassifyName
    const seen = new Set<string>()
    const classifies: WorkbenchClassifyOption[] = []
    rules.forEach((rule) => {
      const name = String(rule.ruleClassifyName || '').trim()
      if (!name || seen.has(name)) return
      seen.add(name)
      classifies.push({ code: name, name })
    })
    ruleClassifies.value = classifies
    if (!classifies.length) return

    // ruleClassify 统一取 ruleClassifyName，供 useRuleClassifyGroups 分组匹配
    const nextRules = rules.map((rule) =>
      rule.ruleClassify !== rule.ruleClassifyName ? { ...rule, ruleClassify: String(rule.ruleClassifyName || '') } : rule
    )
    options.setRules(sortRulesByClassify(nextRules, classifies))
  }

  return {
    ruleClassifies,
    applyRuleClassifies,
    resetRuleClassifies
  }
}
