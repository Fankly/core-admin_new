<template>
  <vxe-modal
    v-model="visible"
    class-name="column-formula-modal"
    :title="title"
    width="480px"
    :transfer="true"
    :mask="true"
    esc-closable
    mask-closable
    destroy-on-close
  >
    <div class="formula-content">{{ formula }}</div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const title = ref('')
const formula = ref('')

const open = (params: { title: string; formula: string }) => {
  title.value = params.title || '计算公式'
  formula.value = params.formula
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped lang="less">
.formula-content {
  padding: 4px 2px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
  white-space: pre-wrap;
}
</style>
