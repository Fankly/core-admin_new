<script setup lang="ts">
import { getPublicData } from '@/api/common'
import { getDynamicTableByUser, getXmxqshListPage } from '@/api/service/requirement'
import { loadUserWfInfo } from '@/api/workflow'
import { finishActivity, finishZlActivity, getSearchData, rejectActivity, rejectZlActivity } from '@/api/workflow/xm'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { checkSameProperty, formatValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import ProvinceModal from '@/views/workflow/xm/components/ProvinceModal.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'

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

interface PublicCode {
  code: string
  name: string
}

type SearchCode = 'XQLR-VIEW' | 'ZLXQMXCX'

const provinceEditValue = ref<string[]>([])
const provinceModalRef = ref<InstanceType<typeof ProvinceModal>>()

const getPublicCode = async () => {
  try {
    const res = await getPublicData('ZLXM_MODIFY_GKBM_NODE')
    if (res.success) {
      provinceEditValue.value = res.data.map((item: PublicCode) => item.code)
      return true
    } else {
      throw new Error(res.msg)
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
    return false
  }
}

const loadUserWfInfoMethod = () => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId
      nodeCode.value = data.nodeCode
      wfCodeString.value = data.wfCode
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
onMounted(async () => {
  const res = await getPublicCode()
  if (res) {
    loadUserWfInfoMethod()
  }
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
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')
const nodeCode = ref<string>('')

const page = {
  total: 0,
  limit: 20,
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
  await getTableHeader(wfCodeString.value)
  await getDataList(wfCodeString.value)
}

const getTableHeader = async (flag: string) => {
  loading.value = true
  let params: Params = {
    nd: wfDataString.value.ND,
    kmlx: wfDataString.value.KMLX,
    busiType: wfDataString.value.BUSITYPE,
    dwId: wfDataString.value.DWID
  }

  let func: any = {
    ['WF_CBXQSHLC']: getDynamicTableByUser,
    ['WF_ZLXQSHLC']: getDynamicTableByUser
  }
  let res: any
  const searchCode: SearchCode = flag === 'WF_CBXQSHLC' ? 'XQLR-VIEW' : 'ZLXQMXCX'
  if (flag === 'WF_CBXQSHLC' || flag === 'WF_ZLXQSHLC') {
    res = await func[flag]({
      searchCode: searchCode,
      searchType: '2',
      ...params
    })
  }
  if (res.success) {
    loading.value = false
    tableInfo.columns = res.data
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const getDataList = async (flag: string) => {
  loading.value = true
  let func: any = {
    ['WF_CBXQSHLC']: getXmxqshListPage,
    ['WF_ZLXQSHLC']: getSearchData
  }
  let parmas: Params = {
    id: wfDataString.value.XMIDS.split(','),
    xmIds: wfDataString.value.XMIDS,
    limit: page.limit,
    page: page.page
  }
  let res = await func[flag]({ ...parmas })
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data.records
    page.total = res.data.total
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const submitDecWorkflowHandle = () => {
  loading.value = true
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }
  specialOrgId.value = userInfo.value.spOrgId
  spRoleId.value = userInfo.value.spRoleId
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }

  submitWorkflow(store.getters.getUserMsg.systemCode, wfCodeString.value, workItemIdString.value, wfUserInfo, {}, wfNodeParam, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value,
    spyj: spyjForm.value.spyj,
    spjg: wfNodeParam.IS_PASS,
    wfCode: wfCodeString.value,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    wfNodeData: wfNodeParam,
    nextPersonAndPath: nextPersonAndPath
  }
  let res: any
  if (wfCodeString.value === 'WF_CBXQSHLC') {
    res = await finishActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_ZLXQSHLC') {
    res = await finishZlActivity({
      ...spfrom
    })
  }
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
    spjg: 'TH'
  }
  let res: any
  if (wfCodeString.value === 'WF_CBXQSHLC') {
    res = await rejectActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_ZLXQSHLC') {
    res = await rejectZlActivity({
      ...spfrom
    })
  }
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
  if (flag === '0' && wfCodeString.value === 'WF_ZLXQSHLC' && !checkSameProperty(tableInfo.tableData, 'sdkzybm_id')) {
    ElMessage.warning('省对口专业部门相同的记录才允许通过，请检查')
    return
  }
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

const viewHandle = () => {
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }

    editPageRef.value.isShowModal = true
  }
}

const isShowProvinceEdit = computed(() => wfCodeString.value === 'WF_ZLXQSHLC' && provinceEditValue.value.includes(nodeCode.value))

const provinceEdit = () => {
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    // 选择归口部门
    let params = {
      xmIds: checkedData.value.map((item: any) => item.id),
      workItemId: workItemIdString.value
    }
    if (provinceModalRef.value) {
      provinceModalRef.value.acceptParams(params)
    }
  }
}

const refershData = () => {
  loadUserWfInfoMethod()
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <!-- 判断省归口部门按钮的隐藏和显示 -->
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle">查看详情</el-button>
        <el-button type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
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
        <vxe-column type="checkbox" width="80"></vxe-column>
        <vxe-column
          v-for="item in tableInfo.columns"
          :key="item.code"
          :formatter="formatterData"
          header-align="center"
          align="center"
          width="200"
          :field="item.columnKey"
          :title="item.columnValue"
        >
        </vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
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
  <ProvinceModal @detail="refershData" ref="provinceModalRef" />
  <CentralizedModification ref="editPageRef" :userInfo="userInfo" :formData="checkedData[0]" flag="VIEW"></CentralizedModification>
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
