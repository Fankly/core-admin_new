<template>
  <el-space class="rr-switch">
    <span>{{ props.title }}</span>
    <el-switch :model-value="props.value" @change="props.onChange"></el-switch>
  </el-space>
</template>
<script setup lang="ts">
/**
 * Switch开关组件
 */
defineOptions({ name: 'SettingSwitch' })

interface Props {
  title?: string
  value?: boolean
  onChange?: (...args: any[]) => void
}
const props = defineProps<Props>()
</script>
