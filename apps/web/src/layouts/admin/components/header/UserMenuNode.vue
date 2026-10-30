<template>
  <li class="ds-user-menu__node" :data-nav-level="levelAttr">
    <button
      v-if="hasChildren"
      class="ds-user-menu__toggle"
      :class="{ 'is-active': containsActive, 'is-open': open }"
      type="button"
      :style="indentStyle"
      :aria-expanded="open"
      @click="emit('toggle', item.key, depth)"
    >
      <i class="ds-user-menu__icon" aria-hidden="true">
        <component :is="levelIcon" v-if="levelIcon" />
        <span v-else class="ds-user-menu__dot"></span>
      </i>
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
      <i class="ds-user-menu__icon" aria-hidden="true">
        <component :is="levelIcon" v-if="levelIcon" />
        <span v-else class="ds-user-menu__dot"></span>
      </i>
      <span class="ds-user-menu__label">{{ item.title }}</span>
      <ArrowUpRight v-if="item.isNewPage" class="ds-user-menu__external" :size="13" :stroke-width="1.8" aria-hidden="true" />
    </NavigationLink>

    <el-collapse-transition
      v-if="hasChildren"
      @before-leave="(el: Element) => el.setAttribute('inert', '')"
      @before-enter="(el: Element) => el.removeAttribute('inert')"
    >
      <ul v-if="open" class="ds-user-menu__children">
        <UserMenuNode
          v-for="child in item.children"
          :key="child.key"
          :item="child"
          :depth="depth + 1"
          :active-path="activePath"
          :expanded-path="expandedPath"
          @toggle="forwardToggle"
        />
      </ul>
    </el-collapse-transition>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, ChevronDown } from '@lucide/vue'
import { NavigationLink } from '@/design-system'
import type { UserMenuItem } from '@/utils/menu'
import { NAV_DOT_LEVEL, navLevelIcon } from '../navigation/nav-level-icon'

defineOptions({ name: 'UserMenuNode' })

const props = defineProps<{
  item: UserMenuItem
  depth: number
  activePath: string
  expandedPath: string[]
}>()
const emit = defineEmits<{ toggle: [key: string, depth: number] }>()
const forwardToggle = (key: string, depth: number) => {
  emit('toggle', key, depth)
}

const hasChildren = computed(() => props.item.children.length > 0)
const target = computed(() => (props.item.isNewPage ? props.item.url : props.item.path))

/** 与侧栏同一套层级图标：L2 文件夹 · L3 文件 · L4 及更深圆点 */
const levelAttr = computed(() => Math.min(props.item.level, NAV_DOT_LEVEL))
const levelIcon = computed(() => navLevelIcon(props.item.level))

/** 当前页是否落在这一支里，展开分组标题并高亮祖先。 */
const containsActive = computed<boolean>(() => {
  if (!props.activePath) return false
  const walk = (item: UserMenuItem): boolean => item.path === props.activePath || item.children.some(walk)
  return walk(props.item)
})

const open = computed(() => props.expandedPath[props.depth] === props.item.key)

// 与侧栏同一套缩进：起点 10px，每级固定 14px（图标宽度不参与计算）
const ROW_INSET = 10
const STEP = 14
const indentStyle = computed(() => ({ paddingLeft: `${String(ROW_INSET + props.depth * STEP)}px` }))
</script>
