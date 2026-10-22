<template>
  <div class="workbench ds-page">
    <PageHeader title="工作台" :description="`${greeting}，${displayName}。继续推进今天的工作。`">
      <template #meta
        ><CalendarDays :size="14" aria-hidden="true" /><span>{{ todayLabel }}</span></template
      >
      <template #actions
        ><button class="ds-button" type="button" @click="showSystem = true"><Activity :size="15" aria-hidden="true" />平台状态</button></template
      >
    </PageHeader>
    <div class="workbench__body">
      <ModuleDirectory :entries="menu.navigationEntries" />
      <aside class="workbench__aside" aria-label="工作记录与账号信息">
        <section class="workbench__recent" aria-labelledby="recent-title">
          <div class="workbench__section-head"><h2 id="recent-title">继续工作</h2><Clock3 :size="16" aria-hidden="true" /></div>
          <p class="workbench__sub">返回已打开的页面</p>
          <ol v-if="recentTabs.length" class="workbench__recent-list">
            <li v-for="tab in recentTabs" :key="tab.path"
              ><RouterLink :to="tab.path" class="workbench-recent"
                ><span
                  ><strong>{{ tab.title }}</strong
                  ><small>{{ tabGroup(tab.meta) }}</small></span
                ><ChevronRight :size="15" aria-hidden="true" /></RouterLink
            ></li>
          </ol>
          <EmptyState v-else title="从一个模块开始" description="打开的页面会保留在这里，方便随时继续。"
            ><template #icon><PanelsTopLeft :size="25" :stroke-width="1.5" /></template
          ></EmptyState>
        </section>
        <section class="workbench__account" aria-labelledby="workspace-title">
          <div class="workbench__section-head"><h2 id="workspace-title">我的工作区</h2><UserRound :size="16" aria-hidden="true" /></div>
          <dl
            ><div
              ><dt>当前账号</dt><dd>{{ displayName }}</dd></div
            ><div
              ><dt>已打开页面</dt><dd>{{ tabs.tabs.length }} 个</dd></div
            ><div
              ><dt>平台版本</dt><dd>{{ app.version }}</dd></div
            ></dl
          >
          <div class="workbench__account-note"><ShieldCheck :size="15" aria-hidden="true" /><p>入口随账号权限开放，页面切换会保留当前工作。</p></div>
        </section>
      </aside>
    </div>
    <el-drawer v-model="showSystem" title="平台状态" size="min(420px, 100vw)" append-to-body destroy-on-close
      ><SystemStatus v-if="showSystem"
    /></el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Activity, CalendarDays, ChevronRight, Clock3, PanelsTopLeft, ShieldCheck, UserRound } from '@lucide/vue'
import { useMenuStore, useSessionStore, useTabsStore } from '@/store'
import { EmptyState, PageHeader } from '@/design-system'
import type { MenuMeta } from '@/types/domain'
import app from '@/constants/app'
import ModuleDirectory from './components/ModuleDirectory.vue'
import SystemStatus from './components/SystemStatus.vue'

defineOptions({ name: 'WorkbenchPage' })
const session = useSessionStore()
const menu = useMenuStore()
const tabs = useTabsStore()
const showSystem = ref(false)
const now = new Date()
const displayName = computed(() => session.user.fullName || session.userName || '同事')
const todayLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now)
const greeting = now.getHours() < 12 ? '上午好' : now.getHours() < 18 ? '下午好' : '晚上好'
const recentTabs = computed(() =>
  tabs.tabs
    .filter((tab) => !tab.affix)
    .slice(-5)
    .reverse()
)
const tabGroup = (meta?: MenuMeta) =>
  (meta?.matched ?? [])
    .slice(0, -1)
    .map((item) => item.title)
    .filter(Boolean)
    .join(' / ') || '已打开页面'
</script>

<style scoped lang="less">
.workbench {
  gap: var(--ds-space-7);
  container-type: inline-size;
}
.workbench__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 36px;
  align-items: start;
}
.workbench__aside {
  border-left: 1px solid var(--ds-line);
  padding-left: 28px;
  min-width: 0;
}
.workbench__section-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.workbench__section-head h2 {
  font-size: var(--ds-text-base);
}
.workbench__section-head svg {
  color: var(--ds-ink-tertiary);
}
.workbench__sub {
  margin-top: 5px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
}
.workbench__recent :deep(.ds-empty-state) {
  min-height: 200px;
  padding-right: 8px;
  padding-left: 8px;
}
.workbench__recent :deep(.ds-empty-state__title) {
  font-size: var(--ds-text-md);
}
.workbench__recent :deep(.ds-empty-state__description) {
  font-size: var(--ds-text-sm);
}
.workbench__recent-list {
  margin-top: 18px;
}
.workbench-recent {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--ds-line);
}
.workbench-recent > span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.workbench-recent strong {
  font-size: var(--ds-text-md);
  font-weight: 500;
  overflow-wrap: anywhere;
}
.workbench-recent small {
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-sm);
}
.workbench-recent svg {
  flex-shrink: 0;
}
.workbench__account {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--ds-line);
}
.workbench__account dl {
  display: grid;
  gap: 18px;
  padding: 24px 0;
  margin: 0;
}
.workbench__account dl > div {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  font-size: var(--ds-text-sm);
}
.workbench__account dt {
  flex-shrink: 0;
  color: var(--ds-ink-tertiary);
}
.workbench__account dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}
.workbench__account-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 14px;
  background: var(--ds-surface-subtle);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
}
.workbench__account-note svg {
  flex-shrink: 0;
  margin-top: 2px;
}
@container (max-width: 1050px) {
  .workbench__body {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .workbench__aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
    padding: 24px 0 0;
    border-left: 0;
    border-top: 1px solid var(--ds-line);
  }
  .workbench__account {
    margin: 0;
    padding: 0;
    border: 0;
  }
}
</style>
