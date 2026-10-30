<script setup lang="ts">
import { computed } from 'vue'
import { versionNoticeRead } from '@/api/sys/versionNotice'
import { ElMessage } from 'element-plus'

interface Props {
  isOpen: boolean
  notices: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const modalVisible = computed({
  get: () => props.isOpen,
  set: (val: boolean) => {
    if (!val) emit('close')
  }
})
const handleNotice = async () => {
  const { id } = props.notices[0]
  const res: any = await versionNoticeRead(id)
  if (res.success) {
    emit('close')
  } else {
    ElMessage.error(res.msg)
  }
}
</script>

<template>
  <vxe-modal
    v-model="modalVisible"
    title="检修公告"
    width="800"
    height="auto"
    show-footer
    destroy-on-close
    :show-close="false"
    position="center"
    :transfer="true"
    class-name="notice-modal"
  >
    <div class="notice-modal-body">
      <!-- 检修通知列表 -->
      <div v-for="notice in notices" :key="notice.id" class="bpm-notice-card-notice">
        <!-- 检修日期 & 当前版本 -->
        <div class="bpm-info-row">
          <div class="bpm-info-item">
            <span class="bpm-info-label">检修标题：</span>
            <span class="bpm-info-val">{{ notice.versionTitle }}</span>
          </div>
          <div class="bpm-info-item">
            <span class="bpm-info-label">检修日期：</span>
            <span class="bpm-info-val">{{ notice.releaseDate }}</span>
          </div>
          <div class="bpm-info-item">
            <span class="bpm-info-label">当前版本：</span>
            <span class="bpm-info-val">{{ notice.versionNo }}</span>
          </div>
          <div class="bpm-info-item-content">
            <span class="bpm-info-label">检修内容：</span>
            <div class="bpm-notice-content-html" v-html="notice.versionContent"></div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="notice-modal-footer">
        <el-button type="primary" @click="handleNotice">我知道了</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<style scoped>
:root {
  --bpm-primary: #00706b;
  --bpm-primary-hover: #005854;
}

/* vxe-modal 弹窗主题 */
.notice-modal {
  --vxe-font-color: #303133;
  --vxe-font-lighten-color: #909399;
  --vxe-modal-header-background-color: #f5f7fa;
  --vxe-modal-body-background-color: #ffffff;
  --vxe-modal-border-color: #ebeef5;
}

.notice-modal .vxe-modal--header {
  background-color: #f5f7fa !important;
  border-bottom: 1px solid #ebeef5 !important;
  color: #303133 !important;
}

.notice-modal .vxe-modal--header-title {
  color: #303133 !important;
  font-weight: 600 !important;
}

.notice-modal .vxe-modal--close-btn {
  color: #909399 !important;
}

.notice-modal .vxe-modal--close-btn:hover {
  color: #606266 !important;
}

.notice-modal .vxe-modal--footer {
  border-top: 1px solid #ebeef5 !important;
  background-color: #f5f7fa !important;
}

.notice-modal .vxe-modal--body {
  color: #303133 !important;
}

/* 弹窗主体 */
.notice-modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 概要信息 */
.notice-modal-intro {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.notice-modal-intro-icon {
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 168, 150, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notice-modal-intro-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notice-modal-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* 检修通知卡片 */
.bpm-notice-card-notice {
  display: flex;
  flex-direction: column;
}

.bpm-notice-card-notice:first-of-type {
  padding-top: 0;
  border-top: none;
}

.bpm-notice-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 20px;
  font-weight: bold;
  color: #000;
  letter-spacing: 1.2px;
}

.bpm-notice-tag {
  padding: 0.125rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.bpm-notice-tag-amber {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.bpm-notice-tag-blue {
  background-color: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

.bpm-notice-tag-emerald {
  background-color: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
}

/* 检修时间 & 影响模块 信息行 */
.bpm-info-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  font-size: 16px;
  padding: 1rem 1.25rem;
  /* border-radius: 0.75rem;
  border: 1px solid #f1f5f9;
  background-color: #f8fafc; */
  margin: 5px 0;
}

.bpm-info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000;
}
.bpm-info-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #000;
}

.bpm-info-label {
  color: #0f172a;
  font-weight: 700;
}

.bpm-info-val {
  font-weight: 600;
  color: #475569;
}

/* 检修内容描述 */
.bpm-notice-content-box {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.bpm-notice-content-html {
  color: #475569;
  font-size: 13px;
  max-height: 55vh;
  overflow: hidden;
  overflow-y: auto;
  min-height: 0;
}

/* 弹窗底部 */
.notice-modal-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 640px) {
  .notice-modal-footer {
    flex-direction: row;
  }
}

.bpm-emergency-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
