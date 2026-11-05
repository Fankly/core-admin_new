<template>
  <div ref="rootRef" :class="['rr-nav', { 'is-collapsed': collapsed }]" @mouseleave="scheduleCloseFlyouts">
    <div class="rr-nav__tools">
      <label class="rr-nav__search">
        <search-icon />
        <input
          ref="searchRef"
          :value="keyword"
          type="text"
          placeholder="搜索菜单"
          autocomplete="off"
          aria-label="搜索菜单"
          @input="onSearchInput"
          @keydown.esc="onSearchEsc"
        />
        <kbd>/</kbd>
      </label>
      <button
        :class="['rr-nav__tool', { 'is-active': favoritesOnly }]"
        type="button"
        :title="favoritesOnly ? '显示全部菜单' : '只看收藏'"
        aria-label="只看收藏"
        :aria-pressed="favoritesOnly"
        @click="favoritesOnly = !favoritesOnly"
      >
        <star aria-hidden="true" />
      </button>
      <button class="rr-nav__tool" type="button" title="收起全部菜单" aria-label="收起全部菜单" @click="collapseAll">
        <chevrons-down-up />
      </button>
    </div>
    <div ref="scrollRef" class="rr-nav__scroll" @scroll.passive="closeFlyouts">
      <el-menu
        v-if="flyoutMounted"
        v-show="collapsed"
        ref="flyoutMenuRef"
        class="rr-nav__rail"
        :default-active="activeKey"
        :collapse="true"
        :collapse-transition="false"
        :unique-opened="true"
        aria-label="主导航"
      >
        <sidebar-nav-flyout-node
          v-for="node in nodes"
          :key="node.key"
          :node="node"
          :popper-class="`rr-nav rr-nav--flyout ${idPrefix}-flyout ${popperClass.endsWith('-dark') ? 'rr-nav--flyout-dark' : ''}`"
          :open-menu="openFlyout"
          :close-menu="closeFlyout"
          :close-version="flyoutCloseVersion"
          :on-leave="scheduleCloseFlyouts"
        />
      </el-menu>
      <nav v-show="!collapsed && !isEmpty" class="rr-nav__root" aria-label="主导航">
        <ul class="rr-nav__list" data-level="1">
          <sidebar-nav-node v-for="x in nodes" :key="x.key" :node="x"></sidebar-nav-node>
        </ul>
      </nav>
      <div v-if="isEmpty && !collapsed" class="rr-nav__empty">
        <star v-if="favoritesOnly && !keyword.trim()" />
        <search-icon v-else />
        <strong>{{ favoritesOnly && !keyword.trim() ? '暂无收藏菜单' : '未找到相关菜单' }}</strong>
        {{ favoritesOnly && !keyword.trim() ? '点击上方星标查看全部菜单，再点击菜单旁的星标收藏' : '请更换关键词，或按 Esc 清空' }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { ChevronsDownUp, Search as SearchIcon, Star } from 'lucide-vue-next'
import { computed, defineComponent, getCurrentInstance, onBeforeUnmount, onMounted, PropType, provide, ref, watch } from 'vue'
import { RouteRecordRaw, useRouter } from 'vue-router'
import { buildNavNodes, getSearchVisibleKeys, INavNode, NavContextKey, searchNavNodes } from './sidebar-nav'
import SidebarNavNode from './sidebar-nav-node.vue'
import SidebarNavFlyoutNode from './sidebar-nav-flyout-node.vue'
import { useMenuFavoritesContext } from './menu-favorites'
import '@/assets/css/sidebar-nav.less'

/** 与 sidebar-nav.less 里 .rr-nav__panel 的展开动画时长一致 */
const PANEL_TRANSITION_MS = 320

/**
 * 纵向侧栏导航：搜索 + 四级手风琴树 + 收起态图标栏
 * 交互对齐「云卡悬浮」设计稿：图标只随层级变化，状态只改颜色
 */
export default defineComponent({
  name: 'SidebarNav',
  components: { SidebarNavNode, SidebarNavFlyoutNode, SearchIcon, ChevronsDownUp, Star },
  props: {
    menus: { type: Array as PropType<RouteRecordRaw[]>, default: () => [] },
    activePath: { type: String, default: '' },
    collapsed: Boolean,
    popperClass: { type: String, default: 'rr-sidebar-menu-pop-light' },
    router: Boolean,
    onSelect: Function
  },
  setup(props) {
    const router = useRouter()
    const favorites = useMenuFavoritesContext()
    const idPrefix = `rr-nav-${getCurrentInstance()?.uid ?? 0}`
    const rootRef = ref<HTMLElement>()
    const scrollRef = ref<HTMLElement>()
    const searchRef = ref<HTMLInputElement>()
    const flyoutMenuRef = ref<{ open: (key: string) => void; close: (key: string) => void }>()
    // 两种导航只挂载一次，避免每次收起 / 展开都重建整棵组件树。
    const flyoutMounted = ref(props.collapsed)
    const flyoutCloseVersion = ref(0)

    const nodes = computed(() => buildNavNodes(props.menus))
    const index = computed(() => {
      const byKey = new Map<string, INavNode>()
      const byPath = new Map<string, INavNode>()
      const walk = (ns: INavNode[]) =>
        ns.forEach((n) => {
          byKey.set(n.key, n)
          if (n.children.length) walk(n.children)
          else if (!byPath.has(n.path)) byPath.set(n.path, n)
        })
      walk(nodes.value)
      return { byKey, byPath }
    })

    const openKeys = ref(new Set<string>())
    // 同一路由挂在多个分组下时，以用户点的那一项为准
    const selectedKey = ref('')
    const activeNode = computed(() => {
      const picked = index.value.byKey.get(selectedKey.value)
      if (picked && picked.path === props.activePath) return picked
      return index.value.byPath.get(props.activePath)
    })
    const activeKey = computed(() => activeNode.value?.key ?? '')
    const pathKeys = computed(() => new Set(activeNode.value?.ancestors ?? []))

    const siblingKeys = (node: INavNode): string[] => {
      const parentKey = node.ancestors[node.ancestors.length - 1]
      const list = parentKey ? index.value.byKey.get(parentKey)?.children ?? [] : nodes.value
      return list.filter((x) => x.key !== node.key).map((x) => x.key)
    }

    // 手风琴：展开一项时收起同层其他分组
    const setOpen = (node: INavNode, open: boolean) => {
      // 原地更新 Set，让 Vue 只通知开合状态改变的分组。
      const keys = openKeys.value
      if (open) siblingKeys(node).forEach((k) => keys.delete(k))
      if (open) keys.add(node.key)
      else keys.delete(node.key)
    }

    // reflow：从页签 / 外部跳转过来时只留当前这一条路径
    const openTrail = (node: INavNode, reflow: boolean) => {
      const next = reflow ? new Set<string>() : new Set(openKeys.value)
      node.ancestors.forEach((k) => {
        const n = index.value.byKey.get(k)
        if (n) siblingKeys(n).forEach((s) => next.delete(s))
        next.add(k)
      })
      openKeys.value = next
    }

    // ---------- 搜索：命中叶子显示其祖先路径，命中分组默认只显示分组自身；手动展开命中分组后才出现下级 ----------
    const keyword = ref('')
    const favoritesOnly = ref(false)
    let openKeysBeforeSearch: Set<string> | null = null
    const searchResult = computed(() =>
      searchNavNodes(nodes.value, {
        keyword: keyword.value,
        favoritesOnly: favoritesOnly.value,
        isFavorite: (node) => favorites.isFavorite(node.menuId, node.isFavorite)
      })
    )
    const visibleKeys = computed(() => getSearchVisibleKeys(nodes.value, searchResult.value, openKeys.value))
    const isEmpty = computed(() => !!searchResult.value && searchResult.value.visible.size === 0)

    watch(
      searchResult,
      (result) => {
        if (result) {
          if (!openKeysBeforeSearch) openKeysBeforeSearch = new Set(openKeys.value)
          openKeys.value = new Set(result.open)
        } else {
          if (openKeysBeforeSearch) openKeys.value = openKeysBeforeSearch
          openKeysBeforeSearch = null
        }
      },
      { flush: 'sync' }
    )

    const resetSearch = (restore: boolean) => {
      if (!restore) openKeysBeforeSearch = null
      keyword.value = ''
    }

    const onSearchInput = (e: Event) => {
      keyword.value = (e.target as HTMLInputElement).value
    }

    const onSearchEsc = () => {
      resetSearch(true)
      searchRef.value?.blur()
    }

    const collapseAll = () => {
      resetSearch(false)
      openKeys.value = new Set()
    }

    // ---------- 点击 ----------
    const hrefOf = (node: INavNode) => (node.isNewPage ? node.url : router.options.history.createHref(node.path))

    let pendingTreeKey = ''
    const onLeafClick = (node: INavNode, e: MouseEvent) => {
      if (node.isNewPage) {
        closeFlyouts()
        props.onSelect?.(node.path)
        return
      }
      // 保留 Ctrl / ⌘ / Shift / 中键 的浏览器默认行为（新标签打开）
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      closeFlyouts()
      resetSearch(true)
      openTrail(node, false)
      pendingTreeKey = node.key
      selectedKey.value = node.key
      if (props.router) router.push(node.path).catch(() => undefined)
      props.onSelect?.(node.path)
    }

    const onToggle = (node: INavNode) => setOpen(node, !openKeys.value.has(node.key))

    // 关闭已挂载的浮层和悬停计时器，保留菜单实例以复用。
    let flyoutTimer = 0
    const closeFlyouts = () => {
      window.clearTimeout(flyoutTimer)
      if (flyoutMounted.value) flyoutCloseVersion.value++
    }
    const scheduleCloseFlyouts = () => {
      if (!props.collapsed) return
      window.clearTimeout(flyoutTimer)
      flyoutTimer = window.setTimeout(() => {
        if (!rootRef.value?.matches(':hover') && !document.querySelector(`.${idPrefix}-flyout:hover`)) closeFlyouts()
      }, 300)
    }
    const openFlyout = (node: INavNode) => flyoutMenuRef.value?.open(node.key)
    const closeFlyout = (key: string) => flyoutMenuRef.value?.close(key)

    watch(() => props.activePath, closeFlyouts)
    watch(
      () => props.collapsed,
      (collapsed) => {
        closeFlyouts()
        if (collapsed) flyoutMounted.value = true
      }
    )

    // ---------- 当前页联动：外部跳转（页签、面包屑、代码 push）时展开并滚到当前项 ----------
    let scrollTimer = 0
    const scrollActiveIntoView = (delay: number) => {
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        const box = scrollRef.value
        const row = box?.querySelector<HTMLElement>('.rr-nav__root .rr-nav__link.is-active')
        if (!box || !row || props.collapsed) return
        const a = row.getBoundingClientRect()
        const b = box.getBoundingClientRect()
        if (!a.height) return
        if (a.top < b.top + 16) box.scrollTop -= b.top + 16 - a.top
        else if (a.bottom > b.bottom - 16) box.scrollTop += a.bottom - b.bottom + 16
      }, delay)
    }

    watch(
      activeKey,
      () => {
        const node = activeNode.value
        const fromTree = !!node && node.key === pendingTreeKey
        pendingTreeKey = ''
        if (!node || fromTree) return
        resetSearch(false)
        openTrail(node, true)
        scrollActiveIntoView(PANEL_TRANSITION_MS)
      },
      { immediate: true }
    )

    // ---------- 「/」聚焦搜索：只在焦点空闲或已在侧栏内时接管，避免抢表格 / 编辑器的输入 ----------
    const onDocKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && props.collapsed) {
        closeFlyouts()
        return
      }
      if (e.key !== '/' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const input = searchRef.value
      if (!input || props.collapsed || !input.offsetParent) return
      const el = document.activeElement
      const idle = !el || el === document.body || (!!rootRef.value?.contains(el) && el !== input)
      if (!idle) return
      e.preventDefault()
      input.focus()
    }
    onMounted(() => document.addEventListener('keydown', onDocKeydown))
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onDocKeydown)
      window.clearTimeout(scrollTimer)
      window.clearTimeout(flyoutTimer)
    })

    provide(NavContextKey, { openKeys, activeKey, pathKeys, visibleKeys, idPrefix, hrefOf, onToggle, onLeafClick })

    return {
      rootRef,
      scrollRef,
      searchRef,
      flyoutMenuRef,
      flyoutMounted,
      flyoutCloseVersion,
      idPrefix,
      nodes,
      activeKey,
      keyword,
      favoritesOnly,
      isEmpty,
      onSearchInput,
      onSearchEsc,
      collapseAll,
      closeFlyouts,
      scheduleCloseFlyouts,
      openFlyout,
      closeFlyout
    }
  }
})
</script>
