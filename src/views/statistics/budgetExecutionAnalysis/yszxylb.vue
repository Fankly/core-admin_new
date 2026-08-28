<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-dropdown @command="expandByLevelHandle">
          <el-button v-permission="'EXPAND'" style="margin-right: 10px" size="mini" plain type="primary"
            >一键展开 <i class="el-icon-arrow-down el-icon--right"
          /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in formList.ZKCJ" :key="item.code" :command="item.code">{{ item.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-permission="'EXPORT'" size="mini" plain type="primary" @click="exportDataHandle">导 出</el-button>
      </div>
      <div class="right">
        <div class="year">
          <el-form :inline="true">
            <el-form-item label="小数位数：">
              <el-select @change="handleChangeXswsData" v-model="formData.xsws" style="width: 60px">
                <el-option v-for="item in formList.XSWS" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
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
                  <span>{{ `展示维度` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.busiType" class="form-select" @change="handleBusiTypeChange">
                  <el-option :key="item.code" v-for="item in formList.BUDUGET_EXECUTION_ANALYSIS" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `指标项` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select multiple collapse-tags clearable v-model="formData.sjx" class="form-select" @remove-tag="handleRemoveTag">
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
              <el-button type="primary" plain size="mini" @click="searchDataHandle">查 询</el-button>
              <el-button type="primary" plain size="mini" @click="resetDataHandle">重 置</el-button>
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
</template>

<script lang="ts">
export default {
  name: '/statistics/budgetExecutionAnalysis/yszxylb'
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
import { getIndicatorByBusiType, getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { Data, getDataListByDw, getDynamicColumnByDw } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import {
  applyExportNumberCell,
  createLatestRequestTracker,
  decorateDynamicColumns,
  getExportLeafColumns
} from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'

interface RowVo {
  id: string
}

interface CodeData {
  code: string
  name: string
}

interface FormData {
  sjx: string[]
  xsws: string
  jedw: string
  xsfs: string
  busiType: string
  startDate: string
  endDate: string
  protype: string[]
  xmlbIds: string
  dwList: []
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
  ZKCJ: CodeData[]
  BUDUGET_EXECUTION_ANALYSIS: CodeData[]
}>({
  YSZXYL_SJX: [],
  XSWS: [],
  ZKCJ: [],
  BUDUGET_EXECUTION_ANALYSIS: []
})

const userDialogRef = ref()
const helpModalRef = ref()
const dwSelectRef = ref()
const dwId = ref<string>('')
const dwName = ref<string>('')
const year = ref('')

const formData = reactive<FormData>({
  sjx: [],
  xsws: '',
  jedw: '',
  xsfs: '',
  busiType: '',
  startDate: '',
  endDate: '',
  protype: [],
  xmlbIds: '',
  dwList: []
})

const gridRef = ref()
const isExpanding = ref(false)
const EXPAND_YIELD_INTERVAL = 40
const EXPAND_PRELOAD_CONCURRENCY = 4
const expandTaskId = ref(0)
const searchRequestTracker = createLatestRequestTracker()
const xmlbRequestTracker = createLatestRequestTracker()
const indicatorRequestTracker = createLatestRequestTracker()

const isExpandTaskCanceled = (taskId: number) => taskId !== expandTaskId.value
const isStaleSearchRequest = (requestToken?: number) => typeof requestToken === 'number' && !searchRequestTracker.isLatest(requestToken)

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
    requestToken?: number
  } = {}
): Promise<any[]> => {
  const { showError = true, taskId, requestToken } = options
  if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
  if (isStaleSearchRequest(requestToken)) return []
  let params: Data = getFormParams()
  params.parentId = parentId
  try {
    const res = await getDataListByDw(params)
    if (isStaleSearchRequest(requestToken)) return []
    if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
    if (res.success) {
      return mapTableRows(res.data || [])
    }
    if (showError && !isStaleSearchRequest(requestToken) && (typeof taskId !== 'number' || !isExpandTaskCanceled(taskId))) {
      ElMessage.error(res.msg)
    }
    return []
  } catch {
    if (showError && !isStaleSearchRequest(requestToken) && (typeof taskId !== 'number' || !isExpandTaskCanceled(taskId))) {
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
  height: '100%',
  rowConfig: {
    height: 32
  },
  rowStyle: ({ row }: any) => {
    if (row && row['leaf']) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  exportConfig: {
    sheetName: '预算执行统计报表-导出',
    type: 'xlsx',
    filename: '预算执行统计报表-导出',
    useStyle: true,
    sheetMethod: (params: any) => formatExportTreeSheet(params)
  }
})

const getExportHeaderRowCount = (options: any, colgroups: any[]) => {
  if (options?.isHeader === false) return 0
  if (options?.isColgroup && Array.isArray(colgroups) && colgroups.length > 0) return colgroups.length
  return 1
}

const getExportTreeColumnIndex = (columns: any[] = []) => {
  const treeColumnIndex = columns.findIndex((column) => column?.treeNode || column?.field === 'name')
  return treeColumnIndex > -1 ? treeColumnIndex + 1 : 1
}

const getDefaultExportBorder = () => ({
  top: {
    style: 'thin',
    color: {
      argba: 'FFFF0000'
    }
  },
  left: {
    style: 'thin',
    color: {
      argba: 'FFFF0000'
    }
  },
  bottom: {
    style: 'thin',
    color: {
      argba: 'FFFF0000'
    }
  },
  right: {
    style: 'thin',
    color: {
      argba: 'FFFF0000'
    }
  }
})

const formatExportTreeSheet = ({ options, worksheet, columns, colgroups, datas }: any) => {
  const exportRows = Array.isArray(datas) ? datas : []
  const exportColumns = getExportLeafColumns(Array.isArray(columns) && columns.length !== 0 ? columns : ((gridOptions.columns || []) as any[]))
  const dataStartRowNumber = getExportHeaderRowCount(options, colgroups) + 1
  const treeColumn = worksheet.getColumn(getExportTreeColumnIndex(columns))
  treeColumn.eachCell({ includeEmpty: false }, (cell: any, rowNumber: number) => {
    if (rowNumber < dataStartRowNumber) return
    const rowData = exportRows[rowNumber - dataStartRowNumber]
    if (!rowData) return
    const level = Number(rowData._level || 0)
    if (level > 0) {
      const sourceRow = rowData._row || rowData
      cell.value = `${'    '.repeat(level)}${sourceRow.name ?? cell.value ?? ''}`
    }
  })
  worksheet.eachRow((row: any, rowNumber: number) => {
    const rowData = rowNumber >= dataStartRowNumber ? exportRows[rowNumber - dataStartRowNumber] : null
    row.eachCell((cell: any, cellNumber: number) => {
      if (rowData) {
        applyExportNumberCell(cell, rowData._row || rowData, exportColumns[cellNumber - 1])
      }
      if (rowData && Number(rowData._level || 0) === 0) {
        cell.font = {
          ...cell.font,
          bold: true
        }
      }
      cell.border = getDefaultExportBorder()
    })
  })
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleChangeXswsData = () => {
  searchDataHandle()
}

const handleRemoveTag = (value: string) => {
  formData.sjx.length = 0
}

const clearGridData = () => {
  if (Array.isArray(gridOptions.columns)) gridOptions.columns.length = 0
  else gridOptions.columns = []
  if (Array.isArray(gridOptions.data)) gridOptions.data.length = 0
  else gridOptions.data = []
}

const normalizeIndicatorOptions = (data: any): CodeData[] => {
  const sourceData = Array.isArray(data) ? data : Array.isArray(data?.indicators) ? data.indicators : Array.isArray(data?.data) ? data.data : []
  const indicatorMap = new Map<string, CodeData>()
  sourceData.forEach((item: any) => {
    if (typeof item === 'string' && item.trim()) {
      indicatorMap.set(item, {
        code: item,
        name: item
      })
      return
    }
    if (item && typeof item === 'object' && item.code) {
      indicatorMap.set(item.code, {
        code: item.code,
        name: item.name || item.code
      })
    }
  })
  return Array.from(indicatorMap.values())
}

const resetIndicatorData = () => {
  formList.YSZXYL_SJX = []
  formData.sjx = []
}

const getIndicatorData = async () => {
  const requestToken = indicatorRequestTracker.issue()
  if (!formData.busiType) {
    resetIndicatorData()
    return
  }
  try {
    const res = await getIndicatorByBusiType(formData.busiType)
    if (!indicatorRequestTracker.isLatest(requestToken)) return
    if (res.success) {
      formList.YSZXYL_SJX = normalizeIndicatorOptions(res.data)
      formData.sjx = formList.YSZXYL_SJX.map((item) => item.code)
      return
    }
    resetIndicatorData()
    ElMessage.error(res.msg)
  } catch {
    if (indicatorRequestTracker.isLatest(requestToken)) {
      resetIndicatorData()
      ElMessage.error('指标项加载失败，请稍后重试')
    }
  }
}

const getTableDataByRequest = async (requestToken?: number) => {
  gridOptions.loading = true
  try {
    gridOptions.data = await requestTableRowsByParent(year.value, {
      requestToken
    })
  } finally {
    if (!isStaleSearchRequest(requestToken)) {
      gridOptions.loading = false
    }
  }
}

const getDynamicColumnData = async (requestToken?: number): Promise<boolean> => {
  gridOptions.loading = true
  let params: Data = getFormParams()
  try {
    const res = await getDynamicColumnByDw(params)
    if (isStaleSearchRequest(requestToken)) return false
    if (res.success) {
      gridOptions.columns = decorateDynamicColumns(res.data || [], formData.xsws, formatNumValue) as any
      return true
    }
    clearGridData()
    ElMessage.error(res.msg)
    return false
  } catch {
    if (!isStaleSearchRequest(requestToken)) {
      clearGridData()
      ElMessage.error('动态列加载失败，请稍后重试')
    }
    return false
  } finally {
    if (!isStaleSearchRequest(requestToken)) {
      gridOptions.loading = false
    }
  }
}

const getFormParams = (): Data => {
  let params: Data = {
    busiType: formData.busiType,
    dwId: dwId.value,
    endDate: formData.endDate,
    startDate: formData.startDate,
    dwList: formData.dwList,
    indicators: formData.sjx.join(','),
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
  const requestToken = searchRequestTracker.issue()
  clearGridData()
  if (!formList.YSZXYL_SJX.length) {
    ElMessage.warning('当前展示维度未配置指标项，请先维护指标项关联！')
    return
  }
  if (formData.sjx && formData.sjx.length === 0) {
    ElMessage.error('指标项不能为空！')
    return
  }
  if (!formData.busiType) {
    ElMessage.error('展示维度不能为空！')
    return
  }
  await setFormData()
  if (isStaleSearchRequest(requestToken)) return
  const dynamicColumnsLoaded = await getDynamicColumnData(requestToken)
  if (!dynamicColumnsLoaded || isStaleSearchRequest(requestToken)) return
  await getTableDataByRequest(requestToken)
}

const resetDataHandle = async () => {
  await setDefaultValue()
  await getXmlbData()
  clearGridData()
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
  formData.busiType = formList.BUDUGET_EXECUTION_ANALYSIS[0]?.code || ''
  await getIndicatorData()
  formData.xmlbIds = ''
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
    $table.exportData(gridOptions.exportConfig)
  }
}

const handleBusiTypeChange = async () => {
  formData.xmlbIds = ''
  clearGridData()
  await Promise.all([getIndicatorData(), getXmlbData()])
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
  let codes = ['XSWS', 'ZKCJ', 'BUDUGET_EXECUTION_ANALYSIS']
  try {
    const res = await getPublicCodeList({ codes })
    if (res.success && res.data) {
      formList.XSWS = res.data['XSWS']
      formList.ZKCJ = res.data['ZKCJ'] || []
      formList.BUDUGET_EXECUTION_ANALYSIS = res.data['BUDUGET_EXECUTION_ANALYSIS'] || []
      return
    }
    ElMessage.error(res.msg)
  } catch {
    ElMessage.error('公共代码加载失败，请稍后重试')
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
  const requestToken = xmlbRequestTracker.issue()
  if (!formData.busiType) {
    selectData.xmlbData = []
    return
  }
  try {
    let res = await getNodeTree(formData.busiType, year.value)
    if (!xmlbRequestTracker.isLatest(requestToken)) return
    if (res.success && res.data) {
      selectData.xmlbData = res.data
      return
    }
    selectData.xmlbData = []
    ElMessage.error(res.msg)
  } catch {
    if (xmlbRequestTracker.isLatest(requestToken)) {
      selectData.xmlbData = []
      ElMessage.error('项目类别加载失败，请稍后重试')
    }
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
  (newVal, oldVal) => {
    if (newVal) {
      const startDate = new Date(newVal)
      const nextYear = startDate.getFullYear().toString()
      const yearChanged = year.value !== nextYear
      year.value = nextYear
      if (formData.endDate) {
        const endDate = new Date(formData.endDate)
        if (endDate.getFullYear() !== startDate.getFullYear() || endDate.getMonth() < startDate.getMonth()) {
          formData.endDate = startDate.getFullYear() + '-12'
        }
      }
      if (oldVal && yearChanged) {
        formData.xmlbIds = ''
        clearGridData()
        getXmlbData()
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
    font-size: 16px;
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

:deep(.el-date-editor) {
  width: 100%;
}
</style>
