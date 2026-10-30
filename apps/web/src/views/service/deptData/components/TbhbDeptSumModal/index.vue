<!-- 部门汇总级 同比/环比分析弹窗 -->
<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal tbhb-dept-sum-modal"
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
      </div>
      <div class="tbhb_table_main">
        <vxe-grid ref="gridRef" class="range-vxe-table" v-bind="gridOptions" @cell-click="handleCellClick" />
      </div>
    </div>
    <!-- 详情级同比/环比弹窗 -->
    <TbhbDeptModal ref="tbhbDeptModalRef" />
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'TbhbDeptSumModal'
}
</script>

<script setup lang="ts">
import { h, ref, reactive, computed } from 'vue'
import { ElMessage, ElTooltip } from 'element-plus'
import { getProSlDataByDeptForTb, getProSlDataByDeptForHb, getFxbgByDeptForTb, getFxbgByDeptForHb } from '@/api/service/deptData/index'
import { vxeExportFormulaHandle, apiExporFile } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import TbhbDeptModal from '@/views/service/deptData/components/TbhbDeptModal/index.vue'

type DeptTbhbType = 'tb' | 'hb'

interface DeptTbhbSumModalParams {
  type: DeptTbhbType
  endDate: string
  currentUserDwId: string
  title?: string
  /** 当前角色信息（含 specialorgcode、specialorgid、org_id 等） */
  userInfo?: any
}

const VALUE_DIGITS = 2
const RATE_DIGITS = 2

const isEmptyValue = (v: any) => v === null || v === undefined || v === '' || v === '-'

const valueFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, VALUE_DIGITS)
  }
}

const rateFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, RATE_DIGITS)
  }
}

const isShowModal = ref(false)
const loading = ref(false)
const reportLoading = ref(false)
const modalTitle = ref('同比分析')
const modalType = ref<DeptTbhbType>('tb')
const gridRef = ref()
const tbhbDeptModalRef = ref()
const userInfoData = ref<any>({})
const currentParams = ref<{ endDate: string; currentUserDwId: string }>({ endDate: '', currentUserDwId: '' })

// 当前角色是否为财务归口（specialorgcode 含 CW）
const isCwRole = computed(() => (userInfoData.value?.specialorgcode ?? '').includes('CW'))
// 当前行是否属于当前角色（财务归口或匹配部门）
const isCurrentRoleRow = (row: any) => isCwRole.value || userInfoData.value?.specialorgid == row?.deptcode

const gridOptions = reactive<any>({
  border: true,
  loading: false,
  headerAlign: 'center',
  align: 'center',
  height: '100%',
  rowConfig: {
    height: 36,
    isHover: true
  },
  size: 'mini',
  columns: [],
  data: [],
  // 归口部门列点击样式（与主页一致）
  cellStyle: ({ row, column }: any) => {
    if (column.property === 'deptname' && row.deptname !== '省平均' && isCurrentRoleRow(row)) {
      return {
        cursor: 'pointer',
        color: 'var(--color-primary)',
        textDecoration: 'underline',
        fontWeight: '600'
      }
    }
    return {}
  },
  rowStyle: ({ row }: any) => {
    if (isCurrentRoleRow(row) && row.deptname !== '省平均') {
      return { cursor: 'pointer' }
    }
    return {}
  },
  exportConfig: {
    type: 'xlsx',
    filename: '专业归口管理项目预算执行-同比分析',
    sheetName: '专业归口管理项目预算执行-同比分析',
    useStyle: true,
    isMergeHead: true
  }
})

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

// 按 type 构建多级表头
const buildColumns = (type: DeptTbhbType): any[] => {
  const compareTitle = type === 'tb' ? '去年同期' : '上月合计'
  const diffTitle = type === 'tb' ? '同比' : '环比'
  // 对比期字段前缀：同比 qn_(去年)，环比 sy_(上月)
  const cmpPrefix = type === 'tb' ? 'qn' : 'sy'
  // 同比/环比差值字段
  const jeField = type === 'tb' ? 'tb_je' : 'hb_je'
  const lvField = type === 'tb' ? 'tb_bl' : 'hb_bl'

  return [
    { field: 'rownumber', title: '序号', width: 60, fixed: 'left', align: 'center', headerAlign: 'center' },
    { field: 'deptname', title: '归口部门', width: 160, fixed: 'left', align: 'center', headerAlign: 'center' },
    {
      title: '本月合计',
      align: 'center',
      headerAlign: 'center',
      children: [
        { field: 'by_mbz', title: '目标值(万元)', width: 130, align: 'right', headerAlign: 'center', formatter: valueFormatter() },
        { field: 'by_wcz', title: '完成值(万元)', width: 130, align: 'right', headerAlign: 'center', formatter: valueFormatter() },
        {
          field: 'by_jsl',
          title: '完成率(%)',
          width: 110,
          align: 'center',
          headerAlign: 'center',
          slots: { header: renderFormulaHeader('完成率(%)', '完成率(%)=完成值(万元)/目标值(万元)*100') },
          formatter: rateFormatter()
        }
      ]
    },
    {
      title: compareTitle,
      align: 'center',
      headerAlign: 'center',
      children: [
        { field: `${cmpPrefix}_mbz`, title: '目标值(万元)', width: 130, align: 'right', headerAlign: 'center', formatter: valueFormatter() },
        { field: `${cmpPrefix}_wcz`, title: '完成值(万元)', width: 130, align: 'right', headerAlign: 'center', formatter: valueFormatter() },
        {
          field: `${cmpPrefix}_jsl`,
          title: '完成率(%)',
          width: 110,
          align: 'center',
          headerAlign: 'center',
          slots: { header: renderFormulaHeader('完成率(%)', '完成率(%)=完成值(万元)/目标值(万元)*100') },
          formatter: rateFormatter()
        }
      ]
    },
    {
      title: diffTitle,
      align: 'center',
      headerAlign: 'center',
      children: [
        {
          field: jeField,
          title: '金额(万元)',
          width: 130,
          align: 'right',
          headerAlign: 'center',
          slots: { header: renderFormulaHeader('金额(万元)', `金额(万元)=本月合计完成值(万元)−${compareTitle}完成值(万元)`) },
          formatter: valueFormatter()
        },
        {
          field: lvField,
          title: '比率(%)',
          width: 110,
          align: 'center',
          headerAlign: 'center',
          slots: { header: renderFormulaHeader('比率(%)', `比率(%)=本月合计完成率(%)−${compareTitle}完成率(%)`) },
          formatter: rateFormatter()
        }
      ]
    }
  ]
}

const getDataApi = (type: DeptTbhbType) => {
  return type === 'tb' ? getProSlDataByDeptForTb : getProSlDataByDeptForHb
}

const getFxbgApi = () => {
  return modalTitle.value === '同比分析' ? getFxbgByDeptForTb : getFxbgByDeptForHb
}

const fillRownumber = (rows: any[]) => {
  let seq = 1
  rows.forEach((row) => {
    row.rownumber = seq
    seq += 1
  })
}

const loadData = async (params: DeptTbhbSumModalParams) => {
  loading.value = true
  gridOptions.loading = true
  try {
    const requestParams = {
      endDate: params.endDate,
      currentUserDwId: params.currentUserDwId
    }
    const dataApi = getDataApi(params.type)
    const res = await dataApi(requestParams)
    if (res.success) {
      const rows: any[] = Array.isArray(res.data) ? res.data : []
      if (rows.length === 0) {
        ElMessage.warning('暂无数据')
        gridOptions.data = []
        return
      }
      fillRownumber(rows)
      gridOptions.data = rows
    } else {
      ElMessage.error(res.msg)
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

const open = (params: DeptTbhbSumModalParams) => {
  modalType.value = params.type
  modalTitle.value = `${params.title ?? ''}${params.type === 'tb' ? '同比分析' : '环比分析'}`
  userInfoData.value = params.userInfo ?? {}
  currentParams.value = { endDate: params.endDate, currentUserDwId: params.currentUserDwId }
  gridOptions.columns = buildColumns(params.type)
  gridOptions.exportConfig = {
    ...gridOptions.exportConfig,
    filename: `专业归口管理项目预算执行-${params.type === 'tb' ? '同比分析' : '环比分析'}`,
    sheetName: `专业归口管理项目预算执行-${params.type === 'tb' ? '同比分析' : '环比分析'}`
  }
  isShowModal.value = true
  loadData(params)
}

// 归口部门单元格点击 → 弹出详情级同比/环比弹窗
const handleCellClick = ({ row, column }: any) => {
  if (!row || column?.property !== 'deptname') return
  if (row.deptname === '省平均' || !isCurrentRoleRow(row)) return
  tbhbDeptModalRef.value?.open({
    type: modalType.value,
    title: row.deptname,
    endDate: currentParams.value.endDate,
    deptcode: row.deptcode,
    currentUserDwId: currentParams.value.currentUserDwId,
    deptId: row.deptcode
  })
}

const handleClose = () => {
  isShowModal.value = false
  gridOptions.columns = []
  gridOptions.data = []
}

const exportDataHandle = () => {
  const $grid = gridRef.value
  if (!$grid) return
  if (!gridOptions.data || gridOptions.data.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  // 对比期前缀：同比 qn（去年），环比 sy（上月）
  const cmpPrefix = modalType.value === 'tb' ? 'qn' : 'sy'
  const jeField = modalType.value === 'tb' ? 'tb_je' : 'hb_je'
  const blField = modalType.value === 'tb' ? 'tb_bl' : 'hb_bl'
  vxeExportFormulaHandle(
    $grid,
    gridOptions.exportConfig?.filename,
    gridOptions.data,
    2,
    {
      by_jsl: { type: 'ratio', valueField: 'by_wcz', targetField: 'by_mbz', skipField: 'by_mbz', matchMode: 'exact' },
      [`${cmpPrefix}_jsl`]: {
        type: 'ratio',
        valueField: `${cmpPrefix}_wcz`,
        targetField: `${cmpPrefix}_mbz`,
        skipField: `${cmpPrefix}_mbz`,
        matchMode: 'exact'
      },
      [jeField]: {
        type: 'diff',
        currentField: 'by_wcz',
        compareField: `${cmpPrefix}_wcz`,
        matchMode: 'exact'
      },
      [blField]: {
        type: 'diff',
        currentField: 'by_jsl',
        compareField: `${cmpPrefix}_jsl`,
        matchMode: 'exact'
      }
    },
    { tbhbMode: true }
  )
}

const viewReportHandle = async () => {
  if (!currentParams.value) return
  if (reportLoading.value) return
  reportLoading.value = true
  try {
    const api = getFxbgApi()
    await apiExporFile(currentParams.value, `${modalTitle.value}报告.docx`, api)
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
</style>
