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
      <el-tabs v-model="isZgs" @tab-click="handleTab">
        <el-tab-pane :key="item.code" :disabled="disabled" v-for="item in tabList" :label="item.name" :name="item.code" />
      </el-tabs>
      <vxe-table
        :cell-style="cellStyle"
        :loading="pageInfo.loading"
        :row-config="{ keyField: 'id', height: 32 }"
        :column-config="{ resizable: true }"
        :sort-config="{ remote: false }"
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
          >
          </vxe-column>
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
          >
          </vxe-column>
        </template>
      </vxe-table>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <Log :specialorgid="userInfo.specialorgid" :nd="formData.nd" ref="logRef" title="目标总控制维护日志" />
  <ImportExcel ref="importRef" />
  <HelpModal ref="helpModalRef" />
</template>
<script lang="ts">
export default {
  name: '/xmInfo/Zkzwh'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import Log from '@/views/xmInfo/components/Log.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'

import { exportData, getData, getDynamicColumn, getImportTemplate, importData, save } from '@/api/xmInfo/mbz'
import { summaryValue } from '@/utils/utils'

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
  columns: Columns[]
  treeConfig: VxeTablePropTypes.TreeConfig
  editConfig: VxeTablePropTypes.EditConfig
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
const helpModalRef = ref()
const userDialogRef = ref()
const logRef = ref()
const importRef = ref()
const tabList = ref<any[]>([])
const isZgs = ref<any>('0')
const disabled = computed(() => pageInfo.loading)

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
        cj: row.cj
      }
      return new Promise((resolve: any) => {
        getData(params).then((res: any) => {
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
    beforeEditMethod: function ({ column, columnIndex, row }: any) {
      if (row.id && !row.leaf && column.field !== 'name') {
        return true
      }
      return false
    }
  },
  exportConfig: {
    type: 'xlsx',
    filename: '目标总控值批量维护-按页面导出',
    sheetName: '目标总控值批量维护-按页面导出',
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, tableInfo.tableData)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1') {
          if (newArr[cellNumber - 2].cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 2].cj - 1) + newArr[cellNumber - 2].name
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
    const index = updateParams[outIndex].dwValues.findIndex((item: any) => item.dwId === column.field)
    if (index > -1) {
      updateParams[outIndex].dwValues[index].ysje = row[column.field]
    } else {
      updateParams[outIndex].dwValues.push({
        dwId: column.field,
        dwName: column.title,
        ysje: row[column.field]
      })
    }
  } else {
    updateParams.push({
      code: code,
      id: id,
      dwValues: [{ dwId: column.field, dwName: column.title, ysje: row[column.field] }]
    })
  }
}

const selectNdHandle = (val: string) => {
  getDataList()
}
// tab切换
const handleTab = async () => {
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
  exportData({
    nd: formData.nd,
    isZgs: isZgs.value,
    specialorgid: userInfo.value.specialorgid
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
  let columnsData = columns.filter((item: any) => item.eidt)
  let column = columnsData.find((item: any) => item.columnKey === field)
  if (column) return true
  return false
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

const getHeaderData = async (specialOrgId: string) => {
  let res = await getDynamicColumn(specialOrgId, isZgs.value)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: Columns) => !item.hidden)
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
    cj: '0'
  }
  let res = await getData(params)
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
    width: 180px;
    text-align: right;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.table {
  height: calc(100% - 40px);
}
</style>
