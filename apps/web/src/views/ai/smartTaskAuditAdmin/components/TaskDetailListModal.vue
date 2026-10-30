<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading"
    :destroy-on-close="true"
    show-zoom
    resize
    transfer
    position="center"
    width="calc(100vw - 160px)"
    height="calc(100vh - 180px)"
    min-width="700"
    min-height="300"
    title="审核要点详情"
    class-name="smart-task-detail-list-modal"
    @close="$emit('close')"
  >
    <div class="task-detail-list">
      <vxe-table
        ref="tableRef"
        :data="dataList"
        :loading="modal.loading"
        height="100%"
        border
        stripe
        round
        show-overflow
        show-header-overflow
        :row-config="{ height: 40 }"
        :column-config="{ resizable: true }"
        :scroll-y="{ enabled: true }"
        empty-text="暂无审核要点数据"
      >
        <vxe-column type="seq" title="序号" width="60" align="center" fixed="left" />
        <vxe-column field="auditPointName" title="要点名称" min-width="180" align="left" show-overflow fixed="left" />
        <vxe-column field="ruleDesc" title="要点描述" min-width="240" align="left" show-overflow />
        <vxe-column field="reviewOpinionName" title="审核意见" width="100" align="center" show-overflow />
        <vxe-column field="reviewConclude" title="审核结论" min-width="260" align="left" show-overflow />
        <vxe-column field="reviewAdvice" title="改进建议" min-width="260" align="left" show-overflow />
        <vxe-column field="reviewProcess" title="分析过程" min-width="300" align="left" show-overflow />
        <vxe-column field="reviewMessage" title="审核消息" min-width="220" align="left" show-overflow />
        <vxe-column field="reviewTable" title="表格数据" min-width="220" align="left" show-overflow>
          <template #default="{ row }">
            <span>{{ formatReviewTable(row.reviewTable) }}</span>
          </template>
        </vxe-column>
        <vxe-column field="startTime" title="开始时间" width="160" align="center" show-overflow />
        <vxe-column field="finishTime" title="完成时间" width="160" align="center" show-overflow />
        <vxe-column field="statusName" title="状态" width="100" align="center" show-overflow />
        <vxe-column field="message" title="错误信息" min-width="220" align="left" show-overflow />
        <vxe-column title="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="openEditDetail(row)">修 改</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </vxe-modal>

  <!-- 修改审核要点明细：从表格行带出数据回显，按 detailId 更新 -->
  <vxe-modal
    v-model="editModal.visible"
    :loading="editModal.loading"
    :destroy-on-close="true"
    show-footer
    show-zoom
    resize
    transfer
    position="center"
    width="900"
    min-width="600"
    height="680"
    title="修改审核要点"
    class-name="smart-task-detail-edit-modal"
    @close="closeEditDetail"
  >
    <el-form ref="formRef" :model="editForm" label-width="100px" label-suffix="：" label-position="right">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="要点名称" prop="auditPointName">
            <el-input v-model.trim="editForm.auditPointName" disabled :maxlength="200" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="要点描述" prop="ruleDesc">
            <el-input v-model.trim="editForm.ruleDesc" placeholder="请输入要点描述" clearable :maxlength="500" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="审核意见" prop="reviewOpinion">
            <el-select v-model="editForm.reviewOpinion" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in reviewOpinionOptions" :key="item.code" :value="item.code" :label="item.name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务状态" prop="status">
            <el-select v-model="editForm.status" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="editForm.startTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              placeholder="请选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="完成时间" prop="finishTime">
            <el-date-picker
              v-model="editForm.finishTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              placeholder="请选择完成时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核结论" prop="reviewConclude">
            <el-input v-model.trim="editForm.reviewConclude" type="textarea" :rows="4" placeholder="请输入审核结论" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="改进建议" prop="reviewAdvice">
            <el-input v-model.trim="editForm.reviewAdvice" type="textarea" :rows="4" placeholder="请输入改进建议" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="分析过程" prop="reviewProcess">
            <el-input v-model.trim="editForm.reviewProcess" type="textarea" :rows="4" placeholder="请输入分析过程" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核消息" prop="reviewMessage">
            <el-input v-model.trim="editForm.reviewMessage" type="textarea" :rows="4" placeholder="请输入审核消息" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="表格数据" prop="reviewTable">
            <el-input v-model.trim="editForm.reviewTable" type="textarea" :rows="4" placeholder="请输入表格数据" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="引用原文" prop="originalText">
            <el-input v-model.trim="editForm.originalText" type="textarea" :rows="4" placeholder="请输入引用原文" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="错误信息" prop="message">
            <el-input v-model.trim="editForm.message" type="textarea" :rows="4" placeholder="请输入错误信息" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="modal-footer">
        <el-button :disabled="editModal.loading" type="primary" size="small" plain @click="saveEditDetail">保 存</el-button>
        <el-button :disabled="editModal.loading" size="small" plain @click="closeEditDetail">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeTableInstance } from 'vxe-table'
import { updateTaskDetail } from '@/api/ai/smartTaskAudit'
import type { AiAuditTaskDetailVO } from '@/api/ai/smartTaskAudit'
import type { ModalState, OptionItem } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  dataList: {
    type: Array as PropType<AiAuditTaskDetailVO[]>,
    default: () => []
  },
  /** 审核意见下拉选项：取公共代码 AI_AUDIT_REVIEW_OPINION_COM，由父组件拉取后传入 */
  reviewOpinionOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  /** 任务状态下拉选项：取公共代码 AI_AUDIT_TASK_STATUS_COM，由父组件拉取后传入 */
  statusOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  }
})

const emit = defineEmits(['close', 'refresh'])

const tableRef = ref<VxeTableInstance>()

/** reviewTable 后端可能返回 JSON 字符串、对象或数组，表格列里只展示摘要，完整内容通过 show-overflow tooltip 查看 */
const formatReviewTable = (raw: unknown): string => {
  if (raw === null || raw === undefined || raw === '') return '-'
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return formatReviewTable(parsed)
    } catch {
      return raw
    }
  }
  if (Array.isArray(raw)) return `[表格数据 · ${raw.length} 项]`
  if (typeof raw === 'object') return '[表格数据]'
  return String(raw)
}

// ---- 修改审核要点明细 ----
interface EditDetailForm {
  detailId: string
  auditPointName: string
  ruleDesc: string
  reviewOpinion: string
  status: string
  startTime: string | Date
  finishTime: string | Date
  reviewConclude: string
  reviewAdvice: string
  reviewProcess: string
  reviewMessage: string
  reviewTable: string
  originalText: string
  message: string
}

const editModal = reactive({
  visible: false,
  loading: false
})

const editForm = reactive<EditDetailForm>({
  detailId: '',
  auditPointName: '',
  ruleDesc: '',
  reviewOpinion: '',
  status: '',
  startTime: '',
  finishTime: '',
  reviewConclude: '',
  reviewAdvice: '',
  reviewProcess: '',
  reviewMessage: '',
  reviewTable: '',
  originalText: '',
  message: ''
})

const formRef = ref()

const toDate = (val: unknown): string | Date => (val ? new Date(val as string) : '')

/** 表格数据后端可能返回对象/数组，编辑框需字符串，统一转字符串 */
const toStringValue = (val: unknown): string => {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  try {
    return JSON.stringify(val)
  } catch {
    return String(val)
  }
}

/** 从表格行带出数据回显：textarea 直接绑定 editForm，赋值即回显 */
const openEditDetail = (row: AiAuditTaskDetailVO) => {
  if (!row?.detailId) {
    ElMessage.warning('当前审核要点缺少明细ID')
    return
  }
  editForm.detailId = String(row.detailId)
  editForm.auditPointName = row.auditPointName || ''
  editForm.ruleDesc = row.ruleDesc || ''
  editForm.reviewOpinion = row.reviewOpinion || ''
  editForm.status = row.status || ''
  editForm.startTime = toDate(row.startTime)
  editForm.finishTime = toDate(row.finishTime)
  editForm.reviewConclude = row.reviewConclude || ''
  editForm.reviewAdvice = row.reviewAdvice || ''
  editForm.reviewProcess = row.reviewProcess || ''
  editForm.reviewMessage = row.reviewMessage || ''
  editForm.reviewTable = toStringValue(row.reviewTable)
  editForm.originalText = row.originalText || ''
  editForm.message = row.message || ''
  editModal.visible = true
}

const closeEditDetail = () => {
  editModal.visible = false
  editModal.loading = false
}

/** 保存：textarea 直接绑定 editForm，按 detailId 调 updateTaskDetail，成功后通知父刷新列表 */
const saveEditDetail = async () => {
  if (!editForm.detailId) {
    ElMessage.warning('明细ID缺失，无法保存')
    return
  }
  let valid = true
  try {
    await formRef.value?.validate?.()
  } catch {
    valid = false
  }
  if (!valid) return

  // 字段原样透传：不做 `值 || undefined` 转换，否则清空后的空字符串会被 JSON.stringify 丢弃，
  // 后端收不到该字段、无法区分「用户清空」与「未改动」，导致文本框清空不生效。
  const payload = {
    detailId: editForm.detailId,
    ruleDesc: editForm.ruleDesc,
    reviewOpinion: editForm.reviewOpinion,
    status: editForm.status,
    startTime: editForm.startTime as Date | undefined,
    finishTime: editForm.finishTime as Date | undefined,
    reviewConclude: editForm.reviewConclude,
    reviewAdvice: editForm.reviewAdvice,
    reviewProcess: editForm.reviewProcess,
    reviewMessage: editForm.reviewMessage,
    reviewTable: editForm.reviewTable,
    originalText: editForm.originalText,
    message: editForm.message
  }

  editModal.loading = true
  try {
    const res = await updateTaskDetail(payload)
    if (res.success) {
      ElMessage.success('保存成功')
      closeEditDetail()
      emit('refresh')
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    editModal.loading = false
  }
}

defineExpose({
  /** 刷新表格布局，弹窗尺寸变化或数据加载后由父组件调用 */
  refreshLayout: () => {
    tableRef.value?.refreshColumn?.()
  }
})
</script>

<style scoped lang="less">
:global(.smart-task-detail-list-modal .vxe-modal--body),
:global(.smart-task-detail-edit-modal .vxe-modal--body) {
  padding: 0;
  overflow: hidden;
}

:global(.smart-task-detail-list-modal .vxe-modal--content) {
  height: 100%;
  padding: 0;
  overflow: hidden;
}

.task-detail-list {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;

  :deep(.vxe-table) {
    color: #475569;
    --vxe-font-color: #475569;
    --vxe-table-header-font-color: #00706b;
    --vxe-table-header-background-color: #dff3f0;
    --vxe-table-header-font-weight: 600;
    --vxe-table-border-color: #e2e8f0;
    --vxe-table-row-hover-background-color: #e6f4f3;
    --vxe-table-row-striped-background-color: #f7fcfb;
    --vxe-table-row-current-background-color: #d8efec;
  }

  :deep(.vxe-header--column) {
    height: 44px;
    color: #00706b !important;
    font-size: 13px;
    font-weight: 600;
    background-color: #dff3f0 !important;
  }

  // 表头文字统一居中（覆盖各列 align/header-align 的内联对齐），表体对齐不受影响
  :deep(.vxe-header--column .vxe-cell) {
    text-align: center !important;
  }

  :deep(.vxe-body--column) {
    color: #475569;
    font-size: 13px;
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: #f7fcfb !important;
  }

  :deep(.vxe-body--row.row--hover) {
    background-color: #e6f4f3 !important;
  }
}

.modal-footer {
  text-align: center;
}
</style>
