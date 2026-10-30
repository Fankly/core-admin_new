<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-dropdown @command="expandByLevelHandle">
          <el-button :loading="gridOptions.loading" v-permission="'EXPAND'" style="margin-right: 10px" size="small" plain type="primary"
            >一键展开 <i class="el-icon-arrow-down el-icon--right"
          /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in formList.ZKCJ" :key="item.code" :command="item.code">{{ item.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-permission="'EXPORT'" size="small" plain type="primary" @click="exportDataHandle">导 出</el-button>
        <el-button v-permission="'TB'" size="small" plain type="primary" @click="handleTbhb('1')">同 比</el-button>
        <el-button v-permission="'HB'" size="small" plain type="primary" @click="handleTbhb('2')">环 比</el-button>
        <el-button v-permission="'VIEWREPORT'" size="small" plain type="primary" @click="viewReportHandle">查看分析报告</el-button>
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
          <GridItem>
            <el-form-item style="text-align: right">
              <el-button type="primary" plain size="small" :loading="gridOptions.loading" @click="searchDataHandle">查 询</el-button>
              <el-button plain size="small" :loading="gridOptions.loading" @click="resetDataHandle">重 置</el-button>
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
import { getParamValueMulti, getPublicCodeList } from '@/api/common'
import { getProTypeTreeNode } from '@/api/process'
import { ElMessage } from 'element-plus'
import { getIndicatorByBusiType, getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { getDynamicColumnByDw, getProYapMbzData, ProYapMbaSearch } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import YszxylbTbhbModal from '@/views/statistics/components/YszxylbTbhbModal/index.vue'
import FxbgModal from '@/views/statistics/components/FxbgModal/index.vue'
import { getYapFxbg } from '@/api/statistics/yszxfxbg'
import { applyFormulaHeaderTooltips } from '@/views/statistics/components/formulaHeader'
import type { BudgetExecutionFormulaContext } from '@/views/statistics/budgetExecutionAnalysis/indicatorFormula'
import { createLatestRequestTracker, fitNumericColumnWidths } from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'
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
  busiType: string
  ysnd: string
  saveDate: string
  protype: string[]
  xmlbIds: string
  kxpzLists: string[]
  dwList: ProYapMbaSearch['dwList']
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
  YSZXFX_KX_COLUMN: CodeData[]
}>({
  YSZXYL_SJX: [],
  XSWS: [],
  ZKCJ: [],
  BUDUGET_EXECUTION_ANALYSIS: [],
  YSZXFX_KX_COLUMN: []
})

const searchGridRef = ref()
const userDialogRef = ref()
const helpModalRef = ref()
const tbhbModalRef = ref()
const fxbgModalRef = ref()
const dwSelectRef = ref()
const xmlbRef = ref()
const dwId = ref<string>('')
const dwName = ref<string>('')
const year = ref('')

type TbhbSearchType = '1' | '2'

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
  kxpzLists: [],
  dwList: []
})

const gridRef = ref()
const exportFormulaContext = ref<BudgetExecutionFormulaContext>()
const isExpanding = ref(false)
const EXPAND_YIELD_INTERVAL = 40
const EXPAND_PRELOAD_CONCURRENCY = 4
const expandTaskId = ref(0)
const indicatorRequestTracker = createLatestRequestTracker()
const xmlbRequestTracker = createLatestRequestTracker()
const searchRequestTracker = createLatestRequestTracker()
let activeSearchToken = 0
let tableQueryParams: ProYapMbaSearch | undefined
const FIXED_LEAF_COLUMN_COUNT = 2
// 展示维度默认值：优先取参数配置，缺省回落 YSZXYL_YAP
const DEFAULT_BUSI_TYPE_PARAM_KEY = 'YSZXYL_YAP_DEFAULT_BUSI_TYPE'
const DEFAULT_BUSI_TYPE = 'YSZXYL_YAP'

const isExpandTaskCanceled = (taskId: number) => taskId !== expandTaskId.value
const isStaleSearchRequest = (token: number) => !searchRequestTracker.isLatest(token)

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
    sheetName: '自定义预安排项目执行分析（按类型）-导出',
    type: 'xlsx',
    filename: '自定义预安排项目执行分析（按类型）-导出',
    useStyle: true
  }
})

const changeYsndData = (val: string) => {
  if (val) year.value = formData.ysnd
  else formData.ysnd = ''
  getXmlbData(val)
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
  activeSearchToken = searchRequestTracker.issue()
  expandTaskId.value += 1
  isExpanding.value = false
  tableQueryParams = undefined
  exportFormulaContext.value = undefined
  gridOptions.loading = false
  gridOptions.data = []
  gridOptions.columns = []
  return activeSearchToken
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
    requestToken?: number
  } = {}
): Promise<any[]> => {
  const { showError = true, taskId, requestToken = activeSearchToken } = options
  if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
  if (isStaleSearchRequest(requestToken) || !tableQueryParams) return []
  const params: ProYapMbaSearch = {
    ...tableQueryParams,
    parentId
  }
  try {
    const res = await getProYapMbzData(params)
    if (isStaleSearchRequest(requestToken)) return []
    if (typeof taskId === 'number' && isExpandTaskCanceled(taskId)) return []
    if (res.success) {
      return mapTableRows(res.data || [])
    }
    if (showError) {
      ElMessage.error(res.msg)
    }
    return []
  } catch {
    if (showError && !isStaleSearchRequest(requestToken) && (typeof taskId !== 'number' || !isExpandTaskCanceled(taskId))) {
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

const getTableData = async (requestToken: number) => {
  gridOptions.loading = true
  try {
    const rows = await requestTableRowsByParent('-1', { requestToken })
    if (!isStaleSearchRequest(requestToken)) {
      gridOptions.columns = fitNumericColumnWidths(gridOptions.columns as any[], rows, gridRef.value?.$el)
      gridOptions.data = rows
    }
  } finally {
    if (!isStaleSearchRequest(requestToken)) gridOptions.loading = false
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

const getDynamicColumnData = async (params: ProYapMbaSearch, requestToken: number): Promise<boolean> => {
  exportFormulaContext.value = undefined
  gridOptions.loading = true
  try {
    const [res, context] = await Promise.all([getDynamicColumnByDw(params), loadBudgetExecutionFormulaContext('yap', params.dwId, params.dwList)])
    if (isStaleSearchRequest(requestToken)) return false
    if (res.success) {
      await editDynamicColumnData(res.data)
      if (isStaleSearchRequest(requestToken)) return false
      gridOptions.columns = res.data
      applyFormulaHeaderTooltips(gridOptions.columns || [])
      exportFormulaContext.value = context
      return true
    }
    ElMessage.error(res.msg)
  } catch (error) {
    if (!isStaleSearchRequest(requestToken)) {
      ElMessage.error(error instanceof Error ? error.message : '动态列加载失败，请稍后重试')
    }
  } finally {
    if (!isStaleSearchRequest(requestToken)) gridOptions.loading = false
  }
  return false
}

const getFormParams = (): ProYapMbaSearch => {
  return {
    busiType: formData.busiType,
    dwId: dwId.value,
    saveDate: formData.saveDate,
    ysnd: formData.ysnd,
    dwList: formData.dwList.map((item) => ({ ...item })),
    indicators: formData.sjx.join(','),
    kxpzLists: [...formData.kxpzLists],
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
  const requestToken = clearGridData()
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
  if (isStaleSearchRequest(requestToken)) return
  const params = getFormParams()
  tableQueryParams = params
  if (!(await getDynamicColumnData(params, requestToken)) || isStaleSearchRequest(requestToken)) return
  await getTableData(requestToken)
}

const resetDataHandle = async () => {
  const requestToken = clearGridData()
  await setDefaultValue()
  await getXmlbData()
  if (isStaleSearchRequest(requestToken)) return
  const params = getFormParams()
  tableQueryParams = params
  if (!(await getDynamicColumnData(params, requestToken)) || isStaleSearchRequest(requestToken)) return
  await getTableData(requestToken)
}

const setDefaultValue = async () => {
  const now = new Date()
  year.value = now.getFullYear().toString()
  formData.ysnd = year.value
  // 设置默认值
  formData.saveDate = year.value + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
  const $dwSelect = dwSelectRef.value
  if ($dwSelect) {
    $dwSelect.clearHandle()
  }
  formData.xsws = 'XSWS_4'
  formData.jedw = 'JEDW_WY'
  formData.xsfs = '0'
  formData.busiType = await resolveDefaultBusiType()
  await getIndicatorData()
  formData.xmlbIds = ''
  formData.kxpzLists = formList.YSZXFX_KX_COLUMN.filter((item) => String(item.note) === '1').map((item) => String(item.code))
  formData.dwList.length = 0
}

// 展示维度默认值：优先取参数配置，缺省回落 YSZXYL_YAP；
// 若最终值不在可选项中，则兜底取第一项，避免下拉无法回显
const resolveDefaultBusiType = async (): Promise<string> => {
  const options = formList.BUDUGET_EXECUTION_ANALYSIS
  let defaultCode = DEFAULT_BUSI_TYPE
  try {
    const res = await getParamValueMulti([DEFAULT_BUSI_TYPE_PARAM_KEY])
    const paramVal = res.success && res.data ? res.data[DEFAULT_BUSI_TYPE_PARAM_KEY] : ''
    if (paramVal) defaultCode = paramVal
  } catch {
    // 参数接口异常时回落 YSZXYL_YAP，不阻断默认值设置
  }
  if (options.some((item) => item.code === defaultCode)) return defaultCode
  return options[0]?.code || defaultCode
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
    // XLSX 插件延迟生成文件，必须捕获本次口径，避免后续查询修改 ref。
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
  if (!formData.ysnd) {
    ElMessage.error('预算年度不能为空！')
    return
  }
  await setFormData()
  const title = searchType === '1' ? '同比分析' : '环比分析'
  tbhbModalRef.value?.open({
    title,
    params: { ...getFormParams(), searchType },
    dataSource: 'yap',
    xsws: formData.xsws,
    exportName: `自定义预安排项目执行分析（按类型）-${title}`
  })
}

// 查看分析报告
const viewReportHandle = () => {
  if (gridOptions.loading) return
  fxbgModalRef.value?.open(
    {
      busiType: formData.busiType,
      saveDate: formData.saveDate,
      ysnd: formData.ysnd
    },
    getYapFxbg
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
  let codes = ['XSWS', 'ZKCJ', 'BUDUGET_EXECUTION_ANALYSIS', 'YSZXFX_KX_COLUMN']
  const res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    formList.XSWS = res.data['XSWS']
    formList.ZKCJ = res.data['ZKCJ'] || []
    formList.BUDUGET_EXECUTION_ANALYSIS = res.data['BUDUGET_EXECUTION_ANALYSIS'] || []
    formList.YSZXFX_KX_COLUMN = res.data['YSZXFX_KX_COLUMN'] || []
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
