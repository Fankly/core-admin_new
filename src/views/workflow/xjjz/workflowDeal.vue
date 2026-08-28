<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { loadUserWfInfo } from '@/api/workflow'
import { ElMessage } from 'element-plus'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { finishActivity, rejectActivity } from '@/api/workflow/xjjz'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { useService } from '@/views/workflow/xjjz/hooks/useService'

const {
  gridOptions,
  handleResetFormData,
  handleSearchPageData,
  handleDownloadFile,
  page,
  limitChangeHandle,
  pageChangeHandle,
  checkedData,
  setWfDataString,
  setDataParams,
  setWfCodeString,
  hasSelectedProjects
} = useService()

onMounted(() => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      setDataParams(data.user)
      wfDataString.value = { ...data.wfData }
      setWfDataString(wfDataString.value)
      setWfCodeString(data.wfCode)
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

const loading = ref(false)
const gridRef = ref()
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

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: '',
  dwId: ''
})
//工作流全局变量
const wfDataString = ref({
  XMID: '',
  FQBM: '',
  FQZZ: '',
  PROTYPE: ''
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
  await handleSearchPageData()
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
    wfData: wfDataString.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await finishActivity({
    ...spfrom
  })
  if (res && res.success) {
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
    yssxIds: wfDataString.value.XMID,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    spjg: 'TH',
    wfCode: wfCodeString.value
  }
  let res = await rejectActivity({
    ...spfrom
  })
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

const viewHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }
    checkedData.value[0].id = checkedData.value[0].xmId
    checkedData.value[0].xmlx = checkedData.value[0].proType
    editPageRef.value.isShowModal = true
  }
}

const detailHandle = () => {
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : rejectDecWorkflowHandle()
}

const disabled = computed(() => loading.value)

const cellClickHandle = async ({ row }: any) => {
  checkedData.value = []
  checkedData.value.push({
    ...row,
    id: row['xmid'],
    xmlx: row['proTypeId']
  })
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle">查看详情</el-button>
        <el-button :disabled="disabled" type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
        <el-button :disabled="disabled" type="primary" size="mini" plain @click="isShowDialogHandle('1')">驳 回</el-button>
        <el-button type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
    </div>
    <div class="table">
      <vxe-grid ref="gridRef" v-bind="gridOptions" @current-change="cellClickHandle">
        <template #xmmc_item="{ data }">
          <el-input v-model="data.xmmc" type="text"></el-input>
        </template>
        <template #xjjzAttachname_default="{ row }">
          <el-button type="text" v-if="row.xjjzAttachname" @click="() => handleDownloadFile(row.xjjzUuid, row.xjjzAttachname)">{{
            row.xjjzAttachname
          }}</el-button>
          <span v-else>{{ row.xjjzAttachname }}</span>
        </template>
        <template #operate_item>
          <el-button type="primary" size="mini" plain @click="searchHandle">查 询</el-button>
          <el-button size="mini" plain @click="handleResetFormData">重 置</el-button>
        </template>
      </vxe-grid>
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

:deep(.vxe-table--render-default .vxe-body--row.row--current) {
  .el-button--text {
    color: white;
  }
}
</style>
