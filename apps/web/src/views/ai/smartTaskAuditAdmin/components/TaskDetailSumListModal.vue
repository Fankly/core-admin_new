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
    title="审核任务规则详情"
    class-name="smart-task-detail-sum-list-modal"
    @close="$emit('close')"
  >
    <div class="task-detail-sum-list">
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
        empty-text="暂无审核规则数据"
      >
        <vxe-column type="seq" title="序号" width="60" align="center" fixed="left" />
        <vxe-column field="ruleName" title="规则名称" min-width="220" align="left" show-overflow fixed="left" />
        <vxe-column field="reviewOpinionName" title="审核意见" width="120" align="center" show-overflow />
        <vxe-column field="reviewConclude" title="审核结论" min-width="300" align="left" show-overflow />
        <vxe-column field="originalText" title="引用原文" min-width="360" align="left" show-overflow />
        <vxe-column title="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="openEditDetail(row)">修 改</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </vxe-modal>

  <!-- 修改审核规则详情：从表格行带出数据回显，按 detailId 更新 -->
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
    title="修改审核任务规则详情"
    class-name="smart-task-detail-sum-edit-modal"
    @close="closeEditDetail"
  >
    <el-form ref="formRef" :model="editForm" label-width="100px" label-suffix="：" label-position="right">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="规则名称" prop="ruleName">
            <el-input v-model.trim="editForm.ruleName" disabled :maxlength="200" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核意见" prop="reviewOpinion">
            <el-select v-model="editForm.reviewOpinion" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in reviewOpinionOptions" :key="item.code" :value="item.code" :label="item.name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核结论" prop="reviewConclude">
            <el-input v-model.trim="editForm.reviewConclude" type="textarea" :rows="4" placeholder="请输入审核结论" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="引用原文" prop="originalText">
            <el-input
              v-model.trim="editForm.originalText"
              type="textarea"
              :autosize="{ minRows: 12, maxRows: 20 }"
              placeholder="请输入引用原文"
              clearable
            />
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
import { updateTaskDetailSum } from '@/api/ai/smartTaskAudit'
import type { AiAuditTaskDetailSumVO } from '@/api/ai/smartTaskAudit'
import type { ModalState, OptionItem } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  dataList: {
    type: Array as PropType<AiAuditTaskDetailSumVO[]>,
    default: () => []
  },
  /** 审核意见下拉选项：取公共代码 AI_AUDIT_REVIEW_OPINION_COM，由父组件拉取后传入 */
  reviewOpinionOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  }
})

const emit = defineEmits(['close', 'refresh'])

const tableRef = ref<VxeTableInstance>()

// ---- 修改审核规则详情 ----
interface EditDetailForm {
  detailId: string
  ruleName: string
  reviewOpinion: string
  reviewConclude: string
  originalText: string
}

const editModal = reactive({
  visible: false,
  loading: false
})

const editForm = reactive<EditDetailForm>({
  detailId: '',
  ruleName: '',
  reviewOpinion: '',
  reviewConclude: '',
  originalText: ''
})

const formRef = ref()

/** 从表格行带出数据回显：textarea 直接绑定 editForm，赋值即回显 */
const openEditDetail = (row: AiAuditTaskDetailSumVO) => {
  if (!row?.detailId) {
    ElMessage.warning('当前审核规则缺少明细ID')
    return
  }
  editForm.detailId = String(row.detailId)
  editForm.ruleName = row.ruleName || ''
  editForm.reviewOpinion = row.reviewOpinion || ''
  editForm.reviewConclude = row.reviewConclude || ''
  editForm.originalText = row.originalText || ''
  editModal.visible = true
}

const closeEditDetail = () => {
  editModal.visible = false
  editModal.loading = false
}

/** 保存：textarea 直接绑定 editForm，按 detailId 调 updateTaskDetailSum，成功后通知父刷新列表 */
const saveEditDetail = async () => {
  if (!editForm.detailId) {
    ElMessage.warning('明细ID缺失，无法保存')
    return
  }

  // 字段原样透传：不做 `值 || undefined` 转换，否则清空后的空字符串会被 JSON.stringify 丢弃，
  // 后端收不到该字段、无法区分「用户清空」与「未改动」，导致文本框清空不生效。
  const payload = {
    detailId: editForm.detailId,
    reviewOpinion: editForm.reviewOpinion,
    reviewConclude: editForm.reviewConclude,
    originalText: editForm.originalText
  }

  editModal.loading = true
  try {
    const res = await updateTaskDetailSum(payload)
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
:global(.smart-task-detail-sum-list-modal .vxe-modal--body),
:global(.smart-task-detail-sum-edit-modal .vxe-modal--body) {
  padding: 0;
  overflow: hidden;
}

:global(.smart-task-detail-sum-list-modal .vxe-modal--content) {
  height: 100%;
  padding: 0;
  overflow: hidden;
}

.task-detail-sum-list {
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
