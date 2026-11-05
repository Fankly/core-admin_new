<template>
  <div v-show="visible" class="task-search">
    <el-form ref="formRef" :model="searchForm" label-width="104px" label-position="right" label-suffix="：">
      <el-row :gutter="12">
        <el-col :span="4">
          <el-form-item label="年度" prop="nd" label-width="60px">
            <el-select :model-value="searchForm.nd" placeholder="请选择年度" :disabled="loading" @change="$emit('update:nd', $event)">
              <el-option v-for="item in yearOptions" :key="item.yearCode" :label="item.yearName" :value="item.yearCode" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="重点任务编码" prop="zdrwbms">
            <ReMultipleText
              :model-value="searchForm.zdrwbms"
              :disabled="loading"
              placeholder="请输入重点任务编码"
              dialog-title="重点任务编码"
              tooltip-text="批量输入重点任务编码"
              @update:model-value="$emit('update:zdrwbms', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="专业分类" prop="zyfl">
            <el-input
              :model-value="searchForm.zyfl"
              clearable
              placeholder="请输入专业分类"
              :disabled="loading"
              @input="$emit('update:zyfl', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="分类重点任务" prop="zyflZdrw">
            <el-input
              :model-value="searchForm.zyflZdrw"
              clearable
              placeholder="请输入专业分类重点任务"
              :disabled="loading"
              @input="$emit('update:zyflZdrw', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="3">
          <div class="task-search__actions">
            <el-button type="primary" size="mini" plain :loading="loading" :disabled="loading" @click="$emit('search')">查 询</el-button>
            <el-button size="mini" plain :disabled="loading" @click="$emit('reset')">重 置</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ElForm } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

defineProps<{
  visible: boolean
  loading: boolean
  yearOptions: Array<{
    yearCode: string
    yearName: string
  }>
  searchForm: {
    nd: string
    zdrwbms: string
    zyfl: string
    zyflZdrw: string
  }
}>()

defineEmits(['update:nd', 'update:zdrwbms', 'update:zyfl', 'update:zyflZdrw', 'search', 'reset'])

const formRef = ref<InstanceType<typeof ElForm>>()

const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({ clearValidate })
</script>

<style scoped lang="less">
.task-search {
  flex-shrink: 0;
  padding: 12px 12px 4px;
  box-sizing: border-box;
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

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.copy-text-input.el-input-group--append) {
    height: 32px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background-color: #ffffff;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;

    .el-input__inner {
      height: 30px;
      border: 0;
      border-radius: 0;
    }

    .el-input-group__append {
      padding: 0;
      overflow: hidden;
      border: 0;
      border-left: 1px solid #e2e8f0;
      border-radius: 0;
      background-color: #f2f9f8;
    }

    .add-button {
      width: 34px;
      height: 30px;
      min-height: 30px;
      padding: 0;
      border: 0 !important;
      border-radius: 0;
      box-shadow: none;
      margin: 0 !important;
    }

    &:hover {
      border-color: #b8ddd9;
    }

    &:focus-within {
      border-color: #00706b;
      box-shadow: 0 0 0 2px rgba(0, 112, 107, 0.12);
    }
  }
}

.task-search__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 8px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>
