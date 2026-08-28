<script setup lang="ts">
import { getPage } from '@/api/service/zlxqszy'
import { loadUserWfInfo } from '@/api/workflow'
import { finishCwActivity, finishZyActivity, rejectCwActivity, rejectZyActivity } from '@/api/workflow/zl'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'

interface Params {
  [key: string]: any
}

onMounted(() => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId
      wfCodeString.value = data.wfCode
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
})

const tableInfo = reactive<any>({
  tableData: [],
  columns: [
    { field: 'ztName', width: 200, title: '状态' },
    { field: 'requestor', width: 200, title: '填报单位' },
    { field: 'requestor', width: 200, title: '承租方' },
    { field: 'zlxz', width: 200, title: '租赁性质1' },
    { field: 'zlxz2', width: 200, title: '租赁性质2' },
    { field: 'xmmc', width: 200, title: '租赁需求名称' },
    { field: 'czf', width: 200, title: '出租方' },
    { field: 'czfsx', width: 200, title: '出租方属性' },
    { field: 'ssnr', width: 200, title: '实施内容及必要性说明' },
    { field: 'zrzclb', width: 200, title: '租入资产类型' },
    { field: 'sgbm', width: 200, title: '省公司专业归口管理部门' },
    { field: 'zrzcjtmc', width: 200, title: '租入资产具体名称' },
    { field: 'sl', width: 200, title: '数量' },
    { field: 'dw', width: 200, title: '单位' },
    { field: 'fwghyt', width: 200, title: '房屋/仓库规划用途' },
    { field: 'fwmj', width: 200, title: '房屋/仓库面积(平方米)' },
    { field: 'zrzcjzTax', width: 200, title: '含税租入资产价值(元)' },
    { field: 'allInvestTax', width: 200, title: '含税总租金(元)' },
    { field: 'zzjgc', width: 200, title: '含税总租构成' },
    { field: 'prjSdate', width: 200, title: '预计起租日' },
    { field: 'prjEdate', width: 200, title: '预计到期日' },
    { field: 'leasemonth', width: 200, title: '租赁期' },
    { field: 'dqclfs', width: 200, title: '到期处置方式' },
    { field: 'jcyj', width: 200, title: '需求决策依据' },
    { field: 'zjzjyj', width: 200, title: '租金作价依据' },
    { field: 'xmssr', width: 200, title: '填报人' },
    { field: 'phoneNum', width: 200, title: '联系方式' }
  ]
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
  GKBM_WF: '',
  GKCS: '',
  ZJC: ''
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
  await getDataList()
}

const getDataList = async () => {
  loading.value = true
  let parmas: Params = {
    limit: page.limit,
    page: page.page,
    xmIds: wfDataString.value.XMIDS
  }
  let res = await getPage({ ...parmas })
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
  if (!spyjForm.value.spyj) {
    ElMessage.warning('审批意见不能为空!')
    return
  }
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
    wfData: wfDataString.value,
    nextPersonAndPath: nextPersonAndPath
  }
  let res: any
  if (wfCodeString.value === 'WF_ZLXQSZYSHLC') {
    res = await finishZyActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_ZLXQSCWSHLC') {
    res = await finishCwActivity({
      ...spfrom
    })
  }
  if (res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('提交成功！', '*')
    } finally {
      loading.value = false
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
    yssxIds: wfDataString.value.XMIDS,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    spjg: 'TH'
  }
  let res: any
  if (wfCodeString.value === 'WF_ZLXQSZYSHLC') {
    res = await rejectZyActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_ZLXQSCWSHLC') {
    res = await rejectCwActivity({
      ...spfrom
    })
  }
  if (res && res.success) {
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('驳回成功！', '*')
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const closeHandle = () => {
  spyjForm.value.spyj = ''
  spyjDialog.value.showDialog = false
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

const checkedData = ref<any[]>([])
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const cellClickHandle = async ({ row }: any) => {
  checkedData.value = []
  checkedData.value.push({
    ...row,
    id: row['xmid'],
    xmlx: row['protypeId']
  })
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

const detailHandle = () => {
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : rejectDecWorkflowHandle()
}

const disabled = computed(() => loading.value)
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <el-button type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
    </div>
    <div class="table">
      <vxe-table
        :row-config="{ isCurrent: true, height: 32 }"
        @current-change="cellClickHandle"
        show-overflow
        :loading="loading"
        align="center"
        height="100%"
        ref="tableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :data="tableInfo.tableData"
      >
        <vxe-column header-align="center" align="center" width="80" type="seq"> </vxe-column>
        <template v-for="item in tableInfo.columns" :key="item.code">
          <vxe-column header-align="center" align="center" width="200" :field="item.field" :title="item.title"> </vxe-column>
        </template>
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
    <template #footer>
      <div style="text-align: center">
        <el-button :loading="loading" @click="detailHandle" type="primary" plain size="mini">确 定</el-button>
        <el-button :loading="loading" @click="closeHandle" type="primary" plain size="mini">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
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
