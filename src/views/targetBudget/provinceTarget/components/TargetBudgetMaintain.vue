<template>
  <vxe-modal
    ref="targetBudgetMaintainRef"
    :destroy-on-close="true"
    :height="modalHeight"
    v-model="isShowModal"
    :width="modalWidth"
    :title="modalTitle"
    @close="handleCloseModal"
    show-zoom
    resize
    fullscreen
  >
    <div v-loading="loading" class="targetBudgetMaintain" element-loading-text="正在加载..." element-loading-background="rgba(255, 255, 255, 0.72)">
      <div class="targetBudgetMaintain-operation">
        <div class="left">
          <template v-if="activeTab === 'maintain'">
            <el-button type="primary" plain size="mini" @click="handleExportData">导 出</el-button>
            <el-button :disabled="!isChangeData" v-if="isShowBtn" type="primary" plain size="mini" @click="handleSubmitData">提 交</el-button>
            <el-button v-if="isShowBtn" type="primary" plain size="mini" @click="handleTargetValueResetData">目标值重置</el-button>
          </template>
          <template v-else-if="activeTab === 'summary'">
            <el-button type="primary" plain size="mini" @click="handleSummaryExportData">导 出</el-button>
          </template>
          <template v-else>
            <el-button
              v-if="isShowBtn"
              :disabled="!projectDetailEditEnabled || !projectDetailHasChanges"
              type="primary"
              plain
              size="mini"
              @click="handleProjectDetailSave"
            >
              保 存
            </el-button>
            <el-button v-if="isShowBtn" type="primary" plain size="mini" @click="handleProjectDetailAddOpen">新 增</el-button>
            <el-button v-if="isShowBtn" type="danger" plain size="mini" @click="handleProjectDetailDelete">删 除</el-button>
            <el-button v-if="isShowBtn" type="primary" plain size="mini" @click="handleProjectDetailImport">导 入</el-button>
            <el-button type="primary" plain size="mini" @click="handleProjectDetailExportData">导 出</el-button>
          </template>
          <el-button type="primary" plain size="mini" @click="handleCloseModal">关 闭</el-button>
        </div>
        <div class="right">
          <div class="info">
            <div class="highlight">
              <dt>版本编号:</dt>
              <dd>{{ parameter?.versionNo }}</dd>
            </div>
            <div class="highlight">
              <dt>版本名称:</dt>
              <dd>{{ parameter?.versionName }}</dd>
            </div>
            <div class="highlight">
              <dt>年度:</dt>
              <dd>{{ parameter?.nd }}</dd>
            </div>
            <div class="highlight">
              <dt>单位:</dt>
              <dd>万元</dd>
            </div>
          </div>
        </div>
      </div>
      <el-tabs v-model="activeTab" class="targetBudgetMaintain-tabs">
        <el-tab-pane v-for="tab in maintainTabs" :key="tab.value" :label="tab.label" :name="tab.value">
          <div v-if="tab.value === 'maintain'" class="targetBudgetMaintain-pane">
            <div class="targetBudgetMaintain-table">
              <div class="targetBudgetMaintain-panel targetBudgetMaintain-panel--remark">
                <el-form label-suffix="：" label-width="100px">
                  <el-form-item class="targetBudgetMaintain-panel__item targetBudgetMaintain-panel__item--remark" label="调整说明">
                    <el-input :disabled="true" v-model="adjustRemark" maxlength="1000" show-word-limit :rows="3" resize="none" type="textarea" />
                  </el-form-item>
                </el-form>
              </div>
              <div class="targetBudgetMaintain-panel targetBudgetMaintain-panel--filter">
                <div class="targetBudgetMaintain-filterBar">
                  <el-form label-suffix="：" label-width="100px" @submit.prevent>
                    <el-form-item class="targetBudgetMaintain-panel__item targetBudgetMaintain-panel__item--filter" label="数据项统计">
                      <div class="targetBudgetMaintain-dataTypeControls">
                        <el-checkbox-group v-model="maintainSearchForm.dataType" class="targetBudgetMaintain-checkboxGroup" size="mini">
                          <el-checkbox
                            v-for="item in maintainDataTypeOptions"
                            :key="item.value"
                            :label="item.value"
                            class="targetBudgetMaintain-checkbox"
                          >
                            {{ item.label }}
                          </el-checkbox>
                        </el-checkbox-group>
                        <el-button
                          v-if="isTargetValueMaintain"
                          class="targetBudgetMaintain-controlAdjustmentButton"
                          type="primary"
                          plain
                          size="mini"
                          @click="handleTargetControlAdjustmentOpen"
                        >
                          目标总控值修改
                        </el-button>
                      </div>
                    </el-form-item>
                  </el-form>
                  <div class="targetBudgetMaintain-query__actions">
                    <el-button type="primary" plain size="mini" @click="handleFilterQuery">查 询</el-button>
                    <el-button plain size="mini" @click="handleFilterReset">重 置</el-button>
                  </div>
                </div>
              </div>
              <div class="targetBudgetMaintain-grid">
                <vxe-grid ref="gridRef" auto-resize :data="tableData" v-on="gridEvent" v-bind="gridOptions">
                  <template v-for="col in editableColumns" :key="col.field" #[col.slots.edit]="{ row }">
                    <input v-number-input="DECIMAL_DIGITS" class="my-input" v-model="row[col.field]" maxlength="20" />
                  </template>
                </vxe-grid>
              </div>
            </div>
          </div>
          <div v-else-if="tab.value === 'summary'" class="targetBudgetMaintain-pane">
            <div class="targetBudgetMaintain-grid">
              <vxe-grid ref="summaryGridRef" auto-resize :data="projectAdjustSummaryData" v-bind="summaryGridOptions" />
            </div>
          </div>
          <div v-else class="targetBudgetMaintain-pane">
            <div class="targetBudgetMaintain-grid">
              <vxe-grid
                ref="projectDetailGridRef"
                auto-resize
                :data="projectDetailVisibleData"
                v-bind="projectDetailGridOptions"
                @checkbox-change="handleProjectDetailSelectChange"
                @checkbox-all="handleProjectDetailSelectChange"
              >
                <template v-for="field in projectDetailTextFields" :key="field" #[`${field}_edit`]="{ row }">
                  <input class="my-input" v-model="row[field]" maxlength="255" />
                </template>
                <template v-for="field in projectDetailAmountFields" :key="`amount-${field}`" #[`${field}_edit`]="{ row }">
                  <input
                    v-number-input="DECIMAL_DIGITS"
                    class="my-input"
                    v-model="row[field]"
                    maxlength="20"
                    @input="handleProjectDetailAmountInput(row, field)"
                    @blur="handleProjectDetailAmountBlur(row, field)"
                  />
                </template>
                <template #sfyap_edit="{ row }">
                  <el-select
                    v-model="row.sfyap"
                    class="targetBudgetMaintain-select"
                    size="mini"
                    :disabled="isProjectDetailPreArrangeDisabled(row)"
                    :popper-append-to-body="false"
                  >
                    <el-option v-for="item in projectDetailPreArrangeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
                <template #dnysTzh_edit="{ row }">
                  <input
                    v-number-input="DECIMAL_DIGITS"
                    class="my-input"
                    v-model="row.dnysTzh"
                    maxlength="20"
                    :disabled="isProjectDetailAdjustedBudgetDisabled(row)"
                    @input="handleProjectDetailAmountInput(row, 'dnysTzh')"
                    @blur="handleProjectDetailAmountBlur(row, 'dnysTzh')"
                  />
                </template>
              </vxe-grid>
            </div>
            <div class="targetBudgetMaintain-pager">
              <el-pagination
                :current-page="projectDetailPage.page"
                background
                align="center"
                :page-sizes="[20, 50, 100, 500]"
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
  </vxe-modal>
  <ImportExcel ref="importRef" />
  <ProjectDetailAddModal
    ref="projectDetailAddModalRef"
    :adjustment-type-options="projectDetailAdjustmentTypeOptions"
    :columns="projectDetailGridOptions.columns || []"
    @confirm="handleProjectDetailAddConfirm"
  />
  <TargetControlAdjustmentModal ref="targetControlAdjustmentModalRef" :search="handleTargetControlAdjustmentSuccess" />
</template>

<script setup lang="ts" name="TargetBudgetmaintain">
import { ref } from 'vue'
import { useTargetBudgetMaintain } from './hooks/useTargetBudgetMaintain'
import ImportExcel from '@/components/ImportExcel/index.vue'
import ProjectDetailAddModal from './ProjectDetailAddModal.vue'
import TargetControlAdjustmentModal from './TargetControlAdjustmentModal.vue'

interface TargetBudgetMaintainProps {
  search: () => void
}

const props = defineProps<TargetBudgetMaintainProps>()

const {
  parameter,
  isShowBtn,
  isTargetValueMaintain,
  modalTitle,
  modalWidth,
  modalHeight,
  isShowModal,
  loading,
  activeTab,
  maintainTabs,
  targetBudgetMaintainRef,
  importRef,
  acceptParams,
  tableData,
  gridRef,
  gridEvent,
  gridOptions,
  summaryGridRef,
  summaryGridOptions,
  projectAdjustSummaryData,
  projectDetailGridRef,
  projectDetailGridOptions,
  projectDetailVisibleData,
  projectDetailPage,
  projectDetailEditEnabled,
  projectDetailHasChanges,
  projectDetailTextFields,
  projectDetailAmountFields,
  projectDetailAdjustmentTypeOptions,
  projectDetailPreArrangeOptions,
  handleCloseModal,
  handleExportData,
  handleSummaryExportData,
  handleSubmitData,
  handleTargetValueResetData,
  handleImportData,
  handleProjectDetailSave,
  handleProjectDetailDelete,
  handleProjectDetailExportData,
  handleProjectDetailImport,
  handleProjectDetailAddConfirm,
  handleProjectDetailPageChange,
  handleProjectDetailLimitChange,
  handleProjectDetailAmountInput,
  handleProjectDetailAmountBlur,
  handleProjectDetailSelectChange,
  isProjectDetailAdjustedBudgetDisabled,
  isProjectDetailPreArrangeDisabled,
  adjustRemark,
  maintainSearchForm,
  maintainDataTypeOptions,
  handleFilterQuery,
  handleFilterReset,
  editableColumns,
  isChangeData,
  DECIMAL_DIGITS,
  targetControlAdjustmentModalRef,
  handleTargetControlAdjustmentOpen,
  handleTargetControlAdjustmentSuccess
} = useTargetBudgetMaintain(props)

const projectDetailAddModalRef = ref<InstanceType<typeof ProjectDetailAddModal>>()

const handleProjectDetailAddOpen = () => {
  projectDetailAddModalRef.value?.acceptParams({
    defaultYear: parameter.value?.nd,
    gkbmId: parameter.value?.gkbmId,
    versionId: parameter.value?.id,
    columns: projectDetailGridOptions.columns || []
  })
}

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped>
.targetBudgetMaintain {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;

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
          max-width: 260px;

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

  &-table {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &-panel {
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-light, #dcdfe6);
    border-radius: 4px;
    background-color: #fff;
    flex: 0 0 auto;
  }

  &-panel__item {
    width: 100%;
    margin-bottom: 0;
  }

  &-panel__item--remark {
    :deep(.el-form-item__content) {
      line-height: normal;
    }
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
    flex: 0 1 auto;
    flex-wrap: nowrap;
    gap: 8px 16px;
    min-height: 28px;
    align-items: center;
  }

  &-dataTypeControls {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 12px;
  }

  &-controlAdjustmentButton {
    flex: 0 0 auto;
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

  &-select {
    width: 100%;
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
