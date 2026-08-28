export type AnnualKeyTaskFieldType = 'text' | 'date' | 'textarea' | 'select'

export interface AnnualKeyTaskField {
  prop: string
  label: string
  type: AnnualKeyTaskFieldType
  width: number
  visible?: boolean
  required?: boolean
}

const field = (prop: string, label: string, options: Partial<Omit<AnnualKeyTaskField, 'prop' | 'label'>> = {}): AnnualKeyTaskField => ({
  prop,
  label,
  type: 'text',
  width: 160,
  ...options
})

export const annualKeyTaskFields: AnnualKeyTaskField[] = [
  field('nd', '年度', { type: 'select', required: true, visible: true, width: 100 }),
  field('zdrwbm', '重点任务编码', { visible: true, width: 160 }),
  field('zyfl', '专业分类', { required: true, visible: true, width: 180 }),
  field('glbm', '管理部门', { required: true, visible: true, width: 180 }),
  field('zyflZdrw', '专业分类重点任务', { required: true, visible: true, width: 240 })
]

export const formatAnnualKeyTaskValue = (prop: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}
