<!-- 明细管理弹窗（外层列表 + 内层新增/编辑表单） -->
<template>
  <!-- 外层：明细列表 -->
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    title="明细管理"
    width="1200"
    height="680"
    :loading="loading"
    @close="handleClose"
  >
    <div class="detail-modal-body">
      <RangeVxeTable
        ref="tableRef"
        class="detail-range-table"
        row-key="detailId"
        row-click-mode="exclusive"
        :border="true"
        :stripe="true"
        :pagination="false"
        :request-auto="false"
        :request-api="getDetailList"
        :request-error="handleListError"
        :columns="detailColumns"
        :loading="loading"
        @selection-change="handleSelectionChange"
      >
        <template #tableHeader="scope">
          <div class="detail-action-group">
            <el-button class="detail-action" size="mini" type="primary" plain @click="handleAdd">新 增</el-button>
            <el-button
              class="detail-action detail-action--danger-outline"
              :disabled="scope.selectedList.length === 0"
              size="mini"
              type="danger"
              plain
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
            <el-button class="detail-action detail-action--secondary" size="mini" type="primary" @click="getList">刷 新</el-button>
            <el-button class="detail-action" size="mini" plain @click="handleClose">关 闭</el-button>
          </div>
        </template>
        <template #operation="{ row }">
          <div class="detail-table-actions">
            <button type="button" class="detail-row-action" @click.stop="handleEdit(row)">编 辑</button>
            <button type="button" class="detail-row-action detail-row-action--danger" @click.stop="handleDelete(row)">删 除</button>
          </div>
        </template>
      </RangeVxeTable>
    </div>

    <!-- 内层：新增/编辑表单 -->
    <vxe-modal
      v-model="isShowFormModal"
      class-name="ai-audit-rule-modal ai-audit-rule-detail-form-modal"
      show-zoom
      resize
      destroy-on-close
      :title="formTitle"
      width="1100"
      height="720"
      :loading="formLoading"
      @close="handleFormClose"
    >
      <div class="detail-form-shell">
        <div class="detail-form-scroll">
          <el-form
            class="ai-audit-rule-form detail-form"
            ref="ruleFormRef"
            label-suffix=":"
            label-width="120px"
            label-position="right"
            :model="formData"
            :rules="formRules"
          >
            <section class="detail-form-section" aria-labelledby="detail-basic-title">
              <h3 id="detail-basic-title" class="detail-form-section__title">基础信息</h3>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="子任务编码" prop="detailCode">
                    <el-input clearable :maxlength="32" show-word-limit v-model.trim="formData.detailCode" placeholder="请输入子任务编码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="子任务名称" prop="detailName">
                    <el-input clearable :maxlength="128" show-word-limit v-model.trim="formData.detailName" placeholder="请输入子任务名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="预算事项编码" prop="yssxbm">
                    <el-input clearable :maxlength="128" show-word-limit v-model.trim="formData.yssxbm" placeholder="请输入预算事项编码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="子任务排序" prop="sort">
                    <el-input type="number" clearable v-model.trim="formData.sort" placeholder="请输入子任务排序" />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>

            <section class="detail-form-section detail-form-section--content" aria-labelledby="detail-content-title">
              <h3 id="detail-content-title" class="detail-form-section__title">任务内容</h3>
              <el-form-item label="子任务描述" prop="detailDesc">
                <el-input
                  clearable
                  :maxlength="512"
                  show-word-limit
                  resize="none"
                  type="textarea"
                  :rows="4"
                  v-model.trim="formData.detailDesc"
                  placeholder="请输入子任务描述"
                />
              </el-form-item>
              <el-form-item class="detail-form-prompt" label="子任务提示词" prop="prompt">
                <el-input
                  clearable
                  :maxlength="15000"
                  show-word-limit
                  resize="none"
                  type="textarea"
                  :rows="12"
                  v-model.trim="formData.prompt"
                  placeholder="请输入子任务提示词"
                />
              </el-form-item>
            </section>
          </el-form>
        </div>

        <div class="detail-form-footer">
          <el-button class="detail-form-action" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary" :loading="formLoading"
            >保 存</el-button
          >
          <el-button class="detail-form-action" size="mini" v-debounce="[handleFormClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </vxe-modal>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'detailModal'
}
</script>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import { listRuleDetail, saveRuleDetail, removeRuleDetail } from '@/api/suzhou/aiAuditRuleManage'

interface DetailRow {
  detailId?: string
  ruleId?: string
  detailCode: string
  detailName: string
  yssxbm: string
  sort: string | number
  detailDesc: string
  prompt: string
}

interface ModalParams {
  ruleId: string
}

const isShowModal = ref(false)
const loading = ref(false)
const tableRef = ref<RangeVxeTableExpose<DetailRow>>()
const selectedList = ref<DetailRow[]>([])
const ruleId = ref('')

const detailColumns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 50, headerAlign: 'center' },
  { type: 'seq', title: '序号', width: 60, headerAlign: 'center' },
  { field: 'detailCode', title: '子任务编码', width: 150, headerAlign: 'center' },
  { field: 'detailName', title: '子任务名称', minWidth: 180, align: 'left', headerAlign: 'center' },
  { field: 'yssxbm', title: '预算事项编码', width: 150, headerAlign: 'center' },
  { field: 'prompt', title: '子任务提示词', minWidth: 360, align: 'left', headerAlign: 'center' },
  { field: 'detailDesc', title: '子任务描述', minWidth: 220, align: 'left', headerAlign: 'center' },
  { field: 'operation', title: '操作', width: 128, fixed: 'right', headerAlign: 'center', slots: { default: 'operation' } }
]

// 内层表单
const isShowFormModal = ref(false)
const formLoading = ref(false)
const formTitle = ref('新增明细')
const ruleFormRef = ref()
const isEdit = ref(false)
const formData = reactive<DetailRow>({
  detailId: '',
  ruleId: '',
  detailCode: '',
  detailName: '',
  yssxbm: '',
  sort: '',
  detailDesc: '',
  prompt: ''
})

const formRules: FormRules = {
  detailCode: [{ required: true, message: '请输入子任务编码', trigger: 'blur' }],
  detailName: [{ required: true, message: '请输入子任务名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入子任务排序', trigger: 'blur' }],
  detailDesc: [{ required: true, message: '请输入子任务描述', trigger: 'blur' }],
  prompt: [{ required: true, message: '请输入子任务提示词', trigger: 'blur' }]
}

const resetFormData = () => {
  formData.detailId = ''
  formData.ruleId = ruleId.value
  formData.detailCode = ''
  formData.detailName = ''
  formData.yssxbm = ''
  formData.sort = ''
  formData.detailDesc = ''
  formData.prompt = ''
}

const handleSelectionChange = (rows: DetailRow[]) => {
  selectedList.value = rows
}

const getDetailList = async () => {
  const res = await listRuleDetail({ ruleId: ruleId.value })
  if (!res.success) throw new Error(res.msg || '明细加载失败，请稍后重试')
  return res
}

const handleListError = (error: unknown) => {
  ElMessage.error((error as Error)?.message || '明细加载失败，请稍后重试')
}

const getList = () => tableRef.value?.getTableList()

const handleAdd = () => {
  isEdit.value = false
  formTitle.value = '新增明细'
  resetFormData()
  isShowFormModal.value = true
}

const handleEdit = (row: DetailRow) => {
  isEdit.value = true
  formTitle.value = '编辑明细'
  Object.assign(formData, {
    detailId: row.detailId,
    ruleId: row.ruleId || ruleId.value,
    detailCode: row.detailCode,
    detailName: row.detailName,
    yssxbm: row.yssxbm,
    sort: row.sort,
    detailDesc: row.detailDesc,
    prompt: row.prompt
  })
  isShowFormModal.value = true
}

const handleSave = () => {
  ruleFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', { status: 'warning' })
      if (type !== 'confirm') {
        ElMessage.info('已取消')
        return
      }
    } catch {
      return
    }

    formLoading.value = true
    try {
      const payload = { ...formData, ruleId: ruleId.value }
      const res = await saveRuleDetail(payload)
      if (res.success) {
        ElMessage.success('保存成功！')
        handleFormClose()
        await getList()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      formLoading.value = false
    }
  })
}

const handleFormClose = () => {
  ruleFormRef.value?.resetFields()
  isShowFormModal.value = false
}

const handleDelete = async (row: DetailRow) => {
  if (!row.detailId) return
  try {
    const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', { status: 'warning' })
    if (confirmResult !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await removeRuleDetail([row.detailId])
    if (res.success) {
      ElMessage.success('删除成功！')
      await getList()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedList.value.length === 0) return
  try {
    const confirmResult = await VXETable.modal.confirm(`确定删除选中的 ${selectedList.value.length} 条明细吗？删除后无法恢复！`, '提示', {
      status: 'warning'
    })
    if (confirmResult !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }

  loading.value = true
  try {
    const detailIdList = selectedList.value.map((item) => item.detailId).filter(Boolean) as string[]
    const res = await removeRuleDetail(detailIdList)
    if (res.success) {
      ElMessage.success('删除成功！')
      tableRef.value?.clearSelection()
      await getList()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  selectedList.value = []
  tableRef.value?.clearSelection()
  isShowModal.value = false
}

const acceptParams = async (params: ModalParams) => {
  ruleId.value = params.ruleId
  isShowModal.value = true
  await nextTick()
  await getList()
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
