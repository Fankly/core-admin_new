<script setup lang="ts">
defineOptions({
  name: 'SettingSwitch'
})
const props = defineProps({
  title: String,
  value: Boolean,
  onChange: Function
})
defineExpose({
  props
})
</script>
<template>
  <el-space class="rr-switch">
    <span>{{ props.title }}</span>
    <el-switch v-model="props.value" @change="props.onChange"></el-switch>
  </el-space>
</template>
