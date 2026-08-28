<!-- 超期预警 -->
<script setup lang="ts">
import { loadUserWfInfo } from '@/api/workflow'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { formatValue } from '@/utils/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { getDynamicColumn, getTableData, reject, finishWf, hasNextBizTime, updateReason } from '@/api/lyg/index'

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
      wfYjBizCode.value = data.wfData.YJ_BIZ_CODE
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
const spyjDialog = ref({
  flag: '',
  showDialog: false
})
const spyjForm = ref({
  spyj: ''
})
const store = useStore()
const workItemIdString = ref<string>('')
const wfYjBizCode = ref<string>('')
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
    yjBizCode: wfYjBizCode.value
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
    xmIdList: wfDataString.value.XMIDS.split(','),
    yjBizCode: wfYjBizCode.value
  }
  let res = await getTableData({ ...parmas })
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data
    page.total = res.data.length
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const submitDecWorkflowHandle = async () => {
  if (nodeCode.value == 'XMFZRQRYJ') {
    const parmas = {
      xmIdList: wfDataString.value.XMIDS.split(','),
      yjBizCode: wfYjBizCode.value
    }
    const res: any = await hasNextBizTime(parmas)
    if (!res.success) return ElMessage.error(res.msg)
    const isNext = res.data
    isNext ? submitWFCallback('') : submitFlow()
    return
  }
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

const submitWFCallback = async (nextPersonAndPath: string) => {
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId,
    spyj: spyjForm.value.spyj,
    wfCode: wfCodeString.value,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    wfData: { ...wfDataString.value, PASS: 'Y' },
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
    xmIds: wfDataString.value.XMIDS,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    wfNodeData: { IS_PASS: 'N' },
    wfData: { PASS: 'N' },
    wfCode: wfCodeString.value,
    spjg: 'TH',
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }
  const res: any = await finishWf({ ...spfrom })
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
const isReason = async () => {
  if (checkedData.value.length == 0) return ElMessage.warning('请选择一条数据！')
  ElMessageBox.prompt('请输入原因说明', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.+$/,
    inputErrorMessage: '原因说明不能为空'
  })
    .then(async (val: any) => {
      const xmIdList = checkedData.value.map(({ id }: any) => id)
      const params = {
        xmIdList: xmIdList,
        yjBizCode: wfYjBizCode.value,
        reason: val.value
      }
      let res = await updateReason({ ...params })
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('保存成功')
      await getDataList()
    })
    .catch((error: any) => {
      console.log(error)
    })
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <el-button :loading="loading" v-if="nodeCode == 'XMFZRQRYJ'" type="primary" size="mini" plain @click="isReason">维护原因说明</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('1')">驳 回</el-button>
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
          <!-- <vxe-colgroup :title="item.title" header-align="center">
            <template v-for="grop in item.children" :key="grop.field">
              <template v-if="grop.visible">
              </template>
            </template>
          </vxe-colgroup> -->
          <vxe-column :formatter="formatterData" header-align="center" align="center" width="200" :field="item.field" :title="item.title" />
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
