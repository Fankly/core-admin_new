<template>
  <button class="ds-menu-search-trigger" type="button" aria-label="搜索菜单" title="搜索菜单（Ctrl / ⌘ K）" @click="openSearch">
    <Search :size="16" aria-hidden="true" /><span>搜索菜单</span><kbd>{{ shortcut }}</kbd>
  </button>
  <el-dialog v-model="open" title="搜索菜单" width="min(600px, calc(100vw - 32px))" append-to-body class="ds-menu-search" @opened="focusSearch">
    <el-input ref="input" v-model="query" placeholder="输入模块名称或所属分组" aria-label="搜索菜单名称" clearable @keydown="onKeydown">
      <template #prefix><Search :size="17" aria-hidden="true" /></template>
    </el-input>
    <p class="ds-menu-search__hint" role="status">{{ query.trim() ? `找到 ${matches.length} 个入口` : '当前账号可访问的模块' }}</p>
    <ul v-if="results.length" class="ds-menu-search__results" aria-label="菜单搜索结果">
      <li v-for="(entry, index) in results" :key="entry.path">
        <component
          :is="entry.external ? 'a' : RouterLink"
          :to="entry.external ? undefined : entry.path"
          :href="entry.external ? entry.href : undefined"
          :target="entry.external ? '_blank' : undefined"
          :rel="entry.external ? 'noopener noreferrer' : undefined"
          class="ds-menu-search__result"
          :class="{ 'is-active': index === activeIndex }"
          @click="open = false"
          @keydown="onResultKeydown($event, index)"
        >
          <span
            ><strong>{{ entry.title }}</strong
            ><small>{{ entry.group }}</small></span
          >
          <ArrowUpRight v-if="entry.external" :size="16" aria-hidden="true" /><ChevronRight v-else :size="16" aria-hidden="true" />
        </component>
      </li>
    </ul>
    <EmptyState v-else title="没有找到匹配的菜单" description="试试其他模块名称或分组关键词。" />
    <template #footer><span class="ds-menu-search__footer">↑ ↓ 选择 · Enter 打开 · Esc 关闭</span></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import type { InputInstance } from 'element-plus'
import { ArrowUpRight, ChevronRight, Search } from '@lucide/vue'
import { useMenuStore } from '@/store'
import { searchNavigationEntries } from '@/router/navigation'
import { EmptyState } from '@/design-system'

const menu = useMenuStore()
const open = ref(false)
const query = ref('')
const input = ref<InputInstance>()
const activeIndex = ref(0)
const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K'
const matches = computed(() => searchNavigationEntries(menu.navigationEntries, query.value))
const results = computed(() => matches.value.slice(0, 30))
watch(query, () => {
  activeIndex.value = 0
})
function openSearch() {
  query.value = ''
  activeIndex.value = 0
  open.value = true
}
function focusSearch() {
  input.value?.focus()
}
function focusResult(index: number) {
  if (!results.value.length) return
  activeIndex.value = (index + results.value.length) % results.value.length
  document.querySelectorAll<HTMLElement>('.ds-menu-search__result').item(activeIndex.value).focus()
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'Enter') {
    event.preventDefault()
    focusResult(activeIndex.value)
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusResult(results.value.length - 1)
  }
}
function onResultKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    focusResult(index + (event.key === 'ArrowDown' ? 1 : -1))
  }
  if (event.key === 'Home') {
    event.preventDefault()
    focusResult(0)
  }
  if (event.key === 'End') {
    event.preventDefault()
    focusResult(results.value.length - 1)
  }
}
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.altKey) {
    event.preventDefault()
    if (open.value) focusSearch()
    else openSearch()
  }
})
</script>

<style lang="less">
.ds-menu-search-trigger {
  display: flex;
  gap: 9px;
  align-items: center;
  flex-shrink: 0;
  height: 34px;
  padding: 0 10px;
  color: var(--ds-header-muted);
  font-size: var(--ds-text-sm);
  background: transparent;
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-sm);
}
.ds-menu-search-trigger:hover {
  color: var(--ds-header-text);
}
.ds-menu-search-trigger kbd {
  padding: 0 5px;
  font-family: inherit;
  font-size: var(--ds-text-xs);
  opacity: 0.75;
}
.ds-menu-search .el-dialog__body {
  padding-top: 8px;
}
.ds-menu-search .el-input__wrapper {
  min-height: 44px;
}
.ds-menu-search__hint {
  margin: 16px 0 8px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
}
.ds-menu-search__results {
  max-height: min(380px, 50dvh);
  overflow: auto;
}
.ds-menu-search__result {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  color: var(--ds-ink);
  border-radius: var(--ds-radius-sm);
}
.ds-menu-search__result.is-active,
.ds-menu-search__result:hover {
  background: var(--ds-jade-50);
}
.ds-menu-search__result span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ds-menu-search__result strong {
  font-size: var(--ds-text-base);
  font-weight: 500;
  overflow-wrap: anywhere;
}
.ds-menu-search__result small {
  font-size: var(--ds-text-sm);
  color: var(--ds-ink-secondary);
  overflow-wrap: anywhere;
}
.ds-menu-search__result svg {
  flex-shrink: 0;
}
.ds-menu-search__footer {
  font-size: var(--ds-text-sm);
  color: var(--ds-ink-secondary);
}
@media (max-width: 1180px) {
  .ds-menu-search-trigger span,
  .ds-menu-search-trigger kbd {
    display: none;
  }
  .ds-menu-search-trigger {
    padding: 0;
    width: 34px;
    justify-content: center;
    border-color: transparent;
  }
}
</style>
