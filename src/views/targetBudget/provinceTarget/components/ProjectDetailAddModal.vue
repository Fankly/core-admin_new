<template>
  <vxe-modal
    v-model="showModal"
    title="调整类型选择框"
    width="88%"
    height="820"
    :show-footer="false"
    :loading="loading"
    :destroy-on-close="true"
    resize
    show-zoom
    position="center"
    fullscreen
    @close="handleClose"
  >
    <div class="project-detail-add-modal">
      <div class="project-detail-add-modal__operation">
        <div class="project-detail-add-modal__operationLeft">
          <el-button type="primary" plain size="mini" @click="handleConfirm">确 认</el-button>
          <el-button plain size="mini" @click="handleClose">取 消</el-button>
          <el-button type="primary" plain size="mini" @click="handleExport">导 出</el-button>
        </div>
      </div>
      <div class="project-detail-add-modal__panel project-detail-add-modal__panel--filter">
        <div class="project-detail-add-modal__filterBar">
          <el-form ref="formRef" :model="formData" class="project-detail-add-modal__form" label-width="88px" label-suffix="：" @submit.prevent>
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item class="project-detail-add-modal__item" label="年度">
                  <el-select v-model="formData.nd" class="project-detail-add-modal__select" filterable @change="handleYearChange">
                    <el-option v-for="item in yearOptions" :key="item.code" :label="item.name" :value="item.code" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item class="project-detail-add-modal__item" label="项目类型">
                  <el-select
                    v-model="formData.protypeIds"
                    class="project-detail-add-modal__select"
                    multiple
                    clearable
                    filterable
                    collapse-tags
                    :collapse-tags-limit="2"
                    :loading="projectTypeLoading"
                    :disabled="projectTypeLoading || projectTypeOptions.length === 0"
                  >
                    <el-option v-for="item in projectTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item class="project-detail-add-modal__item" label="项目编码">
                  <ReMultipleText
                    v-model="projectCodeText"
                    class="project-detail-add-modal__select"
                    dialog-title="项目编码"
                    tooltip-text="项目编码"
                    placeholder="请输入项目编码,多个值用逗号分隔"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item class="project-detail-add-modal__item" label="调整类型">
                  <el-select v-model="formData.tzlx" class="project-detail-add-modal__select">
                    <el-option v-for="item in adjustmentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24" class="project-detail-add-modal__formRow">
              <el-col :span="12">
                <el-form-item class="project-detail-add-modal__item" label="状态">
                  <el-input :model-value="statusInfo.label" class="project-detail-add-modal__select" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <div class="project-detail-add-modal__queryActions">
                  <el-button type="primary" plain size="mini" @click="queryData">查 询</el-button>
                  <el-button plain size="mini" @click="handleReset">重 置</el-button>
                </div>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="project-detail-add-modal__grid">
        <vxe-grid ref="gridRef" auto-resize :data="tableData" v-bind="gridOptions" />
      </div>
      <div class="project-detail-add-modal__pager">
        <el-pagination
          :current-page="pageInfo.page"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[20, 50, 100, 500]"
          :page-size="pageInfo.limit"
          :total="pageInfo.total"
          @size-change="handleLimitChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="ProjectDetailAddModal">
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { useProjectDetailAddModal } from './hooks/useProjectDetailAddModal'

interface AdjustmentTypeOption {
  label: string
  value: '1' | '2' | '3'
}

interface ProjectDetailAddModalProps {
  adjustmentTypeOptions?: AdjustmentTypeOption[]
  columns?: any[]
}

const props = defineProps<ProjectDetailAddModalProps>()

const emit = defineEmits<{
  (event: 'confirm'): void
}>()

const {
  formRef,
  gridRef,
  showModal,
  loading,
  projectTypeLoading,
  formData,
  projectCodeText,
  yearOptions,
  projectTypeOptions,
  adjustmentTypeOptions,
  statusInfo,
  tableData,
  pageInfo,
  gridOptions,
  acceptParams,
  handleYearChange,
  queryData,
  handleExport,
  handlePageChange,
  handleLimitChange,
  handleReset,
  handleClose,
  handleConfirm
} = useProjectDetailAddModal(props, emit)

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.project-detail-add-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__panel {
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-light, #dcdfe6);
    border-radius: 4px;
    background-color: #fff;
    flex: 0 0 auto;
  }

  &__operation {
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__operationLeft {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__panel--filter {
    :deep(.el-form) {
      flex: 1 1 320px;
    }
  }

  &__form {
    flex: 1;
  }

  &__item {
    width: 100%;
    margin-bottom: 0;

    :deep(.el-form-item__content) {
      flex: 1;
    }
  }

  &__filterBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  &__select {
    width: 100%;
  }

  &__formRow {
    margin-top: 12px;
  }

  &__queryActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    height: 100%;
    align-items: center;
  }

  &__grid {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
    flex: 0 0 auto;
  }

  :deep(.vxe-grid) {
    height: 100%;
  }
}
</style>
