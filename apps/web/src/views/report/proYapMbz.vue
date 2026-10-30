<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPAND'" size="small" plain type="primary" @click="expandHandle">一键展开</el-button>
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" size="small" plain type="primary" @click="exportDataHandle">导 出</el-button>
        <el-button :loading="gridOptions.loading" v-permission="'TB'" size="small" plain type="primary" @click="handleTbhb('1')">同 比</el-button>
        <el-button :loading="gridOptions.loading" v-permission="'HB'" size="small" plain type="primary" @click="handleTbhb('2')">环 比</el-button>
        <el-button :loading="gridOptions.loading" v-permission="'VIEWREPORT'" size="small" plain type="primary" @click="viewReportHandle"
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
        <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
          <GridItem>
            <el-form-item prop="sjx">
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
          <GridItem></GridItem>
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
  name: '/report/proYapMbz'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import DwSelect from '@/views/fy/standardCost/components/DwSelect.vue'
import XmlbSelect from '@/views/statistics/components/XmlbSelect.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { onMounted, reactive, ref, watch } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { getProTypeTreeNode } from '@/api/process'
import { ElMessage } from 'element-plus'
import { getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { getDynamicColumnByDw, getProYapMbzData } from '@/api/statistics/ydxcylb'
import type { ProYapMbaSearch } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import YszxylbTbhbModal from '@/views/statistics/components/YszxylbTbhbModal/index.vue'
import FxbgModal from '@/views/statistics/components/FxbgModal/index.vue'
import { getYapFxbg } from '@/api/statistics/yszxfxbg'
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
  ysnd: string
  saveDate: string
  protype: string[]
  xmlbIds: string
  kxpzLists: string[]
  dwList: ProYapMbaSearch['dwList']
}

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
  YSZXFX_KX_COLUMN: CodeData[]
}>({
  YSZXYL_SJX: [],
  YSZXFX_KX_COLUMN: [],
  XSWS: []
})

const userDialogRef = ref()
const helpModalRef = ref()
const tbhbModalRef = ref()
const fxbgModalRef = ref()
const dwSelectRef = ref()
const xmlbRef = ref()
const dwId = ref<string>('')
const dwName = ref<string>('')
const year = ref('')
const busiType = ref('YSZXYL_YAP')

type TbhbSearchType = '1' | '2'

const formData = reactive<FormData>({
  sjx: ['MBZ', 'DFJ', 'LXZ', 'WCZ', 'WCL'],
  xsws: '',
  jedw: '',
  xsfs: '',
  ysnd: '',
  saveDate: '',
  protype: [],
  xmlbIds: '',
  kxpzLists: [],
  dwList: []
})

const gridRef = ref()
const exportFormulaContext = ref<BudgetExecutionFormulaContext>()

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  stripe: true,
  columnConfig: {
    resizable: true
  },
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod: ({ row }: any) => {
      return new Promise((resolve: any) => {
        gridOptions.loading = true
        let params: ProYapMbaSearch = getFormParams()
        params.parentId = row.id
        getProYapMbzData(params).then((res: any) => {
          if (res.success) {
            gridOptions.loading = false
            const data = res.data.map((item: any) => {
              let values = {
                ...item
              }
              values.leaf = item.leaf === '0'
              return {
                ...values
              }
            })
            resolve(data)
          } else {
            gridOptions.loading = false
            ElMessage.error(res.msg)
            resolve([])
          }
        })
      })
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
    sheetName: '项目预安排目标值-导出',
    type: 'xlsx',
    filename: '项目预安排目标值-导出',
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

const getTableData = async () => {
  gridOptions.loading = true
  let params: ProYapMbaSearch = getFormParams()
  const res = await getProYapMbzData(params)
  if (res.success) {
    gridOptions.columns = fitNumericColumnWidths(gridOptions.columns as any[], res.data, gridRef.value?.$el)
    gridOptions.data = res.data.map((item: any) => {
      let values = {
        ...item
      }
      values.leaf = item.leaf === '0'
      return {
        ...values
      }
    })

    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getDynamicColumnData = async (): Promise<boolean> => {
  gridOptions.loading = true
  exportFormulaContext.value = undefined
  const params = getFormParams()
  try {
    const [res, context] = await Promise.all([getDynamicColumnByDw(params), loadBudgetExecutionFormulaContext('yap', params.dwId, params.dwList)])
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

const getFormParams = (): ProYapMbaSearch => {
  return {
    busiType: busiType.value,
    dwId: dwId.value,
    saveDate: formData.saveDate,
    ysnd: formData.ysnd,
    dwList: formData.dwList,
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
  if (!(await getDynamicColumnData())) return
  await getTableData()
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
  formData.sjx = formList.YSZXYL_SJX.map((item: any) => item.code)
  formData.xmlbIds = ''
  formData.kxpzLists = formList.YSZXFX_KX_COLUMN.filter((item) => String(item.note) === '1').map((item) => String(item.code))
  formData.dwList.length = 0
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
    exportName: `项目预安排目标值-${title}`
  })
}

// 查看分析报告
const viewReportHandle = () => {
  if (gridOptions.loading) return
  fxbgModalRef.value?.open(
    {
      busiType: busiType.value,
      saveDate: formData.saveDate,
      ysnd: formData.ysnd
    },
    getYapFxbg
  )
}

// 展开
const expandHandle = async () => {
  const $table = gridRef.value
  if ($table) {
    await expandAllTree(gridOptions.data as any[], $table)
  }
}

const expandAllTree = async (data: any[], $table: any) => {
  for (const row of data) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        await expandAllTree(row.children, $table)
      }
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
  let codes = ['YAP_MBZ_INDICATOR', 'XSWS', 'YSZXFX_KX_COLUMN']
  const res = await getPublicCodeList({ codes })
  if (res.success && res.data) {
    formList.YSZXYL_SJX = res.data['YAP_MBZ_INDICATOR']
    formList.XSWS = res.data['XSWS']
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
  const nd = val ? val : year.value
  let res = await getNodeTree(busiType.value, nd)
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
    font-size: 14px;
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    min-width: 0;
    height: auto;
    min-height: 37px;
    margin-bottom: 10px;
    overflow: visible;

    .left {
      display: flex;
      flex: 1 1 280px;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;

      :deep(.el-button + .el-button) {
        margin-left: 0;
      }
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
