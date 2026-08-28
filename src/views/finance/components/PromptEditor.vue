<template>
  <div class="editor-container">
    <!-- 标签区域 -->
    <div class="tags-section" v-if="tags && tags.length > 0 && showTags">
      <span class="tags-label">快捷插入：</span>
      <div class="tags-list">
        <!-- 关键点1：把 @click 改为 @mousedown.prevent，防止输入框失焦导致光标位置丢失 -->
        <span v-for="tag in tags" :key="tag" class="insert-tag" @mousedown.prevent="insertTag(tag)">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 编辑框区域 -->
    <div class="textarea-section">
      <!-- 关键点2：加上 ref="textareaRef" 以便在 JS 中拿到组件实例 -->
      <el-input ref="textareaRef" type="textarea" v-model="currentValue" :placeholder="placeholder" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PromptEditor',
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
    },
    rows: {
      type: Number,
      default: 20
    },
    showTags: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      currentValue: ''
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.currentValue = val || ''
      }
    },
    currentValue(val) {
      this.$emit('input', val)
    }
  },
  methods: {
    insertTag(tag) {
      const tagString = `{${tag}}`

      // 获取 Element UI 内部真正的原生 textarea DOM 元素
      const textarea = this.$refs.textareaRef.$refs.textarea

      if (textarea && typeof textarea.selectionStart === 'number') {
        // 拿到当前光标的起始和结束位置 (如果没选中文字，这俩值是相等的)
        const startPos = textarea.selectionStart
        const endPos = textarea.selectionEnd

        // 拼接字符串：光标前的内容 + 插入的标签 + 光标后的内容
        const textBefore = this.currentValue.substring(0, startPos)
        const textAfter = this.currentValue.substring(endPos)

        this.currentValue = textBefore + tagString + textAfter

        // 等待 Vue 将新的值渲染到 DOM 后，把光标移动到插入的标签后面
        this.$nextTick(() => {
          textarea.focus() // 确保输入框保持焦点
          const newCursorPos = startPos + tagString.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
        })
      } else {
        // 兜底方案：如果获取不到光标（比如还没点进过输入框），就直接加在末尾
        this.currentValue = (this.currentValue || '') + tagString
      }
    }
  }
}
</script>

<style lang="less" scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  width: 100%;

  .tags-section {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-shrink: 0;

    .tags-label {
      font-size: 14px;
      color: #606266;
      white-space: nowrap;
      flex-shrink: 0;
      padding-top: 4px;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .insert-tag {
        display: inline-block;
        padding: 4px 16px;
        font-size: 13px;
        color: #409eff;
        border: 1px solid #b3d8ff;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background-color: #ecf5ff;
        }
      }
    }
  }

  .textarea-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    :deep(.el-textarea) {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    :deep(.el-textarea__inner) {
      flex: 1;
      height: 100% !important;
      border: 1px solid #e4e7ed;
      font-size: 14px;
      line-height: 1.8;
      resize: none;

      &:focus {
        border-color: #008566;
      }
    }
  }
}
</style>
