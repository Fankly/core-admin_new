<template>
  <Teleport to="body">
    <div v-if="visible" :class="['aep-modal', { 'aep-modal--stack': stack }]">
      <div :class="['aep-modal__panel', { 'aep-modal__panel--fullscreen': fullscreen }]" :style="panelStyle">
        <div class="aep-modal__head">
          <div class="aep-modal__title">
            {{ title }}
            <span v-if="subtitle" class="aep-modal__subtitle">{{ subtitle }}</span>
          </div>
          <div class="aep-modal__head-actions">
            <button
              v-if="fullscreenable"
              class="aep-modal__fullscreen"
              type="button"
              :title="fullscreen ? '退出全屏' : '全屏展示'"
              :aria-label="fullscreen ? '退出全屏' : '全屏展示'"
              :aria-pressed="fullscreen"
              @click="emit('toggle-fullscreen')"
            >
              <svg v-if="!fullscreen" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="1" stroke-linejoin="round" stroke-width="1.8" />
              </svg>
              <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 8h11v11H8z" stroke-linejoin="round" stroke-width="1.8" />
                <path d="M5 16V5h11" stroke-linejoin="round" stroke-width="1.8" />
              </svg>
            </button>
            <button class="aep-modal__close" title="关闭" @click="emit('close')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
export default {
  name: 'AepModalShell'
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    visible: boolean
    /** 标题 */
    title: string
    /** 标题右侧补充说明 */
    subtitle?: string
    /** 面板宽度 */
    width?: string
    /** 面板高度 */
    height?: string
    /** 叠在另一个弹窗之上（提高层级，如从知识列表打开只读详情） */
    stack?: boolean
    /** 是否显示全屏切换按钮 */
    fullscreenable?: boolean
    /** 是否处于全屏 */
    fullscreen?: boolean
  }>(),
  {
    subtitle: '',
    width: '900px',
    height: 'auto',
    stack: false,
    fullscreenable: false,
    fullscreen: false
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle-fullscreen'): void
}>()

const panelStyle = computed(() => ({
  width: props.fullscreen ? '100vw' : props.width,
  height: props.fullscreen ? '100vh' : props.height
}))
</script>
