<template>
  <div v-show="visible" class="task-search">
    <el-form ref="formRef" :model="searchForm" label-width="104px" label-position="right" label-suffix="：">
      <el-row :gutter="12" type="flex" justify="space-between" align="middle">
        <el-col :span="4">
          <el-form-item label="年度" prop="nd" label-width="60px">
            <el-select :model-value="searchForm.nd" placeholder="请选择年度" :disabled="loading" @change="$emit('update:nd', $event)">
              <el-option v-for="item in yearOptions" :key="item.yearCode" :label="item.yearName" :value="item.yearCode" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="auto" class="task-search__actions-col">
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

defineProps<{
  visible: boolean
  loading: boolean
  yearOptions: Array<{
    yearCode: string
    yearName: string
  }>
  searchForm: {
    nd: string
  }
}>()

defineEmits(['update:nd', 'search', 'reset'])

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
}

.task-search__actions-col {
  flex: 0 0 auto;
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
