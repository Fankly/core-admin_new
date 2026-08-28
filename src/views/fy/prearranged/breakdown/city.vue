<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header
      @change-nd="changeNdHandle"
      @change-xsws="changeXswsHandle"
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
              @click="saveHandle"
              :disabled="isFjDisabled"
              v-permission="'SAVE'"
              >保 存
            </el-button>
            <el-button
              type="primary"
              plain
              @click="escalationHandle"
              :disabled="isFjDisabled"
              v-permission="'RELEASE'"
            >
              分解下达
            </el-button>
            <el-button
              type="primary"
              plain
              v-permission="'IMPORT'"
              @click="importHandle"
              :disabled="isFjDisabled"
              >导 入
            </el-button>
            <el-button type="primary" plain @click="exportHandle" v-permission="'EXPORT'"
              >导 出</el-button
            >
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
            <template v-if="!!userMsg.fjUserData.statusInfo">
              <span>当前状态：{{ userMsg?.fjUserData.statusInfo }}</span>
              <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
            </template>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :header-cell-style="headerCellStyle"
            :row-config="tableMsg.rowConfig"
            :cell-style="cellStyle"
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
                :formatter="formatterData"
                :fixed="item.fixed ? 'left' : ''"
                :tree-node="item.columnKey === 'name'"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="!item.hidden"
                width="120"
                :formatter="formatterData"
                :fixed="item.fixed ? 'left' : ''"
                v-else-if="item.eidt"
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
                    @focus="focusHandle(row, item.columnKey)"
                    @change="sumhandle(row, item.columnKey)"
                    v-if="row?.id && !row?.leaf && item.eidt"
                    v-model="row[item.columnKey]"
                    maxlength="20"
                  />
                </template>
              </vxe-column>
              <vxe-column
                :visible="!item.hidden"
                width="160"
                :formatter="formatterData"
                :fixed="item.fixed ? 'left' : ''"
                v-else
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
              type="primary"
              :disabled="isFjDisabled"
              plain
              @click="saveHandle"
              v-permission="'SAVE'"
              >保 存
            </el-button>
            <el-button
              type="primary"
              :disabled="isFjDisabled"
              plain
              @click="escalationHandle"
              v-permission="'RELEASE'"
            >
              分解下达
            </el-button>
            <el-button
              type="primary"
              plain
              v-permission="'IMPORT'"
              @click="importHandle"
              :disabled="isFjDisabled"
              >导 入
            </el-button>
            <el-button type="primary" plain @click="exportHandle" v-permission="'EXPORT'"
              >导 出</el-button
            >
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
            <template v-if="!!userMsg.fjUserData.statusInfo">
              <span>当前状态：{{ userMsg?.fjUserData.statusInfo }}</span>
              <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
            </template>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :header-cell-style="headerCellStyle"
            :row-config="tableMsg.rowConfig"
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
                :formatter="formatterData"
                :fixed="item.fixed ? 'left' : ''"
                :tree-node="item.columnKey === 'name'"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                width="340"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="!item.hidden"
                width="130"
                :formatter="formatterData"
                :fixed="item.fixed ? 'left' : ''"
                v-else-if="item.eidt"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{}"
              >
                <template #edit="{ row }">
                  <input
                    v-number-input="tableMsg.xsws"
                    class="my-input"
                    @focus="focusHandle(row, item.columnKey)"
                    @change="sumhandle(row, item.columnKey)"
                    v-if="row?.id && !row?.leaf && item.eidt"
                    v-model="row[item.columnKey]"
                    maxlength="20"
                  />
                  <span v-else> {{ row[item.columnKey] }}</span>
                </template>
              </vxe-column>
              <vxe-column
                :visible="!item.hidden"
                width="160"
                :formatter="formatterData"
                :fixed="item.fixed ? 'left' : ''"
                v-else
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/prearranged/breakdown/city'
}
</script>

<script setup lang="ts">
import FyHeader from '@/views/fy/components/Header.vue'
import userDialog from '@/components/select/userDialog.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import type { TableMsg } from '@/views/fy/prearranged/interface'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  exportData,
  getData,
  getDynamicColumn,
  getFormStatus,
  getImportTemplate,
  importData,
  save,
  xd
} from '@/api/fy/breakdown/city'
import { VXETable, VxeTablePropTypes } from 'vxe-table'
import XEUtils from 'xe-utils'
import Decimal from 'decimal.js'
import { formatValue, isNullOrUndefined } from '@/utils/utils'
import { Columns } from '@/views/fy/prearranged/interface'
import baseService from '@/service/baseService'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { startYapCityWf } from '@/api/workflow/fy'
import { containsNd } from '@/api/fy/common'
import { getWfTracking } from '@/api/workflow'

const userDialogRef = ref()
const treeTableRef = ref()
const treendTableRef = ref()
const headerRef = ref()
const importRef = ref()
const toolbarOneRef = ref()
const toolbarTwoRef = ref()

const store = useStore()

const tableLoading = ref(false)
const isHidenTab = ref(false)
const isFjDisabled = computed(
  () => !userMsg.fjUserData.id || userMsg.fjUserData.status !== '4' || tableLoading.value
)
const isWfId = computed(() => userMsg.fjUserData && !userMsg.fjUserData.wfId)

const userMsg = reactive<any>({
  userData: '',
  dwName: '',
  isShowPage: false,
  fjUserData: ''
})

const tabMsg = reactive({
  name: '1'
})

const activeCellMethod = ({ row }: any) => {
  if (row.id && !row.leaf) {
    return true
  }
  return false
}

const linkTable = () => {
  const $table = tabMsg.name === '1' ? treeTableRef.value : treendTableRef.value
  const $toolBar = tabMsg.name === '1' ? toolbarOneRef.value : toolbarTwoRef.value
  if ($table && $toolBar) {
    $table.connect($toolBar)
  }
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
  nd: '',
  xsws: '',
  tableData: [],
  ndData: [],
  columns: [],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
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
        dwId: userMsg.userData.org_id,
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

const getTabNameHandle = ({ props }: any) => {
  if (tableMsg.columns) tableMsg.columns.length = 0
  tabMsg.name = props.name
  initGetFormStatus()
  linkTable()
}

const escalationHandle = () => {
  if (
    userMsg.fjUserData &&
    (userMsg.fjUserData.fjStatus === null || userMsg.fjUserData.fjStatus === '')
  ) {
    ElMessage.warning('请保存后,再进行分解下达！')
    return
  }

  ElMessageBox.confirm('确定是否分解下达？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    // 判断是否走工作流
    let paramFLag = '0' //0走工作流  1不走工作流
    let isWorkFlowRes = await baseService.get(
      '/workflow/declare/getParamValue?paramKey=YAP_CITY_FJ_WORKFLOW'
    )
    if (isWorkFlowRes.success) {
      let wfUserInfo: WFUserInfo = {
        userId: store.getters.getUserMsg.id,
        spOrgId: userMsg.userData.specialorgid,
        spRoleId: userMsg.userData.id
      }
      let wfParam: WFParam = {
        KMLX: tabMsg.name,
        ND: tableMsg.nd,
        DWID: userMsg.userData.org_id,
        BUSITYPE: 'YAP',
        DWNAME: userMsg.dwName
      }
      let res = null
      paramFLag = isWorkFlowRes.data
      switch (paramFLag) {
        case '0':
          submitWorkflow(
            store.getters.getUserMsg.systemCode,
            'WF_YAPCITYFJ',
            '',
            wfUserInfo,
            wfParam,
            {},
            submitWFCallback
          )
          break
        case '1':
          res = await xd(userMsg.fjUserData.id)
          if (res.success) {
            ElMessage.success('分解下达成功！')
            await getDataList()
            await initGetFormStatus()
          } else {
            ElMessage.error(res.msg)
          }
          break
      }
    } else {
      ElMessage.error(isWorkFlowRes.msg)
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
    wfCode: 'WF_YAPCITYFJ',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await startYapCityWf({
    ...spfrom
  })
  if (res.success) {
    tableLoading.value = false
    ElMessage.success('提交成功')
    await getDataList()
    await initGetFormStatus()
  } else {
    tableLoading.value = false
    ElMessage.error(res.msg)
  }
}

// 导入
const importHandle = async () => {
  let newParmas = {
    kmlx: tabMsg.name,
    specialorgid: userMsg.userData.org_id,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    parentId: '-1',
    busiType: 'YAP',
    dwId: userMsg.userData.org_id
  }
  let params = {
    title: '-单位分解导入',
    tempApi: () => getImportTemplate(newParmas),
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importData(newImportParams)
    },
    getTableList: getDataList,
    specialorgid: userMsg.userData.org_id
  }
  importRef.value.acceptParams(params)
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

const saveHandle = async () => {
  const $table = tabMsg.name === '1' ? treeTableRef.value : treendTableRef.value
  if ($table) {
    let resultData: any = []
    // 获取表格录入的数据
    const records: any[] = $table.getUpdateRecords()
    const updateRecords = records.filter((item) => !item.leaf && item.id)
    if (updateRecords.length === 0) {
      ElMessage.warning('未进行修改操作,请修改后再进行保存！')
      return
    }
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      let columnKeys = tableMsg.columns?.filter((item: any) => item.eidt)
      updateRecords.forEach((rowData) => {
        let res = columnKeys?.map((item: any) => {
          if (!isNullOrUndefined(rowData[item.columnKey])) {
            return {
              yskmId: rowData.id,
              detailId: rowData['_' + item.columnKey] ? rowData['_' + item.columnKey] : '',
              dwId: item.columnKey,
              je: rowData[item.columnKey] ? rowData[item.columnKey] : '0'
            }
          }
          return ''
        })
        resultData.push(res)
      })
      let mxList = resultData.flat().filter(Boolean)
      let params = {
        dwDetailId: userMsg.fjUserData.id,
        mxList: mxList
      }
      let res = await save(params)
      if (res.success) {
        // 重置刷新树
        ElMessage.success('保存成功')
        getDataList()
        initGetFormStatus()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const isClickHeader = (columns: any, field: string) => {
  let column = columns.findIndex((item: any) => item.eidt && item.columnKey === field)
  return column > -1
}

const cellStyle = ({ row, column }: any) => {
  const isClick = isClickHeader(tableMsg.columns as Columns[], column.field)
  if (tableMsg.editConfig && !tableMsg.editConfig.enabled) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  if (!isClick) {
    if (!row.id || row.leaf) {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    } else {
      return {
        cursor: 'auto',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
  }
  if (!row.id || row.leaf) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
}

const isNeedNum = (columns: any[], field: string) => {
  let findIndex = columns.findIndex((item) => item.needSum && item.columnKey === field)
  if (findIndex > -1) return true
  return false
}

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (tableMsg.columns) {
    const isNum = isNeedNum(tableMsg.columns, column.field)
    if (isNum) {
      return formatValue(cellValue, Number(tableMsg.xsws))
    }
  }
  return cellValue
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
  tableMsg.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  tableMsg.xsws = headerRef.value.formParams.xsws || '2'
  if (isQuery) {
    await initGetFormStatus()
    linkTable()
  }
}

const clearTableData = () => {
  if (tableMsg.tableData) tableMsg.tableData.length = 0
  if (tableMsg.ndData) tableMsg.ndData.length = 0
}

const changeNdHandle = async (val: string) => {
  tableMsg.nd = val
  getTableHeader('YAP', userMsg.fjUserData.dwId)
  getDataList(tableMsg.nd)
  initGetFormStatus()
}

const changeXswsHandle = async (val: string) => {
  tableMsg.xsws = val
  getTableHeader('YAP', userMsg.fjUserData.dwId)
  getDataList(tableMsg.nd)
  initGetFormStatus()
}

const initGetFormStatus = async () => {
  clearTableData()
  let res = await getFormStatus({
    busiType: 'YAP',
    dwId: userMsg.userData.org_id,
    kmlx: tabMsg.name,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws
  })
  if (res.success) {
    userMsg.userData.org_id = res.data.dwId
    userMsg.dwName = res.data.dwName
    userMsg.isShowPage = true
    userMsg.fjUserData = { ...res.data }
    if (tableMsg.editConfig) {
      if (userMsg.fjUserData.id && userMsg.fjUserData.status === '4') {
        tableMsg.editConfig.enabled = true
      } else {
        tableMsg.editConfig.enabled = false
      }
    }
    await getDataList()
    await getTableHeader('YAP', res.data.dwId)
    // compTableWidth();
  } else {
    ElMessage.error(res.msg)
  }
}

const openTodoTaskDesc = () => {
  if (userMsg.fjUserData.wfId) {
    const winWidth = screen.width
    const winHeight = screen.height
    const width = 1200
    const height = 800
    let pageWidth = (winWidth - width) / 2
    let pageTop = (winHeight - height) / 2
    getWfTracking(userMsg.fjUserData.wfId).then((res: any) => {
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

const initData = async () => {
  userDialogRef.value.getUser()
}

const getTableHeader = async (busiType: string, dwId: string) => {
  let dynamicColumnData = await getDynamicColumn(busiType, dwId, tabMsg.name)
  if (dynamicColumnData.success) {
    tableMsg.columns = dynamicColumnData.data.filter((item: Columns) => item.visible)
  } else {
    ElMessage.error(dynamicColumnData.msg)
  }
}

const handleSummary = (children: any, key: string) => {
  if (children && children.length > 0) {
    let sum: any = 0
    children.forEach((item: any) => {
      sum = Decimal.add(sum, item[key] ? item[key] : 0)
    })
    return {
      [key]: sum.toFixed(Number(tableMsg.xsws))
    }
  }
}

const getGroupSummary = (
  data: any,
  config: VxeTablePropTypes.TreeConfig,
  key: string,
  leaf: string,
  filterStr: string,
  columnKeys: any,
  sumKey: string
) => {
  XEUtils.eachTree(
    data,
    (row, index, items, path, parent, nodes) => {
      let children = row.children
      if (children && children.length) {
        Object.assign(row, handleSummary(children, key))
        Object.assign(row, handleSummary(children, sumKey))
      } else {
        if (index === items.length - 1) {
          for (let len = nodes.length - 2; len >= 0; len--) {
            Object.assign(nodes[len], handleSummary(nodes[len].children, key))
            Object.assign(nodes[len], handleSummary(nodes[len].children, sumKey))
          }
        }
      }
    },
    config
  )
  const items = data.filter((item: any) => item[filterStr] && item[leaf])
  if (items && items.length > 0) {
    const sumSbje = items.reduce((prev: number, cur: any) => {
      return Decimal.add(prev, cur[key] ? cur[key] : 0)
    }, 0)
    data[0][key] = sumSbje.toFixed(Number(tableMsg.xsws))
  }
  // 计算合计问题
  let sumValue: any = 0
  if (columnKeys) {
    for (let i = 0; i < columnKeys.length; i++) {
      const item = columnKeys[i]
      sumValue = Decimal.add(sumValue, data[0][item.columnKey] ? data[0][item.columnKey] : 0)
    }
    data[0][sumKey] = sumValue.toFixed(Number(tableMsg.xsws))
  }
}

const sumhandle = (row: any, key: string) => {
  row[key] = row[key]
    ? new Decimal(row[key]).toFixed(Number(tableMsg.xsws))
    : new Decimal(0).toFixed(Number(tableMsg.xsws))
  let columnKeys = tableMsg.columns?.filter((item: any) => item.eidt)
  const config: any = tableMsg.zyTreeConfig
  const tableData = Number(tabMsg.name) === 1 ? tableMsg.tableData : tableMsg.ndData
  countYapFjValue(row, 'yapFjValue', key, columnKeys)
  getGroupSummary(tableData, config, key, 'leaf', 'id', columnKeys, 'yapFjValue')
}
const oldInputValue = ref('0')

const focusHandle = (row: any, key: string) => {
  oldInputValue.value = row[key] ? row[key] : new Decimal(0).toFixed(Number(tableMsg.xsws))
}

const countYapFjValue = (row: any, setValueKey: string, inputKey: string, columnKeys: any) => {
  let sumValue = new Decimal('0')
  let yapSdValue = row.yapSdValue ? new Decimal(row.yapSdValue) : new Decimal('0')
  if (columnKeys) {
    for (let i = 0; i < columnKeys.length; i++) {
      const item = columnKeys[i]
      sumValue = Decimal.add(sumValue, row[item.columnKey] ? row[item.columnKey] : 0)
    }
    if (sumValue.comparedTo(yapSdValue) > 0) {
      ElMessage.error('本次预安排分解值合计应小于等于预安排审定值！')
      sumValue = Decimal.sub(sumValue, row[inputKey] ? row[inputKey] : 0)
      sumValue = Decimal.add(sumValue, oldInputValue.value ? oldInputValue.value : 0)
      row[inputKey] = new Decimal(oldInputValue.value).toFixed(Number(tableMsg.xsws))
    }
    row[setValueKey] = sumValue.toFixed(Number(tableMsg.xsws))
  }
}

const getDataList = async (val?: string) => {
  clearTableData()
  tableLoading.value = true
  tableMsg.nd = val ? val : tableMsg.nd
  let res = await getData({
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    parentId: tableMsg.nd,
    dwId: userMsg.userData.org_id,
    busiType: 'YAP',
    kmlx: tabMsg.name
  })
  if (res.success) {
    tableLoading.value = false
    tabMsg.name === '1' ? (tableMsg.tableData = res.data) : (tableMsg.ndData = res.data)
  } else {
    tableLoading.value = false
    ElMessage.error(res.msg)
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped lang="less">
.container {
  height: calc(100vh - 110px);
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
          display: flex;
          align-items: center;
          justify-content: flex-end;
          .toolbar {
            margin-left: 10px;
          }
        }
      }
    }

    .el-tab-pane {
      height: 100%;
    }

    .standrand-table {
      height: calc(100% - 62px);
    }
  }
}
</style>
