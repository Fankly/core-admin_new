<template>
  <div class="operation">
    <el-button :key="item.pression" v-for="item in serviceBtn" type="primary" size="mini" plain @click="item.method">{{ item.name }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useBudgetingToolbar } from '@/views/service/budget/budgeting/hooks/useBudgetingToolbar'

const { serviceBtn } = useBudgetingToolbar()
</script>

<style scoped lang="less">
.operation {
  margin-bottom: 10px;
}
</style>
