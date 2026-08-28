<template>
  <vxe-modal
    :loading="pageInfo.loading"
    position="center"
    width="70%"
    height="820px"
    show-zoom
    title="目标值管理"
    :mask="true"
    :lock-scroll="true"
    :lock-view="true"
    :resize="true"
    :destroy-on-close="true"
    v-model="isShowModal"
    @show="showModal"
  >
    <div class="content" v-show="showPage">
      <div class="toolButtoon">
        <div class="left">
          <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="saveHandle">保 存 </el-button>
          <el-button :disabled="disabled" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
          <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="importHandle">导 入 </el-button>
          <el-button :disabled="disabled" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
          <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="versionActiveHandle"> 分解预算激活 </el-button>
        </div>
        <div class="right">
          <div class="info">
            <span class="highlight" style="margin-right: 10px">
              版本编号: <span>{{ userInfo.versionNo }}</span>
            </span>
            <span class="highlight" style="margin-right: 10px">
              版本名称:
              <el-tooltip :disabled="!userInfo.versionName || userInfo.versionName.length <= 20" :content="userInfo.versionName" placement="top">
                <span class="version-name">{{ userInfo.versionName }}</span>
              </el-tooltip>
            </span>
            <span class="highlight">
              年度:<span>{{ formData.nd }}</span>
            </span>
          </div>
        </div>
      </div>
      <div class="table">
        <vxe-table
          :cell-style="cellStyle"
          :row-config="{ keyField: 'id', height: 32 }"
          :column-config="{ resizable: true }"
          :border="true"
          align="center"
          show-overflow
          keep-source
          headerAlign="center"
          :editConfig="tableInfo.editConfig"
          :treeConfig="tableInfo.treeConfig"
          :data="tableInfo.tableData"
          height="100%"
          ref="tableRef"
          @edit-closed="getEditDataHandle"
        >
          <template v-for="item in tableInfo.columns" :key="item.columnKey">
            <vxe-column
              :fixed="item.fixed ? 'left' : ''"
              v-if="item.columnKey === 'name'"
              tree-node
              header-align="center"
              border
              width="280"
              :title="item.columnValue"
              :field="item.columnKey"
              align="left"
            ></vxe-column>
            <vxe-column
              :fixed="item.fixed ? 'left' : ''"
              :formatter="formatterData"
              v-else-if="item.eidt"
              header-align="center"
              border
              width="180"
              :title="item.columnValue"
              :field="item.columnKey"
              align="right"
              :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
            >
              <template #edit="{ row }">
                <input v-limit-number class="my-input" @change="sumhandle(row, item.columnKey)" v-model="row[item.columnKey]" maxlength="20" />
              </template>
            </vxe-column>
            <vxe-column
              :fixed="item.fixed ? 'left' : ''"
              :formatter="formatterData"
              v-else
              header-align="center"
              border
              width="180"
              :title="item.columnValue"
              :field="item.columnKey"
              align="right"
            ></vxe-column>
          </template>
        </vxe-table>
      </div>
    </div>
    <ImportExcel ref="importRef" />
  </vxe-modal>
</template>

<script setup lang="ts" name="BreakdownModal">
import ImportExcel from '@/components/ImportExcel/index.vue'

import { enableVersion, exportFjmx, getDynamicColumn, getFjDetail, getImportTemplate, importFjmx, saveFjmx } from '@/api/mbz/index'
import { formatValue, summaryValue, toValidNumber } from '@/utils/utils'
import { computed, reactive, ref } from 'vue'
import VXETable from 'vxe-table'
import { ElMessage } from 'element-plus'
import { getYearData } from '@/api/common'
import { Decimal } from 'decimal.js'
import { Columns } from '@/views/xmInfo/interface'

export interface Params {
  cjr: string
  cjrId: string
  dwId: string
  dwName: string
  id: string
  nd: string
  remark: string
  versionCode: string
  versionName: string
  zt: string
  ztName: string
}

interface Props {
  params: Params
  show: boolean
}

const props = defineProps<Props>()
const emits = defineEmits(['onActive'])

const tableRef = ref()
const importRef = ref()
const isShowModal = ref(false)

const disabled = computed(() => pageInfo.loading)

const isShow = computed(() => props.show)

const showPage = computed(() => pageInfo.isShowPage)

const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
  pageFlag: boolean
  ndDataList: {
    yearName: string
    yearCode: string
  }[]
}>({
  loading: true,
  isShowPage: false,
  pageFlag: false,
  ndDataList: []
})

const formData = reactive({
  nd: ''
})

const userInfo = reactive<{
  dwId: string
  versionId: string
  versionName: string
  versionNo: string
  status: string
}>({
  dwId: '',
  versionId: '',
  versionName: '',
  versionNo: '',
  status: ''
})

const updateParams = reactive<any[]>([])

const count = ref(0)

const tableInfo = reactive<any>({
  tableData: [],
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      pageInfo.loading = true
      let params = {
        nd: formData.nd,
        parentId: row.id,
        dwId: userInfo.dwId,
        cj: row.cj,
        versionId: userInfo.versionId
      }
      return new Promise((resolve: any) => {
        getFjDetail(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) pageInfo.loading = false
        })
      })
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
  }
})

const getExportData = (newArr: any[], data: any[]) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      cj: item.cj,
      name: item.name
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children)
    }
  })
  return newArr
}
const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}

const sumhandle = (row: any, key: string) => {
  let sumEditValue = new Decimal('0')
  editColumns.value.forEach((field) => {
    const editValue = new Decimal(toValidNumber(row[field]))
    sumEditValue = sumEditValue.add(editValue)
  })
  const flag = compareToValue(sumEditValue, new Decimal(toValidNumber(row[sumColumnKey.value])))
  if (flag && !row['isBkk']) {
    row[key] = '0.000000'
    ElMessage.warning(`【${row['name']}】：待分解(万元)必须大于等于0，请检查!`)
  } else row[key] = new Decimal(toValidNumber(row[key])).toFixed(6)
  const config: any = tableInfo.treeConfig
  const tableData = tableInfo.tableData
  summaryValue(tableData, config, key, 6, 'id')
}

const compareToValue = (v1: Decimal, v2: Decimal): boolean => {
  return v1.greaterThan(v2)
}

// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  let sumEditValue = new Decimal('0')
  editColumns.value.forEach((field) => {
    const editValue = new Decimal(toValidNumber(row[field]))
    sumEditValue = sumEditValue.add(editValue)
  })
  let sumColumnValue = new Decimal(toValidNumber(row[sumColumnKey.value]))
  if (row['isBkk']) {
    sumColumnValue = sumEditValue
    tableRef.value.setRow(row, {
      [sumColumnKey.value]: sumEditValue.toFixed(6)
    })
  }
  const dfjValue = sumColumnValue.sub(sumEditValue).toFixed(6)
  tableRef.value.setRow(row, {
    dfj: dfjValue
  })
  sumhandle(row, 'dfj')
  row[column.field] = toValidNumber(row[column.field])
  const id: string = row['id']
  const outIndex = updateParams.findIndex((item: any) => item.protypeId === id)
  if (outIndex > -1) {
    const index = Object.keys(updateParams[outIndex].dwValues).findIndex((key: string) => key === column.field)
    if (index > -1) {
      const key = Object.keys(updateParams[outIndex].dwValues)[index]
      updateParams[outIndex].dwValues[key] = row[column.field]
    } else {
      updateParams[outIndex].dwValues[column.field] = row[column.field]
    }
  } else {
    updateParams.push({
      protypeId: id,
      dwValues: { [column.field]: row[column.field] }
    })
  }
}

// 保存
const saveHandle = async () => {
  if (updateParams.length === 0) {
    ElMessage.warning('请编辑后再进行保存！')
    return
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    let res = await saveFjmx({
      saveDatas: updateParams,
      versionId: userInfo.versionId
    })
    if (res.success) {
      ElMessage.success('保存成功！')
      await getDataList()
      if (tableRef.value) tableRef.value.setAllTreeExpand(true)
      updateParams.length = 0
    } else {
      ElMessage.error(res.msg)
    }
  }
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

// 导入
const importHandle = () => {
  let newParmas = {
    nd: formData.nd,
    dwId: userInfo.dwId,
    versionId: userInfo.versionId
  }
  let params = {
    title: '目标总控值维护-导入',
    tempApi: () => getImportTemplate(userInfo.versionId),
    getTableList: getDataList,
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importFjmx(newImportParams)
    },
    dwId: userInfo.dwId
  }
  importRef.value.acceptParams(params)
}

// 导出
const exportHandle = () => {
  pageInfo.loading = true
  exportFjmx(userInfo.versionId).then((res: any) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = '目标值管理批量分解.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    pageInfo.loading = false
  })
}

// 激活
const versionActiveHandle = async () => {
  const type = await VXETable.modal.confirm('是否确定激活？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    pageInfo.loading = true
    try {
      const res = await enableVersion(userInfo.versionId)
      if (res.success) {
        ElMessage.success('激活成功')
        isShowModal.value = false
        emits('onActive', true)
      } else {
        ElMessage.error(res.msg)
      }
    } finally {
      pageInfo.loading = false
    }
  }
}

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.eidt)
  let column = columnsData.find((item: any) => item.columnKey === field)
  return !!column
}

const cellStyle = ({ row, column }: any) => {
  if (tableInfo.editConfig && !tableInfo.editConfig.enabled) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  if (!isClickHeader(tableInfo.columns, column.field)) {
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
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: formData.nd,
    parentId: '0',
    dwId: userInfo.dwId,
    versionId: userInfo.versionId,
    cj: '0'
  }
  let res = await getFjDetail(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.pageFlag = true
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}

const getHeaderData = async (dwId: string) => {
  let res = await getDynamicColumn(dwId)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: Columns) => !item.hidden)
    filterEditColumns(tableInfo.columns)
    pageInfo.pageFlag = true
    pageInfo.isShowPage = true
    return true
  } else {
    pageInfo.isShowPage = false
    ElMessage.error(res.msg)
    return false
  }
}

const editColumns = ref<string[]>([])
const sumColumnKey = ref<string>('')

const filterEditColumns = (columns: Columns[]) => {
  editColumns.value = columns.filter((item) => item.eidt).map((editColumn) => editColumn.columnKey)
  const value = columns.find((item) => item.sumRow)
  if (value) {
    sumColumnKey.value = value.columnKey
  }
}

const getYearDataList = async () => {
  let res = await getYearData()
  if (res.success) {
    pageInfo.ndDataList = res.data
    if (props.params.nd) {
      formData.nd = props.params.nd
    } else {
      formData.nd = new Date().getFullYear().toString()
    }
  } else {
    ElMessage.error(res.msg)
  }
}

const showModal = async () => {
  getYearDataList()
  pageInfo.loading = false
  if (!props.show) {
    tableInfo.editConfig.enabled = false
  } else {
    tableInfo.editConfig.enabled = true
  }
  formData.nd = props.params.nd as string
  userInfo.dwId = props.params.dwId
  userInfo.versionId = props.params.id
  userInfo.versionName = props.params.versionName
  userInfo.versionNo = props.params.versionCode
  userInfo.status = props.params.zt
  // 请求数据
  let res = await getHeaderData(userInfo.dwId)
  if (!res) return
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

defineExpose({
  isShowModal
})
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: 100%;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;
  min-width: 0;
  min-height: 0;

  .left {
    min-width: 0;
    min-height: 0;
    width: 600px;
  }

  .right {
    flex: 1;
    min-width: 0;
    min-height: 0;
    text-align: right;
    font-weight: bold;
    overflow: auto;
    color: #212529;

    .info {
      display: flex;
      justify-content: end;
      min-width: 0;
      min-height: 0;

      .highlight {
        display: flex;
        min-width: 0;
        min-height: 0;
        align-items: center;
      }

      span {
        display: inline-block;
        font-size: 14px;
        color: #555;
        padding: 5px 10px;
        background-color: #e9ecef;
        border-radius: 5px;
        min-height: 0;
        min-width: 0;
      }

      .version-name {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.table {
  height: calc(100% - 40px);
}
</style>
