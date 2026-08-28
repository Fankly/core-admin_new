<!-- 物料判定任务待办处理 -->
<template>
  <div class="container" v-if="isShowPage" v-loading="loading">
    <div class="operation">
      <el-button type="primary" size="mini" plain @click="handleSubmit">提 交</el-button>
      <template v-if="!isEditing">
        <el-button type="primary" size="mini" plain @click="handleEdit">编 辑</el-button>
      </template>
      <template v-else>
        <el-button type="primary" size="mini" plain @click="handleSave">保 存</el-button>
        <el-button size="mini" plain @click="handleCancelEdit">取 消</el-button>
      </template>
      <el-button type="primary" size="mini" plain @click="handleImport">导 入</el-button>
      <el-button type="primary" size="mini" plain @click="handleExport">导 出</el-button>
      <el-button plain size="mini" type="primary" @click="handleFile">上传佐证材料</el-button>
      <el-button type="primary" size="mini" plain @click="closeDialogHandle">关闭页面</el-button>
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

        <template #reasonWhenNotGdzc_default="{ row }">
          <span>{{ row.reasonWhenNotGdzc }}</span>
        </template>
        <template #reasonWhenNotGdzc_edit="{ row }">
          <el-input v-model.trim="row.reasonWhenNotGdzc" :maxlength="2000" clearable placeholder="请输入" />
        </template>
        <template #reasonWhenYzgGdzc_default="{ row }">
          <span>{{ row.reasonWhenYzgGdzc }}</span>
        </template>
        <template #reasonWhenYzgGdzc_edit="{ row }">
          <el-input v-model.trim="row.reasonWhenYzgGdzc" :maxlength="2000" clearable placeholder="请输入" />
        </template>
        <template #reasonWhenWzgGdzc_default="{ row }">
          <span>{{ row.reasonWhenWzgGdzc }}</span>
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
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
  <materialTaskFile ref="materialTaskFileRef" />
  <!-- 佐证材料预览（与 materialTaskDetailModal 一致） -->
  <MaterialFilePreview ref="filePreviewRef" />
</template>
<script setup lang="ts" name="/toDo/suzhou/materialTask">
import { reactive, ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notify } from '@/api/workflow'
import {
  getDbDetailPage,
  submitDbDetail,
  hasUnSubmittedDbDetail,
  exportDbDetail,
  importData,
  getMaterialTaskDetailSave
} from '@/api/suzhou/materialTask'
import type { MaterialTaskDetailRow } from '@/views/suzhou/common/types/material'
import type { VxeGridProps } from 'vxe-table'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { useStore } from 'vuex'
import materialTaskFile from '@/views/suzhou/materialTask/modules/materialTaskFile.vue'
import MaterialFilePreview from '@/views/suzhou/materialTaskDetail/modules/materialFilePreview.vue'
import { getFileItems, type MaterialFileItem } from '@/views/suzhou/materialTaskDetail/utils/filePreview'

interface CommonParamVo {
  createorId: string
  taskId: number | string
}
const store = useStore()
const CommonParam = reactive<CommonParamVo>({ taskId: '', createorId: '' })
const materialTaskFileRef = ref<InstanceType<typeof materialTaskFile>>()
const filePreviewRef = ref<InstanceType<typeof MaterialFilePreview>>()
const workItemIdString = ref<string>('') //todoId
const loading = ref<boolean>(false)
const isShowPage = ref<boolean>(false)
const isEditing = ref<boolean>(false)
const gridRef = ref()
const importRef = ref()
const page = reactive({
  page: 1,
  limit: 20,
  total: 0 as number | string
})
const confirmIsGdzcOptions = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
]
const editableFields = ['confirmIsGdzcName', 'reasonWhenNotGdzc', 'reasonWhenYzgGdzc', 'reasonWhenWzgGdzc']

const textEditRender = {
  name: 'input',
  autofocus: '.el-input__inner',
  autoselect: true
}

const selectEditRender = {
  autofocus: '.vxe-input__inner'
}
onMounted(() => {
  isShowPage.value = false
  const workItemId = getQueryString('workItemId')
  const createorId = getQueryString('createorId')
  const taskId = getQueryString('taskId')
  workItemIdString.value = workItemId
  CommonParam.createorId = createorId
  CommonParam.taskId = taskId
  nextTick(() => {
    getTableList()
  })
})

// 导入
const handleImport = () => {
  if (checkEditStatus()) return
  let newParmas = {
    ...CommonParam,
    'operator.userId': store.getters.getUserMsg.id,
    'operator.userName': store.getters.getUserMsg.name
  }
  importRef.value.fromData = { ...newParmas }
  let tempApi = exportDbDetail
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
    title: '物料判定待办明细',
    getTableList: getTableList
  }
  if (importRef.value) importRef.value.acceptParams(params)
}
//导出
const handleExport = async () => {
  if (checkEditStatus()) return
  loading.value = true
  try {
    const res: any = await exportDbDetail({
      taskId: CommonParam.taskId,
      createorId: CommonParam.createorId
    })
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
    loading.value = false
  }
}

//提交待办明细
const handleSubmit = async () => {
  if (checkEditStatus()) return
  try {
    ElMessageBox.confirm('是否确定提交？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let submit: any = await submitDbDetail({ ...CommonParam })
        if (!submit.success) return ElMessage.error(submit.msg)
        getTableList()
        ElMessage.success('提交成功！')
        closeModal()
      })
      .catch((error: any) => {
        ElMessage.error((error as Error).message)
      })
      .finally(() => {
        loading.value = false
      })
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
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
      loading.value = true
      let params = {
        ...CommonParam,
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
        await getTableList()
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      if (error !== 'cancel' && error !== 'close') ElMessage.error((error as Error).message)
    })
    .finally(() => {
      loading.value = false
    })
}

const getTableList = async () => {
  loading.value = true
  const params: any = {
    page: page.page,
    limit: page.limit,
    ...CommonParam
  }
  let res: any = await getDbDetailPage({ ...params })
  isShowPage.value = true
  loading.value = false
  if (!res.success) ElMessage.error(res.msg)
  page.total = res.data?.total || 0
  gridOptions.data = normalizeTableRows(res.data?.records || [])
  gridOptions.data.forEach((item: any) => {
    item.sourceDirCode = item.sourceDirCode || '未匹配到'
    item.sourceDirDesc = item.sourceDirDesc || '未匹配到'
  })
}

const handleCurrentChange = async (val: number) => {
  if (checkEditStatus()) return
  if (val <= 0) return
  page.page = val
  await getTableList()
}

const handleFile = () => {
  if (checkEditStatus()) return
  const $table = gridRef.value
  const selectData = $table.getCheckboxRecords()
  if (selectData.length != 1) return ElMessage.warning('请选择一条数据！')
  const params = {
    detailId: selectData[0].detailId as string,
    onSuccess: getTableList
  }
  materialTaskFileRef.value?.open(params)
}

const handleSizeChange = async (val: number) => {
  if (checkEditStatus()) return
  if (val <= 0) return
  page.limit = val
  page.page = 1
  await getTableList()
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
    { type: 'seq', width: 50, title: '序号' },
    { field: 'mjahr', title: '年度', width: 80 },
    { field: 'pspid', title: '项目定义', width: 160 },
    { field: 'post1', title: '项目描述', width: 220 },
    { field: 'matnr', title: '物料编码', width: 120 },
    { field: 'maktx', title: '物料描述', width: 180 },
    { field: 'mblnr', title: '凭证编码', width: 160 },
    { field: 'menge', title: '数量', width: 100 },
    { field: 'unitPrice', title: '单价', width: 100 },
    { field: 'proType', title: '项目类型', width: 120 },
    { field: 'yjdw', title: '一级单位', width: 120 },
    { field: 'ejdw', title: '二级单位', width: 120 },
    { field: 'applyCenter', title: '归口部门', width: 120 },
    { field: 'createor', title: '创建人', width: 100 },
    {
      field: 'sourceDirCode',
      title: 'Ⅲ级目录编码',
      width: 160,
      fixed: 'right'
    },
    {
      field: 'sourceDirDesc',
      title: '同源目录对应名称',
      width: 180,

      fixed: 'right'
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
      slots: { default: 'reasonWhenNotGdzc_default', edit: 'reasonWhenNotGdzc_edit' }
    },
    {
      field: 'reasonWhenWzgGdzc',
      title: '如判断确为固定资产并已整改请简要说明',
      width: 180,
      fixed: 'right',
      editRender: textEditRender,
      slots: { default: 'reasonWhenWzgGdzc_default', edit: 'reasonWhenWzgGdzc_edit' }
    },
    {
      field: 'reasonWhenYzgGdzc',
      title: '如判断确为固定资产但尚未整改，请说明整改方案',
      width: 180,
      fixed: 'right',
      editRender: textEditRender,
      slots: { default: 'reasonWhenYzgGdzc_default', edit: 'reasonWhenYzgGdzc_edit' }
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
    }
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

// 知道了-按钮
const notifyHandle = async () => {
  if (checkEditStatus()) return
  ElMessageBox.confirm('确定结束待办？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      const hasUnSubmitted = await hasUnSubmittedDbDetail({ ...CommonParam })
      if (hasUnSubmitted.data) {
        ElMessage.warning('存在未提交的待办明细，请先提交！')
        loading.value = false
        return
      }
      await closeModal()
    })
    .catch((error: any) => {
      console.log(error)
    })
}

const closeModal = async () => {
  try {
    loading.value = true
    const res = await notify(workItemIdString.value)
    if (!res.success) throw new Error(res.msg)
    closeDialogHandle()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
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

const checkEditStatus = () => {
  if (!isEditing.value) return false
  ElMessage.warning('请先保存或取消当前编辑')
  return true
}

const getConfirmIsGdzcName = (value: string | number) => {
  return confirmIsGdzcOptions.find((item) => item.value === `${value}`)?.label || ''
}

const getConfirmIsGdzcValue = (name: string) => {
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

const handleConfirmIsGdzcChange = (row: MaterialTaskDetailRow, value: string | number) => {
  row.confirmIsGdzc = value
  row.confirmIsGdzcName = getConfirmIsGdzcName(value)
  // 切换时清空无关字段，避免提交脏数据
  if (value === '1') {
    row.reasonWhenNotGdzc = ''
  } else if (value === '0') {
    row.reasonWhenYzgGdzc = ''
    row.reasonWhenWzgGdzc = ''
  }
}

const formatColumnValue = (row: MaterialTaskDetailRow, field: string) => {
  if (field === 'confirmIsGdzcName') return row.confirmIsGdzcName || getConfirmIsGdzcName(row.confirmIsGdzc)
  return row[field]
}

const buildSaveData = () => {
  return ((gridOptions.data || []) as MaterialTaskDetailRow[]).map((row) => ({
    detailId: row.detailId,
    confirmIsGdzc: `${row.confirmIsGdzc}`,
    reasonWhenNotGdzc: row.reasonWhenNotGdzc,
    reasonWhenYzgGdzc: row.reasonWhenYzgGdzc,
    reasonWhenWzgGdzc: row.reasonWhenWzgGdzc,
    sourceDirCode: row.sourceDirCode == '未匹配到' ? '' : row.sourceDirCode,
    sourceDirDesc: row.sourceDirDesc == '未匹配到' ? '' : row.sourceDirDesc
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

const handleCancelEdit = async () => {
  isEditing.value = false
  await getTableList()
}

const handlePreviewFile = (item: MaterialFileItem, row: MaterialTaskDetailRow) => {
  filePreviewRef.value?.handlePreviewFile(item, row)
}
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  box-sizing: border-box;
  background: #fff;
  gap: 10px;
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
</style>
