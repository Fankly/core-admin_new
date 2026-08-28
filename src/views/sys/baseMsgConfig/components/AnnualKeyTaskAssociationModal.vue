<template>
  <vxe-modal
    v-model="visible"
    class-name="annual-key-task-association-modal"
    destroy-on-close
    position="center"
    resize
    show-zoom
    title="关联年度重点任务"
    width="90%"
    height="82%"
    :loading="submitting"
    @close="handleClose"
  >
    <div class="association-content">
      <div class="association-toolbar">
        <div class="association-actions">
          <el-button type="primary" plain :loading="submitting" @click="handleSubmit">确认关联</el-button>
          <el-button plain :disabled="submitting" @click="handleClose">取 消</el-button>
        </div>
        <span class="selection-tip">请选择同一年度的一条或多条重点任务，不选则清空已关联的重点任务</span>
      </div>
      <AnnualKeyTask
        v-if="visible"
        ref="annualKeyTaskRef"
        class="association-task-list"
        embedded
        selection-mode
        :initial-user-role="parameter.userRole"
      />
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="AnnualKeyTaskAssociationModal">
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { linkNdzdrw } from '@/api/sys/proCategory'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import type { AnnualKeyTaskRowVO } from '@/api/xmInfo/annualKeyTask'
import AnnualKeyTask from '@/views/xmInfo/annualKeyTask/index.vue'

interface AcceptParams {
  ids: string[]
  userRole: Partial<UserRole>
}

type AnnualKeyTaskExpose = {
  clearSelectedRows: () => void
  getSelectedRows: () => AnnualKeyTaskRowVO[]
}

const emit = defineEmits<{
  (event: 'saveDataAfter'): void
}>()

const visible = ref(false)
const submitting = ref(false)
const annualKeyTaskRef = ref<AnnualKeyTaskExpose>()
const parameter = ref<AcceptParams>({
  ids: [],
  userRole: {}
})

const acceptParams = async (params: AcceptParams) => {
  parameter.value = {
    ids: [...params.ids],
    userRole: { ...params.userRole }
  }
  visible.value = true
  await nextTick()
}

const handleClose = () => {
  annualKeyTaskRef.value?.clearSelectedRows()
  visible.value = false
}

const handleSubmit = async () => {
  const selectedRows = annualKeyTaskRef.value?.getSelectedRows() || []

  // 允许不选重点任务：未选择时按清空关联处理
  if (!selectedRows.length) {
    submitting.value = true
    try {
      const result = await linkNdzdrw({
        ids: parameter.value.ids,
        nd: '',
        ndzdrwIds: []
      })
      if (!result.success) throw new Error('清空年度重点任务关联失败')
      ElMessage.success('已清空关联')
      handleClose()
      emit('saveDataAfter')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '清空年度重点任务关联失败，请稍后重试')
    } finally {
      submitting.value = false
    }
    return
  }

  const invalidRow = selectedRows.find((row) => row.id === null || row.id === undefined || row.id === '' || !String(row.nd || '').trim())
  if (invalidRow) {
    ElMessage.error('所选年度重点任务缺少任务编码或年度，无法关联')
    return
  }

  const years = [...new Set(selectedRows.map((row) => String(row.nd).trim()))]
  if (years.length !== 1) {
    ElMessage.warning('请选择同一年度的重点任务进行关联')
    return
  }

  submitting.value = true
  try {
    const result = await linkNdzdrw({
      ids: parameter.value.ids,
      nd: years[0],
      ndzdrwIds: selectedRows.map((row) => String(row.id))
    })
    if (!result.success) throw new Error('关联年度重点任务失败')
    ElMessage.success('关联成功')
    handleClose()
    emit('saveDataAfter')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '关联年度重点任务失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
.association-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.association-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding-bottom: 12px;
}

.association-task-list {
  flex: 1 1 0;
  min-height: 0;
}

.selection-tip {
  color: var(--el-text-color-secondary, #64748b);
  font-size: 13px;
}

.association-actions {
  display: flex;
  align-items: center;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

:deep(.vxe-modal--content) {
  display: flex;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}
</style>
