<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header @change-xsws="changeXswsHandle" @change-nd="changeNdHandle" ref="headerRef" :dw-name="userMsg.userData.org_name" />
    <el-tabs v-model="tabMsg.name" type="border-card" @tab-click="getTabNameHandle">
      <el-tab-pane label="其他运营费用-主业" name="1">
        <div class="operation" v-if="userMsg.isShowPage">
          <div class="operation-left">
            <el-button type="primary" :disabled="isDisabled" plain @click="saveHandle" v-permission="'SAVE'">保 存 </el-button>
            <el-button type="primary" :disabled="uploadFileIsDisabled" plain @click="escalationHandle" v-permission="'REPORT'">上 报 </el-button>
            <el-button type="primary" :disabled="isDisabled" plain v-permission="'IMPORT'" @click="importHandle">导 入</el-button>
            <el-button type="primary" :disabled="isDisabled" plain v-permission="'EXPORT'" @click="exportHandle">导 出</el-button>
            <el-button type="primary" :disabled="uploadFileIsDisabled" plain @click="uploadHandle" v-permission="'UPLOAD'">上传附件 </el-button>
          </div>
          <div class="operation-right">
            <span>当前状态：{{ pageMsg?.pageData.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :header-cell-style="headerCellStyle"
            :row-config="tableMsg.rowConfig"
            :cell-style="cellStyle"
            :loading="tableLoading"
            show-overflow
            keep-source
            header-align="center"
            height="100%"
            ref="treeTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :edit-config="tableMsg.editConfig"
            :tree-config="tableMsg.zyTreeConfig"
            :data="tableMsg.tableData"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="item.visible"
                width="180"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="item.visible"
                width="180"
                v-else-if="item.columnKey === 'sbDesc'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input class="my-sbsm" maxlength="127" v-if="row?.id && !row?.leaf" v-model="row.sbDesc" />
                </template>
              </vxe-column>
              <vxe-column
                :visible="item.visible"
                v-else-if="item.columnKey === 'sbje'"
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input v-number-input="tableMsg.xsws" @change="sumhandle(row)" v-if="row?.id && !row?.leaf" v-model="row.sbje" class="my-input" />
                </template>
              </vxe-column>
              <vxe-column
                :visible="item.visible"
                v-else
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="其他运营费用-农电" name="2">
        <div class="operation" v-if="userMsg.isShowPage">
          <div class="operation-left">
            <el-button :disabled="isDisabled" type="primary" plain @click="saveHandle" v-permission="'SAVE'">保 存 </el-button>
            <el-button :disabled="uploadFileIsDisabled" type="primary" plain @click="escalationHandle" v-permission="'REPORT'">上 报 </el-button>
            <el-button :disabled="isDisabled" type="primary" plain v-permission="'IMPORT'" @click="importHandle">导 入</el-button>
            <el-button :disabled="isDisabled" type="primary" plain v-permission="'EXPORT'" @click="exportHandle">导 出</el-button>
            <el-button :disabled="uploadFileIsDisabled" type="primary" plain @click="uploadHandle" v-permission="'UPLOAD'">上传附件 </el-button>
          </div>
          <div class="operation-right">
            <span>当前状态：{{ pageMsg?.pageData.statusInfo }}</span>
            <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :header-cell-style="headerCellStyle"
            :row-config="tableMsg.rowConfig"
            :cell-style="cellStyle"
            :loading="tableLoading"
            keep-source
            show-overflow
            header-align="center"
            height="100%"
            ref="treendTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :edit-config="tableMsg.editConfig"
            :tree-config="tableMsg.zyTreeConfig"
            :data="tableMsg.ndData"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="item.visible"
                width="180"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="item.visible"
                width="180"
                v-else-if="item.columnKey === 'sbDesc'"
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input class="my-sbsm" maxlength="127" v-if="row?.id && !row?.leaf" v-model="row.sbDesc" />
                </template>
              </vxe-column>
              <vxe-column
                :visible="item.visible"
                v-else-if="item.columnKey === 'sbje'"
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input v-number-input="tableMsg.xsws" @change="sumhandle(row)" v-if="row?.id && !row?.leaf" v-model="row.sbje" class="my-input" />
                </template>
              </vxe-column>
              <vxe-column
                :visible="item.visible"
                v-else
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
      <FileUpload
        :busiId="tabMsg.busiId"
        @close="(val: boolean) => uploadMsg.isShowModal = val"
        :toolButton="['delete', 'multiple']"
        :kmlx="tabMsg.name"
        :specialorgid="userMsg.userData.org_id"
        :nd="tableMsg.nd"
        :is-show-modal="uploadMsg.isShowModal"
      ></FileUpload>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/annually/report/county'
}
</script>

<script setup lang="ts">
import FyHeader from '@/views/fy/components/Header.vue'
import FileUpload from '@/views/fy/components/FileUpload.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import type { TableMsg } from '@/views/fy/prearranged/interface'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  save,
  escalation,
  getList,
  judgeIsSd,
  getCurrentPageData,
  getDynamicColumn,
  getImportTemplate,
  importData,
  exportData
} from '@/api/fy/annually/report/county'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGroupSummary } from '@/utils/prearranged'
import { Decimal } from 'decimal.js'
import { VXETable } from 'vxe-table'
import { formatValue } from '@/utils/utils'

const userDialogRef = ref()
const treeTableRef = ref()
const treendTableRef = ref()
const headerRef = ref()
const importRef = ref()
const toolbarOneRef = ref()
const toolbarTwoRef = ref()

const userMsg = reactive<any>({
  userData: '',
  dwName: '',
  isShowPage: false,
  isDisabled: false
})

const uploadFileIsDisabled = computed(() => {
  return userMsg.isDisabled || tableLoading.value || !tabMsg.busiId
})

watch(
  () => userMsg.isDisabled,
  (newValue) => {
    if (tableMsg.editConfig) tableMsg.editConfig.enabled = !newValue
  },
  {
    deep: true
  }
)

const isDisabled = computed(() => {
  return userMsg.isDisabled || tableLoading.value
})

const uploadMsg = reactive({
  isShowModal: false
})

const pageMsg = reactive<any>({
  pageData: ''
})

const tabMsg = reactive({
  name: '1',
  busiId: ''
})

const tableLoading = ref(false)

const activeCellMethod = ({ column, columnIndex, row }: any) => {
  if (row.id && !row.leaf) {
    return true
  }
  return false
}

const headerCellStyle = () => {
  return {
    padding: '8px 0',
    lineHeight: '16px'
  }
}

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  xsws: '',
  nd: '',
  tableData: [],
  ndData: [],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true,
    beforeEditMethod: activeCellMethod
  },
  columns: [],
  zyTreeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        parentId: row.id,
        dwId: userMsg.userData.org_id,
        busiType: 'ND',
        kmlx: tabMsg.name
      }
      return new Promise((resolve: any) => {
        getList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            resolve(res.data)
          } else {
            ElMessage.error(res.msg)
            resolve([])
          }
        })
      })
    }
  }
})

const exportHandle = () => {
  tableLoading.value = true
  let params = {
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    parentId: '-1',
    specialorgid: userMsg.userData.org_id,
    busiType: 'YAP',
    kmlx: tabMsg.name,
    dwId: userMsg.userData.org_id
  }
  exportData(params).then((res: any) => {
    const blob = res
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
    tableLoading.value = false
  })
}

const importHandle = async () => {
  let newParmas = {
    kmlx: tabMsg.name,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    busiType: 'ND',
    ejdw: userMsg.userData.org_id,
    dwId: userMsg.userData.org_id,
    parentId: '-1'
  }
  let params = {
    title: '县年度上报导入',
    tempApi: () => getImportTemplate(newParmas),
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importData(newImportParams)
    },
    getTableList: getTableData,
    specialorgid: userMsg.userData.org_id
  }
  importRef.value.acceptParams(params)
}

const uploadHandle = () => {
  uploadMsg.isShowModal = true
}

const getTabNameHandle = ({ props }: any) => {
  tabMsg.name = props.name
  initDisabledBtn()
  getTableData()
  linkTable()
}

const escalationHandle = () => {
  const $table = tabMsg.name === '1' ? treeTableRef.value : treendTableRef.value
  let msg = ''
  if ($table) {
    // 获取表格录入的数据
    const records: any[] = $table.getUpdateRecords()
    const updateRecords = records.filter((item) => !item.leaf)
    msg = updateRecords.length !== 0 ? '存在未保存数据,是否继续上报？' : '确定是否上报？'
  }
  ElMessageBox.confirm(msg, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    let res = await escalation({
      kmlx: tabMsg.name,
      busiType: 'ND',
      ejdw: userMsg.userData.org_id,
      nd: tableMsg.nd
    })
    if (res.success) {
      ElMessage.success('上报成功！')
      initDisabledBtn()
      getCurData()
    } else {
      ElMessage.error('上报失败,请重新再试！')
    }
  })
}

const getCurData = async () => {
  let res = await getCurrentPageData({
    nd: tableMsg.nd,
    kmlx: tabMsg.name,
    specialorgid: userMsg.userData.org_id,
    busiType: 'ND'
  })
  tabMsg.busiId = res.data.dwDetailId
  pageMsg.pageData = res.data
}

const saveHandle = async () => {
  const $table = tabMsg.name === '1' ? treeTableRef.value : treendTableRef.value
  if ($table) {
    // 获取表格录入的数据
    const records: any[] = $table.getUpdateRecords()
    if (records.length === 0) {
      ElMessage.warning('未进行修改操作,请修改后再进行保存！')
      return
    }
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const updateRecords = records.filter((item) => !item.leaf && item.id)
      let mxList = updateRecords.map((item) => {
        return {
          sbje: item.sbje,
          yskmId: item.id,
          detailId: item.detailId ? item.detailId : '',
          sbDesc: item.sbDesc
        }
      })

      let params = {
        busiType: 'ND',
        ejdw: userMsg.userData.org_id,
        kmlx: tabMsg.name,
        nd: tableMsg.nd,
        mxList: mxList
      }
      let res = await save(params)
      if (res.success) {
        // 重置刷新树
        getDataList()
        getCurData()
        ElMessage.success('保存成功')
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const changeNdHandle = (val: string) => {
  tableMsg.nd = val
  initDisabledBtn()
  getTableData()
}

const changeXswsHandle = (val: string) => {
  tableMsg.xsws = val
  initDisabledBtn()
  getTableData()
}

const formatterHandle = ({ column, cellValue }: any) => {
  if (column.field === 'cnx' || column.field === 'name' || column.field === 'sbDesc') {
    return cellValue
  }
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue, Number(tableMsg.xsws))
}

const getRoleHandle = async () => {
  userMsg.userData = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  tableMsg.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  tableMsg.xsws = headerRef.value.formParams.xsws || '2'
  if (isQuery) {
    initDisabledBtn()
    userMsg.isShowPage = true
    await getTableData()
    linkTable()
  }
}

const linkTable = () => {
  const $table = Number(tabMsg.name) === 1 ? treeTableRef.value : treendTableRef.value
  const $toolBar = Number(tabMsg.name) === 1 ? toolbarOneRef.value : toolbarTwoRef.value
  if ($table && $toolBar) {
    $table.connect($toolBar)
  }
}

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.eidt)
  let column = columnsData.find((item: any) => item.columnKey === field)
  if (column) return true
  return false
}

const cellStyle = ({ row, column }: any) => {
  if (tableMsg.editConfig && !tableMsg.editConfig.enabled) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  if (!isClickHeader(tableMsg.columns, column.field)) {
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

const sumhandle = (row: any) => {
  row.sbje = row.sbje ? new Decimal(row.sbje).toFixed(Number(tableMsg.xsws)) : new Decimal(0).toFixed(Number(tableMsg.xsws))
  const config: any = tabMsg.name === '1' ? tableMsg.zyTreeConfig : tableMsg.ndTreeConfig
  const tableData = Number(tabMsg.name) === 1 ? tableMsg.tableData : tableMsg.ndData
  getGroupSummary(tableData, config, 'sbje', Number(tableMsg.xsws), 'leaf', 'id')
}

const initDisabledBtn = async () => {
  let res = await judgeIsSd('ND', tabMsg.name, tableMsg.nd, userMsg.userData.org_id)
  userMsg.isDisabled = res.data
  if (tableMsg.editConfig) tableMsg.editConfig.enabled = !res.data
}

const initData = async () => {
  userDialogRef.value.getUser()
  getTableHeaderName()
}

const clearTableData = () => {
  if (tableMsg.columns && tableMsg.columns.length > 0) tableMsg.columns.length = 0
  if (tableMsg.tableData) tableMsg.tableData.length = 0
  if (tableMsg.ndData) tableMsg.ndData.length = 0
}

const getTableData = async () => {
  tableLoading.value = true
  clearTableData()
  getCurData()
  let params = {
    nd: tableMsg.nd,
    kmlx: tabMsg.name
  }
  let res = await Promise.all([
    getList({
      ...params,
      parentId: tableMsg.nd,
      dwId: userMsg.userData.org_id,
      busiType: 'ND'
    }),
    getDynamicColumn({
      ...params,
      specialorgid: userMsg.userData.org_id
    })
  ])
  if (res[0].success && res[1].success) {
    Number(tabMsg.name) === 1 ? (tableMsg.tableData = res[0].data) : (tableMsg.ndData = res[0].data)
    tableMsg.columns = res[1].data.filter((item: any) => item.visible)
  } else {
    ElMessage.error('请刷新页面进行重试！')
  }
  tableLoading.value = false
}

const getTableHeaderName = () => {
  let curYear = new Date().getFullYear() // 当年
  return [curYear - 3, curYear - 2, curYear - 1, curYear]
}

const getDataList = async (val?: string) => {
  tableLoading.value = true
  tableMsg.nd = val ? val : tableMsg.nd
  let res = await getList({
    nd: tableMsg.nd,
    parentId: tableMsg.nd,
    dwId: userMsg.userData.org_id,
    busiType: 'ND',
    kmlx: tabMsg.name
  })
  if (res.success) {
    tabMsg.name === '1' ? (tableMsg.tableData = res.data) : (tableMsg.ndData = res.data)
  } else {
    ElMessage.error(res.msg)
  }
  tableLoading.value = false
}

onMounted(() => {
  initData()
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;

  .el-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      padding: 10px;
      height: calc(100% - 39px);

      .operation {
        margin-bottom: 10px;
        display: flex;
        align-items: center;

        &-left,
        &-right {
          width: 50%;
        }

        &-right {
          text-align: right;
        }
      }
    }

    .el-tab-pane {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .standrand-table {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}

.operation-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .toolbar {
    margin-left: 10px;
  }
}
</style>
