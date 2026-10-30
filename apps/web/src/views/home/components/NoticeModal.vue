<script setup lang="ts">
import { Wrench, X, Clock, Server, Info, CheckCircle2, AlertTriangle } from '@lucide/vue'
import type { MaintenanceNotice } from '../types'

interface Props {
  isOpen: boolean
  notices: MaintenanceNotice[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div v-if="isOpen" class="bpm-modal-overlay" @click="emit('close')">
    <div class="bpm-modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="bpm-modal-header">
        <div class="bpm-modal-header-left">
          <div class="bpm-modal-header-icon">
            <Wrench style="width: 1.25rem; height: 1.25rem; color: #99f6e4" />
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem">
              <h3 class="bpm-modal-header-title"> 系统检修公告与维护计划 </h3>
              <span class="bpm-modal-header-badge"> {{ notices.length }} 项计划中 </span>
            </div>
            <p class="bpm-modal-header-subtitle"> 为保障预算管控系统高可用与稳定性，请留意以下计划内运维检修窗口 </p>
          </div>
        </div>

        <button type="button" class="bpm-btn-close-x" @click="emit('close')">
          <X style="width: 1.25rem; height: 1.25rem" />
        </button>
      </div>

      <!-- Modal Body Notice List -->
      <div class="bpm-modal-body">
        <div v-for="notice in notices" :key="notice.id" class="bpm-notice-card">
          <div class="bpm-notice-title-row">
            <div style="display: flex; align-items: center; gap: 0.5rem">
              <span class="bpm-notice-tag" :class="notice.levelBg">
                {{ notice.level }}
              </span>
              <h4 class="bpm-notice-title-text">
                {{ notice.title }}
              </h4>
            </div>
          </div>

          <!-- Time & Scope Row -->
          <div class="bpm-info-row">
            <div class="bpm-info-item">
              <Clock style="width: 1rem; height: 1rem; color: #00706b; flex-shrink: 0" />
              <div>
                <span class="bpm-info-label">检修时间：</span>
                <span class="bpm-info-val">{{ notice.time }}</span>
              </div>
            </div>
            <div class="bpm-info-item">
              <Server style="width: 1rem; height: 1rem; color: #00706b; flex-shrink: 0" />
              <div>
                <span class="bpm-info-label">影响模块：</span>
                <span class="bpm-info-val">{{ notice.scope }}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Description -->
          <div class="bpm-notice-content-box">
            <span class="bpm-notice-content-label">【检修内容及影响范围】</span>
            {{ notice.content }}
          </div>

          <!-- Contact Info -->
          <div class="bpm-notice-contact-row">
            <div style="display: flex; align-items: center; gap: 0.375rem">
              <Info style="width: 0.875rem; height: 0.875rem; color: #94a3b8" />
              <span>检修部门：{{ notice.contact }}</span>
            </div>
            <span class="bpm-reported-status">
              <CheckCircle2 style="width: 0.875rem; height: 0.875rem" />
              <span>已报备集团运维中心</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="bpm-modal-footer">
        <div class="bpm-emergency-note">
          <AlertTriangle style="width: 1rem; height: 1rem; color: #f59e0b; flex-shrink: 0" />
          <span>如遇紧急预算调整业务，请联系系统应急保障热线 (010-8888-6666)</span>
        </div>
        <button type="button" class="bpm-btn-confirm" @click="emit('close')"> 我知道了 </button>
      </div>
    </div>
  </div>
</template>
