<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-dropdown @command="expandByLevelHandle">
          <el-button :loading="gridOptions.loading" v-permission="'EXPAND'" style="margin-right: 10px" size="mini" plain type="primary"
            >一键展开 <i class="el-icon-arrow-down el-icon--right"
          /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in formList.ZKCJ" :key="item.code" :command="item.code">{{ item.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" size="mini" plain type="primary" @click="exportDataHandle">导 出</el-button>
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
            <el-form-item prop="sjx">
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
            <el-form-item prop="ysnd">
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算年度` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-date-picker v-model="formData.ysnd" value-format="YYYY" format="YYYY" type="year" @change="changeYsndData"></el-date-picker>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="saveDate">
              <template #label>
                <el-space :size="4">
                  <span>{{ `归档时间` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-date-picker :clearable="false" v-model="formData.saveDate" value-format="YYYY-MM" format="YYYY-MM" type="month"></el-date-picker>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="xmlbIds">
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <XmlbSelect ref="xmlbRef" class="form-select" :tree-data="selectData.xmlbData" v-model="formData.xmlbIds"></XmlbSelect>
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
              <el-button type="primary" plain size="mini" :loading="gridOptions.loading" @click="searchDataHandle">查 询</el-button>
              <el-button plain size="mini" :loading="gridOptions.loading" @click="resetDataHandle">重 置</el-button>
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
  name: '/statistics/budgetExecutionAnalysis/customYapProjectExecutionByType'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import DwSelect from '@/views/fy/standardCost/components/DwSelect.vue'
import XmlbSelect from '@/views/statistics/components/XmlbSelect.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { getProTypeTreeNode } from '@/api/process'
import { ElMessage } from 'element-plus'
import { getIndicatorByBusiType, getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { getDynamicColumnByDw, getProYapMbzData, ProYapMbaSearch } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { applyExportNumberCell, createLatestRequestTracker, getExportLeafColumns } from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'

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
  ysnd: string
  saveDate: string
  protype: string[]
  xmlbIds: string
  dwList: []
}

interface Column {
  canBeCt: boolean
  children: Column[]
  edit: boolean
  field?: string
  fixed?: string
  needFormat: boolean
  title: string
  visible: boolean
  width: number
}

const flatColumns = reactive<Column[]>([])

const selectData = reactive<{
  projectType: any
  xmlbData: any
}>({
  projectType: [],
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

const searchGridRef = ref()
const userDialogRef = ref()
const helpModalRef = ref()
const dwSelectRef = ref()
const xmlbRef = ref()
const dwId = ref<string>('')
const dwName = ref<string>('')
const year = ref('')

const formData = reactive<FormData>({
  sjx: ['MBZ', 'DFJ', 'LXZ', 'WCZ', 'WCL'],
  xsws: '',
  jedw: '',
  xsfs: '',
  busiType: '',
  ysnd: '',
  saveDate: '',
  protype: [],
  xmlbIds: '',
  dwList: []
})

const gridRef = ref()
const isExpanding = ref(false)
const EXPAND_YIELD_INTERVAL = 40
const EXPAND_PRELOAD_CONCURRENCY = 4
const expandTaskId = ref(0)
const indicatorRequestTracker = createLatestRequestTracker()
const xmlbRequestTracker = createLatestRequestTracker()
const FIXED_LEAF_COLUMN_COUNT = 2

const isExpandTaskCanceled = (taskId: number) => taskId !== expandTaskId.value

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
    sheetName: '自定义预安排项目执行分析（按类型）-导出',
    type: 'xlsx',
    filename: '自定义预安排项目执行分析（按类型）-导出',
    useStyle: true,
    sheetMethod: (params: any) => formatExportTreeSheet(params)
  }
})

const changeYsndData = (val: string) => {
  if (val) year.value = formData.ysnd
  else formData.ysnd = ''
  getXmlbData(val)
}

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
  gridOptions.data = []
  gridOptions.columns = []
}

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
  const params: ProYapMbaSearch = {
    ...getFormParams(),
    parentId
  }
  try {
    const res = await getProYapMbzData(params)
    if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
    if (res.success) {
      return mapTableRows(res.data || [])
    }
    if (showError) {
      ElMessage.error(res.msg)
    }
    return []
  } catch {
    if (showError && (typeof taskId !== 'number' || !isExpandTaskCanceled(taskId))) {
      ElMessage.error('表格数据加载失败，请稍后重试')
    }
    return []
  }
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

const getTableData = async () => {
  gridOptions.loading = true
  try {
    gridOptions.data = await requestTableRowsByParent('-1')
  } finally {
    gridOptions.loading = false
  }
}

// 动态列修改
const isVisibleLeafColumn = (column: Column) => (!Array.isArray(column.children) || column.children.length === 0) && column.visible !== false

const applyFixedByLeafIndex = (column: Column, state: { leafColumnIndex: number }) => {
  delete column.fixed
  if (!isVisibleLeafColumn(column)) return

  state.leafColumnIndex += 1
  if (state.leafColumnIndex <= FIXED_LEAF_COLUMN_COUNT) {
    column.fixed = 'left'
  }
}

const editDynamicColumnData = async <T extends VxeGridPropTypes.Columns & Column[]>(data: T, state = { leafColumnIndex: 0 }) => {
  for (const item of data) {
    flatColumns.push(item)
    if (item.children && item.children.length !== 0) {
      await editDynamicColumnData(item.children, state)
    }
    item.headerAlign = 'center'
    if (item.field === 'name') {
      item.align = 'left'
      item.treeNode = true
    } else if (item.field) {
      const fields = ['gkbm', 'ysly', 'cnxm', 'cnxmms']
      if (item.field === 'subName') {
        item.align = 'left'
      } else if (fields.includes(item.field)) {
        item.align = 'center'
      } else if (item.field.includes('JYL')) {
        item.formatter = ({ cellValue }: any) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString())
        }
      } else if (item.field.includes('WCL')) {
        item.formatter = ({ cellValue }: any) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 2)
        }
      } else {
        item.formatter = ({ cellValue }: any) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), Number(formData.xsws.split('_')[1]))
        }
        item.align = 'right'
      }
    }
    applyFixedByLeafIndex(item, state)
  }
}

const getDynamicColumnData = async () => {
  gridOptions.loading = true
  let params: ProYapMbaSearch = getFormParams()
  const res = await getDynamicColumnByDw(params)
  if (res.success) {
    try {
      await editDynamicColumnData(res.data)
    } catch (error) {
      console.error('发生错误', error)
    } finally {
      gridOptions.columns = res.data
      gridOptions.loading = false
    }
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getFormParams = (): ProYapMbaSearch => {
  return {
    busiType: formData.busiType,
    dwId: dwId.value,
    saveDate: formData.saveDate,
    ysnd: formData.ysnd,
    dwList: formData.dwList,
    indicators: formData.sjx.join(','),
    parentId: '-1',
    xmlbIds: formData.xmlbIds
  }
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
  clearGridData()
  if (!formList.YSZXYL_SJX.length) {
    ElMessage.warning('当前展示维度未配置指标项，请先维护指标项关联！')
    return
  }
  if (!formData.busiType) {
    ElMessage.error('展示维度不能为空！')
    return
  }
  if (formData.sjx && formData.sjx.length === 0) {
    ElMessage.error('指标项不能为空！')
    return
  }
  await setFormData()
  await getDynamicColumnData()
  await getTableData()
}

const resetDataHandle = async () => {
  await setDefaultValue()
  await getXmlbData()
  await getDynamicColumnData()
  await getTableData()
}

const setDefaultValue = async () => {
  const now = new Date()
  year.value = now.getFullYear().toString()
  formData.ysnd = ''
  // 设置默认值
  formData.saveDate = year.value + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    $dwSelect.clearHandle()
  }
  formData.xsws = 'XSWS_4'
  formData.jedw = 'JEDW_WY'
  formData.xsfs = '0'
  formData.busiType = formList.BUDUGET_EXECUTION_ANALYSIS[0]?.code || ''
  await getIndicatorData()
  formData.xmlbIds = ''
  formData.dwList.length = 0
}

const exportDataHandle = () => {
  const $table = gridRef.value
  if ($table) {
    $table.exportData(gridOptions.exportConfig)
  }
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

    const rootRows = await requestTableRowsByParent('-1', { taskId })
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

// 获取项目类型
const getProjectData = () => {
  let newYear: string = year.value ? year.value : new Date().getFullYear().toString()
  const params = {
    parentId: '-1',
    ysnd: newYear
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      selectData.projectType = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const getPublicCode = async () => {
  let codes = ['XSWS', 'ZKCJ', 'BUDUGET_EXECUTION_ANALYSIS']
  const res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    formList.XSWS = res.data['XSWS']
    formList.ZKCJ = res.data['ZKCJ'] || []
    formList.BUDUGET_EXECUTION_ANALYSIS = res.data['BUDUGET_EXECUTION_ANALYSIS'] || []
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  dwId.value = userDialogRef.value.userMsg.org_id
  dwName.value = userDialogRef.value.userMsg.org_name

  if (isQuery) {
    pageInfo.isShowPage = true
    await searchDataHandle()
  }
}

const getXmlbData = async (val?: string) => {
  if (xmlbRef.value) xmlbRef.value.clearHandle()
  const requestToken = xmlbRequestTracker.issue()
  if (!formData.busiType) {
    selectData.xmlbData = []
    return
  }
  const nd = val ? val : year.value
  try {
    const res = await getNodeTree(formData.busiType, nd)
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

const handleBusiTypeChange = async () => {
  formData.xmlbIds = ''
  clearGridData()
  await Promise.all([getIndicatorData(), getXmlbData()])
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
  () => year.value,
  () => {
    getProjectData()
  },
  {
    immediate: true
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
      width: 180px;
      line-height: 40px;
      height: 100%;
      min-width: 0;
      min-height: 0;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: space-between;
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
