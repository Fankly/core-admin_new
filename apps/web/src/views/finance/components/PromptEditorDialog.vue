<template>
  <dialogContainer
    class="prompt-editor-dialog"
    :buttonLoading="buttonLoading"
    :onCancel="() => handleCancel()"
    :onSubmit="() => handleSubmit()"
    ref="dialogContainer"
  >
    <PromptEditor class="prompt-editor" v-model="currentValue" :tags="tags" :placeholder="placeholder" ref="promptEditor" />
  </dialogContainer>
</template>

<script setup>
import PromptEditor from './PromptEditor.vue'
import { reactive, toRef, toRefs, watch, getCurrentInstance } from 'vue'
defineOptions({
  name: 'PromptEditorDialog'
})
const componentProps = defineProps({
  value: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请输入内容'
  }
})
const componentInstance = getCurrentInstance().proxy
const componentData = reactive({
  buttonLoading: false,
  currentValue: ''
})
const buttonLoading = toRef(componentData, 'buttonLoading')
const currentValue = toRef(componentData, 'currentValue')
function handleCancel() {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(false)
  }
}
function handleSubmit() {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(true, componentData.currentValue)
  }
}
watch(
  () => componentProps.value,
  function (val) {
    componentData.currentValue = val || ''
  },
  {
    immediate: true
  }
)
defineExpose({
  handleCancel,
  handleSubmit,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.prompt-editor {
  height: 100%;
}
.prompt-editor-dialog {
  height: 100%;
}
:deep(.scrollbarRows) {
  height: 100%;
  .dialogContainer__body--wrapper {
    height: 100%;
    .textarea-section {
      flex: 1;
      textarea {
        height: 100%;
      }
    }
  }
}
</style>
