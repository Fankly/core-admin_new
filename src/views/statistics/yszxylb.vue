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
import { VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { ElMessage } from 'element-plus'
import { getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { Data, getDataListByDw, getDynamicColumnByDw } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

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
  startDate: string
  endDate: string
  protype: string[]
  xmlbIds: string
  dwList: []
}

interface Column {
  canBeCt: boolean
  children: Column[]
  edit: boolean
  field: string
  needFormat: boolean
  title: string
  visible: boolean
  width: number
}

const flatColumns = reactive<Column[]>([])

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
}>({
  YSZXYL_SJX: [],
  XSWS: [],
  ZKCJ: []
})

const userDialogRef = ref()
const helpModalRef = ref()
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
  dwList: []
})

const gridRef = ref()
const isExpanding = ref(false)
const EXPAND_YIELD_INTERVAL = 40
const EXPAND_PRELOAD_CONCURRENCY = 4
const expandTaskId = ref(0)

const isExpandTaskCanceled = (taskId: number) => taskId !== expandTaskId.value

const exportTextFields = new Set(['name', 'id', 'parentId'])

const getExportLeafColumns = (columns: any[] = []): any[] => {
  return columns.reduce((acc: any[], column: any) => {
    if (!column) return acc
    if (Array.isArray(column.children) && column.children.length !== 0) {
      acc.push(...getExportLeafColumns(column.children))
    } else {
      acc.push(column)
    }
    return acc
  }, [])
}

const getExportDataStartRowNumber = (options: any, colgroups: any[]) => {
  if (options?.isHeader === false) return 1
  if (options?.isColgroup && Array.isArray(colgroups) && colgroups.length !== 0) return colgroups.length + 1
  return 3
}

const isExportTextField = (field: any) => {
  const fieldName = String(field || '')
  if (!fieldName) return true
  if (exportTextFields.has(fieldName)) return true
  return /(code|id|name|type)$/i.test(fieldName)
}

const parseExportNumber = (value: any) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value.replace(/,/g, '').trim()
  if (!text || text === '-') return null
  if (!/^-?(?:\d+|\d*\.\d+)$/.test(text)) return null
  const numberValue = Number(text)
  return Number.isFinite(numberValue) ? numberValue : null
}

const getExportNumberFormat = (value: any) => {
  const text = String(value ?? '')
    .replace(/,/g, '')
    .trim()
  const decimalPart = text.includes('.') ? text.split('.')[1] : ''
  return decimalPart ? `0.${'0'.repeat(decimalPart.length)}` : '0'
}

const applyExportNumberCell = (cell: any, rowData: any, column: any) => {
  const field = column?.field
  if (isExportTextField(field)) return
  const exportValue = cell.value
  const sourceValue = field && Object.prototype.hasOwnProperty.call(rowData, field) ? rowData[field] : cell.value
  const sourceNumberValue = parseExportNumber(sourceValue)
  const numberValue = parseExportNumber(exportValue) ?? sourceNumberValue
  if (numberValue === null) return
  cell.value = numberValue
  cell.numFmt = getExportNumberFormat(sourceNumberValue === null ? exportValue : sourceValue)
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
    sheetMethod: function ({ options, worksheet, columns, colgroups }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      const exportColumns = getExportLeafColumns(Array.isArray(columns) && columns.length !== 0 ? columns : ((gridOptions.columns || []) as any[]))
      const dataStartRowNumber = getExportDataStartRowNumber(options, colgroups)
      getExportData(newArr, gridOptions.data as any, 1)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cellNumber < dataStartRowNumber) return
        const rowData = newArr[cellNumber - dataStartRowNumber]
        if (!rowData) return
        if (rowData.cj > 1) {
          cell.value = '    '.repeat(rowData.cj - 1) + rowData.name
        }
      })
      worksheet.eachRow((row: any, rowNumber: any) => {
        const rowData = rowNumber >= dataStartRowNumber ? newArr[rowNumber - dataStartRowNumber] : null
        row.eachCell((cell: any, cellNumber: any) => {
          if (rowData) {
            applyExportNumberCell(cell, rowData.row, exportColumns[cellNumber - 1])
          }
          if (typeof cell.value === 'number') {
            const xsws = Number(formData.xsws.split('_')[1])
            cell.numFmt = xsws > 0 ? `#,##0.${'0'.repeat(xsws)}` : '#,##0'
          }
          if (rowData && rowData.cj === 1) {
            cell.font = {
              ...cell.font,
              bold: true
            }
          }
          cell.border = {
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
          }
        })
      })
    }
  }
})

const getExportData = (newArr: any[], data: any[], cj: number) => {
  const $table = gridRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item.name,
      cj: cj,
      row: item
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1)
    }
  })
  return newArr
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleChangeXswsData = () => {
  searchDataHandle()
}

const getTableData = async () => {
  gridOptions.loading = true
  try {
    gridOptions.data = await requestTableRowsByParent(year.value)
  } finally {
    gridOptions.loading = false
  }
}

// 动态列修改
const editDynamicColumnData = <T extends VxeGridPropTypes.Columns & Column[]>(data: T) => {
  for (const item of data) {
    flatColumns.push(item)
    if (item.children && item.children.length !== 0) {
      editDynamicColumnData(item.children)
    }
    item.headerAlign = 'center'
    if (item.field === 'name') {
      item.align = 'left'
      item.fixed = 'left'
      item.treeNode = true
    } else {
      if (item.field.includes('JYL')) {
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
      }
      item.align = 'right'
    }
  }
}

const getDynamicColumnData = async () => {
  gridOptions.loading = true
  let params: Data = getFormParams()
  const res = await getDynamicColumnByDw(params)
  if (res.success) {
    try {
      editDynamicColumnData(res.data)
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

const getFormParams = (): Data => {
  let params: Data = {
    busiType: busiType.value,
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
  if (gridOptions.data) gridOptions.data.length = 0
  if (gridOptions.columns) gridOptions.columns.length = 0
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
  // await getDynamicColumnData()
  // await getTableData()
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
  let codes = ['YSSX_ZBX', 'XSWS', 'ZKCJ']
  const res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    formList.YSZXYL_SJX = res.data['YSSX_ZBX']
    formList.XSWS = res.data['XSWS']
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
