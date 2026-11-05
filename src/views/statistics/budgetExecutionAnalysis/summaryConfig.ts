export interface BudgetExecutionSummaryQuery {
  busiType: string
  nd: string
}

export interface BudgetExecutionStatConfig {
  configId: string | number
  parentId: string | number
  isleaf: string | number
  recState: string | number
  configName?: string
  isDisplay?: string | number | null
  statMethod?: string | number
  // 未取得绑定明细时不建立汇总关系。
  targetIds?: Array<string | number>
}

export type BudgetExecutionSummaryRows = ReadonlyMap<string, readonly string[]>

// BudgetStatisticsConfigMapper.getStatConfigList：只统计启用的叶子节点，
// IS_DISPLAY 和页面项目类别筛选不影响统计范围。明细汇总只取目标下的数据绑定叶子，
// 不递归引用目标的明细汇总；四个报表 Service 均未使用 sumMethod 做减法。
export const buildBudgetExecutionSummaryRows = (configs: BudgetExecutionStatConfig[]): BudgetExecutionSummaryRows => {
  const byId = new Map(configs.map((config) => [String(config.configId), config]))
  const children = new Map<string, string[]>()
  configs.forEach((config) => {
    const parentId = String(config.parentId)
    children.set(parentId, [...(children.get(parentId) || []), String(config.configId)])
  })
  const dataLeaves = (id: string, visiting = new Set<string>()): string[] | undefined => {
    const config = byId.get(id)
    if (!config || visiting.has(id)) return undefined
    if (String(config.isleaf) === '1') {
      return String(config.recState) === '1' && String(config.statMethod) === '1' ? [id] : []
    }
    const next = new Set(visiting).add(id)
    const parts = (children.get(id) || []).map((child) => dataLeaves(child, next))
    return parts.some((part) => !part) ? undefined : (parts as string[][]).flat()
  }
  const relations = new Map<string, string[]>()
  const resolved = new Set<string>()
  const resolve = (id: string, visiting = new Set<string>()): boolean | undefined => {
    if (resolved.has(id)) return relations.has(id) ? !!relations.get(id)?.length : true
    const config = byId.get(id)
    if (!config || visiting.has(id)) return undefined
    if (String(config.isleaf) === '1') {
      if (String(config.recState) !== '1') return false
      if (String(config.statMethod) === '1') return true
      if (String(config.statMethod) !== '2') return false
      if (!config.targetIds) return undefined
      // SQL 的 START WITH ... IN 会去重相同目标，但重叠目标的路径仍分别参与统计。
      const parts = [...new Set(config.targetIds.map(String))].map((target) => dataLeaves(target))
      if (parts.some((part) => !part)) return undefined
      relations.set(id, (parts as string[][]).flat())
    } else {
      const next = new Set(visiting).add(id)
      const refs: string[] = []
      for (const child of children.get(id) || []) {
        const contributes = resolve(child, next)
        if (contributes === undefined) return undefined
        if (contributes) refs.push(child)
      }
      relations.set(id, refs)
    }
    resolved.add(id)
    return !!relations.get(id)?.length
  }
  configs.forEach((config) => resolve(String(config.configId)))
  return relations
}
