<template>
  <el-popover
    v-model:visible="open"
    trigger="click"
    role="dialog"
    placement="bottom-start"
    :width="272"
    :offset="8"
    :show-arrow="false"
    popper-class="ds-crumb-menu"
    @after-enter="focusInitial"
    @after-leave="reset"
  >
    <template #reference>
      <button
        ref="trigger"
        class="ds-breadcrumb__segment"
        :class="{ 'ds-breadcrumb__more': folded, 'is-open': open }"
        type="button"
        :aria-label="folded ? '展开已折叠的路径' : undefined"
        :title="folded ? folded : root.title"
        @keydown.esc.stop.prevent="close"
      >
        <Ellipsis v-if="folded" :size="16" :stroke-width="1.8" aria-hidden="true" />
        <template v-else>
          <span class="ds-breadcrumb__text">{{ root.title }}</span>
          <ChevronDown class="ds-breadcrumb__caret" :size="13" :stroke-width="2" aria-hidden="true" />
        </template>
      </button>
    </template>

    <nav ref="panel" class="ds-crumb-menu__panel" :aria-label="root.title" @keydown="onKeydown">
      <header class="ds-crumb-menu__head">
        <button
          v-if="parent"
          class="ds-crumb-menu__back"
          type="button"
          :aria-label="`返回${parent.title}`"
          :title="`返回${parent.title}`"
          @click="back"
        >
          <ChevronLeft :size="15" :stroke-width="2" aria-hidden="true" />
        </button>
        <span class="ds-crumb-menu__title">{{ view.title }}</span>
      </header>

      <Transition :name="`ds-crumb-slide-${direction}`">
        <ul :key="view.path" class="ds-crumb-menu__list">
          <li v-for="node in view.children" :key="node.path" :data-nav-level="Math.min(node.level, NAV_DOT_LEVEL)">
            <button
              v-if="node.children.length"
              class="ds-crumb-menu__row"
              :class="{ 'is-trail': trailPaths.includes(node.path) }"
              type="button"
              :data-path="node.path"
              @click="drill(node)"
            >
              <i class="ds-crumb-menu__icon" aria-hidden="true">
                <component :is="navLevelIcon(node.level)" v-if="navLevelIcon(node.level)" />
                <span v-else class="ds-crumb-menu__dot"></span>
              </i>
              <span class="ds-crumb-menu__label">{{ node.title }}</span>
              <ChevronRight class="ds-crumb-menu__trailing" :size="14" :stroke-width="1.8" aria-hidden="true" />
            </button>
            <NavigationLink
              v-else
              class="ds-crumb-menu__row"
              :class="{ 'is-active': node.path === activePath }"
              :to="node.external ? node.href : node.path"
              :external="node.external"
              :data-path="node.path"
              @click="onLeafClick(node)"
            >
              <i class="ds-crumb-menu__icon" aria-hidden="true">
                <component :is="navLevelIcon(node.level)" v-if="navLevelIcon(node.level)" />
                <span v-else class="ds-crumb-menu__dot"></span>
              </i>
              <span class="ds-crumb-menu__label">{{ node.title }}</span>
              <ArrowUpRight v-if="node.external" class="ds-crumb-menu__trailing" :size="14" :stroke-width="1.8" aria-hidden="true" />
              <Check v-else-if="node.path === activePath" class="ds-crumb-menu__trailing" :size="14" :stroke-width="2" aria-hidden="true" />
            </NavigationLink>
          </li>
          <li v-if="!view.children.length" class="ds-crumb-menu__empty">这一层暂无可访问的页面</li>
        </ul>
      </Transition>
    </nav>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElPopover } from 'element-plus'
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Ellipsis } from '@lucide/vue'
import { NavigationLink } from '@/design-system'
import type { BreadcrumbNode } from '@/router/navigation'
import { NAV_DOT_LEVEL, navLevelIcon } from '../navigation/nav-level-icon'

defineOptions({ name: 'BreadcrumbMenu' })

interface Props {
  /** 这一段列出的层级：普通分段是祖先本身，「…」是被折叠的祖先集合 */
  root: BreadcrumbNode
  /** 当前页的完整路径，用于标出所在分支 */
  trailPaths: string[]
  /** 非空时渲染为「…」，值是被折叠的路径文字 */
  folded?: string
}

const props = withDefaults(defineProps<Props>(), { folded: '' })

const route = useRoute()
const open = ref(false)
const stack = ref<BreadcrumbNode[]>([])
const direction = ref<'forward' | 'back'>('forward')
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

const activePath = computed(() => route.path)
const view = computed(() => stack.value.at(-1) ?? props.root)
const parent = computed(() => (stack.value.length ? (stack.value.at(-2) ?? props.root) : undefined))

const rows = () =>
  Array.from(
    panel.value?.querySelectorAll<HTMLElement>(
      '.ds-crumb-menu__list:not(.ds-crumb-slide-back-leave-active, .ds-crumb-slide-forward-leave-active) .ds-crumb-menu__row'
    ) ?? []
  )

const focusRow = (path?: string) => {
  void nextTick(() => {
    const list = rows()
    const target = (path && list.find((row) => row.dataset.path === path)) || list.find((row) => row.matches('.is-active, .is-trail')) || list.at(0)
    target?.focus()
  })
}

const focusInitial = () => {
  focusRow()
}

/** 分组没有自己的页面：点开后在同一面板里看它的下一层，而不是跳到某个默认页。 */
const drill = (node: BreadcrumbNode) => {
  direction.value = 'forward'
  stack.value = [...stack.value, node]
  focusRow()
}

const back = () => {
  const from = view.value
  direction.value = 'back'
  stack.value = stack.value.slice(0, -1)
  focusRow(from.path)
}

const close = () => {
  open.value = false
  trigger.value?.focus()
}

/** 站内链接靠路由变化收起；外链在新标签页打开，当前路由不变，需要手动收起。 */
const onLeafClick = (node: BreadcrumbNode) => {
  if (node.external) close()
}

const reset = () => {
  stack.value = []
  direction.value = 'forward'
}

const onKeydown = (event: KeyboardEvent) => {
  const list = rows()
  const index = list.findIndex((row) => row === document.activeElement)
  const moves: Record<string, number> = {
    ArrowDown: index < 0 ? 0 : (index + 1) % list.length,
    ArrowUp: index < 0 ? list.length - 1 : (index - 1 + list.length) % list.length,
    Home: 0,
    End: list.length - 1
  }
  if (event.key in moves && list.length) {
    event.preventDefault()
    list[moves[event.key]].focus()
    return
  }
  if (event.key === 'ArrowRight' && index >= 0) {
    const node = view.value.children.find((item) => item.path === list[index].dataset.path)
    if (node?.children.length) {
      event.preventDefault()
      drill(node)
    }
    return
  }
  if (event.key === 'ArrowLeft' && stack.value.length) {
    event.preventDefault()
    back()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
}

watch(
  () => route.path,
  () => {
    open.value = false
  }
)
</script>
