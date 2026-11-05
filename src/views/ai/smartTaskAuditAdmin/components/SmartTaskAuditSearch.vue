<template>
  <div v-show="visible" class="search">
    <el-form ref="formRef" :model="formModel" label-position="right" label-width="140px">
      <Grid :gap="[20, 0]" :cols="4">
        <GridItem>
          <el-form-item prop="xmbm">
            <template #label>
              <el-space :size="4">
                <span>项目编码</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <ReMultipleText v-model="formModel.xmbm" class="project-code-input" dialog-title="项目编码" tooltip-text="项目编码" />
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="proTypeList">
            <template #label>
              <el-space :size="4">
                <span>项目类型</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
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
            </div>
          </el-form-item>
        </GridItem>
        <GridItem :span="2">
          <el-form-item prop="createStartTime">
            <template #label>
              <el-space :size="4">
                <span>创建时间</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-date-picker
                v-model="createTimeRange"
                clearable
                format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
                type="daterange"
                value-format="YYYY-MM-DD"
              />
            </div>
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item prop="jhssnd">
            <template #label>
              <el-space :size="4">
                <span>计划实施年度</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.jhssnd" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in yearList" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="yjdw">
            <template #label>
              <el-space :size="4">
                <span>一级单位</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select
                v-model="formModel.yjdw"
                clearable
                filterable
                placeholder="请选择"
                style="width: 100%"
                @change="$emit('yjdw-change', formModel.yjdw)"
              >
                <el-option v-for="item in yjdwList" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="ejdwList">
            <template #label>
              <el-space :size="4">
                <span>二级单位</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.ejdwList" clearable filterable multiple collapse-tags placeholder="请选择" style="width: 100%">
                <el-option v-for="item in ejdwList" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="taskName">
            <template #label>
              <el-space :size="4">
                <span>任务名称</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-input v-model.trim="formModel.taskName" clearable :maxlength="100" placeholder="请输入"></el-input>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="status">
            <template #label>
              <el-space :size="4">
                <span>任务状态</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.status" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="docPreStatus">
            <template #label>
              <el-space :size="4">
                <span>文档预处理状态</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.docPreStatus" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in docPreStatusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="isHis">
            <template #label>
              <el-space :size="4">
                <span>是否历史</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select
                :model-value="yesNoOptions.length ? formModel.isHis : ''"
                clearable
                placeholder="请选择"
                style="width: 100%"
                @update:model-value="formModel.isHis = $event"
              >
                <el-option v-for="item in yesNoOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem v-show="!collapsed">
          <el-form-item prop="priority">
            <template #label>
              <el-space :size="4">
                <span>优先级</span>
              </el-space>
              <span>&nbsp;：</span>
            </template>
            <div class="form">
              <el-select v-model="formModel.priority" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in priorityOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </GridItem>
        <GridItem suffix>
          <div class="search-buttons">
            <el-button type="primary" size="mini" plain :disabled="loading" @click="$emit('search')">查 询</el-button>
            <el-button size="mini" plain :disabled="loading" @click="$emit('reset')">重 置</el-button>
            <el-button size="mini" plain :aria-expanded="!collapsed" @click="collapsed = !collapsed">{{ collapsed ? '展 开' : '收 起' }}</el-button>
          </div>
        </GridItem>
      </Grid>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import { projectTypeProps } from '../constants'
import type { OptionItem, SearchForm } from '../types'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchForm: {
    type: Object as PropType<SearchForm>,
    required: true
  },
  statusOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  docPreStatusOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  yesNoOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  priorityOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
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
  }
})

defineEmits(['search', 'reset', 'yjdw-change'])

const formRef = ref()
const collapsed = ref(false)
const formModel = computed(() => props.searchForm)
const createTimeRange = computed<string[] | null>({
  get: () => {
    const { createStartTime, createFinishTime } = formModel.value
    return createStartTime || createFinishTime ? [createStartTime, createFinishTime] : null
  },
  set: (range) => {
    formModel.value.createStartTime = range?.[0] || ''
    formModel.value.createFinishTime = range?.[1] || ''
  }
})

defineExpose({
  clearValidate: () => formRef?.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
.search {
  flex-shrink: 0;
  padding: 12px 12px 4px;
  border-bottom: 1px solid #eef2f6;
  background-color: #f8fcfb;

  :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  :deep(.el-form-item__label) {
    color: #475569;
    font-size: 13px;
    font-weight: 500;
  }
}

.form {
  width: 100%;
}

:deep(.project-code-input .copy-text-input) {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: #b8ddd9;
  }

  &:focus-within {
    border-color: #00706b;
  }

  .el-input__inner {
    height: 30px;
    border: 0 !important;
    border-radius: 0;
    box-shadow: none !important;
  }

  .el-input-group__append {
    width: 36px;
    padding: 0;
    overflow: hidden;
    background-color: #f2f9f8;
    border: 0;
    border-left: 1px solid #e2e8f0;
    border-radius: 0;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  &:hover .el-input-group__append {
    border-left-color: #b8ddd9;
  }

  &:focus-within .el-input-group__append {
    border-left-color: #00706b;
    background-color: #e6f4f3;
  }

  .add-button.el-button {
    width: 36px;
    height: 30px;
    min-height: 30px;
    padding: 0;
    color: #00706b !important;
    background-color: transparent !important;
    border: 0 !important;
    border-radius: 0;
  }
}

.search-buttons {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>
