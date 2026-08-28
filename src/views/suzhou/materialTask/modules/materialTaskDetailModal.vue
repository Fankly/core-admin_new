<template>
  <vxe-modal
    v-model="isShowModal"
    :loading="loading"
    resize
    fullscreen
    show-zoom
    position="center"
    width="80%"
    height="720px"
    :title="modalTitle"
    destroy-on-close
    @close="handleClose"
  >
    <div class="material-task-detail">
      <div class="operation">
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
        <el-button plain size="mini" type="primary" :loading="exporting" @click="handleXmView">查看项目明细</el-button>
        <el-button plain size="mini" type="primary" :loading="exporting" @click="handleFile">上传佐证材料</el-button>
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
          <template #fileNameList_default="{ row }">
            <div class="file-name-list">
              <template v-if="getFileItems(row).length">
                <el-tooltip
                  v-for="(item, index) in getFileItems(row)"
                  :key="`${item.fileId || item.fileName}-${index}`"
                  :content="item.fileName"
                  placement="top"
                  :open-delay="300"
                >
                  <a class="file-name-link" href="javascript:void(0)" @click.prevent="handlePreviewFile(item, row)">
                    {{ item.fileName }}
                  </a>
                </el-tooltip>
              </template>
              <span v-else>-</span>
            </div>
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
  </vxe-modal>
  <MaterialTaskLog ref="materialTaskLogRef" />
  <materialTaskFile ref="materialTaskFileRef" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
  <!-- 佐证材料预览（与 smartTaskAudit DetailModal 文件预览一致） -->
  <vxe-modal
    :model-value="filePreviewModal.visible"
    :destroy-on-close="true"
    :show-footer="false"
    show-zoom
    resize
    position="center"
    width="55%"
    height="95%"
    title="文件预览"
    class-name="material-task-file-preview-modal"
    @close="closeFilePreview"
  >
    <div class="audit-file-preview">
      <div v-if="activePreviewFile" class="audit-file-preview__toolbar">
        <div class="audit-file-preview__title-wrap">
          <span class="audit-file-preview__title-bar" aria-hidden="true"></span>
          <span class="audit-file-preview__label">预览文件</span>
        </div>
        <el-select
          v-if="previewFiles.length > 1"
          v-model="activePreviewFileKey"
          class="audit-file-preview__select"
          placeholder="请选择文件"
          @change="switchPreviewFile"
        >
          <el-option
            v-for="file in previewFiles"
            :key="getPreviewFileKey(file)"
            :label="getPreviewFileName(file)"
            :value="getPreviewFileKey(file)"
          />
        </el-select>
        <span v-else class="audit-file-preview__filename" :title="getPreviewFileName(activePreviewFile)">
          {{ getPreviewFileName(activePreviewFile) }}
        </span>
        <span class="audit-file-preview__count"> {{ activePreviewIndex + 1 }}/{{ previewFiles.length }} </span>
      </div>
      <div v-loading="filePreviewModal.loading" class="audit-file-preview__body">
        <div class="audit-file-preview__canvas">
          <OfficePreview
            v-if="activePreviewFile"
            :src="previewSource"
            :file-name="getPreviewFileName(activePreviewFile)"
            height="100%"
            empty-text="暂无可预览文件"
          />
          <div v-else class="audit-file-preview__empty">暂无可预览文件</div>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="materialTaskDetailModal">
import { computed, reactive, ref, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  exportMaterialTaskDetail,
  getMaterialTaskDetailConfirm,
  getMaterialTaskDetailPage,
  getSourceDirDescByCode,
  getMaterialTaskDetailIssue,
  importData,
  getMaterialTaskDetailSave,
  previewMaterialTaskFile
} from '@/api/suzhou/materialTask'
import type { MaterialTaskDetailPageParams, MaterialJudgmentConfirm, MaterialJudgmentIssue } from '@/api/suzhou/materialTask'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import type { MaterialTaskDetailRow, MaterialTaskRow } from '@/views/suzhou/common/types/material'
import type { VxeGridProps } from 'vxe-table'
import { cleanQueryParams, getRoleQueryParams } from '@/views/suzhou/common/utils/params'
import { useStore } from 'vuex'
import { getPublicCodesList } from '@/api/common'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import MaterialTaskLog from '@/views/suzhou/materialTask/modules/materialTaskLog.vue'
import materialTaskFile from '@/views/suzhou/materialTask/modules/materialTaskFile.vue'
import OfficePreview, { getOfficeFileExtension } from '@/components/OfficePreview'
import type { OfficePreviewSource } from '@/components/OfficePreview'
import { useRouter } from 'vue-router'

interface MaterialFileItem {
  fileId: string
  fileName: string
}

// 与 smartTaskAudit 预览一致：后端 doc 已转可预览格式，前端按扩展名放行
const SUPPORTED_PREVIEW_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xlsx', 'xls', 'et'])
const MAX_PREVIEW_BYTES = 30 * 1024 * 1024

const props = defineProps<{
  currentUserRole?: UserRole
}>()
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
const materialTaskFileRef = ref<InstanceType<typeof materialTaskFile>>()
const gridRef = ref()
const router = useRouter()

const isShowModal = ref(false)
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
    {
      field: 'fileNameList',
      title: '佐证材料',
      width: 150,
      fixed: 'right',
      align: 'left',
      headerAlign: 'center',
      showOverflow: false,
      slots: { default: 'fileNameList_default' }
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
    ...getRoleQueryParams(props.currentUserRole)
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

const handleFile = () => {
  if (checkEditStatus()) return
  if (!hasTaskId()) return
  const $table = gridRef.value
  const selectData = $table.getCheckboxRecords()
  if (selectData.length != 1) return ElMessage.warning('请选择一条数据！')
  const params = {
    detailId: selectData[0].detailId as string,
    onSuccess: getTableData
  }
  materialTaskFileRef.value?.open(params)
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

const handleClose = () => {
  isEditing.value = false
  gridOptions.data = []
  page.page = 1
  page.total = 0
  currentTask.value = undefined
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

const open = async (row: MaterialTaskRow) => {
  if (row.status != '2') return ElMessage.warning('智能体判定未完成，请勿重复点击')
  currentTask.value = row
  page.page = 1
  page.total = 0
  gridOptions.data = []
  isShowModal.value = true
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

/** 后端多个佐证材料以 \n 分隔，fileIdList 以逗号分隔，顺序一一对应 */
const splitFileNames = (value?: string | string[] | null) => {
  if (value == null || value === '') return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

const splitFileIds = (value?: string | string[] | null) => {
  if (value == null || value === '') return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getFileItems = (row: MaterialTaskDetailRow): MaterialFileItem[] => {
  const names = splitFileNames(row.fileNameList)
  const ids = splitFileIds(row.fileIdList)
  return names.map((fileName, index) => ({
    fileName,
    fileId: ids[index] || ''
  }))
}

const decodePreviewFileName = (value: unknown) => {
  let result = String(value ?? '').trim()
  if (!result) return '未命名附件'
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) break
      result = decoded
    } catch {
      break
    }
  }
  return result
}

const getPreviewFileKey = (file: MaterialFileItem) => String(file.fileId || file.fileName || '')
const getPreviewFileName = (file: MaterialFileItem) => decodePreviewFileName(file.fileName)
const getPreviewFileExtension = (file: MaterialFileItem) => getOfficeFileExtension(getPreviewFileName(file))
const isSupportedPreviewFile = (file: MaterialFileItem) => {
  const extension = getPreviewFileExtension(file)
  return Boolean(extension && SUPPORTED_PREVIEW_EXTENSIONS.has(extension))
}

const filePreviewModal = reactive({
  visible: false,
  loading: false
})
const previewFiles = shallowRef<MaterialFileItem[]>([])
const activePreviewFileKey = ref('')
const previewSource = shallowRef<OfficePreviewSource>(null)
let previewListLoadSeq = 0
let previewFileLoadSeq = 0

const activePreviewFile = computed(() => {
  return previewFiles.value.find((file) => getPreviewFileKey(file) === activePreviewFileKey.value) || previewFiles.value[0]
})
const activePreviewIndex = computed(() => {
  if (!activePreviewFile.value) return -1
  return previewFiles.value.findIndex((file) => getPreviewFileKey(file) === getPreviewFileKey(activePreviewFile.value!))
})

const resetFilePreview = () => {
  filePreviewModal.visible = false
  filePreviewModal.loading = false
  previewFiles.value = []
  activePreviewFileKey.value = ''
  previewSource.value = null
}

const closeFilePreview = () => {
  previewListLoadSeq += 1
  previewFileLoadSeq += 1
  resetFilePreview()
}

/** previewMaterialTaskFile 直接返回文件流；若业务错误以 JSON/text blob 返回则解析 msg */
const resolvePreviewBlob = async (res: unknown): Promise<Blob> => {
  const blob = res instanceof Blob ? res : new Blob([res as BlobPart])
  const contentType = String(blob.type || '').toLowerCase()
  if (contentType.includes('application/json') || contentType.includes('text/')) {
    const text = await blob.text()
    try {
      const json = JSON.parse(text)
      throw new Error(json?.msg || json?.message || '文件获取失败')
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text.trim() || '文件获取失败')
      }
      throw e
    }
  }
  if (!blob.size) throw new Error('文件内容为空')
  if (blob.size > MAX_PREVIEW_BYTES) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1)
    throw new Error(`文件过大（${sizeMb} MB），超过 30 MB 预览上限，请下载后本地查看`)
  }
  return blob
}

const loadPreviewFile = async (file: MaterialFileItem) => {
  const fileKey = getPreviewFileKey(file)
  const fileId = String(file.fileId || '').trim()
  if (!fileId) {
    ElMessage.error('文件缺少标识，无法预览')
    return
  }

  const seq = ++previewFileLoadSeq
  filePreviewModal.loading = true
  previewSource.value = null
  try {
    const res = await previewMaterialTaskFile(fileId)
    if (seq !== previewFileLoadSeq || !filePreviewModal.visible || activePreviewFileKey.value !== fileKey) return
    previewSource.value = await resolvePreviewBlob(res)
  } catch (e: any) {
    if (seq !== previewFileLoadSeq || !filePreviewModal.visible || activePreviewFileKey.value !== fileKey) return
    ElMessage.error(e?.message || '文件获取失败')
  } finally {
    if (seq === previewFileLoadSeq) {
      filePreviewModal.loading = false
    }
  }
}

const switchPreviewFile = (key: string) => {
  const file = previewFiles.value.find((item) => getPreviewFileKey(item) === String(key))
  if (file) loadPreviewFile(file)
}

/** 与 RuleReviewDetailModal → DetailModal.openAuditFilePreview 一致的预览入口 */
const handlePreviewFile = async (selectedFile: MaterialFileItem, row?: MaterialTaskDetailRow) => {
  const filesFromList = row ? getFileItems(row) : [selectedFile]
  const previewableFiles = filesFromList.filter((file) => file && getPreviewFileKey(file) && isSupportedPreviewFile(file))
  const targetKey = getPreviewFileKey(selectedFile)
  const hasFileId = Boolean(String(selectedFile.fileId || '').trim())

  const targetFile =
    previewableFiles.find((file) => getPreviewFileKey(file) === targetKey) ||
    (isSupportedPreviewFile(selectedFile) ? selectedFile : undefined) ||
    (hasFileId && getPreviewFileKey(selectedFile) ? selectedFile : undefined)

  if (!targetFile) {
    ElMessage.warning('暂不支持预览该文件，仅支持 PDF、DOC、DOCX、XLSX、XLS、ET')
    return
  }
  if (!String(targetFile.fileId || '').trim()) {
    ElMessage.warning('文件ID缺失，无法预览')
    return
  }

  const resolvedFiles = previewableFiles.length ? previewableFiles : [targetFile]
  previewListLoadSeq += 1
  previewFiles.value = resolvedFiles
  activePreviewFileKey.value = getPreviewFileKey(targetFile)
  previewSource.value = null
  filePreviewModal.visible = true
  await loadPreviewFile(targetFile)
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

defineExpose({
  open
})
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

  .file-name-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    line-height: 1.4;
    text-align: left;
    box-sizing: border-box;
  }

  .file-name-list :deep(.el-tooltip),
  .file-name-list :deep(.el-only-child__content) {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .file-name-link {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    color: var(--el-color-primary);
    cursor: pointer;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .file-name-link:hover {
    text-decoration: underline;
  }
}

/* 与 smartTaskAudit 文件预览弹窗样式保持一致 */
:global(.material-task-file-preview-modal) {
  --vxe-modal-body-background-color: #f5fbfb;
  --vxe-modal-header-background-color: #f8fbfb;
}

:global(.material-task-file-preview-modal .vxe-modal--header) {
  color: #173c40;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  border-bottom: 1px solid rgba(14, 139, 141, 0.1);
  box-shadow: inset 0 1px 0 #fff;
}

:global(.material-task-file-preview-modal .vxe-modal--body),
:global(.material-task-file-preview-modal .vxe-modal--content) {
  padding: 0;
  overflow: hidden;
  background: radial-gradient(circle at top right, rgba(14, 139, 141, 0.08), transparent 34%),
    linear-gradient(165deg, #f7fbfb 0%, #f3f6f8 52%, #eef3f5 100%);
}

.audit-file-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #153f45;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
}

.audit-file-preview__toolbar {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 12px;
  min-height: 52px;
  padding: 10px 18px;
  box-sizing: border-box;
  background: linear-gradient(100deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 251, 250, 0.96) 55%, rgba(236, 248, 246, 0.94) 100%);
  border-bottom: 1px solid #c5e5e2;
  box-shadow: inset 0 1px 0 #fff, 0 2px 8px rgba(31, 151, 145, 0.06);
}

.audit-file-preview__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.audit-file-preview__title-bar {
  flex: 0 0 auto;
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(0, 112, 107, 0.85), rgba(85, 202, 187, 0.65));
  box-shadow: 0 0 0 1px rgba(0, 112, 107, 0.08);
}

.audit-file-preview__label {
  flex: 0 0 auto;
  color: #173c40;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.audit-file-preview__select {
  width: min(520px, 62%);
}

.audit-file-preview__select :deep(.el-input__inner) {
  height: 34px;
  color: #1f2937;
  font-family: inherit;
  font-size: 13px;
  line-height: 34px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 112, 107, 0.2);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.audit-file-preview__select :deep(.el-input__inner:hover),
.audit-file-preview__select :deep(.el-input.is-focus .el-input__inner) {
  border-color: rgba(0, 112, 107, 0.42);
  box-shadow: 0 0 0 2px rgba(0, 112, 107, 0.08);
}

.audit-file-preview__filename {
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-file-preview__count {
  flex: 0 0 auto;
  margin-left: auto;
  min-height: 24px;
  padding: 0 10px;
  color: #00706b;
  font-size: 12px;
  font-weight: 600;
  line-height: 24px;
  white-space: nowrap;
  background: rgba(0, 112, 107, 0.08);
  border: 1px solid rgba(0, 112, 107, 0.14);
  border-radius: 999px;
}

.audit-file-preview__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 16px 16px;
  box-sizing: border-box;
  background: transparent;
}

.audit-file-preview__canvas {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #cfe6e3;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(31, 151, 145, 0.1), inset 0 1px 0 #fff;
}

.audit-file-preview__body :deep(.office-preview) {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 12px;
}

.audit-file-preview__empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}
</style>
