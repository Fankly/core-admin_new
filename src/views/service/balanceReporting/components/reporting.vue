<!-- 上报组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      :fullscreen="isViewMode"
      :title="formData?.isStatus == '2' ? props.title : '预计结余-查看'"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
      :loading="pageInfo.loading"
    >
      <div class="content" ref="fromTableRef">
        <div class="toolButtoon">
          <div class="left">
            <el-button size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
            <el-button v-if="canEdit" size="mini" type="primary" plain @click="saveHandle">保 存</el-button>
            <el-button v-if="canEdit" size="mini" type="primary" plain @click="unitDescImportHandle">导 入</el-button>
            <el-button size="mini" type="primary" plain @click="exportHandle1">页面导出</el-button>
            <el-button size="mini" type="primary" plain @click="exportHandle">全量导出</el-button>
            <!--自定义导出-->
          </div>
          <div class="right">
            <div class="info">
              <span class="highlight">
                版本编号: <span>{{ formData?.versionNo }}</span>
              </span>
              <span class="highlight">
                版本名称: <span>{{ formData?.versionName }}</span>
              </span>
              <span class="highlight">
                年度:<span>{{ formData?.nd }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="table">
          <vxe-toolbar ref="yjjyToolRef" custom />
          <vxe-table
            :cell-style="tableInfo.cellStyle"
            :row-style="tableInfo.rowStyle"
            :row-config="{ keyField: 'id', height: 32 }"
            :column-config="{ resizable: true }"
            :border="tableInfo.border"
            align="center"
            show-overflow
            keep-source
            headerAlign="center"
            id="table_toolbar_customYx"
            :custom-config="{ storage: true }"
            :editConfig="tableInfo.editConfig"
            :treeConfig="tableInfo.treeConfig"
            :data="tableInfo.tableData"
            height="100%"
            ref="tableRef"
            @edit-closed="getEditDataHandle"
          >
            <template v-for="(item, index) in tableInfo.columns" :key="'item' + index">
              <vxe-column
                header-align="center"
                show-overflow="tooltip"
                fixed="left"
                v-if="item.children.length == 0"
                tree-node
                width="280"
                :title="item.title"
                :field="item.field"
                align="left"
              />
              <vxe-colgroup v-else :title="item.title" header-align="center">
                <template v-for="(grop, gIndex) in item.children" :key="'grop' + gIndex">
                  <vxe-column
                    v-if="isEditableSituationColumn(grop)"
                    :formatter="formatterData"
                    width="220"
                    :title="grop.title"
                    :field="grop.field"
                    header-align="center"
                    align="left"
                    :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
                  >
                    <template #edit="{ row }">
                      <input class="my-input" v-model="row[grop.field]" />
                    </template>
                  </vxe-column>
                  <vxe-column
                    v-else-if="grop.edit && canEdit"
                    :width="getColumnWidth(grop)"
                    :formatter="formatterData"
                    :title="grop.title"
                    :field="grop.field"
                    header-align="center"
                    align="right"
                    :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
                  >
                    <template #edit="{ row }">
                      <input v-limit-input class="my-input" @change="sumhandle(row, grop.field)" v-model="row[grop.field]" maxlength="20" />
                    </template>
                  </vxe-column>
                  <vxe-column
                    v-else
                    :formatter="formatterData"
                    :width="getColumnWidth(grop)"
                    header-align="center"
                    :title="grop.title"
                    :field="grop.field"
                    :align="getColumnAlign(grop)"
                  />
                </template>
              </vxe-colgroup>
            </template>
          </vxe-table>
        </div>
      </div>
    </vxe-modal>
  </div>
  <ImportExcel ref="importRef" />
</template>
<script lang="ts">
export default {
  name: '/service/components/reporting'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, computed } from 'vue'
import {
  exportForProvince,
  exportForYjdw,
  getDynamicColumnForYjdw,
  getDataForYjdw,
  save,
  getDynamicColumnForProvince,
  getDataForProvince,
  getImportTemplate,
  xmlbysjyDetailImport
} from '@/api/service/balanceReporting/index'
import { summaryValue } from '@/utils/utils' //合计项目类型值
import { ElMessage, ElMessageBox } from 'element-plus'
import { Decimal } from 'decimal.js'
import { formatValue } from '@/utils/utils'
import ImportExcel from '@/components/ImportExcel/indexSy.vue' //导入组件
import { apiExportHandle, vxeExportHandle } from '@/utils/export'

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  },
  title: {
    type: String,
    default: ''
  }
})
const tableRef = ref()
const yjjyToolRef = ref()
const dialogFormRef = ref()
const importRef = ref<any>()
const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: true,
  isShowPage: false
})

const updateParams = reactive<any[]>([])

const count = ref(0)
const isShowModel = ref(false)
const reportEditableFieldSet = ref<Set<string>>(new Set())
const viewHighlightFieldSet = ref<Set<string>>(new Set())
const columnConfigMap = ref<Map<string, any>>(new Map())
const isReportMode = computed(() => props.title == '预计结余-上报')
const isViewMode = computed(() => props.title == '预计结余-查看')
const canEdit = computed(() => isReportMode.value && String(props.formData?.isStatus ?? '') == '2')
const closeHandle = () => {
  isShowModel.value = false
}
const getDataApi = () => (isReportMode.value ? getDataForYjdw : getDataForProvince)
const getColumnApi = () => (isReportMode.value ? getDynamicColumnForYjdw : getDynamicColumnForProvince)
const getExportApi = () => (isReportMode.value ? exportForYjdw : exportForProvince)
const getSituationField = () => `${props.formData?.specialorgid}_qksm`
const getDynamicFieldPrefix = (field = '') => {
  const lastSeparatorIndex = field.lastIndexOf('_')
  return lastSeparatorIndex > -1 ? field.slice(0, lastSeparatorIndex) : field
}
const getGroupFieldPrefix = (group: any) => {
  const editableChild = group.children?.find((child: any) => child.edit && child.field)
  const dynamicChild = group.children?.find((child: any) => child.field?.includes('_'))
  return getDynamicFieldPrefix(editableChild?.field || dynamicChild?.field || group.field || props.formData?.specialorgid)
}
const findColumnConfig = (field: string) => columnConfigMap.value.get(field)
const getColumnDwId = (column: any) =>
  column?.dwId || findColumnConfig(column?.field)?.dwId || getDynamicFieldPrefix(column?.field) || props.formData?.specialorgid
const getColumnDwName = (column: any) => column?.dwName || findColumnConfig(column?.field)?.dwName || column?.title
const isSituationField = (field: string) => field === getSituationField() || field?.endsWith('_qksm')
const isSituationColumn = (column: any) => isSituationField(column?.field)
const isEditableSituationColumn = (column: any) => isSituationColumn(column) && column?.edit && canEdit.value
const getColumnWidth = (column: any) => (isSituationColumn(column) ? 220 : 140)
const getColumnAlign = (column: any) => (isSituationColumn(column) ? 'left' : 'right')
const getFirstFieldPrefix = (field = '') => field.split('_')[0]
const getNumericValue = (row: any, column: any) => row[column.field]
const getSituationValue = (row: any, column: any) => row[column.field] ?? ''
const getDwValueKey = (column: any) => (isSituationColumn(column) ? 'qksm' : 'ysje')
const getDwValue = (row: any, column: any) => (isSituationColumn(column) ? getSituationValue(row, column) : getNumericValue(row, column))
const getUnitColumns = (column: any) => {
  const dwId = getColumnDwId(column)
  const columns = Array.from(columnConfigMap.value.values()).filter((item: any) => getColumnDwId(item) === dwId)
  return {
    numericColumn: columns.find((item: any) => !isSituationColumn(item) && item.edit) || (!isSituationColumn(column) ? column : null),
    situationColumn: columns.find((item: any) => isSituationColumn(item))
  }
}
const getDwValuePayload = (row: any, column: any) => {
  const { numericColumn, situationColumn } = getUnitColumns(column)
  return {
    dwId: getColumnDwId(column),
    dwName: getColumnDwName(column),
    qksm: situationColumn ? getSituationValue(row, situationColumn) : '',
    ysje: numericColumn ? getNumericValue(row, numericColumn) ?? '' : '',
    [getDwValueKey(column)]: getDwValue(row, column)
  }
}

const normalizeColumns = (columns: any[]) => {
  const normalizedColumns = columns.filter((item: any) => item.visible)
  normalizedColumns.forEach((group: any) => {
    if (!group.children?.length) return
    const prefix = getGroupFieldPrefix(group)
    if (!prefix) return
    group.children.forEach((child: any) => {
      child.dwId = group.field || prefix
      child.dwName = group.title
      if (isSituationColumn(child)) child.title = '情况说明'
    })
  })
  return normalizedColumns
}
const refreshColumnCache = (columns: any[]) => {
  reportEditableFieldSet.value = new Set((columns[1]?.children || []).filter((item: any) => item.edit).map((item: any) => item.field))
  viewHighlightFieldSet.value = new Set(columns.filter((item: any, index: number) => index % 2 === 0).map((item: any) => item.field))
  columnConfigMap.value = new Map(columns.flatMap((group: any) => group.children || []).map((column: any) => [column.field, column]))
}
const startLazyLoading = () => {
  count.value++
  pageInfo.loading = true
}
const finishLazyLoading = () => {
  count.value = Math.max(count.value - 1, 0)
  if (!count.value) pageInfo.loading = false
}

const tableInfo = reactive<any>({
  toolbarConfig: {
    custom: true
  },
  border: true,
  tableData: [],
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    lazy: true,
    hasChildField: 'leaf',
    async loadMethod({ row }: any) {
      startLazyLoading()
      let params = {
        // nd: props.formData.nd,
        parentId: row.id,
        specialorgid: props.formData?.specialorgid,
        versionId: props.formData?.versionId
      }
      try {
        const api = getDataApi()
        const res = await api(params)
        if (res.success) return res.data || []
        ElMessage.error(res.msg)
        return []
      } catch (error: any) {
        ElMessage.error(error?.message || '数据加载失败')
        return []
      } finally {
        finishLazyLoading()
      }
    }
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true,
    beforeEditMethod: function ({ column, row }: any) {
      return row.id && !row.leaf && column.field !== 'name'
    }
  },
  rowStyle: ({ row }: any) => {
    if (row.leaf) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  cellStyle: ({ row, column }: any) => {
    if (isReportMode.value) {
      if (!reportEditableFieldSet.value.has(column.field) || !canEdit.value) {
        return {
          cursor: 'auto',
          backgroundColor: 'rgba(232, 234, 236,0.5)'
        }
      }
      if (!row.id || row.leaf) {
        return {
          cursor: 'auto',
          backgroundColor: 'rgba(232, 234, 236,0.5)'
        }
      }
    } else {
      if (column.title != '项目类型') {
        if (viewHighlightFieldSet.value.has(getFirstFieldPrefix(column.field))) {
          return {
            cursor: 'auto',
            backgroundColor: 'rgba(255, 255, 0, 128)'
          }
        } else {
          // return {
          //     cursor: 'auto',
          //     backgroundColor: 'rgba(232, 234, 236,1)'
          //   }
        }
      } else {
        return {
          cursor: 'auto',
          backgroundColor: 'rgba(232, 234, 236,0.5)'
        }
      }
    }
  }
})

const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (isSituationColumn(column)) return cellValue
  return formatValue(cellValue.toString(), 6)
}

const sumhandle = (row: any, key: string) => {
  if (Number(row[key]) < 0) {
    row[key] = '0.000000'
    return ElMessage.warning('预计完成值不能为负数')
  }
  const specialorgid = props.formData?.specialorgid
  const keyCode = props.formData?.versionFlag == 'V1.2' ? '_phmbz' : '_mbz'
  const isOlder = props.formData?.versionFlag == 'V1.2'
  if (Number(row[key]) > Number(row[`${specialorgid}${keyCode}`])) {
    row[key] = '0.000000'
    return ElMessage.warning(`预计完成值不能大于${isOlder ? '平衡目标值' : '目标值'}`)
  }
  row[`${specialorgid}_jyz`] = row[key] ? new Decimal(row[`${specialorgid}${keyCode}`] - row[key]).toFixed(4) : '0.0000'
  row[key] = row[key] ? new Decimal(row[key]).toFixed(4) : '0.0000'
  const config: any = tableInfo.treeConfig
  const tableData = tableInfo.tableData
  summaryValue(tableData, config, key, 6, 'id')
  summaryValue(tableData, config, `${specialorgid}_jyz`, 4, 'id')
}

// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  if (!isSituationColumn(column) && (typeof row[column.field] == 'undefined' || row[column.field] == null || row[column.field] == '')) return
  const id: string = row['id']
  if (!id) return
  const dwId = getColumnDwId(column)
  const outIndex = updateParams.findIndex((item: any) => item.id === id)

  if (outIndex > -1) {
    const index = updateParams[outIndex].dwValues.findIndex((item: any) => item.dwId === dwId)
    if (index > -1) {
      updateParams[outIndex].dwValues[index].dwId = getColumnDwId(column)
      updateParams[outIndex].dwValues[index].dwName = getColumnDwName(column)
      updateParams[outIndex].dwValues[index][getDwValueKey(column)] = getDwValue(row, column)
    } else {
      updateParams[outIndex].dwValues.push(getDwValuePayload(row, column))
    }
  } else {
    updateParams.push({
      id: id,
      dwValues: [getDwValuePayload(row, column)]
    })
  }
}
// 自定义导出
const exportHandle1 = () => {
  const $table = tableRef.value
  if (!$table) return
  vxeExportHandle($table, '预计结余表', tableInfo.tableData)
}
// 导出
const exportHandle = async () => {
  try {
    pageInfo.loading = true
    const api = getExportApi()
    const params = {
      specialorgid: props.formData?.specialorgid,
      versionId: props.formData?.versionId
    }
    const fileName = '预计结余表'
    await apiExportHandle(params, fileName, api)
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  } finally {
    pageInfo.loading = false
  }
}
// 导入  批量维护
const unitDescImportHandle = async () => {
  let newParmas = {
    nd: props.formData?.nd,
    specialorgid: props.formData?.specialorgid,
    versionId: props.formData?.versionId
  }
  let tempApi: any = getImportTemplate
  let importApi: any = xmlbysjyDetailImport
  if (!importApi) return
  let params = {
    title: '预计结余表',
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: newData,
    specialorgid: props.formData?.specialorgid
  }
  importRef.value?.acceptParams?.(params)
}

// 保存
const saveHandle = async () => {
  if (updateParams.length === 0) {
    ElMessage.warning('请编辑后再进行保存！')
    return
  }
  ElMessageBox.confirm('请确定要保存的内容', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      let res = await save({
        specialorgid: props.formData?.specialorgid,
        versionId: props.formData?.versionId,
        nd: props.formData?.nd,
        saveDatas: updateParams
      })
      if (res.success) {
        ElMessage.success('保存成功！')
        await newData()
        updateParams.length = 0
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}
// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    await expandAllTree(tableInfo.tableData, $table)
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
const threeLevel = async () => {
  const $table = tableRef.value
  if (!$table) return
  for (const row of tableInfo.tableData) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children && isReportMode.value) {
        for (const row1 of row.children) {
          if (row1.leaf) {
            await $table.setTreeExpand(row1, true)
          }
        }
      }
    }
  }
}
// 初始化表格数据
const newData = async () => {
  await getDataList()
  await threeLevel()
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  try {
    let params = {
      // nd: props.formData.nd,
      parentId: '',
      specialorgid: props.formData?.specialorgid,
      versionId: props.formData?.versionId
    }
    let res = await getDataApi()(params)
    if (res.success) {
      tableInfo.tableData = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '数据加载失败')
  } finally {
    pageInfo.loading = false
  }
}
//获取表头
const getHeaderData = async (params: any) => {
  pageInfo.loading = true
  updateParams.length = 0
  try {
    let res = await getColumnApi()(params)
    if (res.success) {
      const columns = normalizeColumns(res.data || [])
      refreshColumnCache(columns)
      tableInfo.columns = columns
      pageInfo.isShowPage = true
      await newData()
      custom()
      return true
    }
    pageInfo.isShowPage = false
    ElMessage.error(res.msg)
    return false
  } catch (error: any) {
    pageInfo.isShowPage = false
    ElMessage.error(error?.message || '表头加载失败')
    return false
  } finally {
    pageInfo.loading = false
  }
}
// 工具栏
const custom = () => {
  const $toolbar = yjjyToolRef.value
  const $table = tableRef.value
  if ($toolbar && $table) {
    $table.connect($toolbar)
  }
}
defineExpose({
  isShowModel,
  getHeaderData
})
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
}

.header-group-cell {
  background-color: #212529 !important;
  text-align: center !important;
  font-weight: bold !important;
}

.vxe-table--render-default .vxe-header--column {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
}

.vxe-table--render-default .vxe-header--column .vex-cell {
  white-space: normal !important;
  line-height: 1.5 !important;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;

  .left {
    max-width: 400px;
  }

  .right {
    flex: 1;
    text-align: right;
    font-weight: bold;
    color: #212529;

    span {
      display: inline-block;
      font-size: 14px;
      color: #555;
      padding: 5px 10px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 10px;
    }
  }
}

.table {
  margin: 0 auto;
  height: calc(100% - 40px);
}

// .vxe-table--render-default .vxe-table--fixed-left-wrapper {
//   width: auto !important;
// }
</style>
