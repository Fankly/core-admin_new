<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-dropdown @command="expandByLevelHandle">
          <el-button v-permission="'EXPAND'" style="margin-right: 10px" size="small" plain type="primary"
            >一键展开 <i class="el-icon-arrow-down el-icon--right"
          /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in formList.ZKCJ" :key="item.code" :command="item.code">{{ item.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-permission="'EXPORT'" size="small" plain type="primary" @click="exportDataHandle">导 出</el-button>
        <el-button v-permission="'TB'" :loading="gridOptions.loading" size="small" plain type="primary" @click="handleTbhb('1')">同 比</el-button>
        <el-button v-permission="'HB'" :loading="gridOptions.loading" size="small" plain type="primary" @click="handleTbhb('2')">环 比</el-button>
        <el-button v-permission="'VIEWREPORT'" :loading="gridOptions.loading" size="small" plain type="primary" @click="viewReportHandle"
          >查看分析报告
        </el-button>
      </div>
      <div class="right">
        <div class="year">
          <span class="unit-wanyuan">单位：万元</span>
          <span class="xsws-label">小数位数：</span>
          <el-select @change="handleChangeXswsData" v-model="formData.xsws" style="width: 60px">
            <el-option v-for="item in formList.XSWS" :key="item.code" :value="item.code" :label="item.name"></el-option>
          </el-select>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="search">
      <el-form :model="formData" label-position="right" label-width="100px">
        <Grid ref="searchGridRef" :gap="[10, 0]" :cols="4">
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `指标项` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select multiple collapse-tags clearable v-model="formData.sjx" class="form-select">
                  <el-option :key="item.code" v-for="item in formList.YSZXYL_SJX" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算期间` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-date-picker :clearable="false" v-model="formData.startDate" value-format="YYYY-MM" format="YYYY-MM" type="month"></el-date-picker>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `至` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-date-picker
                  :disabledDate="disabledEndMonth"
                  :clearable="false"
                  v-model="formData.endDate"
                  value-format="YYYY-MM"
                  format="YYYY-MM"
                  type="month"
                ></el-date-picker>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <XmlbSelect class="form-select" :tree-data="selectData.xmlbData" v-model="formData.xmlbIds"></XmlbSelect>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="kxpzLists">
              <template #label>
                <el-space :size="4">
                  <span>{{ `维度` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select multiple collapse-tags clearable v-model="formData.kxpzLists" class="form-select">
                  <el-option :key="item.code" v-for="item in formList.YSZXFX_KX_COLUMN" :label="item.name" :value="String(item.code)"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `单位` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form dwForm" v-if="pageInfo.isShowPage">
                <DwSelect :dwId="dwId" ref="dwSelectRef"></DwSelect>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem></GridItem>
          <GridItem>
            <el-form-item style="text-align: right">
              <el-button type="primary" plain size="small" @click="searchDataHandle">查 询</el-button>
              <el-button type="primary" plain size="small" @click="resetDataHandle">重 置</el-button>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="main">
      <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
  <YszxylbTbhbModal ref="tbhbModalRef" />
  <FxbgModal ref="fxbgModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/yszxylb'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import DwSelect from '@/views/fy/standardCost/components/DwSelect.vue'
import XmlbSelect from '@/views/statistics/components/XmlbSelect.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { VxeGridProps } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { ElMessage } from 'element-plus'
import { getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { Data, getDataListByDw, getDynamicColumnByDw } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import YszxylbTbhbModal from '@/views/statistics/components/YszxylbTbhbModal/index.vue'
import FxbgModal from '@/views/statistics/components/FxbgModal/index.vue'
import { getFxbg } from '@/api/statistics/yszxfxbg'
import { applyFormulaHeaderTooltips } from '@/views/statistics/components/formulaHeader'
import type { BudgetExecutionFormulaContext } from '@/views/statistics/budgetExecutionAnalysis/indicatorFormula'
import { decorateDynamicColumns, fitNumericColumnWidths } from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'
import { formatBudgetExecutionExportSheet } from '@/views/statistics/budgetExecutionAnalysis/exportHelpers'
import { loadBudgetExecutionFormulaContext } from '@/views/statistics/budgetExecutionAnalysis/exportContext'

interface RowVo {
  id: string
}

interface CodeData {
  code: string
  name: string
  note?: string | number
}

interface FormData {
  sjx: string[]
  xsws: string
  jedw: string
  xsfs: string
  startDate: string
  endDate: string
  protype: string[]
  xmlbIds: string
  kxpzLists: string[]
  dwList: Data['dwList']
}

const selectData = reactive<{
  xmlbData: any
}>({
  xmlbData: []
})

const pageInfo = reactive({
  isShowPage: false
})

const formList = reactive<{
  YSZXYL_SJX: CodeData[]
  XSWS: CodeData[]
  YSZXFX_KX_COLUMN: CodeData[]
  ZKCJ: CodeData[]
}>({
  YSZXYL_SJX: [],
  YSZXFX_KX_COLUMN: [],
  XSWS: [],
  ZKCJ: []
})

const userDialogRef = ref()
const helpModalRef = ref()
const tbhbModalRef = ref()
const fxbgModalRef = ref()
const dwSelectRef = ref()
const dwId = ref<string>('')
const dwName = ref<string>('')
const year = ref('')
const busiType = ref('YSZXYL')

const formData = reactive<FormData>({
  sjx: [],
  xsws: '',
  jedw: '',
  xsfs: '',
  startDate: '',
  endDate: '',
  protype: [],
  xmlbIds: '',
  kxpzLists: [],
  dwList: []
})

const gridRef = ref()
const exportFormulaContext = ref<BudgetExecutionFormulaContext>()
const isExpanding = ref(false)
const EXPAND_YIELD_INTERVAL = 40
const EXPAND_PRELOAD_CONCURRENCY = 4
const expandTaskId = ref(0)

type TbhbSearchType = '1' | '2'

const isExpandTaskCanceled = (taskId: number) => taskId !== expandTaskId.value

const mapTableRows = (rows: any[] = []) => {
  return rows.map((item: any) => {
    const values = {
      ...item
    }
    values.leaf = item.leaf === '0'
    return values
  })
}

const requestTableRowsByParent = async (
  parentId: string,
  options: {
    showError?: boolean
    taskId?: number
  } = {}
): Promise<any[]> => {
  const { showError = true, taskId } = options
  if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
  let params: Data = getFormParams()
  params.parentId = parentId
  try {
    const res = await getDataListByDw(params)
    if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
    if (res.success) {
      return mapTableRows(res.data || [])
    }
    if (showError && (typeof taskId !== 'number' || !isExpandTaskCanceled(taskId))) {
      ElMessage.error(res.msg)
    }
    return []
  } catch (error) {
    if (showError && (typeof taskId !== 'number' || !isExpandTaskCanceled(taskId))) {
      ElMessage.error('数据加载失败，请稍后重试')
    }
    return []
  }
}

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  stripe: true,
  columnConfig: {
    resizable: true
  },
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod: async ({ row }: any) => {
      if (!isExpanding.value) gridOptions.loading = true
      try {
        return await requestTableRowsByParent(row.id)
      } finally {
        if (!isExpanding.value) gridOptions.loading = false
      }
    }
  },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  rowStyle: ({ row }: any) => {
    return {
      fontWeight: row?.sfjc === 1 || row?.sfjc === '1' ? 'bold' : 'normal'
    }
  },
  exportConfig: {
    sheetName: '预算执行统计报表-导出',
    type: 'xlsx',
    filename: '预算执行统计报表-导出',
    useStyle: true
  }
})

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleChangeXswsData = () => {
  searchDataHandle()
}

const getTableData = async () => {
  gridOptions.loading = true
  try {
    const rows = await requestTableRowsByParent(year.value)
    gridOptions.columns = fitNumericColumnWidths(gridOptions.columns as any[], rows, gridRef.value?.$el)
    gridOptions.data = rows
  } finally {
    gridOptions.loading = false
  }
}

const getDynamicColumnData = async (): Promise<boolean> => {
  gridOptions.loading = true
  exportFormulaContext.value = undefined
  const params = getFormParams()
  try {
    const [res, context] = await Promise.all([getDynamicColumnByDw(params), loadBudgetExecutionFormulaContext('budget', params.dwId, params.dwList)])
    if (res.success) {
      gridOptions.columns = decorateDynamicColumns(res.data || [], formData.xsws, formatNumValue) as any
      applyFormulaHeaderTooltips(gridOptions.columns || [])
      exportFormulaContext.value = context
      return true
    }
    ElMessage.error(res.msg)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '动态列加载失败，请稍后重试')
  } finally {
    gridOptions.loading = false
  }
  return false
}

const getFormParams = (): Data => {
  let params: Data = {
    busiType: busiType.value,
    dwId: dwId.value,
    endDate: formData.endDate,
    startDate: formData.startDate,
    dwList: formData.dwList,
    indicators: formData.sjx.join(','),
    kxpzLists: [...formData.kxpzLists],
    parentId: year.value,
    xmlbIds: formData.xmlbIds
  }
  return params
}

const setFormData = async () => {
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    const selectDatas = $dwSelect.dwSelectRef.getCheckedNodes()
    formData.dwList = selectDatas.map((item: any) => ({
      code: item.code,
      nodeType: item.nodeType
    }))
  }
}

const searchDataHandle = async () => {
  exportFormulaContext.value = undefined
  if (gridOptions.data) gridOptions.data.length = 0
  if (gridOptions.columns) gridOptions.columns.length = 0
  if (formData.sjx && formData.sjx.length === 0) {
    ElMessage.error('指标项不能为空！')
    return
  }
  await setFormData()
  if (!(await getDynamicColumnData())) return
  await getTableData()
}

const resetDataHandle = async () => {
  exportFormulaContext.value = undefined
  await setDefaultValue()
  if (Array.isArray(gridOptions.columns)) gridOptions.columns.length = 0
  else gridOptions.columns = []
  if (Array.isArray(gridOptions.data)) gridOptions.data.length = 0
  else gridOptions.data = []
}

const setDefaultValue = async () => {
  const now = new Date()
  year.value = now.getFullYear().toString()
  // 设置默认值
  formData.startDate = year.value + '-01'
  formData.endDate = year.value + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    $dwSelect.clearHandle()
  }
  formData.xsws = 'XSWS_2'
  formData.jedw = 'JEDW_WY'
  formData.xsfs = '0'
  formData.sjx = formList.YSZXYL_SJX.map((item: any) => item.code)
  formData.xmlbIds = ''
  formData.kxpzLists = formList.YSZXFX_KX_COLUMN.filter((item) => String(item.note) === '1').map((item) => String(item.code))
  formData.dwList.length = 0
}

const disabledEndMonth = (time: Date) => {
  if (!formData.startDate) return false
  const startDate = new Date(formData.startDate)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()
  const currentYear = time.getFullYear()
  const currentMonth = time.getMonth()
  const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth)
  return currentYear !== startYear || monthDiff < 0
}

const exportDataHandle = () => {
  const $table = gridRef.value
  if ($table) {
    if (gridOptions.loading) return
    const context = exportFormulaContext.value
    if (!context) {
      ElMessage.error('请先查询数据后再导出')
      return
    }
    // XLSX 插件延迟生成文件，捕获本次查询的计算口径。
    $table.exportData({
      ...gridOptions.exportConfig,
      sheetMethod: (params: any) =>
        formatBudgetExecutionExportSheet(params, context, { includeFormulaExplanations: false, autoFitNumericColumns: true })
    })
  }
}

const handleTbhb = async (searchType: TbhbSearchType) => {
  if (gridOptions.loading) return
  if (!formData.sjx.length) {
    ElMessage.error('指标项不能为空！')
    return
  }
  await setFormData()
  tbhbModalRef.value?.open({
    title: searchType === '1' ? '同比分析' : '环比分析',
    params: { ...getFormParams(), searchType },
    xsws: formData.xsws
  })
}

// 查看分析报告
const viewReportHandle = () => {
  if (gridOptions.loading) return
  fxbgModalRef.value?.open(
    {
      busiType: busiType.value,
      endDate: formData.endDate
    },
    getFxbg
  )
}

const yieldToMainThread = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

const preloadLazyDataByLevel = async (data: any[], targetLevel: number, state: { count: number }, taskId: number): Promise<void> => {
  const queue: Array<{ row: any; level: number }> = []
  for (const row of data) {
    if (row && typeof row === 'object' && row.leaf) {
      queue.push({ row, level: 1 })
    }
  }
  let cursor = 0
  const worker = async () => {
    while (true) {
      if (isExpandTaskCanceled(taskId)) return
      if (cursor >= queue.length) return
      const current = queue[cursor]
      cursor += 1
      const { row, level } = current
      if (targetLevel !== Infinity && level >= targetLevel) continue
      const children = await requestTableRowsByParent(row.id, { showError: false, taskId })
      if (isExpandTaskCanceled(taskId)) return
      row.children = children
      state.count += 1
      if (state.count % EXPAND_YIELD_INTERVAL === 0) {
        await yieldToMainThread()
      }
      for (const child of children) {
        if (child && typeof child === 'object' && child.leaf) {
          queue.push({ row: child, level: level + 1 })
        }
      }
    }
  }
  const workerCount = Math.max(1, Math.min(EXPAND_PRELOAD_CONCURRENCY, queue.length || 1))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}

const expandToLevel = async (
  data: any[],
  $table: any,
  targetLevel: number,
  currentLevel: number,
  state: { count: number },
  visitedRows: WeakSet<object>,
  taskId?: number
): Promise<void> => {
  for (const row of data) {
    if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return
    if (!row || typeof row !== 'object') continue
    if (visitedRows.has(row)) continue
    visitedRows.add(row)
    if (row.leaf) {
      // 非“全部展开”时，仅展开到 targetLevel-1，避免多加载一层导致卡顿
      if (targetLevel === Infinity || currentLevel < targetLevel) {
        await $table.setTreeExpand(row, true)
        state.count += 1
        if (state.count % EXPAND_YIELD_INTERVAL === 0) {
          await yieldToMainThread()
        }
      }
      if ((targetLevel === Infinity || currentLevel < targetLevel) && row.children) {
        await expandToLevel(row.children, $table, targetLevel, currentLevel + 1, state, visitedRows, taskId)
      }
    }
  }
}

const expandByLevelHandle = async (command: string) => {
  if (!gridOptions.columns || gridOptions.columns.length === 0) {
    return
  }
  const taskId = ++expandTaskId.value
  const targetLevel = command.includes('ALL') ? Infinity : parseInt(command.split('_')[1], 10)
  if (targetLevel !== Infinity && (!Number.isFinite(targetLevel) || targetLevel < 1)) {
    ElMessage.warning('展开层级参数无效')
    return
  }
  isExpanding.value = true
  gridOptions.loading = true
  try {
    await setFormData()
    if (isExpandTaskCanceled(taskId)) return
    const rootRows = await requestTableRowsByParent(year.value, { taskId })
    if (isExpandTaskCanceled(taskId)) return
    await preloadLazyDataByLevel(rootRows, targetLevel, { count: 0 }, taskId)
    if (isExpandTaskCanceled(taskId)) return
    gridOptions.data = rootRows
    await nextTick()
    if (isExpandTaskCanceled(taskId)) return
    const $table = gridRef.value
    if (!$table) return
    await $table.clearTreeExpand()
    if (isExpandTaskCanceled(taskId)) return
    await expandToLevel(rootRows, $table, targetLevel, 1, { count: 0 }, new WeakSet<object>(), taskId)
  } finally {
    if (!isExpandTaskCanceled(taskId)) {
      gridOptions.loading = false
      isExpanding.value = false
    }
  }
}

const getPublicCode = async () => {
  let codes = ['YSSX_ZBX', 'XSWS', 'ZKCJ', 'YSZXFX_KX_COLUMN']
  const res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    formList.YSZXYL_SJX = res.data['YSSX_ZBX']
    formList.XSWS = res.data['XSWS']
    formList.YSZXFX_KX_COLUMN = res.data['YSZXFX_KX_COLUMN'] || []
    formList.ZKCJ = res.data['ZKCJ'] || []
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  dwId.value = userDialogRef.value.userMsg.org_id
  dwName.value = userDialogRef.value.userMsg.org_name

  if (isQuery) {
    pageInfo.isShowPage = true
    // searchDataHandle()
  }
}

const getXmlbData = async () => {
  let res = await getNodeTree(busiType.value, year.value)
  if (res.success && res.data) {
    selectData.xmlbData = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const initParams = async () => {
  await getPublicCode()
  await setDefaultValue()
  await getXmlbData()
  userDialogRef.value.getUser()
}

onMounted(() => {
  initParams()
})

watch(
  () => formData.startDate,
  (newVal) => {
    if (newVal) {
      const startDate = new Date(newVal)
      year.value = startDate.getFullYear().toString()
      if (formData.endDate) {
        const endDate = new Date(formData.endDate)
        if (endDate.getFullYear() !== startDate.getFullYear() || endDate.getMonth() < startDate.getMonth()) {
          formData.endDate = startDate.getFullYear() + '-12'
        }
      }
    }
  }
)
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;

  .operation {
    font-size: 14px;
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    min-height: 0;
    min-width: 0;
    height: 37px;
    margin-bottom: 10px;
    overflow: hidden;

    .left {
      height: 100%;
      flex: 1;
    }

    .right {
      width: auto;
      line-height: 40px;
      height: 100%;
      min-width: 0;
      min-height: 0;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }
  }

  .search {
    min-height: 0;
    min-width: 0;

    .form {
      .form-select {
        width: 100%;
      }
    }
  }

  .main {
    min-height: 0;
    min-width: 0;
    flex: 1;
  }
}

.el-form--inline {
  height: 100%;
  overflow: hidden;

  :deep(.el-form-item) {
    margin-right: 0;
    overflow: hidden;
  }
}

.el-form-item {
  margin-bottom: 10px;
}

/* 单位固定为万元（查询参数 jedw 固定 JEDW_WY）：主色徽标，与同比环比弹窗/其他统计页保持一致 */
.year {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.unit-wanyuan {
  background: var(--color-primary, #00706b);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  line-height: 20px;
}

.xsws-label {
  font-size: 12px;
  color: #606266;
}

:deep(.el-date-editor) {
  width: 100%;
}
</style>
