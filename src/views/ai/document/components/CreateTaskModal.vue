<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading"
    title="创建任务"
    width="86%"
    height="760"
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
        <el-button size="mini" type="primary" plain :disabled="modal.loading || selectedCount === 0" @click="$emit('create')">创 建</el-button>
        <el-button size="mini" plain :disabled="modal.loading" @click="$emit('close')">关 闭</el-button>
        <span class="create-task-modal__selection">已选择 {{ selectedCount }} 个项目</span>
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
                <el-select v-model="formModel.jhssnd" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yearList" :key="item.code" :value="item.code" :label="item.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级单位：" prop="yjdw">
                <el-select v-model="formModel.yjdw" clearable filterable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yjdwList" :key="item.code" :value="item.code" :label="item.name" />
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
            <el-col :span="18">
              <div class="create-task-modal__search-actions">
                <el-button size="mini" type="primary" plain :disabled="modal.loading || Boolean(gridOptions.loading)" @click="$emit('search')">
                  查 询
                </el-button>
                <el-button size="mini" plain :disabled="modal.loading || Boolean(gridOptions.loading)" @click="$emit('reset')">重 置</el-button>
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
import { projectTypeProps } from '../constants'
import type { ModalState, OptionItem, PageState, ProjectGridOptions, ProjectRow, ProjectSearchForm } from '../types'

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
    type: Object as PropType<ProjectGridOptions>,
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
  projectTypeList: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

const emit = defineEmits(['close', 'search', 'reset', 'create', 'page-change', 'limit-change', 'selection-change'])

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
  getCheckboxRecords: (): ProjectRow[] => gridRef.value?.getCheckboxRecords() || []
})
</script>

<style scoped lang="less">
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

  &__selection {
    margin-left: 4px;
    color: #667085;
    font-size: 12px;
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
  }
}
</style>
