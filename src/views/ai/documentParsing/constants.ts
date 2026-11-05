import type { VxeGridProps } from 'vxe-table'
import type { ParseDocType, ParseRow } from '@/api/ai/documentParsing'
import type { AttachDocType } from '@/views/ai/document/types'

type ParseColumn = NonNullable<VxeGridProps<ParseRow>['columns']>[number]

const centerConfig: Pick<ParseColumn, 'align' | 'headerAlign' | 'showOverflow'> = {
  align: 'center',
  headerAlign: 'center',
  showOverflow: true
}

export interface ParseTabConfig {
  key: ParseDocType
  label: string
  /** 修改弹窗复用文档预处理的三类编辑（jys / kybg / gss） */
  editType: AttachDocType
  infoName: { field: string; title: string }
  infoAmount: { field: string; title: string }
  infoTax: { field: string; title: string }
}

/** 三个页签：除最后 3 列（各自文档的项目名称/预算）外，其余列完全一致 */
export const PARSE_TABS: ParseTabConfig[] = [
  {
    key: 'jys',
    label: '建议书基本信息',
    editType: 'jys',
    infoName: { field: 'jysProjectName', title: '建议书项目名称' },
    infoAmount: { field: 'jysAmount', title: '建议书不含税总预算（万元）' },
    infoTax: { field: 'jysAllInvestTax', title: '建议书含税总预算（万元）' }
  },
  {
    key: 'ky',
    label: '可研基本信息',
    editType: 'kybg',
    infoName: { field: 'kyProjectName', title: '可研项目名称' },
    infoAmount: { field: 'kyAmount', title: '可研不含税总预算（万元）' },
    infoTax: { field: 'kyAllInvestTax', title: '可研含税总预算（万元）' }
  },
  {
    key: 'gss',
    label: '估算书基本信息',
    editType: 'gss',
    infoName: { field: 'gssProjectName', title: '估算书项目名称' },
    infoAmount: { field: 'gssTotalInvestTaxEx', title: '估算书不含税总预算（万元）' },
    infoTax: { field: 'gssTotalInvestTaxIn', title: '估算书含税总预算（万元）' }
  }
]

/** 表格列（顺序照需求：附件信息 → 项目信息 → 预算 → 项目状态 → 文档专属 3 列） */
export const createParseColumns = (tab: ParseTabConfig): ParseColumn[] => [
  // 单选：每次只能高亮一行（修改只针对单条数据）
  { type: 'radio', width: 46, fixed: 'left' },
  { type: 'seq', width: 56, title: '序号', fixed: 'left' },
  { field: 'attachName', title: '附件名称', fixed: 'left', minWidth: 230, align: 'left', headerAlign: 'center', showOverflow: true },
  { field: 'fjName', title: '附件类型', width: 130, ...centerConfig },
  { field: 'xmbm', title: '项目编码', width: 170, ...centerConfig },
  { field: 'xmmc', title: '项目名称', minWidth: 240, align: 'left', headerAlign: 'center', showOverflow: true },
  { field: 'proTypeName', title: '项目类型', width: 120, ...centerConfig },
  { field: 'jhssnd', title: '计划实施年度', width: 120, ...centerConfig },
  { field: 'yjdwName', title: '一级单位', minWidth: 150, ...centerConfig },
  { field: 'amount', title: '不含税总预算（万元）', width: 150, ...centerConfig },
  { field: 'allInvestTax', title: '含税总预算（万元）', width: 140, ...centerConfig },
  { field: 'flowStatusName', title: '项目状态', width: 110, ...centerConfig },
  { field: tab.infoName.field, title: tab.infoName.title, minWidth: 200, align: 'left', headerAlign: 'center', showOverflow: true },
  { field: tab.infoAmount.field, title: tab.infoAmount.title, width: 180, ...centerConfig },
  { field: tab.infoTax.field, title: tab.infoTax.title, width: 170, ...centerConfig }
]

export interface ParseSearchForm {
  xmbm: string
  xmmc: string
  proTypes: string[]
  jhssnd: string
  yjdw: string
  zt: string[]
  attachName: string
}

export const createParseSearchForm = (): ParseSearchForm => ({
  xmbm: '',
  xmmc: '',
  proTypes: [],
  jhssnd: '',
  yjdw: '',
  zt: [],
  attachName: ''
})

export interface ParseOption {
  code: string
  name: string
}

/** 项目类型树：取值键是 middleId（与文档预处理的筛选口径一致） */
export const parseProjectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
