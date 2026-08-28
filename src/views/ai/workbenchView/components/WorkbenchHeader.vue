<template>
  <header class="workbench-head glass-card">
    <div class="head-copy">
      <div class="page-title">
        <div>
          <h1>项目智能评审工作台</h1>
          <p>汇聚项目资料、预审进度与规则判定结果，快速定位风险依据。</p>
        </div>
      </div>
    </div>
    <div class="head-overview">
      <div
        ><strong>{{ total }}</strong
        ><span>项目总数</span></div
      >
      <button class="refresh-button" type="button" title="刷新数据" aria-label="刷新数据" :disabled="refreshing" @click="$emit('refresh')">
        <el-icon :class="{ rotating: refreshing }"><Refresh /></el-icon>
      </button>
      <button class="refresh-button" type="button" title="工作台使用说明" aria-label="工作台使用说明" @click="$emit('help')">
        <el-icon><HelpCircle /></el-icon>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { HelpCircle, Refresh } from '../icons'

defineProps<{
  total: string | number
  refreshing: boolean
}>()

defineEmits(['refresh', 'help'])
</script>
