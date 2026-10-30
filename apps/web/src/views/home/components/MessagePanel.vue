<script setup lang="ts">
import { Bell, ChevronRight, AlertTriangle, Clock, CheckCircle2 } from '@lucide/vue'

interface Props {
  totalNoticeCount?: number
}

withDefaults(defineProps<Props>(), {
  totalNoticeCount: 3
})

const emit = defineEmits<{
  (e: 'open-notice'): void
}>()
</script>

<template>
  <div class="bpm-message-panel">
    <div class="bpm-panel-glow-bg"></div>

    <!-- Panel Header -->
    <div class="bpm-panel-header">
      <div class="bpm-panel-title-group">
        <div class="bpm-panel-icon-badge">
          <Bell style="width: 1rem; height: 1rem; color: #99f6e4" />
          <span class="bpm-live-dot-ping"></span>
          <span class="bpm-live-dot-solid"></span>
        </div>
        <div>
          <h3 class="bpm-panel-title-text">
            消息栏
            <span class="bpm-live-tag"> LIVE </span>
          </h3>
          <p class="bpm-panel-sub-text">系统通知与待办提醒</p>
        </div>
      </div>
      <button type="button" class="bpm-btn-detail-link" @click="emit('open-notice')">
        <span>详情</span>
        <ChevronRight style="width: 0.875rem; height: 0.875rem" />
      </button>
    </div>

    <!-- Message Items List -->
    <div class="bpm-panel-items-list">
      <div class="bpm-notice-item bpm-notice-item-amber" @click="emit('open-notice')">
        <div class="bpm-notice-item-header">
          <span class="bpm-title-with-icon bpm-text-amber-title">
            <AlertTriangle style="width: 0.875rem; height: 0.875rem; color: #fbbf24; flex-shrink: 0" />
            【检修】数据库集群维护
          </span>
          <span class="bpm-notice-time-stamp">08-25</span>
        </div>
        <p class="bpm-notice-item-desc"> 数据库节点例行升级，全系统只读服务... </p>
      </div>

      <div class="bpm-notice-item bpm-notice-item-teal" @click="emit('open-notice')">
        <div class="bpm-notice-item-header">
          <span class="bpm-title-with-icon bpm-text-teal-title">
            <Clock style="width: 0.875rem; height: 0.875rem; color: #5eead4; flex-shrink: 0" />
            【待办】联合会审打分排期
          </span>
          <span class="bpm-notice-time-stamp">10分钟前</span>
        </div>
        <p class="bpm-notice-item-desc"> 18 个申报项目已进入联合表决阶段 </p>
      </div>

      <div class="bpm-notice-item bpm-notice-item-teal" @click="emit('open-notice')">
        <div class="bpm-notice-item-header">
          <span class="bpm-title-with-icon bpm-text-emerald-title">
            <CheckCircle2 style="width: 0.875rem; height: 0.875rem; color: #34d399; flex-shrink: 0" />
            【预警】CAPEX 总包额度提示
          </span>
          <span class="bpm-notice-time-stamp">1小时前</span>
        </div>
        <p class="bpm-notice-item-desc"> 总包使用率超 85%，启动阶梯预警 </p>
      </div>
    </div>

    <!-- Panel Footer -->
    <div class="bpm-panel-footer">
      <span class="bpm-status-indicator">
        <span class="bpm-status-green-dot"></span>
        系统服务正常运行
      </span>
      <button type="button" class="bpm-btn-detail-link" style="font-size: 0.6875rem" @click="emit('open-notice')">
        全部 {{ totalNoticeCount }} 条公告
        <ChevronRight style="width: 0.75rem; height: 0.75rem" />
      </button>
    </div>
  </div>
</template>
