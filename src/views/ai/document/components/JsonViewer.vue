<template>
  <div class="json-viewer">
    <div v-if="viewState.error" class="json-viewer__error" role="alert">
      <div class="json-viewer__error-title">JSON 解析失败</div>
      <div class="json-viewer__error-message">{{ viewState.error }}</div>
      <pre>{{ viewState.raw }}</pre>
    </div>

    <template v-else>
      <ViewerToolbar label="JSON" />

      <div class="json-viewer__content">
        <VueJsonPretty
          :data="viewState.data"
          :indent="2"
          :show-line="true"
          :show-line-number="true"
          :show-icon="true"
          :show-length="true"
          :show-double-quotes="true"
          :collapsed-node-length="80"
          :collapsed-on-click-brackets="true"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import ViewerToolbar from './ViewerToolbar.vue'

const props = defineProps({
  value: {
    type: [String, Object, Array, Number, Boolean],
    default: ''
  }
})

const stripCodeFence = (source: string) => {
  const trimmed = source.replace(/^\uFEFF/, '').trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : trimmed
}

const parseJsonText = (source: string) => {
  const firstResult = JSON.parse(stripCodeFence(source))

  if (typeof firstResult === 'string') {
    const nestedSource = stripCodeFence(firstResult)
    if (/^[\[{]/.test(nestedSource)) {
      try {
        return JSON.parse(nestedSource)
      } catch {
        // 字符串本身可能只是长得像 JSON，保留第一次解析结果。
      }
    }
  }

  return firstResult
}

const viewState = computed(() => {
  const raw = typeof props.value === 'string' ? props.value : String(props.value ?? '')

  try {
    const data = typeof props.value === 'string' ? (props.value.trim() ? parseJsonText(props.value) : {}) : props.value

    return {
      error: '',
      raw: '',
      data
    }
  } catch (error: any) {
    return {
      error: error?.message || '返回内容不是有效的 JSON 数据',
      raw,
      data: {}
    }
  }
})
</script>

<style scoped lang="less">
.json-viewer {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #fff;
  color: #344054;

  &__content {
    flex: 1;
    min-width: max-content;
    padding: 12px 18px 24px;
    background: #fbfcfd;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  }

  &__error {
    margin: 14px;
    padding: 14px;
    border: 1px solid #fecdca;
    border-radius: 5px;
    background: #fffbfa;
    color: #b42318;

    pre {
      margin: 12px 0 0;
      padding: 12px 0 0;
      overflow: auto;
      border-top: 1px solid #fecdca;
      color: #475467;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  &__error-title {
    font-weight: 650;
  }

  &__error-message {
    margin-top: 5px;
    color: #d92d20;
    font-size: 12px;
  }

  :deep(.vjs-tree) {
    color: #475467;
    font-family: inherit;
    font-size: 12px;
  }

  :deep(.vjs-tree-node) {
    min-width: max-content;
    min-height: 23px;
    line-height: 23px;
  }

  :deep(.vjs-tree-node:hover) {
    border-radius: 2px;
    background: #f1f7f6;
  }

  :deep(.vjs-node-index) {
    color: #b0b8c4;
  }

  :deep(.vjs-indent-unit.has-line) {
    border-left-color: #d0d5dd;
    border-left-style: solid;
  }

  :deep(.vjs-key) {
    color: #6941c6;
  }

  :deep(.vjs-value-string) {
    color: #067647;
  }

  :deep(.vjs-value-number) {
    color: #175cd3;
  }

  :deep(.vjs-value-boolean) {
    color: #b54708;
    font-weight: 600;
  }

  :deep(.vjs-value-null),
  :deep(.vjs-value-undefined),
  :deep(.vjs-comment) {
    color: #98a2b3;
  }

  :deep(.vjs-tree-brackets),
  :deep(.vjs-carets) {
    color: #0f766e;
  }
}
</style>
