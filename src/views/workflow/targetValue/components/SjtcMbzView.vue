<template>
  <div v-loading="loading" class="target-value-sjtc" element-loading-text="正在加载..." element-loading-background="rgba(255, 255, 255, 0.72)">
    <div class="target-value-sjtc__operation">
      <div class="target-value-sjtc__actions">
        <el-button type="primary" plain size="mini" @click="emitNotify">知道了</el-button>
        <el-button type="primary" plain size="mini" @click="emitClose">关闭</el-button>
      </div>
      <div class="target-value-sjtc__meta">
        <div class="target-value-sjtc__item">
          <dt>版本编号:</dt>
          <dd>{{ versionInfo.versionNo }}</dd>
        </div>
        <div class="target-value-sjtc__item">
          <dt>版本名称:</dt>
          <dd>{{ versionInfo.versionName }}</dd>
        </div>
        <div class="target-value-sjtc__item">
          <dt>年度:</dt>
          <dd>{{ versionInfo.nd }}</dd>
        </div>
        <div class="target-value-sjtc__item">
          <dt>单位:</dt>
          <dd>万元</dd>
        </div>
      </div>
    </div>
    <el-tabs v-model="activeTab" class="target-value-sjtc__tabs">
      <el-tab-pane v-for="tab in maintainTabs" :key="tab.value" :label="tab.label" :name="tab.value">
        <div v-if="tab.value === 'maintain'" class="target-value-sjtc__pane">
          <div class="target-value-sjtc__table">
            <div class="target-value-sjtc__panel target-value-sjtc__panel--remark">
              <el-form label-suffix="：" label-width="100px">
                <el-form-item class="target-value-sjtc__panel-item target-value-sjtc__panel-item--remark" label="调整说明">
                  <el-input :model-value="adjustRemark" disabled maxlength="500" show-word-limit :rows="3" resize="none" type="textarea" />
                </el-form-item>
              </el-form>
            </div>
            <div class="target-value-sjtc__panel target-value-sjtc__panel--filter">
              <div class="target-value-sjtc__filter-bar">
                <el-form label-suffix="：" label-width="100px" @submit.prevent>
                  <el-form-item class="target-value-sjtc__panel-item target-value-sjtc__panel-item--filter" label="数据项统计">
                    <el-checkbox-group v-model="maintainSearchForm.dataType" class="target-value-sjtc__checkbox-group" size="mini">
                      <el-checkbox v-for="item in maintainDataTypeOptions" :key="item.value" :label="item.value" class="target-value-sjtc__checkbox">
                        {{ item.label }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                </el-form>
                <div class="target-value-sjtc__query-actions">
                  <el-button type="primary" plain size="mini" @click="handleFilterQuery">查 询</el-button>
                  <el-button plain size="mini" @click="handleFilterReset">重 置</el-button>
                </div>
              </div>
            </div>
            <div class="target-value-sjtc__grid">
              <vxe-grid ref="gridRef" auto-resize :data="tableData" v-bind="gridOptions" />
            </div>
          </div>
        </div>
        <div v-else class="target-value-sjtc__pane">
          <div class="target-value-sjtc__grid">
            <vxe-grid ref="projectDetailGridRef" auto-resize :data="projectDetailVisibleData" v-bind="projectDetailGridOptions" />
          </div>
          <div class="target-value-sjtc__pager">
            <el-pagination
              :current-page="projectDetailPage.page"
              background
              align="center"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="projectDetailPage.limit"
              :total="projectDetailPage.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleProjectDetailLimitChange"
              @current-change="handleProjectDetailPageChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { getPublicData } from '@/api/common'
import { getDetailDataList, getDynamicColumn, getTzsmByVersionId, getVersionDetail } from '@/api/targetBudget/provinceTarget'
import type { IObject } from '@/types/interface'
import { formatNumValue } from '@/utils/utils'
import type {
  MaintainTab,
  MaintainTabOption,
  ProjectDetailPage,
  ProjectDetailRow,
  TargetBudgetMaintainRowVo
} from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import { transformToVxeColumns } from '@/views/targetBudget/provinceTarget/utils'
import {
  buildMaintainDataTypeOptions,
  getMaintainDefaultDataTypes,
  getMaintainMergeFields,
  getMaintainSpanMethod,
  isSummaryMaintainRow
} from '@/views/targetBudget/provinceTarget/components/hooks/targetBudgetMaintainHelpers'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { VxeGridProps, VxeTableInstance } from 'vxe-table'
import type { TargetValueWorkflowParams } from './types'

const MAINTAIN_DATA_TYPE_PUBLIC_CODE = 'SJTCMBZ_DATA_TYPE'
const DETAIL_PAGE_SIZE = 10

const props = defineProps<{
  params: TargetValueWorkflowParams
}>()

const emit = defineEmits(['close', 'notify'])

const projectDetailAdjustTypeMap: Record<string, string> = {
  '1': '新增项目预算',
  '2': '调整项目预算',
  '3': '取消项目预算',
  新增项目预算: '新增项目预算',
  调整项目预算: '调整项目预算',
  取消项目预算: '取消项目预算'
}

type ProjectDetailField = keyof ProjectDetailRow

const projectDetailFieldAliases: Record<ProjectDetailField, string[]> = {
  id: ['id', 'detailId', 'xmDetailId'],
  nd: ['nd', 'year'],
  xmmc: ['xmmc', 'projectName'],
  xmbm: ['xmbm', 'projectCode'],
  tzlx: ['tzlx', 'adjustType'],
  xmlxName: ['xmlxName', 'projectType', 'xmlx'],
  yjdwName: ['yjdwName', 'projectOrg', 'projectBelongUnit', 'xmssdw', 'ssdw'],
  ejdwName: ['ejdwName', 'secondUnitName', 'ejdw'],
  xmxzName: ['xmxzName', 'projectNature', 'xmxz'],
  jsksnd: ['jsksnd', 'buildStartYear', 'jsksnx', 'kgnd'],
  jsjsnd: ['jsjsnd', 'buildEndYear', 'jsjsnx', 'wcnd'],
  amount: ['amount', 'declareAmount', 'sbbje', 'sbje'],
  dnys: ['dnys', 'currentBudget'],
  dnysTzh: ['dnysTzh', 'adjustedCurrentBudget', 'dnystzh', 'tzhdnys'],
  tzfd: ['tzfd', 'adjustRange', 'adjustAmount'],
  kypfwh: ['kypfwh', 'feasibilityReplyNo', 'kypfwjh'],
  sfyap: ['sfyapName', 'sfyap', 'isYap'],
  remark: ['remark', 'bz']
}

const loading = ref(false)
const activeTab = ref<MaintainTab>('maintain')
const maintainTabs: MaintainTabOption[] = [
  { label: '省级统筹目标总控值', value: 'maintain' },
  { label: '项目明细清单', value: 'detail' }
]

const gridRef = ref<VxeTableInstance>()
const projectDetailGridRef = ref<VxeTableInstance>()
const tableData = ref<TargetBudgetMaintainRowVo[]>([])
const projectDetailSourceData = ref<ProjectDetailRow[]>([])
const projectDetailVisibleData = computed(() => projectDetailSourceData.value)
const adjustRemark = ref('')
const maintainDataTypeOptions = ref(buildMaintainDataTypeOptions())
const maintainSearchForm = reactive({
  dataType: getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
})
const projectDetailLoaded = ref(false)
const disEditableFields = ref<string[]>([])

const versionInfo = ref({
  nd: '',
  dwId: '',
  versionId: '',
  versionName: '',
  versionNo: ''
})

const projectDetailPage = reactive<ProjectDetailPage>({
  total: 0,
  limit: DETAIL_PAGE_SIZE,
  page: 1,
  current: 1
})

const normalizeParams = (params: TargetValueWorkflowParams) => ({
  nd: String(params.nd || ''),
  dwId: String(params.dwId || ''),
  versionId: String(params.versionId || ''),
  versionName: String(params.versionName || ''),
  versionNo: String(params.versionNo || '')
})

const getSelectedMaintainDataTypes = (dataTypes = maintainSearchForm.dataType) => {
  return dataTypes.length > 0 ? [...dataTypes] : getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
}

const isSummaryRow = (row: TargetBudgetMaintainRowVo) => isSummaryMaintainRow(row)

const cellStyle = ({ column }: any) => {
  if (disEditableFields.value.includes(column?.field)) {
    return {
      fontWeight: 'bold'
    }
  }
}

const gridOptions = reactive<any>({
  border: true,
  keepSource: true,
  columnConfig: {
    resizable: true
  },
  cellStyle,
  editConfig: {
    enabled: false
  },
  spanMethod: (params: any) => {
    return getMaintainSpanMethod({
      ...params,
      mergeFields: getMaintainMergeFields((gridOptions.columns || []) as any[])
    })
  },
  rowClassName: ({ row }: { row: TargetBudgetMaintainRowVo }) => {
    return isSummaryRow(row) ? 'summary-row' : ''
  },
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  }
})

const projectDetailGridOptions = reactive<VxeGridProps<ProjectDetailRow>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columns: [
    {
      type: 'seq',
      width: 70,
      title: '序号'
    },
    {
      field: 'nd',
      title: '年度',
      width: 120
    },
    {
      field: 'tzlx',
      title: '调整类型',
      width: 160,
      formatter: ({ cellValue }: { cellValue: string }) => formatProjectDetailAdjustTypeLabel(cellValue)
    },
    {
      field: 'xmmc',
      title: '项目名称',
      width: 220
    },
    {
      field: 'xmbm',
      title: '项目编码',
      width: 180
    },
    {
      field: 'xmlxName',
      title: '项目类型',
      width: 180
    },
    {
      field: 'yjdwName',
      title: '一级单位',
      width: 220
    },
    {
      field: 'ejdwName',
      title: '二级单位',
      width: 220
    },
    {
      field: 'amount',
      title: '总预算（不含税）（万元）',
      width: 220,
      headerAlign: 'center',
      align: 'right',
      formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
    },
    {
      field: 'dnys',
      title: '当年预算（不含税）（万元）',
      width: 160,
      headerAlign: 'center',
      align: 'right',
      formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
    },
    {
      field: 'dnysTzh',
      title: '当年预算（调整后）',
      width: 190,
      headerAlign: 'center',
      align: 'right',
      formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
    },
    {
      field: 'tzfd',
      title: '调整幅度',
      width: 160,
      headerAlign: 'center',
      align: 'right',
      formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
    },
    {
      field: 'kypfwh',
      title: '可研批复文号',
      width: 220
    },
    {
      field: 'sfyap',
      title: '是否预安排',
      width: 140
    }
  ]
})

const formatReadonlyAmount = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  if (value === '-') return value
  return formatNumValue(String(value), 6)
}

const parseReadonlyDecimal = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === '') return null
  const numberValue = Number(String(value).trim())
  return Number.isFinite(numberValue) ? numberValue : null
}

const formatReadonlyAdjustRange = (adjustedBudget: unknown, currentBudget: unknown, emptyValue = '') => {
  const adjustedBudgetValue = parseReadonlyDecimal(adjustedBudget)
  const currentBudgetValue = parseReadonlyDecimal(currentBudget)
  if (adjustedBudgetValue === null || currentBudgetValue === null) return emptyValue
  return (adjustedBudgetValue - currentBudgetValue).toFixed(6)
}

const normalizeProjectDetailAdjustType = (value: unknown): ProjectDetailRow['tzlx'] => {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return ''
  if (normalizedValue === '新增项目预算') return '1'
  if (normalizedValue === '调整项目预算') return '2'
  if (normalizedValue === '取消项目预算') return '3'
  if (normalizedValue === '1' || normalizedValue === '2' || normalizedValue === '3') {
    return normalizedValue as ProjectDetailRow['tzlx']
  }
  return ''
}

const formatProjectDetailAdjustTypeLabel = (value: unknown) => {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return '-'
  return projectDetailAdjustTypeMap[normalizedValue] || normalizedValue
}

const getFirstMatchedValue = (row: IObject, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row?.[alias]
    if (value !== undefined && value !== null) return value
  }
  return ''
}

const normalizeProjectDetailRow = (row: IObject): ProjectDetailRow => {
  return {
    ...row,
    id: String(getFirstMatchedValue(row, projectDetailFieldAliases.id) || ''),
    nd: String(getFirstMatchedValue(row, projectDetailFieldAliases.nd) || ''),
    xmmc: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmmc) || ''),
    xmbm: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmbm) || ''),
    tzlx: normalizeProjectDetailAdjustType(getFirstMatchedValue(row, projectDetailFieldAliases.tzlx)),
    xmlxName: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmlxName) || ''),
    yjdwName: String(getFirstMatchedValue(row, projectDetailFieldAliases.yjdwName) || ''),
    ejdwName: String(getFirstMatchedValue(row, projectDetailFieldAliases.ejdwName) || ''),
    xmxzName: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmxzName) || ''),
    jsksnd: String(getFirstMatchedValue(row, projectDetailFieldAliases.jsksnd) || ''),
    jsjsnd: String(getFirstMatchedValue(row, projectDetailFieldAliases.jsjsnd) || ''),
    amount: String(getFirstMatchedValue(row, projectDetailFieldAliases.amount) || ''),
    dnys: String(getFirstMatchedValue(row, projectDetailFieldAliases.dnys) || ''),
    dnysTzh: String(getFirstMatchedValue(row, projectDetailFieldAliases.dnysTzh) || ''),
    tzfd: formatReadonlyAdjustRange(
      getFirstMatchedValue(row, projectDetailFieldAliases.dnysTzh),
      getFirstMatchedValue(row, projectDetailFieldAliases.dnys)
    ),
    kypfwh: String(getFirstMatchedValue(row, projectDetailFieldAliases.kypfwh) || ''),
    sfyap: String(getFirstMatchedValue(row, projectDetailFieldAliases.sfyap) || ''),
    remark: String(getFirstMatchedValue(row, projectDetailFieldAliases.remark) || '')
  }
}

const getListRecords = (data: any): IObject[] => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.list)) return data.list
  return []
}

const getListTotal = (data: any, records: IObject[]) => {
  const total = Number(data?.total ?? records.length)
  return Number.isFinite(total) ? total : records.length
}

const syncProjectDetailPagination = (total = projectDetailSourceData.value.length) => {
  projectDetailPage.total = total
  projectDetailPage.current = projectDetailPage.page
}

const resetProjectDetailState = () => {
  projectDetailSourceData.value = []
  projectDetailLoaded.value = false
  projectDetailPage.total = 0
  projectDetailPage.limit = DETAIL_PAGE_SIZE
  projectDetailPage.page = 1
  projectDetailPage.current = 1
}

const clearMaintainGridState = () => {
  tableData.value = []
  gridOptions.data = []
  gridOptions.columns = []
  disEditableFields.value = []
}

const resetMaintainDataTypes = () => {
  maintainSearchForm.dataType = getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
}

const getMaintainDataTypeOptions = async (shouldReset = false) => {
  try {
    const res = await getPublicData(MAINTAIN_DATA_TYPE_PUBLIC_CODE)
    if (!res.success) throw new Error(res.msg)
    maintainDataTypeOptions.value = buildMaintainDataTypeOptions(res.data || [])
  } catch (error) {
    ElMessage.error(`获取数据项统计失败:${(error as Error).message}`)
    maintainDataTypeOptions.value = buildMaintainDataTypeOptions()
  } finally {
    if (shouldReset) {
      resetMaintainDataTypes()
    }
  }
}

const getDynamicColumnData = async (dataTypes = maintainSearchForm.dataType) => {
  const res = await getDynamicColumn({
    dwId: versionInfo.value.dwId,
    versionId: versionInfo.value.versionId,
    dataType: getSelectedMaintainDataTypes(dataTypes)
  })
  if (!res.success) throw new Error(res.msg)
  const columns = transformToVxeColumns(res.data || []) as any[]
  disEditableFields.value = columns.filter((col: any) => !col.slots?.edit).map((col: any) => col.field)
  gridOptions.columns = columns.map((col: any) => {
    const { editRender, slots, ...rest } = col
    return rest
  })
}

const getTargetBudgetMaintainData = async (dataTypes = maintainSearchForm.dataType) => {
  const res = await getVersionDetail({
    dwId: versionInfo.value.dwId,
    versionId: versionInfo.value.versionId,
    dataType: getSelectedMaintainDataTypes(dataTypes)
  })
  if (!res.success) throw new Error(res.msg)
  tableData.value = res.data || []
  gridOptions.data = tableData.value
}

const getWorkflowAdjustRemark = async () => {
  const res = await getTzsmByVersionId(versionInfo.value.versionId)
  if (!res.success) throw new Error(res.msg)
  adjustRemark.value = String(res.data || '')
}

const loadMaintainGridData = async (dataTypes = maintainSearchForm.dataType) => {
  await Promise.all([getDynamicColumnData(dataTypes), getTargetBudgetMaintainData(dataTypes)])
}

const loadProjectDetailData = async (force = false) => {
  if (!versionInfo.value.versionId || (projectDetailLoaded.value && !force)) return

  const res = await getDetailDataList({
    versionId: versionInfo.value.versionId,
    dwId: versionInfo.value.dwId,
    page: projectDetailPage.page,
    limit: projectDetailPage.limit
  })
  if (!res.success) throw new Error(res.msg)

  const records = getListRecords(res.data)
  projectDetailSourceData.value = records.map((row) => normalizeProjectDetailRow(row))
  projectDetailLoaded.value = true
  syncProjectDetailPagination(getListTotal(res.data, records))
}

const handleFilterQuery = async () => {
  loading.value = true
  try {
    const selectedDataTypes = getSelectedMaintainDataTypes()
    maintainSearchForm.dataType = selectedDataTypes
    await loadMaintainGridData(selectedDataTypes)
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleFilterReset = async () => {
  loading.value = true
  try {
    resetMaintainDataTypes()
    await loadMaintainGridData(maintainSearchForm.dataType)
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleProjectDetailPageChange = async (currentPageNum: number) => {
  projectDetailPage.page = currentPageNum
  projectDetailPage.current = currentPageNum
  loading.value = true
  try {
    await loadProjectDetailData(true)
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleProjectDetailLimitChange = async (currentLimitNum: number) => {
  projectDetailPage.page = 1
  projectDetailPage.current = 1
  projectDetailPage.limit = currentLimitNum
  loading.value = true
  try {
    await loadProjectDetailData(true)
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const loadActiveTabData = async () => {
  if (activeTab.value === 'detail') {
    loading.value = true
    try {
      await loadProjectDetailData()
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }
}

const initData = async () => {
  const params = normalizeParams(props.params)
  versionInfo.value = params
  if (!versionInfo.value.versionId) {
    ElMessage.error('缺少目标值参数!')
    return
  }

  loading.value = true
  activeTab.value = 'maintain'
  clearMaintainGridState()
  resetProjectDetailState()
  adjustRemark.value = ''
  try {
    await getMaintainDataTypeOptions(true)
    const results = await Promise.allSettled([loadMaintainGridData(), getWorkflowAdjustRemark()])
    results.forEach((result) => {
      if (result.status === 'rejected') {
        ElMessage.error((result.reason as Error).message)
      }
    })
    await nextTick()
    gridRef.value?.recalculate?.()
  } finally {
    loading.value = false
  }
}

const emitClose = () => {
  emit('close')
}

const emitNotify = () => {
  emit('notify')
}

watch(activeTab, () => {
  void nextTick().then(() => {
    gridRef.value?.recalculate?.()
    projectDetailGridRef.value?.recalculate?.()
    return loadActiveTabData()
  })
})

watch(
  () => props.params,
  () => {
    initData()
  },
  {
    deep: true
  }
)

onMounted(initData)
</script>

<style scoped lang="less">
.target-value-sjtc {
  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: white;

  &__operation {
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    flex: 1 1 auto;
    gap: 8px;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    padding: 4px 12px;
    background-color: var(--el-fill-color-light, #f5f7fa);
    border: 1px solid var(--el-border-color-light, #dcdfe6);
    border-radius: 4px;
    white-space: nowrap;
    max-width: 240px;

    dt {
      color: var(--el-text-color-regular, #606266);
      font-weight: normal;
      margin: 0;
    }

    dd {
      font-weight: 600;
      color: var(--el-text-color-primary, #303133);
      margin: 0 0 0 6px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__table {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__tabs {
    flex: 1;
    min-height: 0;

    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  &__pane {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__panel {
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-light, #dcdfe6);
    border-radius: 4px;
    background-color: #fff;
    flex: 0 0 auto;
  }

  &__panel-item {
    width: 100%;
    margin-bottom: 0;
  }

  &__panel-item--remark {
    :deep(.el-form-item__content) {
      line-height: normal;
    }
  }

  &__filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__panel--filter {
    :deep(.el-form) {
      flex: 1 1 320px;
    }
  }

  &__panel-item--filter {
    :deep(.el-form-item__content) {
      flex: 1;
    }
  }

  &__checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    min-height: 28px;
    align-items: center;
  }

  &__checkbox {
    margin-right: 0;
  }

  &__query-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
  }

  &__grid {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }

  :deep(.summary-row) {
    background-color: #f5f7fa;
    font-weight: bold;

    .vxe-body--column {
      background-color: #f5f7fa !important;
    }

    .col--dirty::before {
      display: none;
    }
  }

  :deep(.vxe-grid) {
    height: 100%;
  }

  :deep(.el-tabs) {
    height: 100%;
  }
}
</style>
