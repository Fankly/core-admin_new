<template>
  <div v-show="visible" class="estate-search">
    <el-form ref="formRef" :model="searchForm" label-position="right" label-width="120px" @submit.prevent>
      <Grid :gap="[20, 0]" :cols="4">
        <GridItem>
          <el-form-item label="房产编号 ：" prop="fcbh">
            <el-input
              :model-value="searchForm.fcbh"
              clearable
              placeholder="请输入房产编号"
              @update:model-value="$emit('update:fcbh', $event)"
              @keyup.enter="$emit('search')"
            />
          </el-form-item>
        </GridItem>
        <GridItem>
          <el-form-item label="房产名称 ：" prop="fcmc">
            <el-input
              :model-value="searchForm.fcmc"
              clearable
              placeholder="请输入房产名称"
              @update:model-value="$emit('update:fcmc', $event)"
              @keyup.enter="$emit('search')"
            />
          </el-form-item>
        </GridItem>
        <GridItem suffix>
          <div class="estate-search__buttons">
            <el-button type="primary" size="mini" plain :disabled="loading" @click="$emit('search')">查 询</el-button>
            <el-button size="mini" plain :disabled="loading" @click="$emit('reset')">重 置</el-button>
          </div>
        </GridItem>
      </Grid>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'

withDefaults(
  defineProps<{
    visible?: boolean
    loading?: boolean
    searchForm: { fcbh: string; fcmc: string }
  }>(),
  {
    visible: true,
    loading: false
  }
)

defineEmits(['search', 'reset', 'update:fcbh', 'update:fcmc'])

const formRef = ref()

defineExpose({
  clearValidate: () => formRef.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
.estate-search {
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

.estate-search__buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 32px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>
