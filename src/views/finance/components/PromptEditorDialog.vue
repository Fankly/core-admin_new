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

<script>
import PromptEditor from './PromptEditor.vue'

export default {
  name: 'PromptEditorDialog',
  components: {
    PromptEditor
  },
  props: {
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
  },
  data() {
    return {
      buttonLoading: false,
      currentValue: ''
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.currentValue = val || ''
      }
    }
  },
  methods: {
    handleCancel() {
      if (this.observer != null) {
        this.observer.cancel(false)
      }
    },
    handleSubmit() {
      if (this.observer != null) {
        this.observer.cancel(true, this.currentValue)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
