<!-- 增加检查包预算 -->
<template>
  <div v-show="pageInfo.isShowPage" class="content">
    <div class="toolButtoon" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-button v-permission="'SAVE'" :disabled="disabled" size="mini" type="primary" plain @click="saveHandle">保 存</el-button>
        <el-button v-permission="'PAGEEXPORT'" :disabled="disabled" size="mini" type="primary" plain @click="pageExportHandle">按页面导出</el-button>
        <el-button v-permission="'EXPAND'" :disabled="disabled" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
        <el-button v-permission="'IMPORT'" :disabled="disabled" size="mini" type="primary" plain @click="importHandle">导 入</el-button>
        <el-button v-permission="'EXPORT'" :disabled="disabled" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
        <el-button v-permission="'LOG'" :disabled="disabled" size="mini" type="primary" plain @click="editLogHandle">修改日志</el-button>
        <el-button v-permission="'VERSION'" :disabled="disabled" size="mini" type="primary" plain @click="versionManageHandle">版本管理</el-button>
      </div>
      <div class="right">
        <div class="year">
          <span>检查包预算：</span>
          <el-switch :disabled="disabled" @change="handleCheckPack" v-model="isCheck" :active-value="true" :inactive-value="false" />
        </div>
        <div class="year">
          <span>年度：</span>
          <el-select :disabled="disabled" @change="selectNdHandle" style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
            <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
          </el-select>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="table">
      <div class="table-tabs">
        <el-tabs v-model="isZgs" @tab-click="handleTab">
          <el-tab-pane :key="item.code" :disabled="disabled" v-for="item in tabList" :label="item.name" :name="item.code" />
        </el-tabs>
      </div>
      <div class="table-main">
        <vxe-table
          :cell-style="cellStyle"
          :loading="pageInfo.loading"
          @cell-click="handleCell"
          :row-config="{ keyField: 'id', height: 32 }"
          :column-config="{ resizable: true }"
          :sort-config="{ remote: false }"
          :border="true"
          align="center"
          show-overflow
          keep-source
          headerAlign="center"
          :treeConfig="tableInfo.treeConfig"
          :data="tableInfo.tableData"
          height="100%"
          ref="tableRef"
          @edit-closed="getEditDataHandle"
        >
          <template v-for="item in tableInfo.columns" :key="item.field">
            <vxe-column
              :fixed="'left'"
              v-if="item.field === 'name'"
              tree-node
              header-align="center"
              border
              width="280"
              :title="item.title"
              :field="item.field"
              align="left"
            />
            <vxe-column
              v-if="item.field === 'ysly'"
              header-align="center"
              border
              width="180"
              :title="item.title"
              :field="item.field"
              align="center"
            />
            <vxe-column
              v-if="item.field === 'gkjb'"
              header-align="center"
              border
              width="180"
              :title="item.title"
              :field="item.field"
              align="center"
            />
            <vxe-column
              :formatter="formatterData"
              v-if="item.field === 'ylz'"
              header-align="center"
              border
              :width="item.width"
              :title="item.title"
              :field="item.field"
              align="right"
            />
            <vxe-column
              :fixed="item.style ? 'left' : ''"
              :formatter="formatterData"
              v-if="item.edit && item.children.length == 0"
              header-align="center"
              border
              width="180"
              :title="item.title"
              :field="item.field"
              align="right"
              :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
            >
              <template #edit="{ row }">
                <input v-limit-number class="my-input" @change="sumhandle(row, item.field)" v-model="row[item.field]" maxlength="20" />
              </template>
            </vxe-column>
            <vxe-colgroup v-if="item.children.length != 0" :title="item.title" header-align="center">
              <template v-for="grop in item.children" :key="grop.id">
                <vxe-column
                  v-if="grop.edit && grop.visible"
                  :formatter="formatterData"
                  :title="grop.title"
                  :field="grop.field"
                  header-align="center"
                  align="right"
                  :width="item.width"
                  :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
                >
                  <template #edit="{ row }">
                    <input v-limit-number class="my-input" @change="sumhandle(row, grop.field)" v-model="row[grop.field]" />
                  </template>
                </vxe-column>
                <vxe-column
                  v-if="!grop.edit && grop.visible"
                  :width="item.width"
                  :formatter="formatterData"
                  header-align="center"
                  :title="grop.title"
                  :field="grop.field"
                  align="right"
                />
              </template>
            </vxe-colgroup>
          </template>
        </vxe-table>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <Log :specialorgid="userInfo.specialorgid" :nd="formData.nd" ref="logRef" title="目标总控制维护日志" />
  <ImportExcel ref="importRef" />
  <HelpModal ref="helpModalRef" />
  <ctPage ref="ctPageRef" :formData="ctParams" />
</template>
<script lang="ts">
export default {
  name: '/xmInfo/ZkzwhCheck'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import Log from '@/views/xmInfo/components/Log.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import ctPage from '@/views/xmInfo/components/ctPage.vue'

import { exportDataCheck, getDataCheck, getDynamicColumnCheck, getImportTemplate, importData, save } from '@/api/xmInfo/mbz'
import { summaryValue } from '@/utils/utils'
import { TableCellStyle } from '@/utils/tableCellStyle'
import { computed, onMounted, reactive, ref } from 'vue'
import VXETable, { VxeTablePropTypes } from 'vxe-table'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { ElMessage } from 'element-plus'
import { Columns } from './interface'
import { getYearData } from '@/api/common'
import { Decimal } from 'decimal.js'
import { formatValue } from '@/utils/utils'
import { User } from '../goalValue/interface'
import router from '@/router'
import { encrypt } from '@/utils/crypto'
import { getPublicData } from '@/api/common' //公共代码

interface TableInfo {
  tableData: any[]
  columns: any
  treeConfig: VxeTablePropTypes.TreeConfig
  exportConfig: VxeTablePropTypes.ExportConfig
}

interface UpdateValue {
  dwId: string
  dwName: string
  ysje: number
}
interface UpdateParam {
  code: string
  id: string
  dwValues: UpdateValue[]
}

const tableRef = ref()
const ctPageRef = ref()
const helpModalRef = ref()
const userDialogRef = ref()
const logRef = ref()
const importRef = ref()
const tabList = ref<any[]>([])
const isZgs = ref<any>('0')
const disabled = computed(() => pageInfo.loading)
const isCheck = ref<boolean>(false)

const tableCellStyle = new TableCellStyle({
  structure: 'tree',
  colorFieldSuffix: '_colorCode',
  mode: 'text'
})

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
const ctParams = ref<any>({})

const userInfo = ref<User>({
  code: '',
  id: '',
  info: '',
  name: '',
  org_id: '',
  org_name: '',
  role_id: '',
  rolename: '',
  spRoleCode: '',
  specialorgid: '',
  specialorgname: '',
  systemId: '',
  systemName: ''
})

const updateParams = reactive<UpdateParam[]>([])

const count = ref(0)

const tableInfo = reactive<TableInfo>({
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
        isZgs: isZgs.value,
        specialorgid: userInfo.value.specialorgid,
        cj: row.cj,
        checkPropackYs: isCheck.value
      }
      return new Promise((resolve: any) => {
        getDataCheck(params).then((res: any) => {
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
  exportConfig: {
    type: 'xlsx',
    filename: '目标总控值批量维护-按页面导出',
    sheetName: '目标总控值批量维护-按页面导出',
    useStyle: true,
    sheetMethod: function ({ worksheet }: any) {
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
      // 设置所有单元格的颜色
      worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
        if (rowNumber > headerRows) {
          const dataIndex = rowNumber - headerRows - 1
          const rowData = newArr[dataIndex]
          if (rowData) {
            row.eachCell({ includeEmpty: false }, (cell: any, colNumber: number) => {
              const visibleColumns = visibleFields.filter((item) => !item.includes('colorCode'))

              const fieldIndex = colNumber - 1
              if (fieldIndex < visibleColumns.length) {
                const field = visibleColumns[fieldIndex]
                if (!field.includes('colorCode')) {
                  const cellStyle = tableCellStyle.getCellStyle(rowData, field)
                  if (cellStyle) {
                    if (cellStyle.color) {
                      cell.font = {
                        ...cell.font,
                        color: { argb: 'FF' + cellStyle.color?.replace('#', '') },
                        blod: cellStyle.fontWeight && cellStyle.fontWeight >= 600
                      }
                    }
                    if (cellStyle.backgroundColor) {
                      cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF' + cellStyle.color?.replace('#', '') }
                      }
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
  }
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
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
const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}

const sumhandle = (row: any, key: string) => {
  row[key] = row[key] ? new Decimal(row[key]).toFixed(6) : '0.000000'
  const config: any = tableInfo.treeConfig
  const tableData = tableInfo.tableData
  summaryValue(tableData, config, key, 6, 'id')
}

// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  if (typeof row[column.field] == 'undefined' || row[column.field] == null || row[column.field] == '') return
  const code: string = row['code']
  const id: string = row['id']
  const outIndex = updateParams.findIndex((item: any) => item.id === id)
  if (outIndex > -1) {
    const index = updateParams[outIndex].dwValues.findIndex((item: any) => item.dwId === column?.field.split('_')[0])
    if (index > -1) {
      updateParams[outIndex].dwValues[index].ysje = row[column.field]
    } else {
      updateParams[outIndex].dwValues.push({
        dwId: column?.field.split('_')[0],
        dwName: column.title,
        ysje: row[column.field]
      })
    }
  } else {
    updateParams.push({
      code: code,
      id: id,
      dwValues: [{ dwId: column?.field.split('_')[0], dwName: column.title, ysje: row[column.field] }]
    })
  }
}

const selectNdHandle = (val: string) => {
  updateParams.length = 0
  getDataList()
}
// tab切换
const handleTab = async () => {
  updateParams.length = 0
  tableInfo.columns.length = 0
  if (tableInfo.columns.length == 0) {
    await getHeaderData(userInfo.value.specialorgid)
    await getDataList()
    if (tableRef.value) tableRef.value.setAllTreeExpand(true)
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
    let res = await save({
      saveData: updateParams,
      nd: formData.nd,
      isZgs: isZgs.value,
      specialorgid: userInfo.value.specialorgid
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

// 页面导出
const pageExportHandle = async () => {
  const $table = tableRef.value
  pageInfo.loading = true
  if ($table) {
    $table.exportData(tableInfo.exportConfig)
  }
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    expandAllTree(tableInfo.tableData, $table)
  }
}

const expandAllTree = async (data: any[], $table: any) => {
  data.forEach(async (row) => {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        expandAllTree(row.children, $table)
      }
    }
  })
}

// 导入
const importHandle = () => {
  let newParmas = {
    nd: formData.nd,
    isZgs: isZgs.value,
    specialorgid: userInfo.value.specialorgid
  }
  let params = {
    title: '目标总控值维护-导入',
    tempApi: () => getImportTemplate(newParmas),
    getTableList: getDataList,
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importData(newImportParams)
    },
    specialorgid: userInfo.value.specialorgid
  }
  importRef.value.acceptParams(params)
}

// 导出
const exportHandle = () => {
  pageInfo.loading = true
  exportDataCheck({
    nd: formData.nd,
    isZgs: isZgs.value,
    specialorgid: userInfo.value.specialorgid,
    checkPropackYs: isCheck.value
  }).then((res: any) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    pageInfo.loading = false
  })
}

// 日志
const editLogHandle = () => {
  logRef.value.showModal = true
}

// 开启/关闭包预算
const handleCheckPack = async (val: any) => {
  updateParams.length = 0
  await getHeaderData(userInfo.value.specialorgid)
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

// 版本管理
const versionManageHandle = () => {
  const str = encrypt(
    JSON.stringify({
      userInfo: { ...userInfo.value },
      nd: formData.nd
    })
  )
  router.push({
    name: '/goalValue/version',
    query: {
      versionParams: str
    }
  })
}

const getRoleHandle = async () => {
  pageInfo.loading = false
  userInfo.value = { ...userDialogRef.value.userMsg }
  // 请求数据
  let res = await getHeaderData(userInfo.value.specialorgid)
  if (!res) return
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
  const isQuery = userDialogRef.value.isQuery
  if (isQuery && pageInfo.pageFlag) {
    pageInfo.isShowPage = true
  }
}

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.edit)
  let column = columnsData.find((item: any) => item.field === field)
  if (column) return true
  return false
}

// 表格点击
const handleCell = ({ row, column }: any) => {
  if (!isCheck.value) return
  if (!column?.field.includes('mbz') && !column?.field.includes('propackJe')) return
  ctParams.value = {
    nd: formData.nd,
    dwId: column?.field.split('_')[0],
    specialorgid: userInfo.value.specialorgid,
    isZgs: isZgs.value,
    parentId: row.id
  }
  ctPageRef.value.isShowModal = true
  ctPageRef.value.getHeaderData(ctParams.value)
}

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
  } else {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
}

const getHeaderData = async (specialOrgId: string) => {
  let res = await getDynamicColumnCheck(specialOrgId, isZgs.value, isCheck.value)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    pageInfo.pageFlag = true
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: formData.nd,
    parentId: '0',
    isZgs: isZgs.value,
    specialorgid: userInfo.value.specialorgid,
    cj: '0',
    checkPropackYs: isCheck.value
  }
  let res = await getDataCheck(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.pageFlag = true
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
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

const initParamLists = async () => {
  // 获取公共代码
  const res = await getPublicData('MBZ_TAB_TYPE')
  if (res.success) {
    tabList.value = res.data
    isZgs.value = res.data[0].code
  }
}

const initData = () => {
  initParamLists()
  getYearDataList()
  pageInfo.loading = true
  userDialogRef.value.getUser()
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
  align-items: center;
  display: flex;
  margin-bottom: 10px;
  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .right {
    width: 350px;
    text-align: right;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.table {
  display: flex;
  flex-direction: column;
  height: calc(100% - 40px);
  &-main {
    min-height: 400px;
    flex: 1;
  }
}
</style>
