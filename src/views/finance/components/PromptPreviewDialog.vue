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

<script>
import { CwProjectDiff } from '@/api/mainController'

export default {
  name: 'PromptPreviewDialog',
  props: {
    data: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      content: '',
      loading: false
    }
  },
  mounted() {
    this.getPrompt()
  },
  methods: {
    getPrompt() {
      if (!this.data) return
      this.loading = true
      CwProjectDiff.getPrompt(this, { cwAuditPromptDto: this.data, projectId: this.data.projectId })
        .then((res) => {
          this.content = res.data || ''
        })
        .catch(() => {})
        .finally(() => {
          this.loading = false
        })
    }
  }
}
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
