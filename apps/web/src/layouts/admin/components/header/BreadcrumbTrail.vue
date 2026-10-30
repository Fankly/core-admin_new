<template>
  <nav ref="trail" class="ds-breadcrumb" aria-label="面包屑">
    <ol class="ds-breadcrumb__list">
      <li class="ds-breadcrumb__item ds-breadcrumb__home" :class="{ 'is-current': isHome }">
        <router-link v-if="!isHome" to="/home" class="ds-breadcrumb__root" aria-label="工作台" title="返回工作台">
          <House :size="16" :stroke-width="1.8" aria-hidden="true" />
          <span class="ds-breadcrumb__home-label">工作台</span>
        </router-link>
        <span v-else class="ds-breadcrumb__current" aria-current="page">
          <House :size="16" :stroke-width="1.8" aria-hidden="true" />
          <span class="ds-breadcrumb__label">工作台</span>
        </span>
      </li>

      <template v-if="!isHome">
        <li v-if="compact && ancestors.length" class="ds-breadcrumb__item ds-breadcrumb__overflow">
          <ChevronRight class="ds-breadcrumb__separator" :size="13" aria-hidden="true" />
          <el-popover
            v-model:visible="pathOpen"
            trigger="click"
            role="dialog"
            aria-label="完整页面路径"
            placement="bottom-start"
            :width="280"
            popper-class="ds-breadcrumb-popover"
            @after-enter="focusPath"
          >
            <template #reference>
              <button
                ref="pathTrigger"
                class="ds-breadcrumb__more"
                type="button"
                aria-label="展开完整路径"
                title="完整路径"
                @keydown.esc.stop.prevent="closePath"
              >
                <Ellipsis :size="18" aria-hidden="true" />
              </button>
            </template>
            <nav ref="pathPanel" aria-label="完整页面路径" @keydown.esc.stop.prevent="closePath">
              <p class="ds-breadcrumb-popover__title">页面路径</p>
              <ol class="ds-breadcrumb-popover__list">
                <li v-for="(item, index) in ancestors" :key="`${item.path}-${item.title}`">
                  <router-link :to="item.path" class="ds-breadcrumb-popover__link" @click="pathOpen = false">
                    <span class="ds-breadcrumb-popover__level" aria-hidden="true">{{ index + 1 }}</span>
                    <span>{{ item.title }}</span>
                    <ChevronRight :size="14" aria-hidden="true" />
                  </router-link>
                </li>
                <li class="ds-breadcrumb-popover__current" aria-current="page">
                  <FileText :size="15" aria-hidden="true" />
                  <span>{{ current?.title }}</span>
                </li>
              </ol>
            </nav>
          </el-popover>
        </li>
        <template v-else>
          <li v-for="item in ancestors" :key="`${item.path}-${item.title}`" class="ds-breadcrumb__item ds-breadcrumb__ancestor">
            <ChevronRight class="ds-breadcrumb__separator" :size="13" aria-hidden="true" />
            <router-link :to="item.path" class="ds-breadcrumb__link" :title="item.title">
              {{ item.title }}
            </router-link>
          </li>
        </template>
      </template>

      <li v-if="!isHome && current" class="ds-breadcrumb__item is-current">
        <ChevronRight class="ds-breadcrumb__separator" :size="13" aria-hidden="true" />
        <span class="ds-breadcrumb__current" aria-current="page" :title="current.title">
          <FileText :size="15" :stroke-width="1.8" aria-hidden="true" />
          <span class="ds-breadcrumb__label">{{ current.title }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useElementSize } from '@vueuse/core'
import { ChevronRight, Ellipsis, FileText, House } from '@lucide/vue'
import { ElPopover } from 'element-plus'

defineOptions({ name: 'BreadcrumbTrail' })

const route = useRoute()
const trail = ref<HTMLElement | null>(null)
const pathTrigger = ref<HTMLButtonElement | null>(null)
const pathPanel = ref<HTMLElement | null>(null)
const pathOpen = ref(false)
const { width } = useElementSize(trail)

const isHome = computed(() => route.path === '/home' || route.path === '/baseHome')

const crumbs = computed(() => {
  const titles = new Set<string>()
  return route.matched
    .filter((record) => {
      const title = typeof record.meta.title === 'string' ? record.meta.title : ''
      if (!title || record.path === '/' || record.path === '/home' || record.path === '/baseHome') return false
      const key = `${record.path}:${title}`
      if (titles.has(key)) return false
      titles.add(key)
      return true
    })
    .map((record) => ({
      path: record.path,
      title: String(record.meta.title)
    }))
})

const ancestors = computed(() => crumbs.value.slice(0, -1))
const current = computed(() => crumbs.value.at(-1))
// 按路径长度预留空间，侧栏拖宽或工具区变宽时优先保留当前页面。
const compact = computed(() => width.value < 240 + ancestors.value.reduce((total, item) => total + Math.min(item.title.length * 13, 156) + 24, 0))

const focusPath = () => {
  pathPanel.value?.querySelector<HTMLAnchorElement>('a')?.focus()
}

const closePath = () => {
  pathOpen.value = false
  pathTrigger.value?.focus()
}

watch([() => route.path, compact], () => {
  pathOpen.value = false
})
</script>
