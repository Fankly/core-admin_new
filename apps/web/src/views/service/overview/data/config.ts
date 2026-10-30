import type { StatisticValue, XmzlConfig } from '@/api/overview'

/** 配置表单：排序在输入框中按字符串编辑，提交时再转数字。 */
export interface ConfigForm {
  jdbm: string
  jdmc: string
  jdpx: string
  zjdbm: string
  zjdmc: string
  zjdpx: string
  yslx: string
  flowStatus: string
  sjlhhs: string
  dec: string
  des: string
}

export type ConfigNodeLevel = 'root' | 'stage' | 'subStage'

/** 左侧阶段树节点：全部 → 阶段 → 子阶段，由配置列表在前端分组生成。 */
export interface ConfigTreeNode {
  id: string
  level: ConfigNodeLevel
  name: string
  count: number
  jdbm?: string
  zjdbm?: string
  children: ConfigTreeNode[]
}

export const ROOT_NODE_ID = 'root'

export const hasValue = (value: unknown) => value !== undefined && value !== null && String(value).trim() !== ''
export const toText = (value: unknown) => (hasValue(value) ? String(value).trim() : '')

// 排序为空的配置排在最后；同序时保持接口返回顺序（Array.prototype.sort 稳定）。
const sortKey = (value: unknown) => (hasValue(value) && Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER)
export const compareConfig = (a: XmzlConfig, b: XmzlConfig) =>
  sortKey(a.jdpx) - sortKey(b.jdpx) ||
  toText(a.jdbm).localeCompare(toText(b.jdbm)) ||
  sortKey(a.zjdpx) - sortKey(b.zjdpx) ||
  toText(a.zjdbm).localeCompare(toText(b.zjdbm))

// 节点 id 由层级与编码序列化而成，编码中含任何字符都不会冲突。
const nodeId = (...parts: string[]) => JSON.stringify(parts)

/** 配置列表需先按 compareConfig 排序，阶段与子阶段按首次出现的顺序成组。 */
export const buildConfigTree = (list: XmzlConfig[]): ConfigTreeNode => {
  const root: ConfigTreeNode = { id: ROOT_NODE_ID, level: 'root', name: '全部阶段', count: list.length, children: [] }
  const stageMap = new Map<string, ConfigTreeNode>()
  list.forEach((row) => {
    const jdbm = toText(row.jdbm)
    let stage = stageMap.get(jdbm)
    if (!stage) {
      stage = { id: nodeId('stage', jdbm), level: 'stage', name: toText(row.jdmc) || jdbm || '未填写阶段', count: 0, jdbm, children: [] }
      stageMap.set(jdbm, stage)
      root.children.push(stage)
    }
    stage.count += 1
    const zjdbm = toText(row.zjdbm)
    // 没有子阶段编码的配置只挂在阶段下，不单独生成子节点。
    if (!zjdbm) return
    let subStage = stage.children.find((child) => child.zjdbm === zjdbm)
    if (!subStage) {
      subStage = { id: nodeId('subStage', jdbm, zjdbm), level: 'subStage', name: toText(row.zjdmc) || zjdbm, count: 0, jdbm, zjdbm, children: [] }
      stage.children.push(subStage)
    }
    subStage.count += 1
  })
  return root
}

export const findConfigNode = (node: ConfigTreeNode, id: string): ConfigTreeNode | undefined => {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findConfigNode(child, id)
    if (found) return found
  }
  return undefined
}

export const matchConfigNode = (row: XmzlConfig, node: ConfigTreeNode) => {
  if (node.level === 'root') return true
  if (toText(row.jdbm) !== node.jdbm) return false
  return node.level === 'stage' || toText(row.zjdbm) === node.zjdbm
}

/** 在阶段/子阶段节点下新增时，带出该节点的阶段（及子阶段）信息。 */
export const presetFromNode = (list: XmzlConfig[], node: ConfigTreeNode): XmzlConfig => {
  const sample = node.level === 'root' ? undefined : list.find((row) => matchConfigNode(row, node))
  if (!sample) return {}
  const preset: XmzlConfig = { jdbm: sample.jdbm, jdmc: sample.jdmc, jdpx: sample.jdpx }
  if (node.level === 'subStage') {
    preset.zjdbm = sample.zjdbm
    preset.zjdmc = sample.zjdmc
    preset.zjdpx = sample.zjdpx
  }
  return preset
}

export const createConfigForm = (row: XmzlConfig = {}): ConfigForm => ({
  jdbm: toText(row.jdbm),
  jdmc: toText(row.jdmc),
  jdpx: toText(row.jdpx),
  zjdbm: toText(row.zjdbm),
  zjdmc: toText(row.zjdmc),
  zjdpx: toText(row.zjdpx),
  yslx: toText(row.yslx),
  flowStatus: toText(row.flowStatus),
  sjlhhs: toText(row.sjlhhs),
  dec: toText(row.dec),
  des: toText(row.des)
})

/** 文本去首尾空格；排序转为数字，为空时不提交；修改时带上 id。 */
export const toConfigPayload = (form: ConfigForm, id?: StatisticValue): XmzlConfig => {
  const { jdpx, zjdpx, ...texts } = form
  const payload: XmzlConfig = { ...texts }
  ;(Object.keys(texts) as (keyof typeof texts)[]).forEach((field) => {
    payload[field] = toText(texts[field])
  })
  if (hasValue(id)) payload.id = id
  if (hasValue(jdpx)) payload.jdpx = Number(jdpx)
  if (hasValue(zjdpx)) payload.zjdpx = Number(zjdpx)
  return payload
}
