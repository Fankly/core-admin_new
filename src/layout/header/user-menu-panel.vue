<template>
  <nav class="rr-masthead-user-panel" :aria-label="title">
    <header class="rr-masthead-user-panel__head">
      <span class="rr-masthead-user-panel__mark" aria-hidden="true">
        <Settings :size="15" :stroke-width="1.8" />
      </span>
      <span class="rr-masthead-user-panel__title">{{ title }}</span>
    </header>
    <div class="rr-masthead-user-panel__search">
      <Search :size="15" :stroke-width="1.8" aria-hidden="true" />
      <input
        ref="searchRef"
        v-model="keyword"
        type="text"
        placeholder="搜索菜单"
        autocomplete="off"
        aria-label="搜索系统管理菜单"
        @keydown.esc="onSearchEsc"
      />
      <button v-if="keyword" class="rr-masthead-user-panel__clear" type="button" title="清空搜索" aria-label="清空搜索" @click="clearSearch">
        <X :size="14" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </div>
    <div :ref="setBodyRef" class="rr-masthead-user-panel__body" @scroll.passive="updateStuck">
      <div v-show="!isEmpty" class="rr-nav rr-masthead-user-panel__nav">
        <ul class="rr-nav__list rr-masthead-user-panel__root-list" :data-level="rootLevel">
          <sidebar-nav-node v-for="node in nodes" :key="node.key" :node="node" :show-favorite="false"></sidebar-nav-node>
        </ul>
      </div>
      <p v-if="isEmpty" class="rr-masthead-user-panel__empty" role="status">{{
        searchResult ? '未找到相关菜单，请更换关键词' : '暂无可访问的菜单'
      }}</p>
    </div>
  </nav>
</template>

<script lang="ts">
import { Search, Settings, X } from 'lucide-vue-next'
import { computed, defineComponent, nextTick, onBeforeUnmount, PropType, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SYSTEM_MENU_TITLE } from '@/utils/menu'
import type { IUserMenuItem } from '@/utils/menu'
import { getSearchVisibleKeys, NavContextKey, searchNavNodes } from '@/layout/sidebar/sidebar-nav'
import type { INavNode } from '@/layout/sidebar/sidebar-nav'
import SidebarNavNode from '@/layout/sidebar/sidebar-nav-node.vue'
import { buildUserMenuIndex, buildUserNavNodes, getAncestorKeys, openTrailKeys, resolveActiveKey, toggleOpenKey } from './user-menu'
import '@/assets/css/sidebar-nav.less'

/** 与 sidebar-nav.less 中 .rr-nav__panel 的展开过渡时长保持一致 */
const PANEL_TRANSITION_MS = 320
/** 滚动定位时上下各留的余量 */
const SCROLL_GAP = 8
/** 面板顶层节点：滚动 / 吸顶逻辑只关心这一层 */
const ROOT_NODE = '.rr-masthead-user-panel__root-list > .rr-nav__node'

/**
 * 头像下拉：只承载「系统管理」菜单树
 * 直接复用侧栏节点组件与样式，图标、缩进、层级底色、选中态都和左边导航一致
 */
export default defineComponent({
  name: 'UserMenuPanel',
  components: { Search, Settings, SidebarNavNode, X },
  props: {
    items: { type: Array as PropType<IUserMenuItem[]>, default: () => [] },
    /** 下拉是否展开，展开时把当前页滚到可视区 */
    visible: { type: Boolean, default: false }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    const idPrefix = 'rr-user-menu'
    const index = computed(() => buildUserMenuIndex(props.items))
    // 侧栏同一套层级：系统管理算第 1 层，下拉里的顶层项是第 2 层，图标与缩进都由 level 决定
    const nodes = computed(() => buildUserNavNodes(props.items))
    const rootLevel = computed(() => (nodes.value.length ? Math.min(...nodes.value.map((x) => x.level)) : 2))

    const openKeys = ref(new Set<string>())
    // 同一路由挂在多处时（如「菜单帮助管理」「帮助中心」），以用户点的那一项为准
    const selectedKey = ref('')
    const activeKey = computed(() => resolveActiveKey(index.value, route.path, selectedKey.value))
    const pathKeys = computed(() => new Set(activeKey.value ? getAncestorKeys(index.value, activeKey.value) : []))
    const searchRef = ref<HTMLInputElement>()
    const keyword = ref('')
    let openKeysBeforeSearch: Set<string> | null = null
    // 与侧栏共用匹配规则：命中叶子展开祖先路径，命中分组可手动展开下级
    const searchResult = computed(() => searchNavNodes(nodes.value, { keyword: keyword.value, favoritesOnly: false, isFavorite: () => false }))
    const visibleKeys = computed(() => getSearchVisibleKeys(nodes.value, searchResult.value, openKeys.value))
    const isEmpty = computed(() => !nodes.value.length || (!!searchResult.value && !searchResult.value.visible.size))

    const clearSearch = () => {
      keyword.value = ''
      searchRef.value?.focus({ preventScroll: true })
    }
    const onSearchEsc = (event: KeyboardEvent) => {
      if (!keyword.value || event.isComposing) return
      event.preventDefault()
      event.stopPropagation()
      clearSearch()
    }

    // 从页签 / 面包屑切到系统管理页面，或菜单异步加载完成后，展开当前页所在分组
    watch(
      activeKey,
      (key) => {
        if (key) openKeys.value = openTrailKeys(index.value, openKeys.value, key)
      },
      { immediate: true }
    )

    // ---------- 滚动：面板会缩放入场，按 offsetTop 计算，不受 transform 影响 ----------
    let body: HTMLElement | null = null
    const setBodyRef = (el: HTMLElement | null) => {
      body = el
    }

    // 滚动区样式上是定位元素，正常会停在 box；万一不是，减去 box 自身的偏移兜底
    const offsetWithin = (el: HTMLElement, box: HTMLElement): number => {
      let top = 0
      let node: HTMLElement | null = el
      while (node && node !== box) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      return node === box ? top : top - offsetWithin(box, document.body)
    }

    // 吸顶标题只在真正贴住顶边时加投影，自然位置上不加，免得像一条多余的分隔线
    const updateStuck = () => {
      const head = body?.querySelector<HTMLElement>(`${ROOT_NODE}.is-open > .rr-nav__trigger`)
      // 用 data 属性而不是 class：节点的 class 由 Vue 绑定，重新渲染时会被覆盖
      body?.querySelectorAll('[data-stuck]').forEach((el) => el !== head && el.removeAttribute('data-stuck'))
      if (!head || !body) return
      if (body.scrollTop > 0 && offsetWithin(head, body) <= body.scrollTop) head.setAttribute('data-stuck', '')
      else head.removeAttribute('data-stuck')
    }

    // 展开中的顶层分组标题会吸顶，定位它的下级时要让出这一行
    const stickyInset = (el: HTMLElement): number => {
      const group = el.parentElement?.closest(ROOT_NODE)
      const head = group?.querySelector<HTMLElement>(':scope > .rr-nav__trigger')
      return head && !el.contains(head) ? head.offsetHeight : 0
    }

    // 让 el 完整出现在可视区；el 比可视区高时优先保证顶部可见
    const scrollIntoBody = (el: HTMLElement, behavior: ScrollBehavior) => {
      if (!body || !body.clientHeight) return
      const inset = stickyInset(el) + SCROLL_GAP
      const top = offsetWithin(el, body)
      const bottom = top + el.offsetHeight
      const viewTop = body.scrollTop
      const viewBottom = viewTop + body.clientHeight
      let target = viewTop
      if (top < viewTop + inset) target = top - inset
      else if (bottom > viewBottom - SCROLL_GAP) target = Math.min(top - inset, bottom - body.clientHeight + SCROLL_GAP)
      if (target !== viewTop) body.scrollTo({ top: Math.max(0, target), behavior })
    }

    // 展开分组后等过渡结束再定位，避免新展开的子项落在面板底部看不见
    let revealTimer = 0
    const revealGroup = (key: string) => {
      window.clearTimeout(revealTimer)
      revealTimer = window.setTimeout(() => {
        const node = document.getElementById(`${idPrefix}-${key}`)?.parentElement
        if (node) scrollIntoBody(node, 'smooth')
      }, PANEL_TRANSITION_MS)
    }

    watch(
      searchResult,
      (result) => {
        window.clearTimeout(revealTimer)
        if (result) {
          if (!openKeysBeforeSearch) openKeysBeforeSearch = new Set(openKeys.value)
          openKeys.value = new Set(result.open)
        } else {
          if (openKeysBeforeSearch) openKeys.value = openKeysBeforeSearch
          openKeysBeforeSearch = null
        }
        nextTick(() => {
          if (body) body.scrollTop = 0
          updateStuck()
        })
      },
      { flush: 'sync' }
    )

    watch(
      () => props.visible,
      (visible) => {
        if (!visible) {
          window.clearTimeout(revealTimer)
          keyword.value = ''
          return
        }
        nextTick(() => {
          searchRef.value?.focus({ preventScroll: true })
          const active = body?.querySelector<HTMLElement>('.rr-nav__link.is-active')
          if (active) scrollIntoBody(active, 'auto')
          else if (body) body.scrollTop = 0
          updateStuck()
        })
      }
    )

    onBeforeUnmount(() => window.clearTimeout(revealTimer))

    // ---------- 点击 ----------
    const itemOf = (node: INavNode) => index.value.byKey.get(node.key)
    const hrefOf = (node: INavNode) => {
      const item = itemOf(node)
      if (!item) return '#'
      return item.isNewPage ? item.url : router.options.history.createHref(item.path)
    }

    const onToggle = (node: INavNode) => {
      const wasOpen = openKeys.value.has(node.key)
      openKeys.value = toggleOpenKey(index.value, openKeys.value, node.key)
      if (!wasOpen) revealGroup(node.key)
      // 收起 / 切换分组后内容高度变化，不一定触发 scroll，渲染后重新判断
      nextTick(updateStuck)
    }

    const onLeafClick = (node: INavNode, e: MouseEvent) => {
      const item = itemOf(node)
      if (!item) return
      // 新窗口打开的菜单交给 <a target="_blank">，只收起面板
      if (item.isNewPage) {
        emit('close')
        return
      }
      // 保留 Ctrl / ⌘ / Shift / 中键 的浏览器默认行为（新标签打开），面板不收起，方便连开几页
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      keyword.value = ''
      openKeys.value = openTrailKeys(index.value, openKeys.value, item.key)
      selectedKey.value = item.key
      emit('close')
      router.push(item.path).catch(() => undefined)
    }

    provide(NavContextKey, { openKeys, activeKey, pathKeys, visibleKeys, idPrefix, hrefOf, onToggle, onLeafClick })

    return {
      title: SYSTEM_MENU_TITLE,
      nodes,
      rootLevel,
      searchRef,
      keyword,
      searchResult,
      isEmpty,
      clearSearch,
      onSearchEsc,
      setBodyRef,
      updateStuck
    }
  }
})
</script>
