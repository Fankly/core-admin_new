<template>
  <li
    v-show="isVisible"
    :class="['rr-nav__node', { 'is-leaf': isLeaf, 'is-open': isOpen, 'on-path': isOnPath, 'has-favorite': showFavorite && isLeaf && !!node.menuId }]"
    :data-level="Math.min(node.level, 4)"
    :style="{ '--depth': node.level }"
  >
    <component
      :is="isLeaf ? 'a' : 'button'"
      v-bind="rowAttrs"
      :class="['rr-nav__row', isLeaf ? 'rr-nav__link' : 'rr-nav__trigger', { 'is-active': isActive }]"
      :title="node.title"
      @click="onClick"
    >
      <span class="rr-nav__icon">
        <component :is="icon" v-if="icon" />
        <span v-else class="rr-nav__dot"></span>
      </span>
      <span v-if="node.level === 1" class="rr-nav__short" aria-hidden="true">{{ shortLabel }}</span>
      <span class="rr-nav__text">{{ node.title }}</span>
      <span v-if="!isLeaf" class="rr-nav__arrow"><chevron-down /></span>
    </component>
    <menu-favorite-button
      v-if="showFavorite && isLeaf && node.menuId"
      class="rr-nav__favorite"
      :menu-id="node.menuId"
      :title="node.title"
      :is-favorite="node.isFavorite"
    />
    <div v-if="!isLeaf" :id="panelId" class="rr-nav__panel" :inert="!isOpen">
      <div class="rr-nav__panel-inner">
        <ul v-if="hasOpened" class="rr-nav__list" :data-level="Math.min(node.level + 1, 4)">
          <sidebar-nav-node v-for="x in node.children" :key="x.key" :node="x" :show-favorite="showFavorite"></sidebar-nav-node>
        </ul>
      </div>
    </div>
  </li>
</template>
<script lang="ts">
import { ChevronDown, FileText, Folder, Layers } from 'lucide-vue-next'
import { computed, defineComponent, inject, PropType, ref, watch } from 'vue'
import { getNavShortLabel, INavNode, NavContextKey } from './sidebar-nav'
import MenuFavoriteButton from './menu-favorite-button.vue'

/** 图标只由层级决定：L1 层叠 · L2 文件夹 · L3 文件 · L4 及以下圆点；展开 / 选中只改颜色 */
const LEVEL_ICONS = [Layers, Folder, FileText]

/**
 * 侧栏导航树节点
 */
export default defineComponent({
  name: 'SidebarNavNode',
  components: { ChevronDown, MenuFavoriteButton },
  props: {
    node: { type: Object as PropType<INavNode>, required: true },
    /** 叶子节点是否带收藏按钮；头像下拉等不提供收藏的面板关掉，右侧也不留空位 */
    showFavorite: { type: Boolean, default: true }
  },
  setup(props) {
    const ctx = inject(NavContextKey)!
    const isLeaf = computed(() => !props.node.children.length)
    const isOpen = computed(() => ctx.openKeys.value.has(props.node.key))
    // 首次展开才挂载后代，之后保留实例，收起动画和再次展开无需重建。
    const hasOpened = ref(isOpen.value)
    watch(isOpen, (open) => {
      if (open) hasOpened.value = true
    })
    const isOnPath = computed(() => ctx.pathKeys.value.has(props.node.key))
    const isActive = computed(() => ctx.activeKey.value === props.node.key)
    const isVisible = computed(() => !ctx.visibleKeys.value || ctx.visibleKeys.value.has(props.node.key))
    const icon = computed(() => LEVEL_ICONS[props.node.level - 1])
    const shortLabel = computed(() => getNavShortLabel(props.node))
    const panelId = computed(() => `${ctx.idPrefix}-${props.node.key}`)
    const rowAttrs = computed(() => {
      const n = props.node
      if (!isLeaf.value) return { type: 'button', 'aria-expanded': isOpen.value, 'aria-controls': panelId.value }
      return {
        href: ctx.hrefOf(n),
        target: n.isNewPage ? '_blank' : undefined,
        rel: n.isNewPage ? 'noopener' : undefined,
        'aria-current': isActive.value ? 'page' : undefined
      }
    })
    const onClick = (e: MouseEvent) => {
      if (isLeaf.value) ctx.onLeafClick(props.node, e)
      else ctx.onToggle(props.node)
    }
    return { isLeaf, isOpen, hasOpened, isOnPath, isActive, isVisible, icon, shortLabel, panelId, rowAttrs, onClick }
  }
})
</script>
