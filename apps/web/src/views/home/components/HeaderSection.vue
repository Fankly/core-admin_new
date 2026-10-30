<script setup lang="ts">
import { BarChart2, Bell, Users } from '@lucide/vue'

interface Props {
  title?: string
  noticeCount?: number
  subtitles?: string[]
}

withDefaults(defineProps<Props>(), {
  title: '项目预算全生命周期管控平台',
  noticeCount: 3,
  subtitles: () => ['开放', '协同', '精益', '智慧', '共享']
})

const emit = defineEmits<{
  (e: 'click-cockpit'): void
  (e: 'click-notice'): void
}>()
</script>

<template>
  <section class="bpm-hero-section">
    <div class="bpm-hero-title-wrapper">
      <h2 class="bpm-hero-title">
        {{ title }}
      </h2>

      <!-- 当前访问人数 -->
      <div class="bpm-visitor-card">
        <Users class="bpm-visitor-icon" />
        <span class="bpm-visitor-label">当前访问人数:</span>
        <span class="bpm-visitor-count">1286</span>
        <span class="bpm-visitor-label">人</span>
      </div>
    </div>

    <div class="bpm-subtitle-row">
      <p class="bpm-subtitle-list">
        <template v-for="(sub, index) in subtitles" :key="index">
          <span>{{ sub }}</span>
          <span v-if="index < subtitles.length - 1" class="bpm-subtitle-divider">|</span>
        </template>
      </p>

      <!-- Action Buttons -->
      <div class="bpm-hero-actions">
        <button type="button" class="bpm-btn-cockpit" @click="emit('click-cockpit')">
          <BarChart2 style="width: 1rem; height: 1rem; color: #ffffff" />
          <span>业务驾驶舱</span>
        </button>

        <button type="button" class="bpm-btn-notice" @click="emit('click-notice')">
          <Bell style="width: 1rem; height: 1rem; color: #00706b" />
          <span>检修公告</span>
          <span v-if="noticeCount > 0" class="bpm-badge-count">
            {{ noticeCount }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>
