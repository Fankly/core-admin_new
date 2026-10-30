<!-- 预计完成数填报 -->
<script setup lang="ts">
import { loadUserWfInfo } from '@/api/workflow'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { formatValue } from '@/utils/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useStore } from '@/store/business'
import {
  exportTemplate,
  importYjwcs,
  getDynamicColumn,
  getTableData,
  rejectActivity,
  finishWfActivity,
  saveYjwcz,
  submitWfActivity
} from '@/api/workflow/yjwctbCity'
import ImportExcel from '@/components/ImportExcel/indexNew.vue' //导入组件

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
const wfType = ref<string>('')

const loadUserWfInfoMethod = () => {
  const workItemId = getQueryString('workItemId')
  const workType = getQueryString('type')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfType.value = workType
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
const importRef = ref<any>()
// 预计完成数维护：编辑态开关
const isEditing = ref(false)
// 进入编辑态前的数据快照，用于「取消」回滚
let sourceSnapshot: any[] = []
// 可手动维护的列
const EDITABLE_FIELD = 'yjwcz'
const WYABLE_FIELD = 'erpztys'

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
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')
const nodeCode = ref<string>('')
const orgFlag = ref<string>('')
const isSubmit = ref<boolean>(false)

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
  RW_ID: '',
  PASS: ''
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
  const res: any = await getDynamicColumn({})
  if (res.success) {
    const columns = res.data.filter((item: any) => item.visible)
    tableInfo.columns = columns
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
    workItemId: workItemIdString.value,
    rwId: wfDataString.value.RW_ID
  }
  let res = await getTableData({ ...parmas })
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data.records
    page.total = Number(res.data.total ?? 0)
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const submitHandle = async () => {
  isSubmit.value = true
  await submitFlow()
}

const submitDecWorkflowHandle = async () => {
  isSubmit.value = false
  await submitFlow()
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
  const api = isSubmit.value ? submitWfActivity : finishWfActivity
  const res: any = await api({ ...spfrom })
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
  const res: any = await rejectActivity({ ...spfrom })
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

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (column.title.includes('万元')) return formatValue(cellValue.toString(), 6)
  if (column.field == 'erpztys') return formatValue(cellValue.toString(), 2)
  return cellValue
}

// 列冻结规则：前两列左冻结，末列右冻结
const getColFixed = (index: number): string => {
  if (index <= 1) return 'left'
  if (index === tableInfo.columns.length - 1) return 'right'
  return ''
}

// 是否允许编辑该列
const beforeEditMethod = ({ column }: any) => {
  return isEditing.value && column.field === EDITABLE_FIELD
}

// 进入编辑态
const editHandle = () => {
  sourceSnapshot = JSON.parse(JSON.stringify(tableInfo.tableData))
  isEditing.value = true
}

// 取消编辑，回滚到进入编辑态前的数据
const cancelEditHandle = () => {
  tableInfo.tableData = JSON.parse(JSON.stringify(sourceSnapshot))
  isEditing.value = false
}

// 保存预计完成数
const saveHandle = async () => {
  const dataList = tableInfo.tableData.map((row: any) => ({
    xmId: row.xm_id,
    yjwcz: row[EDITABLE_FIELD]
  }))
  loading.value = true
  const res: any = await saveYjwcz({ items: dataList, workItemId: workItemIdString.value, rwId: wfDataString.value.RW_ID })
  if (res.success) {
    loading.value = false
    isEditing.value = false
    ElMessage.success('保存成功')
    await getDataList()
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
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

// 导入  批量维护
const unitDescImportHandle = async () => {
  let newParmas = {
    workItemId: workItemIdString.value,
    rwId: wfDataString.value.RW_ID
  }
  importRef.value.fromData = newParmas
  let tempApi: any = exportTemplate
  let importApi: any = importYjwcs
  if (!importApi) return
  let params = {
    title: '预计完成数填报',
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: getDataList
  }
  importRef.value.acceptParams(params)
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <template v-if="wfType == '2'">
          <el-button :loading="loading" :disabled="isEditing" type="primary" size="small" plain @click="isShowDialogHandle('0')">通 过</el-button>
          <el-button :loading="loading" :disabled="isEditing" type="primary" size="small" plain @click="isShowDialogHandle('1')">驳 回</el-button>
        </template>
        <template v-else>
          <el-button v-if="!isEditing" :loading="loading" type="primary" size="small" plain @click="editHandle">编 辑</el-button>
          <template v-else>
            <el-button :loading="loading" type="primary" size="small" plain @click="saveHandle">保 存</el-button>
            <el-button :loading="loading" size="small" plain @click="cancelEditHandle">取消编辑</el-button>
          </template>
          <el-button :loading="loading" type="primary" size="small" plain @click="unitDescImportHandle">导 入</el-button>
          <el-button :loading="loading" type="primary" size="small" plain @click="submitHandle">提 交</el-button>
        </template>
        <el-button :loading="loading" type="primary" size="small" plain @click="closeDialogHandle">关 闭</el-button>
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
        :edit-config="{
          trigger: 'click',
          mode: 'cell',
          showStatus: true,
          enabled: isEditing,
          beforeEditMethod
        }"
      >
        <vxe-column type="checkbox" width="80" fixed="left" />
        <template v-for="(item, index) in tableInfo.columns" :key="item.field">
          <vxe-column
            v-if="item.field === EDITABLE_FIELD"
            :formatter="formatterData"
            header-align="center"
            align="right"
            width="200"
            :field="item.field"
            :title="item.title"
            :fixed="getColFixed(index)"
            :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
          />
          <vxe-column
            v-else-if="item.field === WYABLE_FIELD"
            :formatter="formatterData"
            header-align="center"
            align="right"
            width="200"
            :field="item.field"
            :title="item.title"
            :fixed="getColFixed(index)"
          />
          <vxe-column
            v-else
            :formatter="formatterData"
            header-align="center"
            align="center"
            width="200"
            :field="item.field"
            :title="item.title"
            :fixed="getColFixed(index)"
          />
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
      <el-button :loading="loading" @click="detailHandle" type="primary" plain size="small">确 定</el-button>
      <el-button :loading="loading" @click="closeHandle" type="primary" plain size="small">关 闭</el-button>
    </div>
  </el-dialog>
  <ImportExcel ref="importRef" />
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
