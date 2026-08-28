<!-- 项目需求审核流程处理（新） -->
<script setup lang="ts">
import { getDynamicColumn, getTableData, exportData, downloadReviewReportByMeetingId, finishWf, reject } from '@/api/ai/reviewWorkBench'
import { loadUserWfInfo } from '@/api/workflow'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { formatValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { apiExportHandle } from '@/utils/export'

interface Columns {
  columnKey: string
  columnValue: string
  eidt: boolean
  hidden: boolean
  fixed: boolean
  needSum: string
  visible: boolean
}

interface Params {
  [key: string]: any
}

const loadUserWfInfoMethod = () => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfMeetingId.value = data.wfData.MEETING_ID
      wfInstIdString.value = data.wfInstId
      nodeCode.value = data.nodeCode
      orgFlag.value = data.orgFlag
      wfCodeString.value = data.wfCode
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
    document.domain = 'sgcc.com.cn'
    const width = window.parent.innerWidth
    const height = window.parent.innerHeight
    window.parent.Appframe ? window.parent.Appframe.workflow.WorkList.setWidth(width, height) : ''
  })
}
onMounted(async () => {
  loadUserWfInfoMethod()
})

const tableInfo = reactive<any>({
  tableData: [],
  columns: []
})

const loading = ref(false)
const tableRef = ref()
const editPageRef = ref()
const spyjDialog = ref({
  flag: '',
  showDialog: false
})
const spyjForm = ref({
  spyj: ''
})
const store = useStore()
const specialOrgId = ref<string>('')
const spRoleId = ref<string>('')
const workItemIdString = ref<string>('')
const wfMeetingId = ref<string>('')
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')
const nodeCode = ref<string>('')
const orgFlag = ref<string>('')

const page = {
  total: 0,
  limit: 100,
  page: 1
}

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref({
  XMIDS: '',
  KMLX: '',
  ND: '',
  DWID: '',
  DWNAME: '',
  BUSITYPE: '',
  PAGETYPE: '',
  SM: '',
  ISZS: '',
  SPECIALORGID: ''
})

const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())

  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name)
}

// 查询
const searchHandle = async () => {
  await getTableHeader()
  await getDataList()
}

const getTableHeader = async () => {
  loading.value = true
  const res: any = await getDynamicColumn({
    meetingId: wfMeetingId.value
  })
  if (res.success) {
    tableInfo.columns = res.data
    loading.value = false
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const getDataList = async () => {
  loading.value = true
  let parmas: Params = {
    limit: page.limit,
    page: page.page,
    meetingId: wfMeetingId.value
  }
  let res = await getTableData({ ...parmas })
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data.records
    page.total = res.data.total
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const submitDecWorkflowHandle = async () => {
  submitFlow()
}

const submitFlow = () => {
  loading.value = true
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }
  const wFParam: WFParam = { ...wfDataString.value }
  submitWorkflow(store.getters.getUserMsg.systemCode, wfCodeString.value, workItemIdString.value, wfUserInfo, wFParam, {}, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId,
    spyj: spyjForm.value.spyj,
    wfCode: wfCodeString.value,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    wfData: { ...wfDataString.value },
    nextPersonAndPath: nextPersonAndPath
  }

  const res: any = await finishWf({ ...spfrom })
  if (res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('提交成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}
// 驳回
const rejectDecWorkflowHandle = async () => {
  if (!spyjForm.value.spyj) {
    ElMessage.warning('审批意见不能为空!')
    return
  }
  loading.value = true

  let spfrom = {
    userId: store.getters.getUserMsg.id,
    dwId: wfDataString.value.DWID,
    yssxIds: wfDataString.value.XMIDS,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    wfNodeData: { IS_PASS: 'N' },
    wfCode: wfCodeString.value,
    spjg: 'TH',
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }
  const res: any = await reject({ ...spfrom })
  if (res && res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('驳回成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const isNeedNum = (columns: Columns[], field: string) => {
  let findIndex = columns.findIndex((item: Columns) => item.needSum && item.columnKey === field)
  return findIndex > -1
}

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (tableInfo.columns) {
    const isNum = isNeedNum(tableInfo.columns, column.field)
    if (isNum) {
      return formatValue(cellValue)
    }
  }
  return cellValue
}

const closeHandle = () => {
  spyjForm.value.spyj = ''
  spyjDialog.value.showDialog = false
  loading.value = false
}

const closeDialogHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}

const isShowDialogHandle = (flag: string) => {
  spyjDialog.value.showDialog = true
  spyjDialog.value.flag = flag
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const detailHandle = () => {
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : rejectDecWorkflowHandle()
}
const checkedData = ref<any[]>([])
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  checkedData.value = []
  await tableRef.value.clearCheckboxRow()
  tableRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

const searchDataHandle = () => {
  searchHandle()
}

// 查看详情
const viewHandle = () => {
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }
    checkedData.value[0].id = checkedData.value[0].xm_id
    checkedData.value[0].xmlx = checkedData.value[0].pro_type
    editPageRef.value.isShowModal = true
  }
}
const exportHandle = () => {
  const params = { meetingId: wfMeetingId.value }
  const fileName = '项目明细'
  apiExportHandle(params, fileName, exportData)
}
const reportHandle = async () => {
  const params = { meetingId: wfMeetingId.value }
  const fileName = '评审报告'
  apiExportHandle(params, fileName, downloadReviewReportByMeetingId)
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('1')">驳 回</el-button>
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle" :loading="loading">查看详情</el-button>
        <el-button type="primary" size="mini" plain @click="exportHandle" :loading="loading">项目信息导出</el-button>
        <el-button type="primary" size="mini" plain @click="reportHandle" :loading="loading">评审报告下载</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
    </div>
    <div class="table">
      <vxe-table
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @cell-click="cellClickHandle"
        @checkbox-change="checkChangeHandle"
        @checkbox-all="checkChangeAllHandle"
        :row-config="{ height: 32 }"
        show-overflow
        :loading="loading"
        align="center"
        height="100%"
        ref="tableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :data="tableInfo.tableData"
      >
        <vxe-column type="checkbox" width="80" />
        <template v-for="item in tableInfo.columns" :key="item.field">
          <vxe-colgroup :title="item.title" header-align="center">
            <template v-for="grop in item.children" :key="grop.field">
              <template v-if="grop.visible">
                <vxe-column :formatter="formatterData" header-align="center" align="center" width="200" :field="grop.field" :title="grop.title" />
              </template>
            </template>
          </vxe-colgroup>
        </template>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
        disabled
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <el-dialog
    @close="closeHandle"
    v-loading="loading"
    v-model="spyjDialog.showDialog"
    title="审批意见"
    :destroy-on-close="true"
    :show-close="true"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form :disabled="loading" :model="spyjForm">
      <el-form-item label="审批意见：">
        <el-input maxlength="128" v-model="spyjForm.spyj" type="textarea" :rows="6" resize="none" />
      </el-form-item>
    </el-form>
    <div style="text-align: center">
      <el-button :loading="loading" @click="detailHandle" type="primary" plain size="mini">确 定</el-button>
      <el-button :loading="loading" @click="closeHandle" type="primary" plain size="mini">关 闭</el-button>
    </div>
  </el-dialog>
  <CentralizedModification
    @saveAfter="searchDataHandle"
    :get-api="'LHHS'"
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="checkedData[0]"
    :flag="'VIEW'"
  ></CentralizedModification>
</template>

<style scoped lang="less">
.table-container {
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .pager {
    background-color: #fff;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    background-color: #fff;

    .left,
    .right {
      width: 50%;
    }

    .right {
      text-align: right;
    }
  }
}
</style>
