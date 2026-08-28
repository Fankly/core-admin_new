<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import baseService from '@/service/baseService'
import { loadUserWfInfo, initWfJavascript } from '@/api/workflow'
import { ElMessage } from 'element-plus'
import { BaseMsgData, DialogData } from '@/views/matter/types/matterDecl'
import { buildWFDefine, loadJsStr, submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import {
  finishActivity,
  rejectActivity,
  rejectOutBoundActivity,
  finishOutBoundActivity,
  finishAdjustActivity,
  rejectAdjustActivity
} from '@/api/workflow/matterDeclare'

onMounted(() => {
  document.querySelector('body')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  document.querySelector('html')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  document.querySelector('#app')?.setAttribute('style', 'height: 100vh;background-color: white;}')
  document.querySelector('.rr-fullscreen')?.setAttribute('style', 'height: 100vh;background-color: white;}')

  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = data.wfData
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

const columns = ref<
  {
    columnKey: string
    columnName: string
  }[]
>([])

const columnsData = ref([])

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref({
  SXIDS: '',
  SQIDS: ''
})

// 分页
const page = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const getQueryString = (name: string) => {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  var queryString = window.location.search
  if (queryString == '' && window.location.href.lastIndexOf('?') != -1) {
    queryString = window.location.href.substring(window.location.href.lastIndexOf('?'))
  }
  var r = queryString.substr(1).match(reg)
  if (r != null) {
    return unescape(r[2])
  }
  return ''
}

// 查询
const searchHandle = () => {
  if (wfCodeString.value === 'WF_MATTERDECLARELC') {
    baseService
      .get('/workflow/declare/getDynamicColumn', {
        userId: store.getters.getUserMsg.id
      })
      .then((res) => {
        columns.value = res.data
      })
    baseService
      .post('/workflow/declare/getPage', {
        limit: 10,
        page: 1,
        id: wfDataString.value.SXIDS.split(','),
        specialorgid: userInfo.value.spOrgId
      })
      .then((res) => {
        columnsData.value = res.data.records
      })
  } else if (wfCodeString.value === 'WF_MATTEROUTBOUNDLC') {
    baseService
      .get('/workflow/outbound/getDynamicColumn', {
        userId: store.getters.getUserMsg.id
      })
      .then((res) => {
        columns.value = res.data
      })
    baseService
      .post('/workflow/outbound/getPage', {
        limit: 10,
        page: 1,
        id: wfDataString.value.SXIDS.split(','),
        specialorgid: userInfo.value.spOrgId
      })
      .then((res) => {
        columnsData.value = res.data.records
      })
  } else if (wfCodeString.value === 'WF_MATTERADJUSTLC') {
    baseService
      .get('/workflow/adjust/getDynamicColumn', {
        userId: store.getters.getUserMsg.id
      })
      .then((res) => {
        columns.value = res.data
      })
    baseService
      .post('/workflow/adjust/getPage', {
        limit: 10,
        page: 1,
        id: wfDataString.value.SQIDS.split(','),
        specialorgid: userInfo.value.spOrgId
      })
      .then((res) => {
        columnsData.value = res.data.records
      })
  }
}

const submitDecWorkflowHandle = () => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }

  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }
  loading.value = true
  submitWorkflow(store.getters.getUserMsg.systemCode, wfCodeString.value, workItemIdString.value, wfUserInfo, {}, wfNodeParam, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = true
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

  if (wfCodeString.value === 'WF_MATTERDECLARELC') {
    const res = await finishActivity({
      ...spfrom
    })
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
  } else if (wfCodeString.value === 'WF_MATTEROUTBOUNDLC') {
    const res = await finishOutBoundActivity({
      ...spfrom
    })
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
  } else if (wfCodeString.value === 'WF_MATTERADJUSTLC') {
    const res = await finishAdjustActivity({
      ...spfrom
    })
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
}
const rejectDecWorkflowHandle = async () => {
  if (!spyjForm.value.spyj) {
    ElMessage.warning('审批意见不能为空!')
    return
  }
  if (wfCodeString.value === 'WF_MATTERDECLARELC') {
    loading.value = true
    let spfrom = {
      userId: store.getters.getUserMsg.id,
      yssxIds: wfDataString.value.SXIDS,
      workItemId: workItemIdString.value,
      wfInstId: wfInstIdString.value,
      spyj: spyjForm.value.spyj,
      spjg: 'TH'
    }
    const res = await rejectActivity({
      ...spfrom
    })

    if (res.success) {
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
  } else if (wfCodeString.value === 'WF_MATTEROUTBOUNDLC') {
    loading.value = true
    let spfrom = {
      userId: store.getters.getUserMsg.id,
      yssxIds: wfDataString.value.SXIDS,
      workItemId: workItemIdString.value,
      wfInstId: wfInstIdString.value,
      spyj: spyjForm.value.spyj,
      spjg: 'TH'
    }
    const res = await rejectOutBoundActivity({
      ...spfrom
    })

    if (res.success) {
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
  } else if (wfCodeString.value === 'WF_MATTERADJUSTLC') {
    loading.value = true
    let spfrom = {
      userId: store.getters.getUserMsg.id,
      yssxIds: wfDataString.value.SQIDS,
      workItemId: workItemIdString.value,
      wfInstId: wfInstIdString.value,
      spyj: spyjForm.value.spyj,
      spjg: 'TH'
    }
    const res = await rejectAdjustActivity({
      ...spfrom
    })

    if (res.success) {
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
}

const viewDecworkflowHandle = () => {
  if (baseMsgData.selectedData && !baseMsgData.selectedData.id) {
    ElMessage.warning('请选择一条数据,进行查看!')
    return
  }
  loadComponent()
  if (wfCodeString.value === 'WF_MATTERDECLARELC') {
    baseMsgData.jd = '1'
  } else if (wfCodeString.value === 'WF_MATTEROUTBOUNDLC') {
    baseMsgData.jd = '2'
  } else if (wfCodeString.value === 'WF_MATTERADJUSTLC') {
    console.log(1)
  }
  baseMsgData.specialOrgId = userInfo.value.spOrgId
  diaLogData.title = '预算事项-查看'
  baseMsgData.operationFlag = 'VIEW'
  diaLogData.isShowPage = true
  diaLogData.isShowAdjustFormDialog = true
}

const closeHandle = () => {
  spyjForm.value.spyj = ''
  spyjDialog.value.showDialog = false
}

const isShowDialogHandle = (flag: string) => {
  spyjDialog.value.showDialog = true
  spyjDialog.value.flag = flag
}

const detailHandle = () => {
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : rejectDecWorkflowHandle()
}

const handleSelectionChange = (val: any) => {
  baseMsgData.selectedData = val
}

const diaLogData = reactive<DialogData>({
  title: '',
  isShowPage: false,
  isShowAdjustFormDialog: false
})

const compName = ref()

const loadComponent = async () => {
  try {
    if (wfCodeString.value === 'WF_MATTERDECLARELC' || wfCodeString.value === 'WF_MATTEROUTBOUNDLC') {
      const comp = await import('@/views/matter/components/formMatterDecl.vue')
      compName.value = comp.default
    } else if (wfCodeString.value === 'WF_MATTERADJUSTLC') {
      const comp = await import('@/views/matter/components/ChangeRequest/index.vue')
      compName.value = comp.default
    }
  } catch (error) {
    console.error('Error loading component:', error)
  }
}

const isListEnum = reactive([
  {
    label: '是',
    value: '1'
  },
  {
    label: '否',
    value: '0'
  }
])

// 树形结构props类型
const treeProps = reactive({
  defaultProps: {
    children: 'children',
    label: 'text',
    id: 'id'
  },
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

const baseMsgData = reactive<BaseMsgData>({
  yjdwListData: [],
  isYapListData: isListEnum,
  projectTypeData: {
    projectType: [],
    defaultProps: treeProps.projectTypeProps
  },
  specialOrgId: '',
  operationFlag: '',
  yssxbm: '',
  selectedData: {},
  jd: ''
})
</script>

<template>
  <div class="table-container">
    <div class="table-operation">
      <el-button type="primary" size="mini" plain @click="viewDecworkflowHandle">查 看</el-button>
      <el-button type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
      <el-button type="primary" size="mini" plain @click="isShowDialogHandle('1')">驳 回</el-button>
    </div>
    <div class="table-table">
      <el-table @current-change="handleSelectionChange" highlight-current-row height="100%" :data="columnsData" fit border stripe>
        <template v-for="item in columns" :key="item.columnKey">
          <el-table-column show-overflow-tooltip width="160" :label="item.columnName" :prop="item.columnKey"></el-table-column>
        </template>
      </el-table>
      <el-pagination></el-pagination>
    </div>
    <div class="pagination">
      <el-pagination
        :current-page="page.page"
        background
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
    <el-form :model="spyjForm">
      <el-form-item label="审批意见：">
        <el-input maxlength="128" v-model="spyjForm.spyj" type="textarea" :rows="6" resize="none" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button @click="detailHandle" type="primary" plain size="mini">确 定</el-button>
        <el-button @click="closeHandle" type="primary" plain size="mini">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
  <component @closeDialog="diaLogData.isShowPage = false" :is="compName" :baseMsgData="baseMsgData" :diaLogData="diaLogData"></component>
</template>

<style scoped lang="less">
.table-container {
  padding: 10px;
  box-sizing: border-box;
  height: 100%;
  .table-table {
    height: calc(100% - 70px);
  }
  .table-operation {
    padding-bottom: 10px;
  }
}
</style>
