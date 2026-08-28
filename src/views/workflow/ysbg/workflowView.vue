<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { loadUserWfInfo } from '@/api/workflow'
import { ElMessage } from 'element-plus'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { formatValue } from '@/utils/utils'
import { getDynamicTable, getYsbgshListPage } from '@/api/workflow/ysbg'
import { finishActivity, rejectActivity } from '@/api/workflow/ysbg'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { downloadAttach } from '@/api/service/requirement'

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
  columns: [],
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let func: any = {
        ['WF_MISXMYSBGLC']: getYsbgshListPage
      }
      let params: any = {
        id: wfDataString.value.XMIDS.split(',')
      }
      let flag = wfCodeString.value
      return new Promise((resolve: any) => {
        func[flag]({
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
  FQBM: '',
  FQZZ: '',
  SFGMB: ''
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

  let func: any = {
    ['WF_MISXMYSBGLC']: getDynamicTable
  }
  let res: any
  if (flag === 'WF_MISXMYSBGLC') {
    res = await func[flag]({
      searchType: '2'
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
    ['WF_MISXMYSBGLC']: getYsbgshListPage
  }
  let parmas: Params = {
    id: wfDataString.value.XMIDS.split(','),
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
    wfData: wfDataString.value,
    nextPersonAndPath: nextPersonAndPath
  }
  let res: any
  if (wfCodeString.value === 'WF_MISXMYSBGLC') {
    res = await finishActivity({
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
    sfgmb: wfDataString.value.SFGMB,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    spjg: 'TH'
  }
  let res: any
  if (wfCodeString.value === 'WF_MISXMYSBGLC') {
    res = await rejectActivity({
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
    xmlx: row['pro_type']
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

const handleDownloadAttach = async (row: any) => {
  const uuid = row.uuid as string
  loading.value = true
  try {
    let res = await downloadAttach(uuid)
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    if (res.headers) {
      let filename = row['attach_name']
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
    }
  } catch (e) {
    handleError(e as Error, '下载附件失败')
  } finally {
    loading.value = false
  }
}

const handleError = (error: Error, message = '操作失败'): void => {
  console.error(`${message}`, error)
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
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
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle">查看详情</el-button>
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
        <template v-for="item in tableInfo.columns" :key="item.code">
          <vxe-column
            v-if="item['columnKey'] === 'attach_name'"
            :formatter="formatterData"
            header-align="center"
            align="center"
            width="200"
            :field="item.columnKey"
            :title="item.columnValue"
          >
            <template #default="{ row }">
              <el-button @click="() => handleDownloadAttach(row)" type="text">{{ row['attach_name'] }}</el-button>
            </template>
          </vxe-column>
          <vxe-column
            v-else
            :formatter="formatterData"
            header-align="center"
            align="center"
            width="200"
            :field="item.columnKey"
            :title="item.columnValue"
          >
          </vxe-column>
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
</style>
