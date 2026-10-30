<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading"
    :destroy-on-close="true"
    show-footer
    show-close
    resize
    position="center"
    width="760"
    height="480"
    title="任务进度"
    @close="$emit('close')"
  >
    <div class="point-progress">
      <div class="point-progress__hd">
        <span class="point-progress__title" :title="modal.title">{{ modal.title || '—' }}</span>
        <span class="point-progress__meta">共 {{ rows.length }} 个任务 · 已完成 {{ completedCount }}</span>
      </div>
      <div class="point-progress__body">
        <table class="point-progress-table">
          <colgroup>
            <col style="width: 64px" />
            <col />
            <col style="width: 170px" />
            <col style="width: 170px" />
            <col style="width: 110px" />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>名称</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="`${row.name || ''}-${index}`">
              <td class="is-center">{{ index + 1 }}</td>
              <td class="is-name" :title="row.name">{{ row.name || '-' }}</td>
              <td class="is-center">{{ row.startTime || '-' }}</td>
              <td class="is-center">{{ row.finishTime || '-' }}</td>
              <td class="is-center">
                <span class="progress-status" :class="`progress-status--${row.status || 'unknown'}`">{{ statusName(row) }}</span>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="is-empty">{{ modal.loading ? '加载中…' : '暂无执行明细' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button size="small" plain @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { PointTaskProgressRow } from '@/api/ai/smartTaskAudit'
import type { PointTaskProgressState } from '../hooks/usePointTaskPanel'
import { POINT_TASK_STATUS_OPTIONS } from '../pointTask'

const props = defineProps({
  modal: {
    type: Object as PropType<PointTaskProgressState>,
    required: true
  }
})

defineEmits(['close'])

const rows = computed<PointTaskProgressRow[]>(() => props.modal.rows || [])
const completedCount = computed(() => rows.value.filter((row) => String(row.status) === '3').length)

/** 后端给了 statusName 就用它，缺了按文档码值兜底：0已取消 1未开始 2处理中 3已完成 4处理失败 */
const statusName = (row: PointTaskProgressRow) => {
  const name = String(row.statusName || '').trim()
  if (name) return name
  return POINT_TASK_STATUS_OPTIONS.find((item) => item.code === String(row.status ?? ''))?.name || '-'
}
</script>

<style scoped lang="less">
@import '../css/tokens.less';

.point-progress {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.point-progress__hd {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 12px;
  background: @primary-bg-light;
  border: 1px solid @primary-border-light;
  border-radius: 8px;
  margin-bottom: 10px;
}

.point-progress__title {
  min-width: 0;
  overflow: hidden;
  color: @text-main;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-progress__meta {
  flex-shrink: 0;
  color: @primary-solid;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.point-progress__body {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid @border-main;
  border-radius: 8px;
}

.point-progress-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 12.5px;

  th,
  td {
    padding: 0 10px;
    height: 38px;
    color: @text-secondary;
    text-align: left;
    border-bottom: 1px solid @border-light;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    color: @table-header-text;
    background: @table-header-bg;
    font-weight: 600;
    font-size: 12.5px;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: @table-hover-bg;
  }

  .is-center {
    text-align: center;
  }

  .is-name {
    color: @text-main;
  }

  .is-empty {
    height: 120px;
    color: @text-muted;
    text-align: center;
  }
}

/* 状态徽标：与列表一致（未开始灰 / 处理中橙 / 已完成青 / 处理失败红 / 已取消灰） */
.progress-status {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.progress-status--1 {
  color: #475569;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.progress-status--2 {
  color: #b45309;
  background: #fff7ed;
  border-color: #fed7aa;
}

.progress-status--3 {
  color: #0f766e;
  background: #f0fdfa;
  border-color: #99f6e4;
}

.progress-status--4 {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.progress-status--0,
.progress-status--unknown {
  color: #64748b;
  background: #f8fafc;
  border-color: #e2e8f0;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
