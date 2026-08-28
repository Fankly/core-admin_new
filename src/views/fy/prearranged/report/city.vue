<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header
      @change-xsws="changeXswsHandle"
      @change-nd="changeNdHandle"
      ref="headerRef"
      :dw-name="userMsg.dwName"
    />
    <el-tabs v-model="tabMsg.name" type="border-card" @tab-click="getTabNameHandle">
      <el-tab-pane label="其他运营费用-主业" name="1">
        <div class="operation" v-if="userMsg.isShowPage">
          <div class="operation-left">
            <el-button
              type="primary"
              plain
              :disabled="isDisabled"
              @click="saveHandle"
              v-permission="'SAVE'"
              >保 存
            </el-button>
            <el-button
              type="primary"
              plain
              :disabled="isDisabled"
              @click="escalationHandle"
              v-permission="'REPORT'"
              >上 报
            </el-button>
            <el-button
              type="primary"
              plain
              :disabled="isDisabled"
              v-permission="'IMPORT'"
              @click="importHandle"
              >导 入
            </el-button>
            <el-button type="primary" plain v-permission="'EXPORT'" @click="exportHandle"
              >导 出</el-button
            >
            <el-button
              type="primary"
              plain
              :disabled="isDisabled"
              @click="uploadHandle"
              v-permission="'UPLOAD'"
            >
              上传附件
            </el-button>
            <el-button
              :disabled="isWfId"
              type="primary"
              plain
              @click="openTodoTaskDesc"
              v-permission="'VIEWWORKFLOW'"
            >
              查看流转过程
            </el-button>
          </div>
          <div class="operation-right">
            <span>当前状态：{{ pageMsg?.pageData.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :row-config="tableMsg.rowConfig"
            :cell-style="cellStyle"
            :header-cell-style="headerCellStyle"
            show-overflow
            :loading="tableLoading"
            align="center"
            keep-source
            height="100%"
            ref="treeTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.zyTreeConfig"
            :data="tableMsg.tableData"
            :edit-config="tableMsg.editConfig"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="!item.hidden"
                width="340"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="!item.hidden"
                v-else-if="item.columnKey === 'sbsm'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input
                    class="my-sbsm"
                    maxlength="127"
                    v-if="row?.id && !row?.leaf"
                    v-model="row['sbsm']"
                  />
                </template>
              </vxe-column>
              <vxe-column
                width="160"
                :visible="!item.hidden"
                v-else-if="item.columnKey === 'sbje'"
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input
                    class="my-input"
                    @change="sumhandle(row)"
                    v-if="row?.id && !row?.leaf"
                    v-model="row['sbje']"
                    maxlength="20"
                    v-number-input="tableMsg.xsws"
                  />
                  <span v-else> {{ row?.sbje }}</span>
                </template>
              </vxe-column>
              <vxe-column
                width="160"
                :visible="!item.hidden"
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
      <el-tab-pane v-if="isHidenTab" label="其他运营费用-农电" name="2">
        <div class="operation" v-if="userMsg.isShowPage">
          <div class="operation-left">
            <el-button
              :disabled="isDisabled"
              type="primary"
              plain
              @click="saveHandle"
              v-permission="'SAVE'"
              >保 存
            </el-button>
            <el-button
              :disabled="isDisabled"
              type="primary"
              plain
              @click="escalationHandle"
              v-permission="'REPORT'"
              >上 报
            </el-button>
            <el-button
              :disabled="isDisabled"
              type="primary"
              plain
              v-permission="'IMPORT'"
              @click="importHandle"
              >导 入
            </el-button>
            <el-button type="primary" plain @click="exportHandle" v-permission="'EXPORT'"
              >导 出</el-button
            >
            <el-button
              :disabled="isDisabled"
              type="primary"
              plain
              @click="uploadHandle"
              v-permission="'UPLOAD'"
            >
              上传附件
            </el-button>
            <el-button
              :disabled="isWfId"
              type="primary"
              plain
              @click="openTodoTaskDesc"
              v-permission="'VIEWWORKFLOW'"
            >
              查看流转过程
            </el-button>
          </div>
          <div class="operation-right">
            <span>当前状态：{{ pageMsg?.pageData.statusInfo }}</span>
            <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :row-config="tableMsg.rowConfig"
            :header-cell-style="headerCellStyle"
            :cell-style="cellStyle"
            show-overflow
            :loading="tableLoading"
            align="center"
            keep-source
            height="100%"
            ref="treendTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.zyTreeConfig"
            :data="tableMsg.ndData"
            :edit-config="tableMsg.editConfig"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="!item.hidden"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                width="340"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="!item.hidden"
                v-else-if="item.columnKey === 'sbsm'"
                :formatter="formatterHandle"
                header-align="center"
                align="left"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input class="my-sbsm" maxlength="127" v-model="row.sbsm" />
                </template>
              </vxe-column>
              <vxe-column
                width="160"
                :visible="!item.hidden"
                v-else-if="item.columnKey === 'sbje'"
                :formatter="formatterHandle"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input
                    v-number-input="tableMsg.xsws"
                    class="my-input"
                    @change="sumhandle(row)"
                    v-model="row.sbje"
                    maxlength="20"
                  />
                </template>
              </vxe-column>
              <vxe-column
                width="160"
                :visible="!item.hidden"
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
  name: '/fy/prearranged/report/city'
}
</script>

<script setup lang="ts">
import FyHeader from '@/views/fy/components/Header.vue'
import FileUpload from '@/views/fy/components/FileUpload.vue'
import userDialog from '@/components/select/userDialog.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import type { TableMsg } from '@/views/fy/prearranged/interface'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  citySave,
  citySb,
  getCurrentPageData,
  getData,
  getDynamicColumn,
  exportData,
  importTemplate,
  importData
} from '@/api/fy/report/city'
import { containsNd } from '@/api/fy/common'
import { getGroupSummary } from '@/utils/prearranged'
import { Decimal } from 'decimal.js'
import { VXETable } from 'vxe-table'
import { formatValue } from '@/utils/utils'
import { Columns } from '@/views/fy/prearranged/interface'
import baseService from '@/service/baseService'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { getWfTracking } from '@/api/workflow'
import { startYapCityReportWf } from '@/api/workflow/fy'

const userDialogRef = ref()
const treeTableRef = ref()
const treendTableRef = ref()
const toolbarOneRef = ref()
const toolbarTwoRef = ref()
const headerRef = ref()
const importRef = ref()

const isHidenTab = ref(false)

const store = useStore()

const userMsg = reactive<any>({
  userData: '',
  dwName: '',
  isShowPage: false
})

const pageMsg = reactive<any>({
  pageData: ''
})

const tabMsg = reactive({
  name: '1',
  busiId: ''
})

const uploadMsg = reactive({
  isShowModal: false
})

const tableLoading = ref(false)

watch(
  () => pageMsg.pageData,
  (newData) => {
    if (tableMsg.editConfig)
      tableMsg.editConfig.enabled =
        newData.sdzt === '1' || newData.sbzt === '2' || !newData.dwDetailId ? false : true
  },
  {
    deep: true
  }
)

const isWfId = computed(() => pageMsg.pageData && !pageMsg.pageData.wfId)

const isDisabled = computed(() => {
  return (
    !pageMsg.pageData.dwDetailId ||
    pageMsg.pageData.sdzt === '1' ||
    pageMsg.pageData.sbzt === '2' ||
    tableLoading.value
  )
})

const activeCellMethod = ({ column, columnIndex, row }: any) => {
  if (row.id && !row.leaf && (column.field === 'sbje' || column.field === 'sbsm')) {
    return true
  }
  return false
}

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  nd: '',
  xsws: '',
  tableData: [],
  ndData: [],
  columns: [],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true,
    beforeEditMethod: activeCellMethod
  },
  zyTreeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        parentId: row.id,
        specialorgid: userMsg.userData.org_id,
        busiType: 'YAP',
        kmlx: tabMsg.name
      }
      return new Promise((resolve: any) => {
        getData({
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

const headerCellStyle = () => {
  return {
    padding: '8px 0',
    lineHeight: '16px'
  }
}

const getTabNameHandle = ({ props }: any) => {
  tabMsg.name = props.name
  getTableData()
  linkTable()
}

const sumhandle = (row: any) => {
  row.sbje = row.sbje
    ? new Decimal(row.sbje).toFixed(Number(tableMsg.xsws))
    : new Decimal('0').toFixed(Number(tableMsg.xsws))
  const config: any = tabMsg.name === '1' ? tableMsg.zyTreeConfig : tableMsg.ndTreeConfig
  const tableData = Number(tabMsg.name) === 1 ? tableMsg.tableData : tableMsg.ndData
  getGroupSummary(tableData, config, 'sbje', Number(tableMsg.xsws), 'leaf', 'id')
}

const escalationHandle = () => {
  const $table = tabMsg.name === '1' ? treeTableRef.value : treendTableRef.value
  let msg = ''
  if ($table) {
    // 获取表格录入的数据
    const records: any[] = $table.getUpdateRecords()
    const updateRecords = records.filter((item) => !item.leaf)
    msg = updateRecords.length !== 0 ? '存在未保存数据,是否继续上报？' : '是否确认上报？'
  }
  ElMessageBox.confirm(msg, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    // 判断是否走工作流
    let paramFLag = '0' //0走工作流  1不走工作流
    let isWorkFlowRes = await baseService.get(
      '/workflow/declare/getParamValue?paramKey=YAP_CITY_SB_WORKFLOW'
    )
    let wfUserInfo: WFUserInfo = {
      userId: store.getters.getUserMsg.id,
      spOrgId: userMsg.userData.specialorgid,
      spRoleId: userMsg.userData.id
    }
    let wfParam: WFParam = {
      KMLX: tabMsg.name,
      ND: tableMsg.nd,
      DWID: pageMsg.pageData.dwId,
      BUSITYPE: 'YAP',
      DWNAME: userMsg.dwName,
      ISZS: pageMsg.pageData.isZs,
      SPECIALORGID: userMsg.userData.org_id
    }
    let res = null
    paramFLag = isWorkFlowRes.data
    switch (paramFLag) {
      case '0':
        submitWorkflow(
          store.getters.getUserMsg.systemCode,
          'WF_YAPCITYSB',
          '',
          wfUserInfo,
          wfParam,
          {},
          submitWFCallback
        )
        break
      case '1':
        res = await citySb({
          kmlx: tabMsg.name,
          busiType: 'YAP',
          specialorgid: userMsg.userData.org_id,
          nd: tableMsg.nd,
          xsws: tableMsg.xsws
        })
        if (res.success) {
          ElMessage.success('上报成功！')
          getCurData()
        } else {
          ElMessage.error(res.msg)
        }
        break
    }
  })
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: any) => {
  const list: any[] = JSON.parse(wfData).WorkFlowDataList.WorkFlowData
  let obj: any = {}
  list.forEach((item) => {
    obj[item.DataCode] = item.DataValue
  })
  tableLoading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userMsg.userData.specialorgid,
    spRoleId: userMsg.userData.id,
    wfCode: 'WF_YAPCITYSB',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await startYapCityReportWf({
    ...spfrom
  })
  if (res.success) {
    tableLoading.value = false
    ElMessage.success('提交成功')
    await getCurData()
  } else {
    tableLoading.value = false
    ElMessage.error(res.msg)
  }
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
      let mxList = updateRecords.map((item): List => {
        return {
          sbje: item.sbje,
          yskmId: item.id,
          detailId: item.detailId ? item.detailId : '',
          sbsm: item.sbsm
        }
      })
      let params = {
        busiType: 'YAP',
        specialorgid: userMsg.userData.org_id,
        kmlx: tabMsg.name,
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        lists: mxList
      }
      let res = await citySave(params)
      if (res.success) {
        // 重置刷新树
        getTableData()
        ElMessage.success('保存成功')
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const importHandle = async () => {
  let newParmas = {
    kmlx: tabMsg.name,
    specialorgid: userMsg.userData.org_id,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws
  }
  let params = {
    title: '市预安排上报导入',
    tempApi: () => importTemplate(newParmas),
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

const isClickHeader = (columns: Columns[], field: string) => {
  let columnIndex = columns.findIndex((item: any) => item.eidt && item.columnKey === field)
  return columnIndex > -1
}

const cellStyle = ({ row, column }: any) => {
  if (tableMsg.editConfig && !tableMsg.editConfig.enabled) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  if (tableMsg.columns && !isClickHeader(tableMsg.columns, column.field)) {
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

const changeNdHandle = (val: string) => {
  tableMsg.nd = val
  getTableData()
}

const changeXswsHandle = (val: string) => {
  tableMsg.xsws = val
  getTableData()
}

const uploadHandle = async () => {
  uploadMsg.isShowModal = true
  tabMsg.busiId = pageMsg.pageData.dwDetailId
}

// 判断表头是否可以点击
const isNeedNum = (columns: any[], field: string) => {
  let findIndex = columns.findIndex((item) => item.needSum && item.columnKey === field)
  if (findIndex > -1) return true
  return false
}

const formatterHandle = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (tableMsg.columns) {
    const isNum = isNeedNum(tableMsg.columns, column.field)
    if (isNum) {
      return formatValue(cellValue, Number(tableMsg.xsws))
    }
  }
  return cellValue
}

// 导出
const exportHandle = () => {
  tableLoading.value = true
  let params = {
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    parentId: '-1',
    specialorgid: userMsg.userData.org_id,
    busiType: 'YAP',
    kmlx: tabMsg.name
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

// 是否隐藏tab
const isHideTab = async (dwId: string) => {
  let res = await containsNd(dwId)
  if (res.success) {
    isHidenTab.value = res.data
  }
}

const getRoleHandle = async () => {
  userMsg.userData = { ...userDialogRef.value.userMsg }
  isHideTab(userMsg.userData.org_id)
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    tableMsg.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
    tableMsg.xsws = headerRef.value.formParams.xsws || '2'
    userMsg.isShowPage = true
    await getTableData()
    linkTable()
  }
}

const openTodoTaskDesc = () => {
  if (pageMsg.pageData.wfId) {
    const winWidth = screen.width
    const winHeight = screen.height
    const width = 1200
    const height = 800
    let pageWidth = (winWidth - width) / 2
    let pageTop = (winHeight - height) / 2
    getWfTracking(pageMsg.pageData.wfId).then((res: any) => {
      if (res.success) {
        window.open(
          res.data,
          '_blank',
          `width=${width},height=${height},top=${pageTop},left=${pageWidth}`
        )
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
}

const linkTable = () => {
  const $table = tabMsg.name === '1' ? treeTableRef.value : treendTableRef.value
  const $toolBar = tabMsg.name === '1' ? toolbarOneRef.value : toolbarTwoRef.value
  if ($table && $toolBar) {
    $table.connect($toolBar)
  }
}

const getCurData = async () => {
  let res = await getCurrentPageData({
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    kmlx: tabMsg.name,
    specialorgid: userMsg.userData.org_id
  })
  pageMsg.pageData = { ...res.data }
  userMsg.dwName = res.data.dwName
}

const initData = async () => {
  userDialogRef.value.getUser()
}

const getTableData = async () => {
  tableLoading.value = true
  clearTableData()
  getCurData()
  let params = {
    nd: tableMsg.nd,
    parentId: '-1',
    specialorgid: userMsg.userData.org_id,
    busiType: 'YAP',
    kmlx: tabMsg.name,
    xsws: tableMsg.xsws
  }
  let res = await Promise.all([
    getDynamicColumn(tableMsg.nd, tabMsg.name, tableMsg.xsws),
    getData(params)
  ])
  if (res[0].success && res[1].success) {
    tableMsg.columns = res[0].data.filter((item: Columns) => item.visible)
    Number(tabMsg.name) === 1 ? (tableMsg.tableData = res[1].data) : (tableMsg.ndData = res[1].data)
  } else {
    ElMessage.error('请刷新页面进行重试！')
  }
  tableLoading.value = false
}

const clearTableData = () => {
  if (tableMsg.columns && tableMsg.columns.length > 0) tableMsg.columns.length = 0
  if (tableMsg.tableData) tableMsg.tableData.length = 0
  if (tableMsg.ndData) tableMsg.ndData.length = 0
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
      min-width: 0;
      min-height: 0;
      flex: 1;
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
