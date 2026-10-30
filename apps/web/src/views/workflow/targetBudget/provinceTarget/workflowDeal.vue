<!-- 省统筹目标值审核审批页面 -->
<template>
  <div v-loading="loading" class="workflowTargetBudget" element-loading-text="正在加载..." element-loading-background="rgba(255, 255, 255, 0.72)">
    <div class="workflowTargetBudget-operation">
      <div class="left">
        <template v-if="activeTab === 'maintain'">
          <el-button size="small" type="primary" :disabled="loading || !isWorkflowReady" plain @click="handleExportData">导 出</el-button>
        </template>
        <template v-else-if="activeTab === 'summary'">
          <el-button size="small" type="primary" :disabled="loading || !isWorkflowReady" plain @click="handleSummaryExportData">导 出</el-button>
        </template>
        <template v-else>
          <el-button size="small" type="primary" :disabled="loading || !isWorkflowReady" plain @click="handleProjectDetailExportData">导 出</el-button>
        </template>
        <el-button size="small" type="primary" :disabled="loading || !isWorkflowReady || !auditPassAllowed" plain @click="handlePass">
          通 过
        </el-button>
        <el-button size="small" type="primary" :disabled="loading || !isWorkflowReady" plain @click="handleReject"> 驳 回 </el-button>
        <el-button size="small" type="primary" :disabled="loading" plain @click="closeDialog">关 闭</el-button>
      </div>
      <div class="right">
        <div class="info">
          <div class="highlight">
            <dt> 版本编号:</dt>
            <dd>{{ wfDataString?.VERSION_NO }}</dd>
          </div>
          <div class="highlight">
            <dt> 版本名称:</dt>
            <dd>{{ wfDataString?.VERSION_NAME }}</dd>
          </div>
          <div class="highlight">
            <dt>年度:</dt>
            <dd>{{ wfDataString?.ND }}</dd>
          </div>
          <div class="highlight">
            <dt>单位:</dt>
            <dd>{{ `万元` }}</dd>
          </div>
        </div>
      </div>
    </div>
    <el-tabs v-model="activeTab" class="workflowTargetBudget-tabs">
      <el-tab-pane v-for="tab in maintainTabs" :key="tab.value" :label="tab.label" :name="tab.value">
        <div v-if="tab.value === 'maintain'" class="workflowTargetBudget-pane">
          <div class="workflowTargetBudget-table">
            <div class="workflowTargetBudget-panel workflowTargetBudget-panel--remark">
              <div class="workflowTargetBudget-panel__header" @click="toggleRemarkPanel">
                <span class="workflowTargetBudget-panel__title">
                  <i class="el-icon-arrow-down workflowTargetBudget-panel__arrow" :class="{ 'is-expanded': isRemarkPanelExpanded }"></i>
                  调整说明及附件
                </span>
                <el-button type="text" size="small" @click.stop="toggleRemarkPanel">
                  {{ isRemarkPanelExpanded ? '收 起' : '展 开' }}
                </el-button>
              </div>
              <el-collapse-transition>
                <div v-show="isRemarkPanelExpanded" class="workflowTargetBudget-panel__body">
                  <el-form label-suffix="：" label-width="100px">
                    <el-form-item class="workflowTargetBudget-panel__item workflowTargetBudget-panel__item--remark" label="调整说明">
                      <el-input :model-value="adjustRemark" disabled maxlength="500" show-word-limit :rows="3" resize="none" type="textarea" />
                    </el-form-item>
                    <el-form-item class="workflowTargetBudget-panel__item workflowTargetBudget-panel__item--attachments" label="附件">
                      <TargetBudgetAttachments :key="workflowVersionId" :version-id="workflowVersionId" :readonly="true" />
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-transition>
            </div>
            <div class="workflowTargetBudget-panel workflowTargetBudget-panel--filter">
              <div class="workflowTargetBudget-filterBar">
                <el-form label-suffix="：" label-width="100px" @submit.prevent>
                  <el-form-item class="workflowTargetBudget-panel__item workflowTargetBudget-panel__item--filter" label="数据项统计">
                    <el-checkbox-group v-model="maintainSearchForm.dataType" class="workflowTargetBudget-checkboxGroup" size="small">
                      <el-checkbox
                        v-for="item in maintainDataTypeOptions"
                        :key="item.value"
                        :label="item.value"
                        class="workflowTargetBudget-checkbox"
                      >
                        {{ item.label }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                </el-form>
                <div class="workflowTargetBudget-query__actions">
                  <el-button type="primary" plain size="small" @click="handleFilterQuery">查 询</el-button>
                  <el-button plain size="small" @click="handleFilterReset">重 置</el-button>
                </div>
              </div>
            </div>
            <div class="workflowTargetBudget-grid">
              <vxe-grid ref="gridRef" auto-resize :data="tableData" v-on="gridEvent" v-bind="gridOptions"></vxe-grid>
            </div>
          </div>
        </div>
        <div v-else-if="tab.value === 'summary'" class="workflowTargetBudget-pane">
          <div class="workflowTargetBudget-grid">
            <vxe-grid ref="summaryGridRef" auto-resize :data="projectAdjustSummaryData" v-bind="summaryGridOptions" />
          </div>
        </div>
        <div v-else class="workflowTargetBudget-pane">
          <div class="workflowTargetBudget-grid">
            <vxe-grid ref="projectDetailGridRef" auto-resize :data="projectDetailVisibleData" v-bind="projectDetailGridOptions" />
          </div>
          <div class="workflowTargetBudget-pager">
            <el-pagination
              :current-page="projectDetailPage.page"
              background
              align="center"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="projectDetailPage.limit"
              :total="projectDetailPage.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleProjectDetailLimitChange"
              @current-change="handleProjectDetailPageChange"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  <vxe-modal
    v-model="approveDialogVisible"
    show-zoom
    resize
    position="center"
    destroy-on-close
    transfer
    :mask-closable="false"
    :loading="loading"
    :show-footer="true"
    :width="560"
    :height="isApproveNeedShxx ? 280 : 235"
    title="审批"
    @close="closeApproveDialog"
  >
    <el-form label-suffix="：" label-width="100px" class="workflowTargetBudget-approveForm">
      <el-form-item v-if="isApproveNeedShxx" label="上会信息" required>
        <el-select v-model="approveForm.shxx" placeholder="请选择上会信息" style="width: 100%">
          <el-option v-for="item in shxxOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="审批意见" required>
        <el-input v-model="approveForm.spyj" type="textarea" :rows="4" maxlength="500" show-word-limit resize="none" placeholder="请输入审批意见" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="workflowTargetBudget-modalFooter">
        <el-button plain type="primary" size="small" :disabled="loading" @click="submitApproveDialog">确 定</el-button>
        <el-button plain type="primary" size="small" :disabled="loading" @click="closeApproveDialog">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "WorkflowDeal" })
import { onMounted } from 'vue'
import { useWorkflowDeal } from './hooks/useWorkflowDeal'
import TargetBudgetAttachments from '@/views/targetBudget/provinceTarget/components/TargetBudgetAttachments.vue'

const {
  loading,
  isWorkflowReady,
  auditPassAllowed,
  activeTab,
  maintainTabs,
  gridEvent,
  gridOptions,
  gridRef,
  tableData,
  adjustRemark,
  isRemarkPanelExpanded,
  toggleRemarkPanel,
  maintainSearchForm,
  maintainDataTypeOptions,
  summaryGridRef,
  summaryGridOptions,
  projectAdjustSummaryData,
  projectDetailGridRef,
  projectDetailGridOptions,
  projectDetailVisibleData,
  projectDetailPage,
  wfDataString,
  workflowVersionId,
  approveDialogVisible,
  approveForm,
  shxxOptions,
  isApproveNeedShxx,
  initWorkflowContext,
  handleFilterQuery,
  handleFilterReset,
  handleExportData,
  handleSummaryExportData,
  handleProjectDetailExportData,
  handleProjectDetailPageChange,
  handleProjectDetailLimitChange,
  handlePass,
  submitApproveDialog,
  handleReject,
  closeApproveDialog,
  closeDialog
} = useWorkflowDeal()

onMounted(() => {
  initWorkflowContext()
})
</script>

<style scoped lang="less">
.workflowTargetBudget {
  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: white;

  &-operation {
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;

    .left {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1 1 auto;

      .info {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;

        .highlight {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          padding: 4px 12px;
          background-color: var(--el-fill-color-light, #f5f7fa);
          border: 1px solid var(--el-border-color-light, #dcdfe6);
          border-radius: 4px;
          white-space: nowrap;
          transition: background-color 0.2s;
          max-width: 240px;

          &:hover {
            background-color: var(--el-fill-color, #e6e8eb);
          }

          dt {
            color: var(--el-text-color-regular, #606266);
            font-weight: normal;
            margin: 0;
          }

          dd {
            font-weight: 600;
            color: var(--el-text-color-primary, #303133);
            margin: 0 0 0 6px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  &-table {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &-tabs {
    flex: 1;
    min-height: 0;

    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  &-pane {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &-panel {
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-light, #dcdfe6);
    border-radius: 4px;
    background-color: #fff;
    flex: 0 0 auto;
  }

  &-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }

  &-panel__title {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
  }

  &-panel__arrow {
    margin-right: 6px;
    font-size: 12px;
    color: var(--el-text-color-regular, #606266);
    transition: transform 0.2s ease;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }

  &-panel__body {
    padding-top: 12px;
  }

  &-panel__item {
    width: 100%;
    margin-bottom: 0;
  }

  &-approveForm {
    padding: 8px 16px 0;
  }

  &-modalFooter {
    text-align: center;
  }

  &-panel__item--remark {
    :deep(.el-form-item__content) {
      line-height: normal;
    }
  }

  &-panel__item--attachments {
    margin-top: 12px;
  }

  &-filterBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  &-panel--filter {
    :deep(.el-form) {
      flex: 1 1 320px;
    }
  }

  &-panel__item--filter {
    :deep(.el-form-item__content) {
      flex: 1;
    }
  }

  &-checkboxGroup {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    min-height: 28px;
    align-items: center;
  }

  &-checkbox {
    margin-right: 0;
  }

  &-query__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
  }

  &-grid {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  &-pager {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }

  :deep(.summary-row) {
    background-color: #f5f7fa;
    font-weight: bold;

    .vxe-body--column {
      background-color: #f5f7fa !important;
    }

    .col--dirty::before {
      display: none;
    }
  }

  :deep(.vxe-grid) {
    height: 100%;
  }

  :deep(.el-tabs) {
    height: 100%;
  }
}
</style>

<style lang="less">
.workflow-messagebox-center-btn {
  .el-message-box__btns {
    text-align: center;
  }
}
</style>
