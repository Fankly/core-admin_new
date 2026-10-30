<!-- 同比/环比分析弹窗 -->
<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal tbhb-dept-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="90vw"
    height="85vh"
    @close="handleClose"
    :loading="loading"
  >
    <div class="tbhb_table">
      <div class="tbhb_table_button">
        <el-button :loading="loading" size="small" plain type="primary" @click="exportDataHandle">导 出</el-button>
        <!-- <el-button :loading="reportLoading" size="small" plain type="primary" @click="viewReportHandle">分析报告</el-button> -->
        <div class="tbhb_table_button_year">
          <span class="unit-wanyuan">单位：万元</span>
          <span class="unit-wanyuan">小数位数：2</span>
        </div>
      </div>
      <div class="tbhb_table_main">
        <vxe-grid ref="gridRef" class="range-vxe-table" v-bind="gridOptions" />
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'TbhbDeptModal'
}
</script>

<script setup lang="ts">
import { h, ref, reactive } from 'vue'
import { ElMessage, ElTooltip } from 'element-plus'
import {
  getDynamicColumnByDeptWithXmlxForTb,
  getStatDataNewWithXmlxForTb,
  getDynamicColumnByDeptWithXmlxForHb,
  getStatDataNewWithXmlxForHb,
  getTbFxbg,
  gethbFxbg
} from '@/api/service/deptData/index'
import { vxeExportFormulaHandle, apiExporFile } from '@/utils/export'
import type { FormulaConfig, InlineSumOptions } from '@/utils/export'
import { applyColumnFormat, buildRows, getColumnKind, getLeafColumns } from './columns'

type DeptTbhbType = 'tb' | 'hb'

interface DeptTbhbModalParams {
  type: DeptTbhbType
  endDate: string
  deptcode: string
  currentUserDwId: string
  deptId: string
  title?: string
}

const isShowModal = ref(false)
const loading = ref(false)
const modalTitle = ref('同比分析')
const gridRef = ref()
const reportLoading = ref(false)
const currentParams = ref<DeptTbhbModalParams | null>(null)

const MERGE_PROPS = ['xmlx']

// 合并行（基于 xmlx 等字段，与 detailDeptData 逻辑一致）
const objectSpanMethod = ({ row, column, rowIndex }: any) => {
  if (!MERGE_PROPS.includes(column.property)) return

  const tableData = gridOptions.data
  if (!tableData?.length) {
    return { rowspan: 1, colspan: 1 }
  }

  const isSameGroup = (a: any, b: any): boolean => {
    return MERGE_PROPS.every((prop) => a[prop] === b[prop])
  }

  if (rowIndex > 0 && isSameGroup(row, tableData[rowIndex - 1])) {
    return { rowspan: 0, colspan: 0 }
  }

  let rowspan = 1
  for (let i = rowIndex + 1; i < tableData.length; i++) {
    if (isSameGroup(tableData[i], row)) {
      rowspan++
    } else {
      break
    }
  }

  return { rowspan, colspan: 1 }
}

const gridOptions = reactive<any>({
  border: true,
  loading: false,
  headerAlign: 'center',
  align: 'center',
  // showOverflow: true,
  // showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 36
  },
  size: 'mini',
  columns: [],
  data: [],
  spanMethod: objectSpanMethod,
  exportConfig: {
    type: 'xlsx',
    filename: '专业归口管理项目预算执行-同比分析',
    sheetName: '专业归口管理项目预算执行-同比分析',
    useStyle: true,
    isMergeHead: true
  },
  rowStyle: ({ row }: any) => {
    if (row.dwName === '省公司') {
      return { fontWeight: 'bolder' }
    }
    return {}
  }
})

const getRequestParams = (params: DeptTbhbModalParams) => {
  return {
    endDate: params.endDate,
    deptcode: params.deptcode,
    currentUserDwId: params.currentUserDwId,
    deptId: params.deptId
  }
}

const getColumnApi = (type: DeptTbhbType) => {
  return type === 'tb' ? getDynamicColumnByDeptWithXmlxForTb : getDynamicColumnByDeptWithXmlxForHb
}

const getDataApi = (type: DeptTbhbType) => {
  return type === 'tb' ? getStatDataNewWithXmlxForTb : getStatDataNewWithXmlxForHb
}

const getFxbgApi = () => {
  return currentParams.value?.type === 'tb' ? getTbFxbg : gethbFxbg
}

// 公式提示表头：标题 + 问号图标，hover 弹出公式（el-tooltip 的 popper 默认 append 到 body，不受弹窗 overflow 裁剪）
const renderFormulaHeader = (title: string, formula: string) => {
  return () =>
    h(
      ElTooltip,
      { effect: 'dark', placement: 'top', content: formula },
      {
        default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, [title])
      }
    )
}

const loadData = async (params: DeptTbhbModalParams) => {
  loading.value = true
  gridOptions.loading = true
  try {
    const requestParams = getRequestParams(params)
    const columnApi = getColumnApi(params.type)
    const dataApi = getDataApi(params.type)

    let serverColumns: any[] = []
    try {
      const colRes = await columnApi(requestParams)
      if (colRes.success && Array.isArray(colRes.data) && colRes.data.length !== 0) {
        serverColumns = colRes.data.filter((col: any) => col.visible !== false)
      }
    } catch (e) {
      console.error('获取同比/环比表头失败', e)
    }

    if (serverColumns.length === 0) {
      gridOptions.columns = []
      gridOptions.data = []
      ElMessage.warning('未获取到表头数据')
      return
    }

    const columns = applyColumnFormat(serverColumns)
    // 表头公式提示：仅对带 tipContent 的叶子列挂表头 tooltip
    getLeafColumns(columns).forEach((col: any) => {
      const tip = col?.tipContent
      if (tip) {
        col.slots = col.slots || {}
        col.slots.header = renderFormulaHeader(col.title, String(tip))
      }
    })
    gridOptions.columns = columns

    const dataRes = await dataApi(requestParams)
    if (dataRes.success) {
      const rows: any[] = Array.isArray(dataRes.data) ? dataRes.data : []
      const result = buildRows(rows)
      gridOptions.data = result
    } else {
      ElMessage.error(dataRes.msg)
      gridOptions.data = []
    }
  } catch (e: any) {
    console.error('加载同比/环比数据失败', e)
    ElMessage.error('加载数据失败')
    gridOptions.data = []
  } finally {
    loading.value = false
    gridOptions.loading = false
  }
}

const open = (params: DeptTbhbModalParams) => {
  modalTitle.value = `${params.title ?? ''}${params.type === 'tb' ? '同比分析' : '环比分析'}`
  currentParams.value = { ...params }
  gridOptions.exportConfig = {
    ...gridOptions.exportConfig,
    filename: `专业归口管理项目预算执行-${params.type === 'tb' ? '同比分析' : '环比分析'}`,
    sheetName: `专业归口管理项目预算执行-${params.type === 'tb' ? '同比分析' : '环比分析'}`
  }
  isShowModal.value = true
  loadData(params)
}

const handleClose = () => {
  isShowModal.value = false
  gridOptions.columns = []
  gridOptions.data = []
  currentParams.value = null
}

// 根据列树结构动态构建公式配置
// 遍历列树，利用父子关系识别同一期次内的完成率/完成值/目标值列，
// 以及同比/环比增幅(金额)和增率(比率)列，关联本期与对比期对应列
const buildFormulaConfig = (columns: any[]): FormulaConfig | undefined => {
  const cfg: FormulaConfig = {}

  // 递归收集叶子列，保留其直接父节点引用，用于判断所属期次分组
  interface LeafInfo {
    col: any
    parent: any
  }
  const leafInfos: LeafInfo[] = []
  const walk = (cols: any[], parent: any) => {
    if (!Array.isArray(cols)) return
    cols.forEach((col: any) => {
      if (Array.isArray(col.children) && col.children.length !== 0) {
        walk(col.children, col)
      } else {
        leafInfos.push({ col, parent })
      }
    })
  }
  walk(columns, null)

  // 在同一父节点下按 title 关键词查找叶子列 field
  const findSiblingField = (parent: any, titleKey: string): string | undefined => {
    const siblings = leafInfos.filter((li) => li.parent === parent)
    for (const li of siblings) {
      if (String(li.col.title || '').indexOf(titleKey) !== -1) return li.col.field
    }
    return undefined
  }

  // 找出所有包含"完成值"的期次分组（父节点），按出现顺序排列
  // 前两个分别为本期和对比期
  const periodParents: any[] = []
  leafInfos.forEach((li) => {
    if (String(li.col.title || '').indexOf('完成值') !== -1 && li.parent && !periodParents.includes(li.parent)) {
      periodParents.push(li.parent)
    }
  })

  leafInfos.forEach((li) => {
    const col = li.col
    const field = String(col.field || '')
    if (!field) return
    const kind = getColumnKind(col)
    if (kind === 'rate') {
      // 完成率 = 完成值/目标值*100（同父节点内查找）
      const valueField = findSiblingField(li.parent, '完成值')
      const targetField = findSiblingField(li.parent, '目标值')
      if (valueField && targetField) {
        cfg[field] = { type: 'ratio', valueField, targetField, skipField: targetField, matchMode: 'exact' }
      }
    } else if (kind === 'je') {
      // 金额(同比/环比增幅) = 本期完成值 - 对比期完成值
      if (periodParents.length >= 2) {
        const currentField = findSiblingField(periodParents[0], '完成值')
        const compareField = findSiblingField(periodParents[1], '完成值')
        if (currentField && compareField) {
          cfg[field] = { type: 'diff', currentField, compareField, matchMode: 'exact' }
        }
      }
    } else if (kind === 'bl') {
      // 比率(同比/环比增率) = 本期完成率 - 对比期完成率
      if (periodParents.length >= 2) {
        const currentField = findSiblingField(periodParents[0], '完成率')
        const compareField = findSiblingField(periodParents[1], '完成率')
        if (currentField && compareField) {
          cfg[field] = { type: 'diff', currentField, compareField, matchMode: 'exact' }
        }
      }
    }
  })
  return Object.keys(cfg).length > 0 ? cfg : undefined
}

// 构造导出横向（行内）SUM 公式：表头第一层「合计」分组下的目标值/完成值列，
// 等于同行后面各项目类型分组对应列之和。
// 字段约定：{prefix}_{period}_{metric}，如 hj_by_MBZ（合计.本月合计.目标值）、xx_by_MBZ（某项目类型.本月合计.目标值）。
// 合计列前缀固定为 'hj'；period∈{by,qn,sy}；metric∈{MBZ,WCZ,JSL}。
// 仅对 value 类（目标值/完成值）写横向 SUM；完成率仍走 buildFormulaConfig 的 IFERROR 公式。
// 例：hj_by_MBZ = SUM(其他所有 *_by_MBZ 列同行单元格)；hj_qn_MBZ / hj_sy_MBZ 同理。
const buildInlineSumConfig = (columns: any[]): InlineSumOptions | undefined => {
  const leaves = getLeafColumns(columns)
  // 仅取 value 类叶子列（标题含「值」：目标值/完成值），完成率/金额/比率不参与横向求和
  const valueLeaves = leaves.filter((col: any) => getColumnKind(col) === 'value')
  if (valueLeaves.length === 0) return undefined

  // field 形如 {prefix}_{period}_{metric}，按首段 prefix 分组
  const splitField = (field: string): { prefix: string; suffix: string } | null => {
    const parts = String(field || '').split('_')
    if (parts.length < 2) return null
    return { prefix: parts[0], suffix: parts.slice(1).join('_') }
  }

  // 合计列前缀（不区分大小写），与 lslxJsc/reportingyx.vue 的 hj_* 约定一致
  const HJ_PREFIX = 'hj'
  const isHjPrefix = (p: string) => String(p || '').toLowerCase() === HJ_PREFIX

  // 找出所有「合计」前缀的 value 列，按 suffix 分组保留明细列候选
  const hjTargets: { field: string; suffix: string }[] = []
  const othersBySuffix: Record<string, string[]> = {}
  valueLeaves.forEach((col: any) => {
    const field = String(col.field || '')
    const info = splitField(field)
    if (!info) return
    if (isHjPrefix(info.prefix)) {
      hjTargets.push({ field, suffix: info.suffix })
    } else {
      if (!othersBySuffix[info.suffix]) othersBySuffix[info.suffix] = []
      othersBySuffix[info.suffix].push(field)
    }
  })

  if (hjTargets.length === 0) return undefined

  const config = hjTargets
    .map((t) => ({ targetField: t.field, sourceFields: othersBySuffix[t.suffix] || [] }))
    .filter((spec) => spec.sourceFields.length > 0)

  return config.length > 0 ? { config } : undefined
}

const exportDataHandle = () => {
  const $grid = gridRef.value
  if (!$grid) return
  if (!gridOptions.data || gridOptions.data.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  // 动态构建公式配置：遍历实际列识别完成率/金额/比率列
  const formulaConfig = buildFormulaConfig(gridOptions.columns)
  // 合计列（hj_*）的目标值/完成值对同行后面各项对应列横向求和
  const inlineSumOptions = buildInlineSumConfig(gridOptions.columns)
  vxeExportFormulaHandle(
    $grid,
    gridOptions.exportConfig?.filename,
    gridOptions.data,
    2,
    formulaConfig,
    { tbhbMode: true },
    undefined,
    inlineSumOptions
  )
}

const viewReportHandle = async () => {
  if (!currentParams.value) return
  if (reportLoading.value) return
  reportLoading.value = true
  try {
    const api = getFxbgApi()
    const requestParams = getRequestParams(currentParams.value)
    await apiExporFile(requestParams, `${modalTitle.value}报告.docx`, api)
  } catch (e: any) {
    console.error('分析报告失败', e)
    ElMessage.error('分析报告失败')
  } finally {
    reportLoading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="less">
.tbhb_table {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .tbhb_table_button {
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }
  .tbhb_table_main {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}

// 公式提示图标：让用户一眼看出该表头可悬浮查看公式
:deep(.vxe-formula-icon) {
  margin-left: 2px;
  color: var(--color-primary, #00706b);
  font-size: 14px;
  cursor: pointer;
  vertical-align: middle;
  transition: color 0.2s ease, transform 0.2s ease;
  &:hover {
    color: #005f5b;
    transform: scale(1.15);
  }
}

.tbhb_table_button_year {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.unit-wanyuan {
  background: var(--color-primary, #00706b);
  color: #fff;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  height: 30px;
  line-height: 30px;
}
</style>
