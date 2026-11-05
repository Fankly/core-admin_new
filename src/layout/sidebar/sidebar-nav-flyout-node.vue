<template>
  <component
    :is="isLeaf ? 'el-menu-item' : 'el-submenu'"
    ref="menuRef"
    :index="node.key"
    class="rr-nav__flyout-item"
    :class="{ 'on-path': isOnPath }"
    :aria-label="node.title"
    :popper-class="popperClass"
    :popper-append-to-body="true"
    :show-timeout="150"
    :hide-timeout="250"
    :tabindex="isLeaf ? undefined : 0"
    @mouseleave="onLeave"
    @keydown="onGroupKeydown"
  >
    <template #[rowSlot]>
      <span class="rr-nav__node" :class="{ 'on-path': isOnPath }" :data-level="Math.min(node.level, 4)" :style="{ '--depth': node.level }">
        <component
          :is="isLeaf ? 'a' : 'span'"
          class="rr-nav__row"
          :class="[isLeaf ? 'rr-nav__link' : 'rr-nav__trigger', { 'is-active': isActive }]"
          :href="isLeaf ? ctx.hrefOf(node) : undefined"
          :target="node.isNewPage ? '_blank' : undefined"
          :rel="node.isNewPage ? 'noopener noreferrer' : undefined"
          :aria-current="isActive ? 'page' : undefined"
          :title="node.title"
          @click="onClick"
        >
          <span class="rr-nav__icon" aria-hidden="true">
            <component :is="icon" v-if="icon" />
            <span v-else class="rr-nav__dot"></span>
          </span>
          <span v-if="node.level === 1" class="rr-nav__short" aria-hidden="true">{{ shortLabel }}</span>
          <span class="rr-nav__text">{{ node.title }}</span>
          <span v-if="!isLeaf" class="rr-nav__arrow" aria-hidden="true"><chevron-right /></span>
        </component>
      </span>
    </template>
    <template v-if="!isLeaf && hasOpened" #default>
      <sidebar-nav-flyout-node
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :popper-class="popperClass"
        :open-menu="openMenu"
        :close-menu="closeMenu"
        :close-version="closeVersion"
        :on-leave="onLeave"
      />
    </template>
  </component>
</template>

<script lang="ts">
import { ChevronRight, FileText, Folder, Layers } from 'lucide-vue-next'
import { computed, defineComponent, inject, nextTick, PropType, ref, watch } from 'vue'
import { getNavShortLabel, INavNode, NavContextKey } from './sidebar-nav'

const LEVEL_ICONS = [Layers, Folder, FileText]

/** 收起态复用 Element Plus 的级联定位和悬停交互，路由选择仍由侧栏上下文统一处理。 */
export default defineComponent({
  name: 'SidebarNavFlyoutNode',
  components: { ChevronRight },
  props: {
    node: { type: Object as PropType<INavNode>, required: true },
    popperClass: { type: String, required: true },
    openMenu: { type: Function as PropType<(node: INavNode) => void>, required: true },
    closeMenu: { type: Function as PropType<(key: string) => void>, required: true },
    closeVersion: { type: Number, default: 0 },
    onLeave: { type: Function as PropType<() => void>, required: true }
  },
  setup(props) {
    const ctx = inject(NavContextKey)!
    const isLeaf = computed(() => !props.node.children.length)
    // Element Plus 1.x 的 hover 不派发 open 事件，观察子菜单实例的 opened 状态。
    const menuRef = ref<{ opened: boolean; handleMouseleave: () => void }>()
    const hasOpened = ref(false)
    watch(
      () => menuRef.value?.opened,
      (open) => {
        if (open) hasOpened.value = true
      }
    )
    watch(
      () => props.closeVersion,
      () => {
        if (isLeaf.value) return
        // 同时取消尚未执行的 hover 打开计时器，避免 Esc / 切换侧栏后浮层再次出现。
        menuRef.value?.handleMouseleave()
        props.closeMenu(props.node.key)
      }
    )
    const rowSlot = computed(() => (isLeaf.value ? 'default' : 'title'))
    const isOnPath = computed(() => ctx.pathKeys.value.has(props.node.key))
    const isActive = computed(() => ctx.activeKey.value === props.node.key)
    const icon = computed(() => LEVEL_ICONS[props.node.level - 1])
    const shortLabel = computed(() => getNavShortLabel(props.node))
    const onClick = (event: MouseEvent) => {
      if (!isLeaf.value) {
        props.openMenu(props.node)
        return
      }
      // 修饰键打开新标签时，不让 el-menu 把当前菜单标成已选中或收起浮层。
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) event.stopPropagation()
      ctx.onLeafClick(props.node, event)
    }
    const onGroupKeydown = (event: KeyboardEvent) => {
      if (isLeaf.value || !['Enter', ' ', 'ArrowRight'].includes(event.key) || event.target !== event.currentTarget) return
      event.preventDefault()
      const popupId = (event.currentTarget as HTMLElement).querySelector('.el-submenu__title')?.getAttribute('aria-describedby')
      props.openMenu(props.node)
      nextTick(() => {
        if (popupId) document.getElementById(popupId)?.querySelector<HTMLElement>('.el-submenu[tabindex], a')?.focus()
      })
    }
    return { ctx, menuRef, hasOpened, isLeaf, rowSlot, isOnPath, isActive, icon, shortLabel, onClick, onGroupKeydown }
  }
})
</script>
