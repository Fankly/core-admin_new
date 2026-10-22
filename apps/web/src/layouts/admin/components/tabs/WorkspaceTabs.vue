<template>
  <div class="ds-tabs" :class="`ds-tabs--${preferences.tabStyle}`">
    <div ref="scrollRef" class="ds-tabs__scroll" role="tablist" aria-label="已打开页面">
      <div
        v-for="(tab, index) in tabs.tabs"
        :key="tab.path"
        class="ds-tabs__item"
        :class="{ 'is-active': tab.path === tabs.activePath, 'is-affix': tab.affix }"
      >
        <button
          class="ds-tabs__link"
          type="button"
          role="tab"
          :aria-selected="tab.path === tabs.activePath"
          :tabindex="tab.path === tabs.activePath ? 0 : -1"
          :title="tab.title"
          @click="navigate(tab.path)"
          @auxclick="onAuxClick($event, tab)"
          @keydown="onTabKeydown($event, index)"
        >
          <span class="ds-tabs__dot" aria-hidden="true"></span>
          <span class="ds-tabs__label">{{ tab.title }}</span>
        </button>
        <button
          v-if="!tab.affix"
          class="ds-tabs__close"
          type="button"
          :aria-label="`关闭 ${tab.title}`"
          title="关闭"
          @click.stop="closeTab(tab.path)"
        >
          <X :size="12" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </div>

    <el-dropdown trigger="click" placement="bottom-end" @command="onCommand">
      <button class="ds-tabs__more" type="button" aria-label="标签页操作" title="标签页操作">
        <ChevronDown :size="15" :stroke-width="1.9" aria-hidden="true" />
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="item in operations" :key="item.command" :icon="item.icon" :command="item.command" :disabled="item.disabled">
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, ChevronDown, CircleX, X } from '@lucide/vue'
import type { TabItem } from '@/types/domain'
import { usePreferencesStore, useTabsStore } from '@/store'

defineOptions({ name: 'WorkspaceTabs' })

const router = useRouter()
const tabs = useTabsStore()
const preferences = usePreferencesStore()
const scrollRef = ref<HTMLElement | null>(null)

const operations = computed(() => [
  { label: '关闭当前标签页', command: 'closeCurrent', icon: X, disabled: tabs.activeTab?.affix },
  { label: '关闭其他标签页', command: 'closeOthers', icon: CircleX, disabled: tabs.tabs.length <= 2 },
  { label: '关闭左侧标签页', command: 'closeLeft', icon: ArrowLeft, disabled: false },
  { label: '关闭右侧标签页', command: 'closeRight', icon: ArrowRight, disabled: false },
  { label: '关闭全部标签页', command: 'closeAll', icon: CircleX, disabled: tabs.tabs.length <= 1 }
])

const navigate = (path?: string) => {
  if (path && path !== router.currentRoute.value.fullPath) void router.push(path)
}

const focusActiveTab = () => {
  void nextTick(() => {
    scrollRef.value?.querySelector<HTMLElement>('.ds-tabs__item.is-active .ds-tabs__link')?.focus()
  })
}

const closeTab = (path: string) => {
  navigate(tabs.closeTab(path))
  focusActiveTab()
}

const onAuxClick = (event: MouseEvent, tab: TabItem) => {
  if (event.button !== 1 || tab.affix) return
  event.preventDefault()
  closeTab(tab.path)
}

const onTabKeydown = (event: KeyboardEvent, index: number) => {
  const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.tabs.length - 1 }
  if (!(event.key in keys)) return
  const targetIndex = (keys[event.key] + tabs.tabs.length) % tabs.tabs.length
  event.preventDefault()
  const container = (event.currentTarget as HTMLElement).closest('.ds-tabs__scroll')
  const buttons = container?.querySelectorAll<HTMLButtonElement>('.ds-tabs__link')
  buttons?.[targetIndex]?.focus()
}

const onCommand = (command: string) => {
  switch (command) {
    case 'closeCurrent':
      navigate(tabs.closeCurrent())
      break
    case 'closeOthers':
      tabs.closeOthers()
      break
    case 'closeLeft':
      tabs.closeLeft()
      break
    case 'closeRight':
      tabs.closeRight()
      break
    case 'closeAll':
      navigate(tabs.closeAll())
      break
  }
  focusActiveTab()
}

watch(
  () => tabs.activePath,
  () => {
    void nextTick(() => {
      const container = scrollRef.value
      const active = container?.querySelector<HTMLElement>('.ds-tabs__item.is-active')
      if (!container || !active) return
      const viewport = container.getBoundingClientRect()
      const item = active.getBoundingClientRect()
      if (item.left < viewport.left) container.scrollLeft -= viewport.left - item.left
      else if (item.right > viewport.right) container.scrollLeft += item.right - viewport.right
    })
  },
  { immediate: true }
)
</script>
