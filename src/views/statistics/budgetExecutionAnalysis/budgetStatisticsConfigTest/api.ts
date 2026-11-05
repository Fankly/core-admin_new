import { getConfigInfo, getConfigList, getDataDetail, getNodeTree, getSumDetail } from '@/api/statistics/budgetStatisticsConfig'
import { contextError, flatten, key } from './rules'
import type { InitParams, Row, Snapshot } from './rules'

export function resultData(result: any, fallback: string): any {
  if (!result?.success || result.data == null) throw new Error(result?.msg || fallback)
  return result.data
}
function arrayData(result: any, fallback: string): Row[] {
  const data = resultData(result, fallback)
  if (!Array.isArray(data)) throw new Error(fallback)
  return data
}
// 限制并发，避免大型配置树校验时同时发起过多请求。
async function mapLimited<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(6, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++
        results[index] = await fn(items[index])
      }
    })
  )
  return results
}
export async function loadSnapshot(context: InitParams, withTargets = false): Promise<Snapshot> {
  const error = contextError(context)
  if (error) throw new Error(error)
  const tree = arrayData(await getNodeTree(context.busiType, context.nd), '配置树加载失败')
  const nodes = flatten(tree)
  const parents = [context.nd, ...nodes.filter((node) => key(node.isleaf) === '0' || node.children?.length).map((node) => key(node.id))]
  const groups = await mapLimited([...new Set(parents)], async (id) =>
    arrayData(await getConfigList(context.busiType, context.nd, id), '配置列表加载失败')
  )
  const rows = groups.flat()
  const ids = new Set(rows.map((row) => key(row.configId)))
  if (ids.size !== rows.length || rows.length !== nodes.length || nodes.some((node) => !ids.has(key(node.id)))) {
    throw new Error('配置树与列表发生变化，请重新选择年度或维度刷新后重试')
  }
  const targets: Record<string, string[]> = {}
  if (withTargets) {
    await mapLimited(
      rows.filter((row) => key(row.isleaf) === '1' && key(row.statMethod) === '2'),
      async (row) => {
        targets[key(row.configId)] = arrayData(await getSumDetail(key(row.configId)), '汇总引用加载失败').map((item) => key(item.tarConfigId))
      }
    )
  }
  return { tree, rows, targets }
}
export async function loadRecord(id: unknown) {
  if (!key(id)) throw new Error('配置标识无效，请重新选择')
  const [info, data, sums] = await Promise.all([getConfigInfo(key(id)), getDataDetail(key(id)), getSumDetail(key(id))])
  const row = resultData(info, '配置详情加载失败')
  if (key(row.configId) !== key(id)) throw new Error('配置详情已变化，请重新选择')
  return { row, data: arrayData(data, '数据绑定加载失败'), sums: arrayData(sums, '汇总明细加载失败') }
}
