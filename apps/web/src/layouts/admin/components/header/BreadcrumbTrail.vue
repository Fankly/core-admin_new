<template>
  <nav ref="trail" class="ds-breadcrumb" aria-label="面包屑">
    <ol class="ds-breadcrumb__list">
      <li class="ds-breadcrumb__item">
        <router-link v-if="!isHome" to="/home" class="ds-breadcrumb__home" :class="{ 'is-icon': !fit.homeLabel }" aria-label="主页" title="主页">
          <House :size="16" :stroke-width="1.8" aria-hidden="true" />
          <span v-if="fit.homeLabel" class="ds-breadcrumb__text">主页</span>
        </router-link>
        <span v-else class="ds-breadcrumb__current" aria-current="page">
          <House :size="16" :stroke-width="1.8" aria-hidden="true" />
          <span class="ds-breadcrumb__text">主页</span>
        </span>
      </li>

      <li v-for="item in leading" :key="item.path" class="ds-breadcrumb__item">
        <ChevronRight class="ds-breadcrumb__separator" :size="14" :stroke-width="1.8" aria-hidden="true" />
        <BreadcrumbMenu :root="item" :trail-paths="trailPaths" />
      </li>

      <li v-if="foldedRoot" class="ds-breadcrumb__item">
        <ChevronRight class="ds-breadcrumb__separator" :size="14" :stroke-width="1.8" aria-hidden="true" />
        <BreadcrumbMenu :root="foldedRoot" :trail-paths="trailPaths" :folded="foldedLabel" />
      </li>

      <li v-for="item in trailing" :key="item.path" class="ds-breadcrumb__item">
        <ChevronRight class="ds-breadcrumb__separator" :size="14" :stroke-width="1.8" aria-hidden="true" />
        <BreadcrumbMenu :root="item" :trail-paths="trailPaths" />
      </li>

      <li v-if="currentTitle" class="ds-breadcrumb__item is-current">
        <ChevronRight class="ds-breadcrumb__separator" :size="14" :stroke-width="1.8" aria-hidden="true" />
        <span class="ds-breadcrumb__current" aria-current="page" :title="currentTitle">
          <span class="ds-breadcrumb__text">{{ currentTitle }}</span>
        </span>
      </li>
    </ol>

    <!-- 测量层：按真实样式渲染每一段，决定哪些祖先折进「…」；不可见、不可聚焦 -->
    <div v-if="!isHome" ref="measure" class="ds-breadcrumb__measure" aria-hidden="true" inert>
      <span class="ds-breadcrumb__home" data-measure="home-label"><House :size="16" /><span class="ds-breadcrumb__text">主页</span></span>
      <span class="ds-breadcrumb__home is-icon" data-measure="home-icon"><House :size="16" /></span>
      <span data-measure="separator"><ChevronRight class="ds-breadcrumb__separator" :size="14" /></span>
      <span class="ds-breadcrumb__segment ds-breadcrumb__more" data-measure="more"><Ellipsis :size="16" /></span>
      <span v-for="item in ancestors" :key="item.path" class="ds-breadcrumb__segment" data-measure="ancestor">
        <span class="ds-breadcrumb__text">{{ item.title }}</span>
        <ChevronDown class="ds-breadcrumb__caret" :size="13" />
      </span>
      <span class="ds-breadcrumb__current" data-measure="current">
        <span class="ds-breadcrumb__text">{{ currentTitle }}</span>
      </span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useResizeObserver } from '@vueuse/core'
import { ChevronDown, ChevronRight, Ellipsis, House } from '@lucide/vue'
import { useMenuStore } from '@/store'
import { resolveBreadcrumb, type BreadcrumbNode } from '@/router/navigation'
import BreadcrumbMenu from './BreadcrumbMenu.vue'
import { fitBreadcrumb, type BreadcrumbWidths } from './breadcrumb-fit'

defineOptions({ name: 'BreadcrumbTrail' })

const route = useRoute()
const menu = useMenuStore()
const trail = ref<HTMLElement | null>(null)
const measure = ref<HTMLElement | null>(null)
const available = ref(0)
const widths = ref<BreadcrumbWidths>({ homeLabel: 0, homeIcon: 0, separator: 0, more: 0, ancestors: [], current: 0 })

const isHome = computed(() => route.path === '/home')

const resolved = computed(() => (isHome.value ? null : resolveBreadcrumb(menu.routes, route.path)))
const ancestors = computed<BreadcrumbNode[]>(() => resolved.value?.ancestors ?? [])

// 不在菜单树里的页面（工作台、错误页、穿透页）只显示自己的标题。
const currentTitle = computed(() => {
  if (isHome.value) return ''
  if (resolved.value) return resolved.value.current.title
  const record = [...route.matched].reverse().find((item) => typeof item.meta.title === 'string' && item.meta.title)
  return record && record.path !== '/' ? String(record.meta.title) : ''
})

const trailPaths = computed(() => [...ancestors.value.map((item) => item.path), route.path])

const fit = computed(() => fitBreadcrumb(available.value, widths.value))
const leading = computed(() => ancestors.value.slice(0, fit.value.head))
const trailing = computed(() => ancestors.value.slice(ancestors.value.length - fit.value.tail))
const folded = computed(() => ancestors.value.slice(fit.value.head, ancestors.value.length - fit.value.tail))
const foldedLabel = computed(() => folded.value.map((item) => item.title).join(' / '))

/** 只折叠一层时「…」就是那一层；折叠多层时先列出这些祖先，再逐层点开。 */
const foldedRoot = computed<BreadcrumbNode | null>(() => {
  const nodes = folded.value
  if (!nodes.length) return null
  if (nodes.length === 1) return nodes[0]
  return { path: '__folded__', title: '页面路径', level: nodes[0].level, external: false, href: '', children: nodes }
})

const readWidths = () => {
  const root = measure.value
  if (!root) return
  const width = (key: string) => root.querySelector(`[data-measure="${key}"]`)?.getBoundingClientRect().width ?? 0
  widths.value = {
    homeLabel: width('home-label'),
    homeIcon: width('home-icon'),
    separator: width('separator'),
    more: width('more'),
    ancestors: Array.from(root.querySelectorAll('[data-measure="ancestor"]'), (node) => node.getBoundingClientRect().width),
    current: width('current')
  }
}

useResizeObserver(trail, (entries) => {
  available.value = entries[0]?.contentRect.width ?? 0
})
// 标题或字体变化会改变测量层尺寸；路由切换时标题可能等宽，所以同时监听路径
useResizeObserver(measure, readWidths)
watch([() => route.path, ancestors], readWidths, { flush: 'post' })
</script>
