<template>
  <Teleport to="body">
    <div v-if="visible" class="aep-modal">
      <div class="aep-modal__panel aep-notice-panel">
        <div class="aep-notice-panel__bar"></div>
        <div class="aep-notice">
          <div class="aep-notice__ring"></div>
          <div class="aep-notice__icon">
            <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 class="aep-notice__title">消息提醒</h3>
          <p class="aep-notice__text"> 系统将基于大模型自动提取审核要点，预计需要<b>3-5</b>分钟，您可以稍作等待 </p>
        </div>
        <div class="aep-notice-panel__foot">
          <button class="aep-btn aep-btn--primary aep-btn--lg" style="min-width: 160px" @click="emit('close')">知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
export default {
  name: 'AepProgressModal'
}
</script>

<script setup lang="ts">
defineProps<{
  /** 是否显示 */
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>
