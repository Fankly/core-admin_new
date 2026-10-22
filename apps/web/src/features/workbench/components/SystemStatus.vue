<template>
  <section aria-label="平台运行状态" class="system-status">
    <header class="system-status__head">
      <div><h3>平台运行状态</h3><p>服务节点的当前信息</p></div>
      <button class="ds-icon-button" type="button" aria-label="刷新平台状态" title="刷新平台状态" :disabled="loading" @click="load"
        ><RefreshCw :size="16" :class="{ 'system-status__spin': loading }" aria-hidden="true"
      /></button>
    </header>
    <div v-if="loading && !info" class="system-status__skeleton" role="status" aria-label="正在读取平台状态"
      ><span class="ds-skeleton"></span><span class="ds-skeleton"></span
    ></div>
    <EmptyState v-else-if="!info" title="暂时无法读取运行状态" description="可以重新读取，或稍后再试。"
      ><template #actions><button class="ds-button" type="button" @click="load">重新读取</button></template></EmptyState
    >
    <template v-else>
      <div class="system-status__meters"
        ><div v-for="meter in meters" :key="meter.label"
          ><span>{{ meter.label }}</span
          ><strong>{{ meter.value === null ? '—' : `${meter.value}%` }}</strong
          ><meter v-if="meter.value !== null" :value="meter.value" min="0" max="100" :aria-label="meter.label" /></div
      ></div>
      <dl
        ><div
          ><dt>操作系统</dt><dd>{{ info.osName || '—' }}</dd></div
        ><div
          ><dt>Java 版本</dt><dd>{{ info.javaVersion || '—' }}</dd></div
        ><div
          ><dt>处理器</dt><dd>{{ info.processors ? `${info.processors} 核` : '—' }}</dd></div
        ><div
          ><dt>时区</dt><dd>{{ info.userTimezone || '—' }}</dd></div
        ><div
          ><dt>读取时间</dt><dd>{{ updatedAt }}</dd></div
        ></dl
      >
      <p v-if="error" role="status" class="system-status__error">{{ error }}，当前显示上次读取结果。</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref } from 'vue'
import { RefreshCw } from '@lucide/vue'
import { EmptyState } from '@/design-system'
import { getSystemInfo, type SystemInfo } from '@/api/system'

const info = ref<SystemInfo | null>(null)
const loading = ref(false)
const error = ref('')
const updatedAt = ref('—')
const disposed = ref(false)
const isDisposed = () => disposed.value
onScopeDispose(() => {
  disposed.value = true
})
function toPercent(value: number | string | undefined) {
  if (value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null
  return Math.min(100, Math.round(number <= 1 ? number * 100 : number))
}
const meters = computed(() => [
  { label: 'CPU 负载', value: toPercent(info.value?.systemCpuLoad) },
  { label: '内存占用', value: toPercent(info.value?.memoryRate) }
])
async function load() {
  if (loading.value || isDisposed()) return
  loading.value = true
  error.value = ''
  try {
    const res = await getSystemInfo()
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '运行状态读取失败')
    if (isDisposed()) return
    info.value = res.data
    updatedAt.value = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
  } catch {
    if (!isDisposed()) error.value = '运行状态读取失败'
  } finally {
    if (!isDisposed()) loading.value = false
  }
}
onMounted(() => {
  void load()
})
</script>

<style scoped lang="less">
.system-status__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.system-status__head h3 {
  font-size: var(--ds-text-base);
}
.system-status__head p {
  margin-top: 4px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
}
.system-status__meters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 28px 0;
}
.system-status__meters div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.system-status__meters span,
dt {
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
}
.system-status__meters strong {
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
meter {
  width: 100%;
  height: 7px;
  accent-color: var(--ds-jade-600);
}
dl {
  display: grid;
  gap: 16px;
  margin: 0;
  padding-top: 24px;
  border-top: 1px solid var(--ds-line);
}
dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
dd {
  margin: 0;
  text-align: right;
  font-size: var(--ds-text-md);
}
.system-status__error {
  margin-top: 20px;
  color: var(--ds-warning);
  font-size: var(--ds-text-sm);
}
.system-status__skeleton {
  display: grid;
  gap: 20px;
  padding: 28px 0;
}
.system-status__skeleton span {
  height: 60px;
}
.system-status__spin {
  animation: status-spin 1s linear infinite;
}
@keyframes status-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
