import { computed, ref, watch } from 'vue'
import type { ReviewRule, WorkbenchClassifyOption } from '../types'

/** 无分类时的平铺分组标识 */
export const FLAT_GROUP_KEY = '__flat__'

export interface RuleGroup {
  key: string
  /** 为空表示平铺分组，不渲染分类标题 */
  name: string
  rules: ReviewRule[]
}

interface UseRuleClassifyGroupsOptions {
  projectTaskId: () => string
  filteredRules: () => ReviewRule[]
  ruleClassifies: () => WorkbenchClassifyOption[] | undefined
}

/**
 * 规则列表的分类分组状态。
 *
 * 所有分类默认展开，可各自独立收起（非手风琴，不互斥）；切换任务时恢复全部展开。
 * 分组顺序沿用字典顺序，与 useRuleClassifies 的规则重排保持一致。
 */
export function useRuleClassifyGroups(options: UseRuleClassifyGroupsOptions) {
  const classifyNameMap = computed(() => new Map((options.ruleClassifies() || []).map((classify) => [classify.code, classify.name])))

  // 只在所有规则都命中分类字典时分组，避免未知分类被静默隐藏
  const isRuleGrouped = computed(() => {
    const rules = options.filteredRules()
    if (!classifyNameMap.value.size || !rules.length) return false
    return rules.every((rule) => classifyNameMap.value.has(String(rule.ruleClassify || '')))
  })

  const ruleGroups = computed<RuleGroup[]>(() => {
    const rules = options.filteredRules()
    if (!isRuleGrouped.value) {
      return rules.length ? [{ key: FLAT_GROUP_KEY, name: '', rules }] : []
    }

    const groups = new Map<string, RuleGroup>()
    // 先按字典顺序建组，保证分类展示顺序与规则管理一致
    options.ruleClassifies()?.forEach((classify) => groups.set(classify.code, { key: classify.code, name: classify.name, rules: [] }))

    rules.forEach((rule) => {
      groups.get(String(rule.ruleClassify || ''))?.rules.push(rule)
    })

    return Array.from(groups.values()).filter((group) => group.rules.length)
  })

  /** 只记录被手动收起的分类，未记录即为展开 */
  const collapsedGroupKeys = ref<Set<string>>(new Set())

  const isRuleGroupExpanded = (group: RuleGroup) => !collapsedGroupKeys.value.has(group.key)

  const toggleRuleGroup = (group: RuleGroup) => {
    const next = new Set(collapsedGroupKeys.value)
    if (next.has(group.key)) next.delete(group.key)
    else next.add(group.key)
    collapsedGroupKeys.value = next
  }

  watch(options.projectTaskId, () => {
    collapsedGroupKeys.value = new Set()
  })

  return {
    isRuleGrouped,
    ruleGroups,
    isRuleGroupExpanded,
    toggleRuleGroup
  }
}
