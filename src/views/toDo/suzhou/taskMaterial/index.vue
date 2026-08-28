<template>
  <div class="material-task-detail" v-if="isShowPage">
    <div class="operation">
      <el-button type="primary" size="mini" plain @click="notifyHandle">知道了</el-button>
      <el-button v-if="!isEditing" type="primary" size="mini" plain :loading="exporting" @click="handleEdit">编 辑</el-button>
      <template v-else>
        <el-button type="primary" size="mini" plain :loading="exporting" @click="handleSave">保 存</el-button>
        <el-button size="mini" plain :disabled="exporting" @click="handleCancelEdit">取 消</el-button>
      </template>
      <el-button type="primary" size="mini" plain :loading="exporting" @click="handleImport">导 入</el-button>
      <el-button plain size="mini" type="primary" :loading="exporting" @click="handleExport">导 出</el-button>
      <el-button plain size="mini" type="primary" :loading="exporting" @click="handleSend">下 发</el-button>
      <el-button plain size="mini" type="primary" :loading="exporting" @click="handleConfirm">确 认</el-button>
      <el-button plain size="mini" type="primary" :loading="exporting" @click="handleLog">修改日志</el-button>
      <!-- <el-button plain size="mini" type="primary" :loading="exporting" @click="handleXmView">查看项目明细</el-button> -->
      <el-button type="primary" size="mini" plain @click="closeDialogHandle">关闭页面</el-button>
    </div>
    <div class="search-area">
      <el-form :model="searchForm" class="search-form" label-suffix=" : " label-width="120px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="项目定义" class="search-item">
              <ReMultipleText
                v-model="searchForm.xmdy"
                dialog-title="项目定义"
                tooltip-text="项目定义"
                placeholder="请输入项目定义,多个项目定义以逗号分隔"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目描述" class="search-item">
              <el-input v-model="searchForm.post1" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="物料编码" class="search-item">
              <ReMultipleText
                v-model="searchForm.wlbm"
                dialog-title="物料编码"
                tooltip-text="物料编码"
                placeholder="请输入物料编码,多个物料编码以逗号分隔"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="物料描述" class="search-item">
              <el-input v-model="searchForm.maktx" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="年度" prop="mjahr">
              <el-date-picker
                style="width: 100%"
                :clearable="false"
                v-model="searchForm.mjahr"
                value-format="YYYY"
                format="YYYY"
                type="year"
                placeholder="请选择年度"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" class="search-item">
              <el-select style="width: 100%" v-model="searchForm.status" clearable>
                <el-option v-for="item in statusOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="匹配结果" class="search-item">
              <el-select style="width: 100%" v-model="searchForm.ppjg" clearable>
                <el-option v-for="item in ppOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <div style="text-align: right">
              <el-button type="primary" plain @click="handleSearch">查 询</el-button>
              <el-button plain @click="handleReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid ref="gridRef" v-bind="gridOptions">
        <template #confirmIsGdzcName_default="{ row }">
          <span>{{ formatColumnValue(row, 'confirmIsGdzcName') }}</span>
        </template>
        <template #confirmIsGdzcName_edit="{ row }">
          <vxe-select
            v-model="row.confirmIsGdzc"
            style="width: 100%"
            transfer
            placeholder="请选择"
            clearable
            @change="handleConfirmIsGdzcChange(row, $event.value)"
          >
            <vxe-option v-for="item in confirmIsGdzcOptions" :key="item.value" :label="item.label" :value="item.value" />
          </vxe-select>
        </template>
        <template #sourceDirRowNum_edit="{ row }">
          <el-input v-model.trim="row.sourceDirCode" @blur="getProName(row)" :maxlength="2000" clearable placeholder="请输入" />
        </template>
        <template #sourceDirDesc_edit="{ row }">
          <el-input v-model.trim="row.sourceDirDesc" :maxlength="2000" clearable placeholder="请输入" />
        </template>
        <template #reasonWhenNotGdzc_edit="{ row }">
          <el-input v-model.trim="row.reasonWhenNotGdzc" :maxlength="2000" clearable placeholder="请输入" />
        </template>
        <template #reasonWhenYzgGdzc_edit="{ row }">
          <el-input v-model.trim="row.reasonWhenYzgGdzc" :maxlength="2000" clearable placeholder="请输入" />
        </template>
        <template #reasonWhenWzgGdzc_edit="{ row }">
          <el-input v-model.trim="row.reasonWhenWzgGdzc" :maxlength="2000" clearable placeholder="请输入" />
        </template>
      </vxe-grid>
    </div>
    <div class="main-pagination">
      <el-pagination
        :current-page="page.page"
        background
        :page-sizes="[20, 50, 100, 200]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
  <MaterialTaskLog ref="materialTaskLogRef" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
</template>

<script setup lang="ts" name="/workflow/suzhou/taskMaterial">
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  exportMaterialTaskDetail,
  getMaterialTaskDetailConfirm,
  getMaterialTaskDetailPage,
  getSourceDirDescByCode,
  getMaterialTaskDetailIssue,
  importData,
  getMaterialTaskDetailSave
} from '@/api/suzhou/materialTask'
import type { MaterialTaskDetailPageParams, MaterialJudgmentConfirm, MaterialJudgmentIssue } from '@/api/suzhou/materialTask'
import type { MaterialTaskDetailRow, MaterialTaskRow } from '@/views/suzhou/common/types/material'
import type { VxeGridProps } from 'vxe-table'
import { cleanQueryParams, getRoleQueryParams } from '@/views/suzhou/common/utils/params'
import { useStore } from 'vuex'
import { getPublicCodesList } from '@/api/common'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import MaterialTaskLog from '@/views/suzhou/materialTask/modules/materialTaskLog.vue'
import { useRouter } from 'vue-router'
import { notify } from '@/api/workflow'

const statusOptions = ref<Array<{ code: string; name: string }>>([])
const ppOptions = ref<Array<{ code: string; name: string }>>([
  {
    code: '0',
    name: '未匹配'
  },
  {
    code: '1',
    name: '已匹配'
  }
])
const searchForm = ref<any>({})
const importRef = ref()
const materialTaskLogRef = ref<InstanceType<typeof MaterialTaskLog>>()
const gridRef = ref()
const router = useRouter()
const wfData = reactive<any>({
  workItemIdString: '',
  taskId: '',
  dwId: '',
  dwName: '',
  bmId: '',
  bmName: '',
  roleId: '',
  roleName: ''
})
const isShowPage = ref<any>()

const isEditing = ref(false)
const loading = ref(false)
const exporting = ref(false)
const currentTask = ref<MaterialTaskRow>()
const store = useStore()
const confirmIsGdzcOptions = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
]

const page = reactive({
  page: 1,
  limit: 20,
  total: 0 as number | string
})

const editableFields = ['sourceDirCode', 'sourceDirDesc', 'confirmIsGdzcName', 'reasonWhenNotGdzc', 'reasonWhenYzgGdzc', 'reasonWhenWzgGdzc']

const textEditRender = {
  name: 'input',
  autofocus: '.el-input__inner',
  autoselect: true
}

const selectEditRender = {
  autofocus: '.vxe-input--inner'
}

const gridOptions = reactive<VxeGridProps<MaterialTaskDetailRow>>({
  border: true,
  stripe: true,
  keepSource: true,
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: false,
  headerAlign: 'center',
  align: 'center',
  rowConfig: {
    height: 32
  },
  columnConfig: {
    resizable: true
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    beforeEditMethod: ({ column }: any) => {
      return isEditing.value && editableFields.includes(column.field)
    }
  },
  columns: [
    { type: 'checkbox', headerAlign: 'center', align: 'center', width: 50 },
    { type: 'seq', width: 60, title: '序号' },
    { field: 'mjahr', title: '年度', width: 120 },
    { field: 'pspid', title: '项目定义', width: 160 },
    { field: 'post1', title: '项目描述', width: 220 },
    { field: 'matnr', title: '物料编码', width: 160 },
    { field: 'maktx', title: '物料描述', width: 220 },
    { field: 'mblnr', title: '凭证编码', width: 160 },
    { field: 'menge', title: '数量', width: 100 },
    { field: 'unitPrice', title: '单价', width: 100 },
    { field: 'proType', title: '项目类型', width: 120 },
    { field: 'yjdw', title: '一级单位', width: 120 },
    { field: 'ejdw', title: '二级单位', width: 120 },
    { field: 'applyCenter', title: '归口部门', width: 120 },
    { field: 'createor', title: '创建人', width: 100 },
    { field: 'updater', title: '修改人', width: 100 },
    { field: 'xqSubmitUsername', title: '需求提交人', width: 100 },
    {
      field: 'sourceDirCode',
      title: 'Ⅲ级目录编码',
      width: 160,
      fixed: 'right',
      editRender: textEditRender,
      slots: { edit: 'sourceDirRowNum_edit' }
    },
    {
      field: 'sourceDirDesc',
      title: '同源目录对应名称',
      width: 180,
      fixed: 'right',
      editRender: textEditRender,
      slots: { edit: 'sourceDirDesc_edit' }
    },
    {
      field: 'confirmIsGdzcName',
      fixed: 'right',
      title: '确认是否为固定资产（是/否）',
      width: 120,
      editRender: selectEditRender,
      slots: { default: 'confirmIsGdzcName_default', edit: 'confirmIsGdzcName_edit' }
    },
    {
      field: 'reasonWhenNotGdzc',
      title: '如判断不为固定资产，请说明原因',
      width: 180,
      fixed: 'right',
      editRender: textEditRender,
      slots: { edit: 'reasonWhenNotGdzc_edit' }
    },
    {
      field: 'reasonWhenWzgGdzc',
      title: '如判断确为固定资产并已整改请简要说明',
      width: 180,
      fixed: 'right',
      editRender: textEditRender,
      slots: { edit: 'reasonWhenWzgGdzc_edit' }
    },
    {
      field: 'reasonWhenYzgGdzc',
      title: '如判断确为固定资产但尚未整改，请说明整改方案',
      width: 180,
      fixed: 'right',
      editRender: textEditRender,
      slots: { edit: 'reasonWhenYzgGdzc_edit' }
    },
    { field: 'statusName', title: '状态', width: 100, fixed: 'right' }
  ],
  data: [],
  rowStyle: ({ row }: any) => {
    if (row.sourceDirCode && row.sourceDirCode != '未匹配到') {
      return {
        color: 'red'
      }
    }
  }
})

const checkEditStatus = () => {
  if (!isEditing.value) return false
  ElMessage.warning('请先保存或取消当前编辑')
  return true
}

const handleSearch = () => {
  if (checkEditStatus()) return
  getTableData()
}
const handleReset = () => {
  if (checkEditStatus()) return
  for (let key in searchForm.value) {
    searchForm.value[key] = null
  }
  getTableData()
}

const modalTitle = computed(() => {
  const taskName = currentTask.value?.taskName
  return taskName ? `任务明细-${taskName}` : '任务明细'
})

const buildParams = (): MaterialTaskDetailPageParams => {
  return cleanQueryParams({
    page: page.page,
    limit: page.limit,
    taskId: currentTask.value?.taskId,
    ...searchForm.value,
    pspidList: searchForm.value.xmdy ? searchForm.value.xmdy.split(',') : [],
    matnrList: searchForm.value.wlbm ? searchForm.value.wlbm.split(',') : [],
    ...wfData
  }) as MaterialTaskDetailPageParams
}

const hasTaskId = () => currentTask.value?.taskId !== undefined && currentTask.value?.taskId !== null && currentTask.value?.taskId !== ''

const getTableData = async () => {
  if (!hasTaskId()) return
  loading.value = true
  try {
    const res = await getMaterialTaskDetailPage(buildParams())
    if (!res.success) throw new Error(res.msg || '查询任务明细失败')
    gridOptions.data = normalizeTableRows(res.data?.records || [])
    gridOptions.data.forEach((item: any) => {
      item.sourceDirCode = item.sourceDirCode || '未匹配到'
      item.sourceDirDesc = item.sourceDirDesc || '未匹配到'
    })
    page.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
    isShowPage.value = true
  }
}

const parseExportFilename = (res: any) => {
  const disposition = res?.headers?.['content-disposition'] || res?.headers?.['Content-Disposition']
  const filename = disposition
    ?.split(';')
    ?.find((item: string) => item.trim().startsWith('filename='))
    ?.split('=')?.[1]
    ?.replace(/"/g, '')
  if (!filename) return '物料判定任务明细.xlsx'
  return decodeURI(decodeURI(filename))
}

const getSelectedDetailIdList = () => {
  const $table = gridRef.value
  const selectData = $table?.getCheckboxRecords?.() || []
  return selectData.map(({ detailId }: MaterialTaskDetailRow) => detailId)
}

const buildIssueParams = (): MaterialJudgmentIssue => {
  const params = buildParams()
  return {
    detailIdList: getSelectedDetailIdList(),
    taskId: params.taskId,
    specialOrgId: params.bmId,
    userId: store.getters.getUserMsg.id
  }
}

const handleConfirm = async () => {
  if (checkEditStatus()) return
  if (!hasTaskId()) return
  exporting.value = true
  const issueParams: MaterialJudgmentConfirm = {
    ...buildIssueParams(),
    operator: {
      userId: store.getters.getUserMsg.id,
      userName: store.getters.getUserMsg.name
    }
  }
  const res: any = await getMaterialTaskDetailConfirm({ ...issueParams })
  if (res.success) {
    getTableData()
    ElMessage.success('已确认！')
  } else {
    ElMessage.error(res.msg)
  }
  exporting.value = false
}

// 修改日志
const handleLog = () => {
  if (checkEditStatus()) return
  if (!hasTaskId()) return
  materialTaskLogRef.value?.open({
    taskId: currentTask.value?.taskId as number | string
  })
}

const handleXmView = () => {
  if (checkEditStatus()) return
  if (!hasTaskId()) return
  const params = buildParams()
  const $table = gridRef.value
  const selectData = $table.getCheckboxRecords()
  if (selectData.length == 0) return ElMessage.warning('请选择数据')
  const xmbmList = selectData.map(({ pspid }: any) => pspid)
  const xmbm = xmbmList.join(',')
  const routerUrl: any = router.resolve({
    name: '/budget-process/process-42',
    query: {
      xmbm: xmbm,
      specialorgid: params.bmId,
      roleCode: params.roleCode,
      roleId: params.roleId,
      spRoleId: params.spRoleId
    }
  })
  window.open(routerUrl.href, '_blank')
}

const handleSend = async () => {
  if (checkEditStatus()) return
  if (!hasTaskId()) return
  exporting.value = true
  const issueParams = buildIssueParams()
  const res: any = await getMaterialTaskDetailIssue({ ...issueParams })
  if (res.success) {
    getTableData()
    let msg = res.data.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'success',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  } else {
    ElMessage.error(res.msg)
  }
  exporting.value = false
}

// 导入
const handleImport = () => {
  if (checkEditStatus()) return
  let newParmas = { ...buildParams() }
  importRef.value.fromData = {
    ...newParmas,
    'operator.userId': store.getters.getUserMsg.id,
    'operator.userName': store.getters.getUserMsg.name
  }
  let tempApi = exportMaterialTaskDetail
  let importApi = importData
  if (!tempApi && !importApi) return
  let params = {
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
    title: '物料判定任务明细',
    getTableList: getTableData
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

const handleExport = async () => {
  if (checkEditStatus()) return
  if (!hasTaskId()) return
  exporting.value = true
  try {
    const res: any = await exportMaterialTaskDetail(buildParams())
    const url = window.URL.createObjectURL(res)
    const link = document.createElement('a')
    link.href = url
    link.download = parseExportFilename(res)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    exporting.value = false
  }
}

const handleCurrentChange = async (val: number) => {
  if (checkEditStatus()) return
  if (val <= 0) return
  page.page = val
  await getTableData()
}

const handleSizeChange = async (val: number) => {
  if (checkEditStatus()) return
  if (val <= 0) return
  page.limit = val
  page.page = 1
  await getTableData()
}

const getProName = async (row: any) => {
  if (!row.sourceDirCode) return
  const res = await getSourceDirDescByCode(row.sourceDirCode)
  if (!res.success) return ElMessage.error(res.msg)
  if (!res.data) {
    row.sourceDirDesc = ''
    row.sourceDirCode = ''
    ElMessage.warning('此Ⅲ级目录编码不存在')
  } else {
    row.sourceDirDesc = res.data
  }
}

const open = async () => {
  currentTask.value = wfData
  page.page = 1
  page.total = 0
  gridOptions.data = []
  searchForm.value = {}
  await getTableData()
  await getStatusOptions()
}

const getStatusOptions = async () => {
  try {
    const res = await getPublicCodesList({ codes: ['MATERIAL_JUDGMENT_DETAIL_STATUS_COM'] })
    if (!res.success) throw new Error(res.msg)
    statusOptions.value = res.data?.[0]?.codes || []
  } catch (error) {
    ElMessage.error((error as Error).message || '状态字典加载失败!')
  }
}

const getConfirmIsGdzcName = (value?: string | number | null) => {
  return confirmIsGdzcOptions.find((item) => item.value === `${value}`)?.label || ''
}

const getConfirmIsGdzcValue = (name?: string | null) => {
  return confirmIsGdzcOptions.find((item) => item.label === name)?.value || ''
}

const normalizeTableRows = (rows: MaterialTaskDetailRow[]) => {
  return rows.map((row) => {
    const confirmIsGdzc = `${row.confirmIsGdzc ?? getConfirmIsGdzcValue(row.confirmIsGdzcName)}`
    return {
      ...row,
      confirmIsGdzc,
      confirmIsGdzcName: row.confirmIsGdzcName || getConfirmIsGdzcName(confirmIsGdzc)
    }
  })
}

const handleConfirmIsGdzcChange = (row: MaterialTaskDetailRow, value?: string | number | null) => {
  row.confirmIsGdzc = value
  row.confirmIsGdzcName = getConfirmIsGdzcName(value)
  // 切换时清空无关字段，避免提交脏数据
  if (value === '1') {
    row.reasonWhenNotGdzc = ''
  } else if (value === '0') {
    row.reasonWhenYzgGdzc = ''
    row.reasonWhenWzgGdzc = ''
  }
  gridRef.value?.updateData?.()
}

const formatColumnValue = (row: MaterialTaskDetailRow, field: string) => {
  if (field === 'confirmIsGdzcName') return row.confirmIsGdzcName || getConfirmIsGdzcName(row.confirmIsGdzc)
  return row[field]
}

const buildSaveData = () => {
  return ((gridOptions.data || []) as MaterialTaskDetailRow[]).map((row) => ({
    detailId: row.detailId,
    sourceDirCode: row.sourceDirCode == '未匹配到' ? '' : row.sourceDirCode,
    sourceDirDesc: row.sourceDirDesc == '未匹配到' ? '' : row.sourceDirDesc,
    confirmIsGdzc: `${row.confirmIsGdzc}`,
    reasonWhenNotGdzc: row.reasonWhenNotGdzc,
    reasonWhenYzgGdzc: row.reasonWhenYzgGdzc,
    reasonWhenWzgGdzc: row.reasonWhenWzgGdzc
  }))
}

const validateSaveData = (): string | null => {
  const rows = (gridOptions.data || []) as MaterialTaskDetailRow[]
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const confirmIsGdzc = `${row.confirmIsGdzc}`
    if (confirmIsGdzc === '1') {
      if (!row.reasonWhenYzgGdzc?.trim() && !row.reasonWhenWzgGdzc?.trim()) {
        return `第${
          i + 1
        }行：确认是否为固定资产为"是"时，"如判断确为固定资产但尚未整改，请说明整改方案"和"如判断确为固定资产并已整改请简要说明"至少填写一项`
      }
    } else if (confirmIsGdzc === '0') {
      if (!row.reasonWhenNotGdzc?.trim()) {
        return `第${i + 1}行：确认是否为固定资产为"否"时，"如判断不为固定资产，请说明原因"为必填项`
      }
    }
  }
  return null
}

//编辑
const handleEdit = () => {
  if (!gridOptions.data?.length) return ElMessage.warning('暂无可编辑数据')
  isEditing.value = true
}

//保存
const handleSave = () => {
  const validateMsg = validateSaveData()
  if (validateMsg) {
    ElMessage.warning(validateMsg)
    return
  }

  ElMessageBox.confirm('是否确定保存？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      exporting.value = true
      let params = {
        list: buildSaveData(),
        operator: {
          userId: store.getters.getUserMsg.id,
          userName: store.getters.getUserMsg.name
        }
      }
      let res = await getMaterialTaskDetailSave({ ...params })
      if (res.success) {
        ElMessage.success('保存成功！')
        isEditing.value = false
        await getTableData()
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      if (error !== 'cancel' && error !== 'close') ElMessage.error((error as Error).message)
    })
    .finally(() => {
      exporting.value = false
    })
}

const handleCancelEdit = async () => {
  isEditing.value = false
  await getTableData()
}

// 关闭工作流
const closeDialogHandle = () => {
  if (checkEditStatus()) return
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}

onMounted(async () => {
  isShowPage.value = false
  const workItemId = getQueryString('workItemId')
  const taskId = getQueryString('taskId')
  const org_id = getQueryString('org_id')
  const org_name = getQueryString('org_name')
  const specialorgid = getQueryString('specialorgid')
  const specialorgname = getQueryString('specialorgname')
  const specialroleid = getQueryString('specialroleid')
  const specialrolename = getQueryString('specialrolename')
  wfData.workItemIdString = workItemId
  wfData.taskId = taskId
  wfData.dwId = org_id
  wfData.dwName = org_name
  wfData.bmId = specialorgid
  wfData.bmName = specialorgname
  wfData.roleId = specialroleid
  wfData.roleName = specialrolename
  await open()
})

const closeModal = async () => {
  try {
    loading.value = true
    const res = await notify(wfData.workItemIdString)
    if (!res.success) throw new Error(res.msg)
    closeDialogHandle()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 获取"workItemId"
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
const notifyHandle = async () => {
  if (checkEditStatus()) return
  ElMessageBox.confirm('确定结束待办？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      await closeModal()
    })
    .catch((error: any) => {
      console.log(error)
    })
}
</script>

<style scoped lang="less">
.material-task-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;

  .operation {
    padding-bottom: 10px;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .main-pagination {
    padding-top: 10px;
  }
}
</style>
