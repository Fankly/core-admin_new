<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading"
    title="创建任务"
    width="86%"
    height="820"
    resize
    show-zoom
    show-close
    fullscreen
    destroy-on-close
    position="center"
    @close="$emit('close')"
  >
    <div class="create-task-modal">
      <div class="create-task-modal__actions">
        <el-tooltip content="请先在下方列表勾选项目" :disabled="selectedCount > 0" placement="bottom-start" effect="light">
          <span class="create-task-modal__action">
            <el-button size="mini" type="primary" plain :disabled="modal.loading || selectedCount === 0" @click="$emit('create')">
              创 建<template v-if="selectedCount > 0">（{{ selectedCount }}）</template>
            </el-button>
          </span>
        </el-tooltip>
        <el-button size="mini" plain :disabled="modal.loading" @click="$emit('close')">关 闭</el-button>
        <span v-if="selectedCount > 0" class="create-task-modal__selected" aria-live="polite">已选 {{ selectedCount }} 个项目</span>
      </div>

      <div class="create-task-modal__search">
        <el-form ref="formRef" :model="formModel" label-position="right" label-width="110px">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="项目编码：" prop="xmbm">
                <ReMultipleText v-model="formModel.xmbm" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：" prop="xmmc">
                <el-input v-model.trim="formModel.xmmc" clearable :maxlength="100" placeholder="请输入" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="计划年度：" prop="jhssnd">
                <el-select v-model="formModel.jhssnd" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yearList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级单位：" prop="yjdw">
                <el-select
                  v-model="formModel.yjdw"
                  clearable
                  filterable
                  placeholder="请选择"
                  style="width: 100%"
                  @change="$emit('yjdw-change', formModel.yjdw)"
                >
                  <el-option v-for="item in yjdwList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：" prop="ejdwList">
                <el-select v-model="formModel.ejdwList" clearable filterable multiple collapse-tags placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in ejdwList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：" prop="proTypeList">
                <ElTreeSelect
                  v-model="formModel.proTypeList"
                  clearable
                  :data="projectTypeList"
                  :props="projectTypeProps"
                  :multiple="true"
                  :show-checkbox="true"
                  :collapse-tags="true"
                  :check-on-click-node="false"
                  node-key="middleId"
                  placeholder="请选择"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级分类：" prop="yjfl">
                <el-select v-model="formModel.yjfl" clearable placeholder="请选择" style="width: 100%" @change="$emit('yjfl-change', formModel.yjfl)">
                  <el-option v-for="item in yjflList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级分类：" prop="ejfl">
                <el-select v-model="formModel.ejfl" clearable placeholder="请选择" style="width: 100%" @change="$emit('ejfl-change', formModel.ejfl)">
                  <el-option v-for="item in ejflList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="三级分类：" prop="sjflList">
                <el-select v-model="formModel.sjflList" clearable multiple collapse-tags placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in sjflList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态：" prop="flowStatusList">
                <ElTreeSelect
                  v-model="formModel.flowStatusList"
                  clearable
                  :data="flowStatusList"
                  :props="flowStatusProps"
                  :multiple="true"
                  :show-checkbox="true"
                  :collapse-tags="true"
                  :check-on-click-node="false"
                  node-key="code"
                  placeholder="请选择"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <div class="create-task-modal__search-actions">
                <el-button size="mini" type="primary" plain :disabled="modal.loading" @click="$emit('search')">查 询</el-button>
                <el-button size="mini" plain :disabled="modal.loading" @click="$emit('reset')">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="create-task-modal__table">
        <vxe-grid
          ref="gridRef"
          v-bind="gridOptions"
          @checkbox-change="selectionChangeHandle"
          @checkbox-all="selectionChangeHandle"
          @cell-click="cellClickHandle"
        ></vxe-grid>
      </div>

      <div class="create-task-modal__pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="Number(page.total)"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="$emit('limit-change', $event)"
          @current-change="$emit('page-change', $event)"
        />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import { flowStatusProps, projectTypeProps } from '../constants'
import type { ModalState, OptionItem, PageState, ProjectSearchForm, SmartTaskAuditProjectGridOptions, SmartTaskAuditProjectRow } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  searchForm: {
    type: Object as PropType<ProjectSearchForm>,
    required: true
  },
  gridOptions: {
    type: Object as PropType<SmartTaskAuditProjectGridOptions>,
    required: true
  },
  page: {
    type: Object as PropType<PageState>,
    required: true
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  yearList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  yjdwList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  ejdwList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  projectTypeList: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  yjflList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  ejflList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  sjflList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  flowStatusList: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  }
})

const emit = defineEmits([
  'close',
  'search',
  'reset',
  'create',
  'page-change',
  'limit-change',
  'selection-change',
  'yjdw-change',
  'yjfl-change',
  'ejfl-change'
])

const formRef = ref()
const gridRef = ref<VxeGridInstance>()
const formModel = computed(() => props.searchForm)

const selectionChangeHandle = ({ records }: any) => {
  emit('selection-change', records || gridRef.value?.getCheckboxRecords() || [])
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type !== 'checkbox') {
    await gridRef.value?.clearCheckboxRow()
    await gridRef.value?.setCheckboxRow(row, true)
    emit('selection-change', [row])
    return
  }
  emit('selection-change', gridRef.value?.getCheckboxRecords() || [])
}

defineExpose({
  clearValidate: () => formRef.value?.clearValidate?.(),
  clearCheckboxRow: () => gridRef.value?.clearCheckboxRow(),
  getCheckboxRecords: (): SmartTaskAuditProjectRow[] => gridRef.value?.getCheckboxRecords() || []
})
</script>

<style scoped lang="less">
@import '../css/tokens.less';

.create-task-modal {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    margin-bottom: 10px;
  }

  /* 包一层 span，让按钮禁用时 el-tooltip 仍能接到 hover */
  &__action {
    display: inline-flex;
    align-items: center;
  }

  &__selected {
    height: 24px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border: 1px solid @primary-border-light;
    border-radius: 999px;
    color: @primary-solid;
    background: @primary-bg-light;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__search {
    padding: 0 10px;
  }

  &__search-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-top: 2px;
  }

  &__table {
    flex: 1;
    min-height: 0;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
    overflow: hidden;

    :deep(.el-pagination) {
      flex-wrap: wrap;
      justify-content: flex-end;
      row-gap: 4px;
    }

    :deep(.el-pagination .el-pagination__jump) {
      margin: 0 0 0 8px;
    }
  }
}
</style>
