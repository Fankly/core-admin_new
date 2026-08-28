<template>
  <div class="table-section">
    <table class="data-table" v-if="data.length > 0">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in data" :key="index">
          <td v-for="column in columns" :key="column.key">
            <template v-if="column.type === 'action'">
              <a href="#" class="action-link" @click.prevent="handleAction(column.action ?? '', item)">
                {{ column.actionText }}
              </a>
            </template>
            <template v-else>
              {{ item[column.key] }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4m0-11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V11"></path>
        </svg>
      </div>
      <div class="empty-title">暂无数据</div>
      <div class="empty-desc">当前没有任何记录，请尝试其他搜索条件</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from "vue";
// Props定义
interface TableColumn {
  key: string;
  label: string;
  type?: string;
  action?: string;
  actionText?: string;
}

const props = defineProps<{
  columns: TableColumn[];
  data: any[];
}>();

// Emits定义
const emit = defineEmits(["action-click"]);

// 处理操作
const handleAction = (action: string, item: any) => {
  emit("action-click", action, item);
};
</script>

<style scoped>
.table-section {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 112, 107, 0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin: 0 5px;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 5;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.table-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  height: 100%;
}

.data-table th {
  background: rgba(0, 112, 107, 0.05);
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: var(--color-primary);
  border-bottom: 1px solid rgba(0, 112, 107, 0.1);
  font-size: 14px;
  letter-spacing: 0.3px;
  position: relative;
  height: 56px;
}

.data-table th::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 80%, #fff) 100%);
}

.data-table td {
  padding: 10px;
  border-bottom: 1px solid rgba(0, 112, 107, 0.05);
  color: #595959;
  font-size: 14px;
  vertical-align: middle;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
}

.data-table tr:hover td {
  background: rgba(255, 255, 255, 0.4);
  color: var(--color-primary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.action-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  padding: 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
  overflow: hidden;
}

.action-link::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.action-link:hover::before {
  left: 100%;
}

.action-link:hover {
  background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 80%, white) 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-color: transparent;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  flex: 1;
  min-height: 400px;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-icon svg {
  color: var(--color-primary);
  opacity: 0.7;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  letter-spacing: 0.2px;
}

.empty-desc {
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  max-width: 400px;
}
</style>
