// 临时测试页的规则集中在此；ID 始终按字符串比较，避免数字转换丢失精度。
export interface InitParams {
  nd: string
  busiType: string
}
export type Row = Record<string, any>
export interface Snapshot {
  tree: Row[]
  rows: Row[]
  targets: Record<string, string[]>
}
export const key = (value: unknown): string => String(value ?? '').trim()
export const sameId = (a: unknown, b: unknown): boolean => key(a) === key(b)
export const flatten = (nodes: Row[]): Row[] => nodes.flatMap((node) => [node, ...flatten(node.children || [])])
export const emptyForm = () => ({
  configName: '',
  dispOrder: '',
  subName: '',
  gkbm: '',
  ysly: '',
  cnxm: '',
  cnxmms: '',
  isleaf: '0',
  recState: '1',
  isDisplay: '1',
  sfjc: '0',
  statMethod: '1',
  statType: '1',
  proType: '',
  bgjdType: '',
  bgjdValue: ''
})
export const textLimits: Record<string, [string, number]> = {
  configName: ['名称', 31],
  subName: ['前台显示序号', 31],
  gkbm: ['归口部门', 120],
  ysly: ['预算来源', 120],
  cnxm: ['承诺项', 120],
  cnxmms: ['备注', 120],
  proType: ['项目类型 / 承诺项', 2000]
}
export const contextError = (context: InitParams) => (!/^[1-9]\d{3}$/.test(context.nd) || !key(context.busiType) ? '请选择有效的年度和展示维度' : '')

export function fieldError(field: string, value: unknown, form: Row): string {
  const text = key(value)
  if (field === 'configName' && !text) return '名称不能为空或只包含空格'
  if (textLimits[field] && text.length > textLimits[field][1]) return `${textLimits[field][0]}最多 ${textLimits[field][1]} 个字符`
  if (field === 'dispOrder' && (!/^\d{1,8}$/.test(text) || Number(text) < 1)) return '序号必须是 1～99999999 的整数'
  if (['isleaf', 'recState', 'isDisplay', 'sfjc'].includes(field) && !['0', '1'].includes(text)) return '请选择有效的选项'
  if (field === 'statMethod' && key(form.isleaf) === '1' && !['1', '2'].includes(text)) return '请选择统计方式'
  if (field === 'statType' && key(form.isleaf) === '1' && key(form.statMethod) === '1' && !['1', '2'].includes(text)) return '请选择统计类型'
  if (field === 'proType' && key(form.isleaf) === '1' && key(form.statMethod) === '1' && key(form.statType) === '2' && !text)
    return '承诺项不能为空或只包含空格'
  if (field === 'bgjdValue' && key(form.bgjdType) === '1' && !text) return '请选择普通分析节点'
  return ''
}

export function buildPayload(form: Row, context: InitParams, parentId: unknown, configId: unknown, data: Row[], sums: Row[]): Row {
  const payload: Row = {
    ...context,
    nd: Number(context.nd),
    parentId,
    configName: key(form.configName),
    dispOrder: Number(form.dispOrder),
    isleaf: Number(form.isleaf),
    recState: Number(form.recState),
    isDisplay: key(form.isDisplay),
    sfjc: key(form.sfjc),
    statMethod: '',
    statType: null,
    proType: '',
    dataDetails: [],
    sumDetails: [],
    bgjdType: key(form.bgjdType),
    bgjdValue: key(form.bgjdType) === '1' ? key(form.bgjdValue) : ''
  }
  if (key(configId)) payload.configId = configId
  for (const field of ['subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms']) payload[field] = key(form[field])
  if (key(form.isleaf) === '1') {
    payload.statMethod = key(form.statMethod)
    if (payload.statMethod === '1') {
      payload.statType = Number(form.statType)
      payload.proType = key(form.proType)
      if (payload.statType === 1)
        payload.dataDetails = data.map((item) => ({
          ...(key(item.detailId) ? { detailId: item.detailId } : {}),
          proType: key(item.proType),
          packType: key(item.packType)
        }))
    } else if (payload.statMethod === '2') {
      payload.sumDetails = sums.map((item) => ({ ...(key(item.detailId) ? { detailId: item.detailId } : {}), tarConfigId: item.tarConfigId }))
    }
  }
  return payload
}

// 分组包含子节点，汇总节点包含被引用节点；两类边共同参与循环检查。
export function dependencyGraph(snapshot: Snapshot): Map<string, string[]> {
  return new Map(
    snapshot.rows.map((row) => [
      key(row.configId),
      key(row.isleaf) === '0'
        ? snapshot.rows.filter((child) => sameId(child.parentId, row.configId)).map((child) => key(child.configId))
        : key(row.statMethod) === '2'
        ? snapshot.targets[key(row.configId)] || []
        : []
    ])
  )
}
export function reaches(graph: Map<string, string[]>, start: string, target: string, seen = new Set<string>()): boolean {
  if (start === target) return true
  if (seen.has(start)) return false
  seen.add(start)
  return (graph.get(start) || []).some((next) => reaches(graph, next, target, seen))
}
export function saveError(payload: Row, snapshot: Snapshot): string {
  const context = contextError({ nd: key(payload.nd), busiType: payload.busiType })
  if (context) return context
  const rows = snapshot.rows
  const current = rows.find((row) => sameId(row.configId, payload.configId))
  if (key(payload.configId) && !current) return '该配置已被删除，请关闭弹窗后刷新页面'
  if (current && !sameId(current.parentId, payload.parentId)) return '配置父节点已变化，请重新打开修改'
  const parent = rows.find((row) => sameId(row.configId, payload.parentId))
  if (!sameId(payload.parentId, payload.nd) && !parent) return '父节点已不存在，请重新选择'
  if (parent && key(parent.isleaf) !== '0') return '末级节点下不能新增配置'
  if (key(payload.recState) === '1') {
    let ancestor = parent
    const seen = new Set<string>()
    while (ancestor && !seen.has(key(ancestor.configId))) {
      seen.add(key(ancestor.configId))
      if (key(ancestor.recState) !== '1') return '父级配置已停用，请先启用父级或将当前配置设为停用'
      ancestor = rows.find((row) => sameId(row.configId, ancestor?.parentId))
    }
  }
  const siblings = rows.filter((row) => sameId(row.parentId, payload.parentId) && !sameId(row.configId, payload.configId))
  if (siblings.some((row) => key(row.configName) === payload.configName)) return '同一父节点下名称不能重复'
  const children = rows.filter((row) => sameId(row.parentId, payload.configId))
  if (key(payload.isleaf) === '1' && children.length) return '存在子节点，不能改为末级节点'
  if (key(payload.recState) === '0' && children.some((row) => key(row.recState) === '1')) return '请先停用启用中的子节点'
  if (key(payload.isleaf) !== '1') return ''
  if (payload.statMethod === '1') {
    if (payload.statType === 1) {
      if (!key(payload.proType) && !payload.dataDetails.length) return '请至少选择一个项目类型或添加一条数据绑定'
      const ids = payload.dataDetails.map((item: Row) => key(item.proType))
      if (ids.some((id: string) => !id)) return '数据绑定缺少项目类型'
      if (new Set(ids).size !== ids.length) return '相同项目类型不能重复添加'
    }
    return ''
  }
  const targets: string[] = payload.sumDetails.map((item: Row) => key(item.tarConfigId))
  if (!targets.length) return '明细汇总至少需要一个汇总目标'
  if (new Set(targets).size !== targets.length) return '汇总目标不能重复'
  const graph = dependencyGraph(snapshot)
  const id = key(payload.configId) || '__new_config__'
  graph.set(id, targets)
  // 新增记录尚未在快照中，但其父节点已经包含它。
  if (parent && !key(payload.configId)) graph.set(key(parent.configId), [...(graph.get(key(parent.configId)) || []), id])
  for (const target of targets) {
    const row = rows.find((item) => sameId(item.configId, target))
    if (!row) return '汇总目标已不存在，请重新选择'
    if (sameId(target, payload.configId)) return '不能汇总当前配置自身'
    if (reaches(graph, target, id)) return '汇总目标会形成循环引用，请重新选择'
  }
  for (const a of targets)
    for (const b of targets) {
      if (a !== b && reaches(graph, a, b)) return '汇总目标存在包含关系，会重复统计，请重新选择'
    }
  return ''
}

export function deleteError(ids: unknown[], snapshot: Snapshot): string {
  if (!ids.length) return '请选择一条或多条数据进行删除'
  const selected = new Set(ids.map(key))
  if (selected.has('') || selected.size !== ids.length) return '所选配置标识无效，请刷新页面'
  for (const id of selected) {
    const row = snapshot.rows.find((item) => sameId(item.configId, id))
    if (!row) return '所选配置已被删除，请刷新页面'
    if (key(row.recState) !== '0') return '存在启用状态或状态异常的数据，无法删除，请先停用'
    if (snapshot.rows.some((item) => sameId(item.parentId, id) && !selected.has(key(item.configId)))) return '存在子节点，请先删除子节点'
    if (snapshot.rows.some((item) => !selected.has(key(item.configId)) && (snapshot.targets[key(item.configId)] || []).includes(id)))
      return '配置被其他汇总节点引用，请先解除引用'
  }
  return ''
}

// 只比较保存相关字段，并统一接口可能混用的数字/字符串类型。
export function fingerprint(row: Row, data: Row[], sums: Row[]): string {
  const fields = [...Object.keys(emptyForm()), 'configId', 'parentId', 'busiType', 'nd']
  return JSON.stringify([
    fields.map((field) => key(row[field])),
    data.map((item) => [key(item.detailId), key(item.proType), key(item.packType)]).sort(),
    sums.map((item) => [key(item.detailId), key(item.tarConfigId)]).sort()
  ])
}
