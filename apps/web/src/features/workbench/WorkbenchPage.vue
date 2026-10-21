<template>
  <div class="workbench ds-page">
    <PageHeader :title="'工作台'" :description="`${greeting}，${displayName}。从这里继续推进今天的工作。`">
      <template #meta>
        <CalendarDays :size="13" :stroke-width="1.8" aria-hidden="true" />
        <span>{{ todayLabel }}</span>
        <span class="workbench__dot" aria-hidden="true"></span>
        <span>{{ navLabel }}视图</span>
      </template>
      <template #actions>
        <button class="ds-button" type="button" :disabled="systemLoading" @click="loadSystemInfo">
          <RefreshCw :size="14" :stroke-width="1.8" :class="{ workbench__spin: systemLoading }" aria-hidden="true" />
          刷新
        </button>
      </template>
    </PageHeader>

    <div class="workbench__grid">
      <div class="workbench__column">
        <section class="ds-panel workbench__entries">
          <header class="ds-panel__head">
            <div>
              <h2 class="ds-panel__title">可用入口</h2>
              <p class="workbench__sub">按当前账号的菜单权限加载</p>
            </div>
            <span class="ds-panel__meta">{{ allEntries.length }} 个模块</span>
          </header>

          <div v-if="quickEntries.length" class="workbench__entry-grid">
            <template v-for="entry in quickEntries" :key="entry.path">
              <a v-if="entry.external" class="workbench-entry" :href="entry.href" target="_blank" rel="noopener noreferrer" :title="entry.title">
                <span class="workbench-entry__icon" aria-hidden="true">
                  <svg-icon v-if="entry.icon" :name="entry.icon" />
                  <LayoutGrid v-else :size="16" :stroke-width="1.7" />
                </span>
                <span class="workbench-entry__body">
                  <span class="workbench-entry__group">{{ entry.group }}</span>
                  <span class="workbench-entry__title">{{ entry.title }}</span>
                </span>
                <ArrowUpRight class="workbench-entry__arrow" :size="14" :stroke-width="1.7" aria-hidden="true" />
              </a>
              <router-link v-else class="workbench-entry" :to="entry.path" :title="entry.title">
                <span class="workbench-entry__icon" aria-hidden="true">
                  <svg-icon v-if="entry.icon" :name="entry.icon" />
                  <LayoutGrid v-else :size="16" :stroke-width="1.7" />
                </span>
                <span class="workbench-entry__body">
                  <span class="workbench-entry__group">{{ entry.group }}</span>
                  <span class="workbench-entry__title">{{ entry.title }}</span>
                </span>
                <ChevronRight class="workbench-entry__arrow" :size="14" :stroke-width="1.7" aria-hidden="true" />
              </router-link>
            </template>
          </div>

          <div v-else class="workbench__empty">
            <span class="ds-empty__icon"><LayoutGrid :size="18" :stroke-width="1.7" aria-hidden="true" /></span>
            <div>
              <p class="workbench__empty-title">当前账号还没有可用的菜单入口</p>
              <p class="workbench__empty-copy">菜单由服务端权限下发；如刚完成授权，请刷新页面或联系管理员。</p>
            </div>
          </div>
        </section>

        <section class="ds-panel workbench__recent">
          <header class="ds-panel__head">
            <div>
              <h2 class="ds-panel__title">最近访问</h2>
              <p class="workbench__sub">从已打开的标签页继续</p>
            </div>
            <Clock3 :size="15" :stroke-width="1.7" class="workbench__muted-icon" aria-hidden="true" />
          </header>

          <ol v-if="recentTabs.length" class="workbench__recent-list">
            <li v-for="tab in recentTabs" :key="tab.path">
              <router-link :to="tab.path" class="workbench-recent">
                <span class="workbench-recent__rail" aria-hidden="true"></span>
                <span class="workbench-recent__body">
                  <span class="workbench-recent__title">{{ tab.title }}</span>
                  <span class="workbench-recent__meta">{{ tabGroup(tab.meta) }}</span>
                </span>
                <span class="workbench-recent__path">{{ tab.path }}</span>
                <ChevronRight :size="14" :stroke-width="1.7" class="workbench-recent__arrow" aria-hidden="true" />
              </router-link>
            </li>
          </ol>

          <div v-else class="workbench__empty">
            <span class="ds-empty__icon"><Clock3 :size="18" :stroke-width="1.7" aria-hidden="true" /></span>
            <div>
              <p class="workbench__empty-title">还没有最近访问</p>
              <p class="workbench__empty-copy">从左侧导航进入一个模块后，这里会保留它，方便你快速返回。</p>
            </div>
          </div>
        </section>
      </div>

      <div class="workbench__column">
        <section class="ds-panel workbench__system">
          <header class="ds-panel__head">
            <div>
              <h2 class="ds-panel__title">运行环境</h2>
              <p class="workbench__sub">来自平台服务端信息</p>
            </div>
            <span class="ds-status" :class="{ 'ds-status--ok': systemReady, 'ds-status--warn': !systemReady && !systemLoading }">
              {{ systemReady ? '已连接' : systemLoading ? '读取中' : '不可用' }}
            </span>
          </header>

          <div v-if="systemLoading" class="ds-panel__body workbench__system-skeleton" aria-label="正在读取运行环境">
            <span class="ds-skeleton"></span>
            <span class="ds-skeleton"></span>
            <span class="ds-skeleton"></span>
          </div>

          <div v-else-if="!systemReady" class="ds-panel__body">
            <div class="workbench__inline-error">
              <CircleAlert :size="16" :stroke-width="1.8" aria-hidden="true" />
              <p>暂时无法读取运行环境，工作台其他内容不受影响。</p>
              <button class="ds-button" type="button" @click="loadSystemInfo">重试</button>
            </div>
          </div>

          <div v-else class="ds-panel__body">
            <div class="workbench__metrics">
              <div class="workbench-metric">
                <span class="workbench-metric__label">CPU 负载</span>
                <strong class="workbench-metric__value">{{ cpuPercent }}<small>%</small></strong>
                <span class="workbench-meter"><i :style="{ transform: `scaleX(${cpuPercent / 100})` }"></i></span>
              </div>
              <div class="workbench-metric">
                <span class="workbench-metric__label">内存占用</span>
                <strong class="workbench-metric__value">{{ memoryPercent }}<small>%</small></strong>
                <span class="workbench-meter"><i :style="{ transform: `scaleX(${memoryPercent / 100})` }"></i></span>
              </div>
              <div class="workbench-metric">
                <span class="workbench-metric__label">处理器</span>
                <strong class="workbench-metric__value">{{ sysInfo.processors || '—' }}<small>核</small></strong>
                <span class="workbench-metric__hint">服务节点</span>
              </div>
            </div>

            <dl class="workbench__facts">
              <div>
                <dt>操作系统</dt>
                <dd>{{ sysInfo.osName || '—' }}</dd>
              </div>
              <div>
                <dt>Java 运行时</dt>
                <dd>{{ sysInfo.javaVersion || '—' }}</dd>
              </div>
              <div>
                <dt>时区</dt>
                <dd>{{ sysInfo.userTimezone || '—' }}</dd>
              </div>
              <div>
                <dt>读取时间</dt>
                <dd>{{ updatedAt }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="ds-panel workbench__workspace">
          <header class="ds-panel__head">
            <div>
              <h2 class="ds-panel__title">当前工作区</h2>
              <p class="workbench__sub">随账号与界面设置变化</p>
            </div>
            <Server :size="15" :stroke-width="1.7" class="workbench__muted-icon" aria-hidden="true" />
          </header>
          <dl class="workbench__facts workbench__facts--flush">
            <div v-for="fact in workspaceFacts" :key="fact.label">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight, CalendarDays, ChevronRight, CircleAlert, Clock3, LayoutGrid, RefreshCw, Server } from '@lucide/vue'
import type { RouteRecordRaw } from 'vue-router'
import baseService from '@/service/baseService'
import { useMenuStore, usePreferencesStore, useSessionStore, useShellStore, useTabsStore } from '@/store'
import { PageHeader } from '@/design-system'
import SvgIcon from '@/components/base/svg-icon'
import type { MenuMeta } from '@/types/domain'
import app from '@/constants/app'

defineOptions({ name: 'WorkbenchPage' })

interface SysInfo {
  osName?: string
  osVersion?: string
  osArch?: string
  processors?: number
  totalPhysical?: number
  freePhysical?: number
  memoryRate?: number
  userLanguage?: string
  jvmName?: string
  javaVersion?: string
  javaHome?: string
  userDir?: string
  javaTotalMemory?: number
  javaFreeMemory?: number
  javaMaxMemory?: number
  userName?: string
  systemCpuLoad?: number
  userTimezone?: string
}

interface QuickEntry {
  path: string
  title: string
  group: string
  icon: string
  external: boolean
  href: string
}

const session = useSessionStore()
const menu = useMenuStore()
const tabs = useTabsStore()
const preferences = usePreferencesStore()
const shell = useShellStore()

const sysInfo = ref<SysInfo>({})
const systemLoading = ref(true)
const systemReady = ref(false)
const updatedAt = ref('—')
const now = new Date()

const displayName = computed(() => session.user.fullName || session.userName || '同事')
const todayLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now)
const greeting = computed(() => {
  const hour = now.getHours()
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const navLabels: Record<string, string> = {
  left: '左侧导航',
  top: '顶部导航',
  mix: '混合导航'
}
const navLabel = computed(() => navLabels[preferences.navLayout] ?? '左侧导航')

const toPercent = (value: unknown): number => {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(number <= 1 ? number * 100 : number)))
}

const cpuPercent = computed(() => toPercent(sysInfo.value.systemCpuLoad))
const memoryPercent = computed(() => toPercent(sysInfo.value.memoryRate))

const collectEntries = (routes: RouteRecordRaw[], parentTitle = ''): QuickEntry[] => {
  return routes.flatMap((route) => {
    const meta = (route.meta ?? {}) as MenuMeta
    const title = typeof meta.title === 'string' ? meta.title : ''
    const nextGroup = title || parentTitle

    if (route.children?.length) return collectEntries(route.children, nextGroup)
    if (!route.path || route.path.startsWith('/__') || route.path === '/home' || route.path === '/baseHome') return []

    return [
      {
        path: route.path,
        title: title || route.path,
        group: parentTitle || '工作区',
        icon: typeof meta.icon === 'string' ? meta.icon : '',
        external: Boolean(meta.isNewPage),
        href: typeof meta.url === 'string' ? meta.url : route.path
      }
    ]
  })
}

const allEntries = computed(() => collectEntries(menu.routes))
const quickEntries = computed(() => allEntries.value.slice(0, 8))

const recentTabs = computed(() =>
  tabs.tabs
    .filter((tab) => !tab.affix)
    .slice(-5)
    .reverse()
)

const tabGroup = (meta?: MenuMeta): string => {
  const titles = (meta?.matched ?? []).map((item) => item.title).filter((title): title is string => Boolean(title))
  return titles.length > 1 ? titles.slice(0, -1).join(' / ') : '已打开页面'
}

const workspaceFacts = computed(() => [
  { label: '当前账号', value: displayName.value },
  { label: '导航模式', value: navLabel.value },
  { label: '已打开页面', value: `${String(tabs.tabs.length)} 个` },
  { label: '按钮权限', value: session.permissions.length ? `${String(session.permissions.length)} 项` : '未配置' },
  { label: '页面缓存', value: app.enabledKeepAlive ? '已启用' : '已关闭' },
  { label: '平台版本', value: app.version }
])

const loadSystemInfo = async () => {
  systemLoading.value = true
  try {
    const res = await baseService.get<SysInfo | null>('/sys/info')
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '运行信息读取失败')
    sysInfo.value = res.data
    systemReady.value = true
    updatedAt.value = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
  } catch (error) {
    systemReady.value = false
    console.error('[workbench] failed to load system info', error)
  } finally {
    systemLoading.value = false
  }
}

onMounted(() => {
  void loadSystemInfo()
  shell.setMainPageRole(true)
})
</script>

<style scoped lang="less">
.workbench {
  gap: 20px;
}

.workbench__dot {
  width: 3px;
  height: 3px;
  background: var(--ds-line-strong);
  border-radius: 50%;
}

.workbench__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.workbench__column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.workbench__sub {
  margin-top: 4px;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
}

.workbench__muted-icon {
  color: var(--ds-ink-tertiary);
}

.workbench__entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 4px;
}

.workbench-entry {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 14px;
  color: var(--ds-ink);
  border-radius: var(--ds-radius-sm);
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease;

  &:hover {
    color: var(--ds-jade-800);
    background: var(--ds-jade-50);
  }

  &:focus-visible {
    background: var(--ds-jade-50);
  }
}

.workbench-entry__icon {
  display: grid;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--ds-jade-700);
  background: var(--ds-surface);
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-sm);
}

.workbench-entry:hover .workbench-entry__icon {
  border-color: var(--ds-jade-200);
}

.workbench-entry__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.workbench-entry__group {
  overflow: hidden;
  color: var(--ds-ink-tertiary);
  font-size: 10px;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-entry__title {
  margin-top: 3px;
  overflow: hidden;
  color: inherit;
  font-size: var(--ds-text-md);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-entry__arrow {
  flex: 0 0 auto;
  color: var(--ds-ink-tertiary);
  opacity: 0;
  transform: translateX(-3px);
  transition:
    opacity var(--ds-duration-fast) ease,
    transform var(--ds-duration-fast) var(--ds-ease-out);
}

.workbench-entry:hover .workbench-entry__arrow,
.workbench-entry:focus-visible .workbench-entry__arrow {
  opacity: 1;
  transform: translateX(0);
}

.workbench__recent-list {
  padding: 4px 4px 6px;
}

.workbench-recent {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 11px 14px;
  color: var(--ds-ink);
  border-radius: var(--ds-radius-sm);

  &:hover {
    background: var(--ds-surface-subtle);
  }
}

.workbench-recent__rail {
  flex: 0 0 auto;
  width: 5px;
  height: 5px;
  background: var(--ds-jade-400);
  border-radius: 50%;
}

.workbench-recent__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.workbench-recent__title {
  overflow: hidden;
  font-size: var(--ds-text-md);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-recent__meta {
  margin-top: 2px;
  overflow: hidden;
  color: var(--ds-ink-tertiary);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-recent__path {
  flex: 0 1 auto;
  max-width: 160px;
  overflow: hidden;
  color: var(--ds-ink-tertiary);
  font-family: var(--ds-font-mono);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-recent__arrow {
  flex: 0 0 auto;
  color: var(--ds-ink-tertiary);
}

.workbench__empty {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 24px;
  margin: 6px;
  color: var(--ds-ink-secondary);
  border: 1px dashed var(--ds-line-strong);
  border-radius: var(--ds-radius-md);
}

.workbench__empty-title {
  color: var(--ds-ink);
  font-size: var(--ds-text-md);
  font-weight: 500;
}

.workbench__empty-copy {
  max-width: 51ch;
  margin-top: 4px;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
  line-height: 1.65;
}

.workbench__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.workbench-metric {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workbench-metric__label {
  color: var(--ds-ink-tertiary);
  font-size: 10px;
}

.workbench-metric__value {
  margin-top: 5px;
  color: var(--ds-ink);
  font-family: var(--ds-font-numeric);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;

  small {
    margin-left: 2px;
    color: var(--ds-ink-tertiary);
    font-family: var(--ds-font-sans);
    font-size: 10px;
    font-weight: 400;
  }
}

.workbench-meter {
  width: 100%;
  height: 3px;
  margin-top: 9px;
  overflow: hidden;
  background: var(--ds-surface-sunken);
  border-radius: 2px;

  i {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--ds-jade-500);
    border-radius: inherit;
    transform-origin: left center;
    transition: transform var(--ds-duration-slow) var(--ds-ease-out);
  }
}

.workbench-metric__hint {
  margin-top: 9px;
  color: var(--ds-ink-tertiary);
  font-size: 10px;
}

.workbench__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  padding-top: 18px;
  margin: 18px 0 0;
  border-top: 1px solid var(--ds-line);

  div {
    min-width: 0;
  }

  dt {
    color: var(--ds-ink-tertiary);
    font-size: 10px;
  }

  dd {
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--ds-ink);
    font-size: var(--ds-text-sm);
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.workbench__facts--flush {
  padding: 16px 20px 20px;
  margin: 0;
  border-top: 0;
}

.workbench__system-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;

  span {
    width: 100%;
    height: 30px;
  }

  span:nth-child(2) {
    width: 80%;
    height: 58px;
  }

  span:nth-child(3) {
    width: 100%;
    height: 20px;
  }
}

.workbench__inline-error {
  display: flex;
  flex-direction: column;
  gap: 9px;
  align-items: flex-start;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
  line-height: 1.6;
}

.workbench__spin {
  animation: workbench-spin 0.9s linear infinite;
}

@keyframes workbench-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .workbench__grid {
    grid-template-columns: minmax(0, 1fr) minmax(290px, 0.8fr);
  }

  .workbench__entry-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .workbench__grid {
    grid-template-columns: 1fr;
  }

  .workbench__entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .workbench__grid {
    gap: 12px;
  }

  .workbench__column {
    gap: 12px;
  }

  .workbench__entry-grid {
    grid-template-columns: 1fr;
  }

  .workbench__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workbench__facts {
    grid-template-columns: 1fr;
  }

  .workbench-recent__path {
    display: none;
  }
}
</style>
