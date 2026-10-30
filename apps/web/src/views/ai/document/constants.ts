import type { AttachDocType, OptionItem } from './types'

export const DETAIL_PERMISSION = 'DETAIL'
export const EDIT_PERMISSION = 'EDIT'
export const ADD_PERMISSION = 'ADD'
export const DELETE_PERMISSION = 'DELETE'
export const EXPORT_PERMISSION = 'EXPORT'

export const priorityOptions: OptionItem[] = [
  { code: '1', name: '高' },
  { code: '2', name: '中' },
  { code: '3', name: '低' }
]

export const statusOptions: OptionItem[] = [
  { code: '1', name: '未开始' },
  { code: '2', name: '处理中' },
  { code: '3', name: '已完成' },
  { code: '4', name: '处理失败' }
]

export const projectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

export const flowStatusProps = {
  label: 'name',
  children: 'children',
  value: 'code'
}

/* ---------------------------------------------------------------------------
 * 建议书 / 可研报告 / 估算书 编辑弹窗的字段配置
 * 字段与标签照 docs/文档预处理任务接口协议.md；fjId 依次为 1 / 2 / 38
 * ------------------------------------------------------------------------- */

export type AttachTypeFieldKind = 'text' | 'textarea' | 'number'

export interface AttachTypeField {
  key: string
  label: string
  kind: AttachTypeFieldKind
}

export interface AttachTypeEditConfig {
  /** 表格行里的附件类型码 */
  fjId: string
  title: string
  /** 下拉菜单/提示里的短名称 */
  label: string
  fields: AttachTypeField[]
}

export const ATTACH_TYPE_EDIT_CONFIG: Record<AttachDocType, AttachTypeEditConfig> = {
  jys: {
    fjId: '1',
    title: '编辑建议书',
    label: '建议书',
    fields: [
      { key: 'projectName', label: '项目名称', kind: 'text' },
      { key: 'projectCom', label: '项目单位', kind: 'text' },
      { key: 'projectLifecycle', label: '项目实施起止时间', kind: 'text' },
      { key: 'implementPurpose', label: '项目实施目的', kind: 'textarea' },
      { key: 'basicInfo', label: '基本情况', kind: 'textarea' },
      { key: 'existingProblems', label: '存在问题及实施必要性', kind: 'textarea' },
      { key: 'projectJustification', label: '立项依据', kind: 'textarea' },
      { key: 'technologyImplementPlan', label: '技术实施方案', kind: 'textarea' },
      { key: 'powerOutageImplementPlan', label: '停电实施方案', kind: 'textarea' },
      { key: 'effect', label: '环境影响及经济或社会效益', kind: 'textarea' },
      { key: 'disposalProposals', label: '拆除物资处置建议', kind: 'textarea' },
      { key: 'benefitAnalysis', label: '效益分析', kind: 'textarea' },
      { key: 'amount', label: '总投资不含税（万元）', kind: 'number' },
      { key: 'allInvestTax', label: '总投资含税（万元）', kind: 'number' },
      { key: 'economyContent', label: '经济性', kind: 'textarea' },
      { key: 'complianceContent', label: '合规性', kind: 'textarea' }
    ]
  },
  kybg: {
    fjId: '2',
    title: '编辑可研报告',
    label: '可研报告',
    fields: [
      { key: 'projectName', label: '项目名称', kind: 'text' },
      { key: 'projectCom', label: '项目单位', kind: 'text' },
      { key: 'projectBackground', label: '项目背景', kind: 'textarea' },
      { key: 'existingProblems', label: '必要性', kind: 'textarea' },
      { key: 'economyCompliance', label: '经济性与财务合规性', kind: 'textarea' },
      { key: 'technologyImplementPlan', label: '技术实施方案', kind: 'textarea' },
      { key: 'deploymentContent', label: '建设/检修/实施内容', kind: 'textarea' },
      { key: 'benefitAnalysis', label: '效益分析', kind: 'textarea' },
      { key: 'amount', label: '总投资不含税（万元）', kind: 'number' },
      { key: 'allInvestTax', label: '总投资含税（万元）', kind: 'number' }
    ]
  },
  gss: {
    fjId: '38',
    title: '编辑估算书',
    label: '估算书',
    fields: [
      { key: 'projectName', label: '项目名称', kind: 'text' },
      { key: 'projectDesc', label: '项目描述', kind: 'textarea' },
      { key: 'totalInvestTaxIn', label: '含税总投资金额', kind: 'number' },
      { key: 'totalInvestTaxEx', label: '不含税总投资金额', kind: 'number' },
      { key: 'gcTotalInvestTaxIn', label: '工程总费用含税金额', kind: 'number' },
      { key: 'cbgjTotalInvestTaxIn', label: '成本归集总计行合计值', kind: 'number' }
    ]
  }
}
