<template>
  <div class="content" v-show="pageInfo.isShowPage">
    <div class="toolButtoon">
      <div class="left">
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="pageExportHandle">按页面导出</el-button>
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="editLogHandle">修改日志</el-button>
      </div>
      <div class="right">
        <div class="year">
          <span>检查包预算：</span>
          <el-switch :disabled="disabled" @change="handleCheckPack" v-model="isCheck" :active-value="true" :inactive-value="false" />
        </div>
        <div class="filter-item">
          <span>年度：</span>
          <el-select style="width: 110px" v-model="formData.nd" placeholder="请选择年份" @change="changeNdHandle">
            <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
          </el-select>
        </div>
      </div>
    </div>
    <div class="table">
      <el-tabs v-model="isZgs" @tab-click="handleTab">
        <el-tab-pane :key="item.code" v-for="item in tabList" :disabled="disabled" :label="item.name" :name="item.code" />
      </el-tabs>
      <vxe-table
        :cell-style="cellStyle"
        :row-config="{ keyField: 'id', height: 32 }"
        :loading="pageInfo.loading"
        :column-config="{ resizable: true }"
        :border="true"
        align="center"
        show-overflow
        keep-source
        headerAlign="center"
        :editConfig="tableInfo.editConfig"
        :treeConfig="tableInfo.treeConfig"
        :data="tableInfo.tableData"
        height="92%"
        ref="tableRef"
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
          />
          <vxe-colgroup v-else-if="item.children && item.children.length != 0" :title="item.columnValue" header-align="center">
            <template v-for="grop in item.children" :key="grop.columnKey">
              <vxe-column
                :formatter="formatterData"
                header-align="center"
                border
                width="180"
                :title="grop.columnValue"
                :field="grop.columnKey"
                align="right"
              />
            </template>
          </vxe-colgroup>
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
          />
        </template>
      </vxe-table>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <Log :specialorgid="userInfo.specialorgid" :nd="formData.nd" ref="logRef" title="成本性项目目标值日志" />
</template>
<script lang="ts">
export default {
  name: '/goalValue/customGoalValue/detail'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { getValueColumns, getValueData } from '@/api/goalValue/customGoalValue'
import type { ValueQueryParams } from '@/api/goalValue/customGoalValue'
import { summaryValue } from '@/utils/prearranged'
import { TableCellStyle } from '@/utils/tableCellStyle'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicData, getYearData } from '@/api/common'
import { Decimal } from 'decimal.js'
import { formatValue, toValidNumber } from '@/utils/utils'
import Log from '@/views/xmInfo/components/Log.vue'

interface Columns {
  columnKey: string
  columnValue: string
  eidt?: boolean
  fixed?: boolean
  hidden?: boolean
}

const tableRef = ref()
const userDialogRef = ref()
const tabList = ref<any[]>([])
const isZgs = ref<any>('0')
const userInfo = ref<any>({})
const isCheck = ref<boolean>(false)
const logRef = ref()

const disabled = computed(() => pageInfo.loading)

const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
  ndDataList: {
    yearName: string
    yearCode: string
  }[]
}>({
  loading: true,
  isShowPage: false,
  ndDataList: []
})

const formData = reactive({
  nd: ''
})

const count = ref(0)

const createQueryParams = (parentId = '0'): ValueQueryParams => ({
  nd: formData.nd,
  parentId,
  isZgs: String(isZgs.value),
  specialorgid: userInfo.value?.specialorgid || userInfo.value?.specialOrgId || '',
  checkPropackYs: isCheck.value
})

const normalizeTreeData = (data: any[] = []): any[] => {
  return data.map((item: any) => ({
    ...item,
    leaf: String(item.leaf) === '0',
    children: item.children ? normalizeTreeData(item.children) : item.children
  }))
}

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
      let params = createQueryParams(row.id)
      return new Promise((resolve: any) => {
        getValueData(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(normalizeTreeData(res.data))
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

const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
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

const tableCellStyle = new TableCellStyle({
  structure: 'tree',
  colorFieldSuffix: '_colorCode',
  mode: 'text'
})

const cellStyle = ({ row, column }: any) => {
  if (isCheck.value) {
    if (!(!column?.field.includes('mbz') && !column?.field.includes('propackJe'))) {
      return {
        ...tableCellStyle.getCellStyle(row, column?.field),
        cursor: 'pointer',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
    return {
      cursor: 'auto',
      ...tableCellStyle.getCellStyle(row, column?.field),
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  return {
    cursor: 'auto',
    backgroundColor: 'rgba(232, 234, 236,0.5)'
  }
}

// 开启/关闭包预算
const handleCheckPack = async (val: any) => {
  await getHeaderData()
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let params = createQueryParams()
  let res = await getValueData(params)
  if (res.success) {
    tableInfo.tableData = normalizeTreeData(res.data)
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}

const getHeaderData = async () => {
  let res = await getValueColumns(createQueryParams())
  if (res.success) {
    tableInfo.columns = res.data.filter((item: Columns) => !item.hidden)
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}

const getYearDataList = async () => {
  let res = await getYearData()
  if (res.success) {
    pageInfo.ndDataList = res.data
    formData.nd = new Date().getFullYear().toString()
  } else {
    ElMessage.error(res.msg)
  }
}

const refreshData = async () => {
  tableInfo.columns.length = 0
  let res = await getHeaderData()
  if (!res) {
    pageInfo.loading = false
    return
  }
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

const handleTab = async () => {
  await refreshData()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

// 年度切换
const changeNdHandle = async () => {
  if (!formData.nd) return
  await refreshData()
}

const initParamLists = async () => {
  const res = await getPublicData('MBZ_TAB_TYPE')
  if (res.success && res.data?.length) {
    tabList.value = res.data
    isZgs.value = res.data[0].code
  }
}

const getRoleHandle = async () => {
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    await refreshData()
    if (tableRef.value) tableRef.value.setAllTreeExpand(true)
  }
}

const initData = async () => {
  await initParamLists()
  await getYearDataList()
  userDialogRef.value.getUser()
}

const getExportData = (newArr: any[], data: any[]) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push(item)
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children)
    }
  })
  return newArr
}

const pageExportHandle = () => {
  pageInfo.loading = true
  const $table = tableRef.value
  $table.exportData({
    type: 'xlsx',
    filename: '成本性项目目标值-按页面导出',
    sheetName: '成本性项目目标值-按页面导出',
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, tableInfo.tableData || [])

      const totalRows = worksheet.rowCount
      const dataCount = newArr.length

      const headerRows = dataCount > 0 ? totalRows - dataCount : 1

      // 获取所有可见列的field
      const getAllFields = (cols: any[]): string[] => {
        let fields: string[] = []
        cols.forEach((col) => {
          if (col.children && col.children.length > 0) {
            fields = fields.concat(getAllFields(col.children))
          } else if (col.field) {
            fields.push(col.field)
          }
        })
        return fields
      }
      const visibleFields = getAllFields(tableInfo.columns || [])

      // 处理name的缩进
      nameCol.eachCell({ includeEmpty: false }, (cell: any, rowNumber: number) => {
        if (rowNumber > headerRows) {
          const dataIndex = rowNumber - headerRows - 1
          if (newArr[dataIndex]) {
            if (newArr[dataIndex].cj > 1) {
              cell.value = '    '.repeat(newArr[dataIndex].cj - 1) + newArr[dataIndex].name
            }
          }
        }
      })

      // 设置所有单元格的颜色
      worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
        if (rowNumber > headerRows) {
          const dataIndex = rowNumber - headerRows - 1
          const rowData = newArr[dataIndex]
          if (rowData) {
            row.eachCell({ includeEmpty: false }, (cell: any, colNumber: number) => {
              const fieldIndex = colNumber - 1
              if (fieldIndex < visibleFields.length) {
                const field = visibleFields[fieldIndex]
                const cellStyle = tableCellStyle.getCellStyle(rowData, field)
                if (cellStyle) {
                  if (cellStyle.color) {
                    cell.font = {
                      color: { argb: 'FF' + cellStyle.color.replace('#', '') },
                      bold: cellStyle.fontWeight && cellStyle.fontWeight >= 600
                    }
                  }
                  if (cellStyle.backgroundColor) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'FF' + cellStyle.backgroundColor.replace('#', '') }
                    }
                  }
                }
              }
            })
          }
        }
      })
      pageInfo.loading = false
    }
  })
}

// 日志
const editLogHandle = () => {
  logRef.value.showModal = true
}

onMounted(initData)
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
}

.toolButtoon {
  height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  .left {
    max-width: 600px;
    min-height: 0;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 10px;

    .filter-item {
      display: flex;
      align-items: center;
      white-space: nowrap;

      > span {
        color: #606266;
        font-weight: 500;
        margin-right: 6px;
      }
    }
  }
}

.table {
  height: calc(100% - 40px);
}
</style>
