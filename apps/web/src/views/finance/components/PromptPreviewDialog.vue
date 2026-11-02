<template>
  <div class="prompt-preview-dialog">
    <div class="terminal-container">
      <div class="terminal-content">
        <span v-if="loading" class="placeholder-content"> //加载中... </span>
        <span v-else-if="!content" class="placeholder-content"> //选择一个测试项目后，点击"预览完整提示词"可查看组装后的完整提示词。 </span>
        <span v-else v-html="content"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CwProjectDiff } from '@/api/mainController'
import { reactive, toRef, toRefs, onMounted, getCurrentInstance } from 'vue'
defineOptions({
  name: 'PromptPreviewDialog'
})
const componentProps = defineProps({
  data: {
    type: Object,
    default: null
  }
})
const componentInstance = getCurrentInstance().proxy
const componentData = reactive({
  content: '',
  loading: false
})
const content = toRef(componentData, 'content')
const loading = toRef(componentData, 'loading')
function getPrompt() {
  if (!componentProps.data) return
  componentData.loading = true
  CwProjectDiff.getPrompt(componentInstance, {
    cwAuditPromptDto: componentProps.data,
    projectId: componentProps.data.projectId
  })
    .then((res) => {
      componentData.content = res.data || ''
    })
    .catch(() => {})
    .finally(() => {
      componentData.loading = false
    })
}
onMounted(() => {
  getPrompt()
})
defineExpose({
  getPrompt,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.prompt-preview-dialog {
  width: 100%;
  height: 100%;
  .terminal-container {
    white-space: pre-wrap;
    background-color: #1e1e1e;
    padding: 16px;
    color: #a9b7c6;
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.6;
    overflow-y: auto;
    width: 100%;
    height: 100%;
    min-height: 400px;
    border-radius: 4px;
    .placeholder-content {
      color: #808080;
    }
  }
}
</style>
