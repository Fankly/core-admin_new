<template>
  <li class="ds-user-menu__node">
    <button
      v-if="hasChildren"
      class="ds-user-menu__toggle"
      :class="{ 'is-active': containsActive, 'is-open': open }"
      type="button"
      :style="indentStyle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Folder class="ds-user-menu__icon" :size="14" :stroke-width="1.8" aria-hidden="true" />
      <span class="ds-user-menu__label">{{ item.title }}</span>
      <ChevronDown class="ds-user-menu__chevron" :class="{ 'is-open': open }" :size="13" :stroke-width="2" aria-hidden="true" />
    </button>
    <NavigationLink
      v-else
      class="ds-user-menu__link"
      :class="{ 'is-active': item.path === activePath }"
      :to="target"
      :external="item.isNewPage"
      :style="indentStyle"
      :title="item.title"
    >
      <FileText class="ds-user-menu__icon" :size="14" :stroke-width="1.8" aria-hidden="true" />
      <span class="ds-user-menu__label">{{ item.title }}</span>
      <ArrowUpRight v-if="item.isNewPage" class="ds-user-menu__external" :size="13" :stroke-width="1.8" aria-hidden="true" />
    </NavigationLink>

    <ul v-if="hasChildren && open" class="ds-user-menu__children">
      <UserMenuNode v-for="child in item.children" :key="child.key" :item="child" :depth="depth + 1" :active-path="activePath" />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpRight, ChevronDown, FileText, Folder } from '@lucide/vue'
import { NavigationLink } from '@/design-system'
import type { UserMenuItem } from '@/utils/menu'

defineOptions({ name: 'UserMenuNode' })

const props = defineProps<{
  item: UserMenuItem
  depth: number
  activePath: string
}>()

const hasChildren = computed(() => props.item.children.length > 0)
const target = computed(() => (props.item.isNewPage ? props.item.url : props.item.path))

/** 当前页是否落在这一支里，展开分组标题并高亮祖先。 */
const containsActive = computed<boolean>(() => {
  if (!props.activePath) return false
  const walk = (item: UserMenuItem): boolean => item.path === props.activePath || item.children.some(walk)
  return walk(props.item)
})

const open = ref(containsActive.value)

// 从页签 / 面包屑切到系统管理页面后再次打开下拉时，自动展开所在分组
watch(
  () => props.activePath,
  (path, previous) => {
    if (path && path !== previous && containsActive.value) open.value = true
  }
)

// 与面板内边距对齐，再按层级递进 14px（与侧栏每级缩进一致）
const indentStyle = computed(() => ({ paddingLeft: `${String(12 + props.depth * 14)}px` }))
</script>
