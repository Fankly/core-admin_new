<template>
  <div class="search-collapse" :class="{ 'is-visible': visible }" :aria-hidden="!visible">
    <div class="search-collapse__content">
      <div class="search">
        <!-- 回车即查询：搜索表单里 Enter=查询 是通用习惯，keyup 从各字段冒泡到 form 上统一处理 -->
        <el-form ref="formRef" :model="formModel" label-position="right" label-width="140px" @submit.prevent @keyup.enter="handleEnterSearch">
          <Grid id="smart-task-audit-advanced-search" class="search-grid" :class="{ 'is-collapsed': collapsed }" :gap="[20, 0]" :cols="4">
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
                    :popper-append-to-body="true"
                    node-key="middleId"
                    placeholder="请选择"
                  />
                </div>
              </el-form-item>
            </GridItem>
            <GridItem :span="2">
              <el-form-item prop="createTimeStart">
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
              <el-form-item prop="docPreStatus">
                <template #label>
                  <el-space :size="4">
                    <span>材料预处理状态</span>
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
              <el-form-item prop="isHis">
                <template #label>
                  <el-space :size="4">
                    <span>仅看历史任务</span>
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
            <GridItem class="search-advanced-field" :class="{ 'is-hidden': collapsed }">
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
            <GridItem suffix class="search-actions-field" :style="collapsed ? { gridRow: '2', gridColumn: '4' } : undefined">
              <div class="search-buttons">
                <el-button type="primary" size="mini" plain :disabled="loading" @click="$emit('search')">查 询</el-button>
                <el-button size="mini" plain :disabled="loading" @click="$emit('reset')">重 置</el-button>
                <el-button
                  size="mini"
                  plain
                  :aria-expanded="!collapsed"
                  aria-controls="smart-task-audit-advanced-search"
                  @click="collapsed = !collapsed"
                >
                  {{ collapsed ? '展 开' : '收 起' }}
                </el-button>
              </div>
            </GridItem>
          </Grid>
        </el-form>
      </div>
    </div>
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

const emit = defineEmits(['search', 'reset', 'yjdw-change'])

const formRef = ref()
const collapsed = ref(false)
const formModel = computed(() => props.searchForm)

const handleEnterSearch = () => {
  if (props.loading) return
  emit('search')
}
const createTimeRange = computed<string[] | null>({
  get: () => {
    const { createTimeStart, createTimeFinish } = formModel.value
    return createTimeStart || createTimeFinish ? [createTimeStart, createTimeFinish] : null
  },
  set: (range) => {
    formModel.value.createTimeStart = range?.[0] || ''
    formModel.value.createTimeFinish = range?.[1] || ''
  }
})

defineExpose({
  clearValidate: () => formRef?.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
@import '../css/tokens.less';

.search-collapse {
  display: grid;
  flex-shrink: 0;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-collapse.is-visible {
  grid-template-rows: 1fr;
}

.search-collapse__content {
  min-height: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  transition: opacity 0.12s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 0.24s;
}

.search-collapse.is-visible .search-collapse__content {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition-delay: 0.06s, 0s, 0s;
}

/* 查询带：并入大卡、底部轻分割；四列网格，表单项底部留 8px */
.search {
  flex-shrink: 0;
  padding: 12px 12px 4px;
  border-bottom: 1px solid @border-light;
  background: @surface;

  :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  :deep(.el-form-item__label) {
    color: @text-main;
    font-size: 13px;
    font-weight: 500;
  }
}

.search-grid {
  max-height: 160px;
  overflow: hidden;
  transition: max-height 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-grid.is-collapsed {
  max-height: 80px;
}

.search-advanced-field {
  min-height: 0;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity 0.12s ease 0.06s, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear;
}

.search-advanced-field.is-hidden {
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity 0.08s ease, transform 0.16s ease, visibility 0s linear 0.16s;
}

.search-actions-field {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.form {
  width: 100%;
}

:deep(.project-code-input .copy-text-input) {
  overflow: hidden;
  border: 1px solid @border-main;
  border-radius: 6px;
  transition: border-color 0.12s ease;

  &:hover {
    border-color: @primary-border-light;
  }

  &:focus-within {
    border-color: @primary-solid;
  }

  .el-input__inner {
    height: 32px;
    border: 0 !important;
    border-radius: 0;
    box-shadow: none !important;
  }

  .el-input-group__append {
    width: 36px;
    padding: 0;
    overflow: hidden;
    background-color: @primary-bg-light;
    border: 0;
    border-left: 1px solid @border-main;
    border-radius: 0;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  &:hover .el-input-group__append {
    border-left-color: @primary-border-light;
  }

  &:focus-within .el-input-group__append {
    border-left-color: @primary-solid;
    background-color: @primary-bg-hover;
  }

  .add-button.el-button {
    width: 36px;
    height: 32px;
    min-height: 32px;
    padding: 0;
    color: @primary-solid !important;
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

@media (prefers-reduced-motion: reduce) {
  .search-collapse,
  .search-collapse__content,
  .search-grid,
  .search-advanced-field,
  .search-actions-field {
    transition-duration: 0.01ms !important;
  }

  .search-collapse__content,
  .search-advanced-field {
    transform: none;
  }
}
</style>
