<template>
  <div ref="rootRef" class="ds-nav" :class="[`ds-nav--${props.mode}`, { 'is-collapsed': isCollapsed }]">
    <div v-if="showTools" class="ds-nav__tools">
      <label class="ds-nav__search">
        <Search :size="14" aria-hidden="true" />
        <input
          ref="searchRef"
          :value="keyword"
          type="search"
          placeholder="搜索菜单"
          autocomplete="off"
          aria-label="搜索菜单"
          @input="onSearchInput"
          @keydown.esc="onSearchEsc"
        />
        <kbd aria-hidden="true">/</kbd>
      </label>
      <button
        class="ds-nav__tool"
        :class="{ 'is-active': favoritesOnly }"
        type="button"
        :title="favoritesOnly ? '显示全部菜单' : '只看收藏'"
        aria-label="只看收藏"
        :aria-pressed="favoritesOnly"
        @click="toggleFavoritesOnly"
      >
        <Star :size="14" aria-hidden="true" />
      </button>
      <button class="ds-nav__tool" type="button" title="收起全部菜单" aria-label="收起全部菜单" @click="collapseAll">
        <ChevronsDownUp :size="14" aria-hidden="true" />
      </button>
    </div>

    <el-menu
      ref="menuRef"
      :default-active="props.currRoute ?? state.currRoute"
      :mode="props.mode"
      :collapse="isCollapsed"
      :router="props.router"
      @select="props.onSelect"
      :collapse-transition="false"
      :unique-opened="!isFiltering"
      :ellipsis="false"
      class="ds-nav__menu"
    >
      <NavMenuTree :class-name="popClassName" :menus="visibleMenus" :level-icons="!isHorizontal" />
    </el-menu>
    <div v-if="!visibleMenus.length && !isCollapsed" class="ds-nav__empty">
      <Star v-if="isFavoritesEmpty" :size="28" aria-hidden="true" />
      <Search v-else :size="28" aria-hidden="true" />
      <strong>{{ emptyTitle }}</strong>
      <span>{{ emptyHint }}</span>
    </div>

    <div v-if="!isHorizontal && !isCollapsed" class="ds-nav__footer">
      <span class="ds-nav__version">v{{ app.version }}</span>
      <span class="ds-nav__footer-mark">过程管控</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, type RouteRecordRaw } from 'vue-router'
import { useResizeObserver } from '@vueuse/core'
import { ChevronsDownUp, Search, Star } from '@lucide/vue'
import { EThemeSetting } from '@/constants/enum'
import { useFavoritesStore, useMenuStore, usePreferencesStore } from '@/store'
import { toValidRoutes } from '@/utils/router'
import app from '@/constants/app'
import NavMenuTree from './NavMenuTree.vue'

defineOptions({ name: 'SideNav' })

interface Props {
  mode?: 'vertical' | 'horizontal'
  menus?: RouteRecordRaw[]
  currRoute?: string
  router?: boolean
  onSelect?: (index: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vertical',
  menus: undefined,
  currRoute: undefined,
  router: false,
  onSelect: undefined
})

const MenuMore = defineComponent({
  name: 'MenuMore',
  render: () => null
})

const route = useRoute()
const menu = useMenuStore()
const preferences = usePreferencesStore()

const isHorizontal = computed(() => props.mode === 'horizontal')
const isCollapsed = computed(() => !isHorizontal.value && preferences.sidebarCollapse)
const popClassName = computed(() => {
  const sidebarTheme = preferences.config[EThemeSetting.Sidebar]
  // 纵向侧栏收起时的悬停菜单：额外打一个 rail 标记，让它复用展开态的行几何与层级图标；
  // 顶部 / 混合布局的横排下拉保持既有的紧凑版式。
  const mode = isHorizontal.value ? '' : ' ds-nav-pop-rail'
  return `ds-nav-pop-${sidebarTheme === 'dark' ? 'dark' : 'light'}${mode}`
})

const state = reactive({
  rawMenus: [] as RouteRecordRaw[],
  menus: [] as RouteRecordRaw[],
  currRoute: route.path,
  keyword: '',
  favoritesOnly: false
})

interface MenuHandle {
  $el?: HTMLElement
  open: (index: string) => void
  close: (index: string) => void
}

const menuRef = ref<MenuHandle | null>(null)
const widths = ref<number[]>([])
const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const sourceMenus = computed(() => {
  const source = props.menus === undefined ? menu.routes : props.menus
  return toValidRoutes(source)
})

const buildOverflowMenus = () => {
  if (!isHorizontal.value || !menuRef.value?.$el) {
    state.menus = state.rawMenus
    return
  }

  const root = menuRef.value.$el
  const available = (root.parentElement?.getBoundingClientRect().width ?? 0) - 24
  if (!available || widths.value.length === 0) {
    state.menus = state.rawMenus
    return
  }

  if (widths.value.reduce((total, width) => total + width, 0) <= available) {
    state.menus = state.rawMenus
    return
  }

  let used = 0
  let lastVisibleIndex = -1
  for (let index = 0; index < widths.value.length; index++) {
    used += widths.value[index]
    if (used > available - 104) break
    lastVisibleIndex = index
  }

  if (lastVisibleIndex >= state.rawMenus.length - 1) {
    state.menus = state.rawMenus
    return
  }

  const visible = state.rawMenus.slice(0, lastVisibleIndex + 1)
  const overflow = state.rawMenus.slice(lastVisibleIndex + 1)
  state.menus = [
    ...visible,
    {
      path: '/__more',
      component: MenuMore,
      meta: { title: '更多', icon: false, isMore: true },
      children: overflow
    }
  ]
}

/* --------------------------------------------------------------------------
   搜索 / 只看收藏 / 收起全部：与参考 `sidebar-nav.vue` 的工具栏同语义。
   过滤只作用于渲染树，不改动 store 里的菜单；命中叶子时自动展开其祖先路径。
   -------------------------------------------------------------------------- */
const favorites = useFavoritesStore()

const showTools = computed(() => !isHorizontal.value && !isCollapsed.value)
const keyword = computed(() => state.keyword)
const favoritesOnly = computed(() => state.favoritesOnly)
const isFiltering = computed(() => Boolean(state.keyword.trim()) || state.favoritesOnly)
// 与参考 `rr-nav__empty` 同语义：星标对应用户还没有收藏，放大镜对应关键词没命中
const isFavoritesEmpty = computed(() => favoritesOnly.value && !keyword.value.trim())
const emptyTitle = computed(() => {
  if (isFavoritesEmpty.value) return '暂无收藏菜单'
  if (isFiltering.value) return '未找到相关菜单'
  return '当前账号暂无可用模块'
})
const emptyHint = computed(() => {
  if (isFavoritesEmpty.value) return '点击上方星标查看全部菜单，再点击菜单旁的星标收藏'
  if (isFiltering.value) return '请更换关键词，或按 Esc 清空'
  return '请联系管理员分配模块权限'
})

const isFavoriteNode = (node: RouteRecordRaw): boolean => {
  const id = node.meta?.id
  return favorites.isFavorite(typeof id === 'string' ? id : '', Boolean(node.meta?.isFavorite))
}

/**
 * 返回过滤后的渲染树和需要自动展开的分组路径。
 * 命中叶子 → 保留命中项与其祖先；分组标题命中且子级没有命中 → 只保留分组自身，
 * 子级原样留着等用户手动展开（与参考的 expandableGroups 一致）。
 */
const filterMenus = (items: RouteRecordRaw[]): { menus: RouteRecordRaw[]; open: string[] } => {
  const term = state.keyword.trim().toLocaleLowerCase()
  const open: string[] = []
  const walk = (nodes: RouteRecordRaw[], ancestors: string[]): RouteRecordRaw[] => {
    const result: RouteRecordRaw[] = []
    for (const node of nodes) {
      const rawTitle = node.meta?.title
      const title = (typeof rawTitle === 'string' ? rawTitle : '').toLocaleLowerCase()
      const selfMatched = Boolean(term) && title.includes(term)
      const children = node.children ?? []
      if (!children.length) {
        const hit = (selfMatched || !term) && (!state.favoritesOnly || isFavoriteNode(node))
        if (hit) {
          result.push(node)
          ancestors.forEach((path) => open.push(path))
        }
        continue
      }
      const matchedChildren = walk(children, [...ancestors, node.path])
      const childHit = matchedChildren.length > 0
      // 收藏模式下分组标题不单独命中，否则会带出未收藏的下级
      const hit = childHit || (selfMatched && !state.favoritesOnly)
      if (!hit) continue
      result.push(childHit ? { ...node, children: matchedChildren } : node)
      ancestors.forEach((path) => open.push(path))
      if (childHit) open.push(node.path)
    }
    return result
  }
  return { menus: walk(items, []), open: [...new Set(open)] }
}

const filtered = computed(() => (isFiltering.value ? filterMenus(state.menus) : { menus: state.menus, open: [] as string[] }))
const visibleMenus = computed(() => filtered.value.menus)

/** 收集当前渲染树里存在的分组路径，避免对已卸载的 sub-menu 调 open/close。 */
const groupPathsOf = (items: RouteRecordRaw[], result: string[] = []): string[] => {
  for (const item of items) {
    if (!item.children?.length) continue
    result.push(item.path)
    groupPathsOf(item.children, result)
  }
  return result
}

// 收起态 / 树重绘期间 el-menu 内部可能还没注册对应的 sub-menu，调用会抛错，这里只对已渲染的分组操作
const callMenu = (method: 'open' | 'close', path: string) => {
  try {
    menuRef.value?.[method](path)
  } catch {
    // 分组不在当前渲染树里就跳过，不影响其余路径
  }
}

const openGroups = (paths: string[]) => {
  const available = new Set(groupPathsOf(visibleMenus.value))
  paths.forEach((path) => {
    if (!available.has(path)) return
    callMenu('open', path)
  })
}

/**
 * 退出过滤的那一帧里分组组件可能还没挂载，`open()` 会被 el-menu 静默丢弃。
 * 逐帧重试直到目标分组真的展开（最多 4 帧），避免"退出搜索后展开状态丢失"。
 */
const openedPathSet = (): Set<string> =>
  new Set(
    [...(rootRef.value?.querySelectorAll<HTMLElement>('.ds-nav__menu .el-sub-menu.is-opened') ?? [])].map((element) => element.dataset.navPath ?? '')
  )

const openedFromDom = (): string[] => [...openedPathSet()]

const openGroupsWhenReady = (paths: string[], attempt = 0) => {
  openGroups(paths)
  if (attempt >= 4) return
  const opened = openedPathSet()
  if (paths.every((path) => opened.has(path))) return
  requestAnimationFrame(() => {
    openGroupsWhenReady(paths, attempt + 1)
  })
}

const closeAllGroups = () => {
  groupPathsOf(visibleMenus.value).forEach((path) => {
    callMenu('close', path)
  })
}

/** 当前路由在完整菜单里的祖先路径；找不到返回 null（空数组是命中，不能当"没找到"）。 */
const trailOf = (items: RouteRecordRaw[], path: string, trail: string[] = []): string[] | null => {
  for (const item of items) {
    if (item.path === path) return trail
    const children = item.children
    if (children?.length) {
      const found = trailOf(children, path, [...trail, item.path])
      if (found) return found
    }
  }
  return null
}

// 展开状态由 el-menu 自己持有：进入过滤时从 DOM 拍一份快照，退出时按它还原（参考的 openKeysBeforeSearch）
let restorePaths: string[] | null = null

// 过滤结果变化后展开命中路径：同一分支内多次 open 会互相挤掉，所以过滤期间关掉手风琴互斥。
// 延后的这次展开必须用「当前」过滤结果并校验仍在过滤态：否则退出过滤后，上一帧排队的
// 展开会盖掉刚还原的快照。
let filterToken = 0
watch(
  () => filtered.value,
  () => {
    filterToken += 1
    if (!isFiltering.value) return
    const token = filterToken
    void nextTick(() => {
      if (token !== filterToken || !isFiltering.value) return
      openGroups(filtered.value.open)
      scrollSearchHitIntoView()
    })
  },
  { flush: 'post' }
)

watch(isFiltering, (filtering) => {
  if (filtering) {
    restorePaths = openedFromDom()
    return
  }
  const restore = restorePaths ?? trailOf(state.menus, props.currRoute ?? state.currRoute) ?? []
  restorePaths = null
  void nextTick(() => {
    closeAllGroups()
    openGroupsWhenReady(restore)
  })
})

const scrollSearchHitIntoView = () => {
  const row = rootRef.value?.querySelector<HTMLElement>('.ds-nav__menu .el-menu-item.is-active')
  row?.scrollIntoView({ block: 'nearest' })
}

const onSearchInput = (event: Event) => {
  state.keyword = (event.target as HTMLInputElement).value
}

const onSearchEsc = () => {
  state.keyword = ''
  searchRef.value?.blur()
}

const toggleFavoritesOnly = () => {
  state.favoritesOnly = !state.favoritesOnly
  // 收藏列表按账号加载一次；未拿到服务端数据时过滤只能依赖菜单下发的 isFavorite
  if (state.favoritesOnly) void favorites.reload()
}

const collapseAll = () => {
  state.keyword = ''
  closeAllGroups()
}

// 「/」聚焦搜索：只在焦点空闲或已在侧栏内时接管，不抢表格 / 编辑器的输入
const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
  const input = searchRef.value
  if (!input || isCollapsed.value || !input.offsetParent) return
  const active = document.activeElement
  const idle = !active || active === document.body || (Boolean(rootRef.value?.contains(active)) && active !== input)
  if (!idle) return
  event.preventDefault()
  input.focus()
}

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
})

const measureMenuWidths = () => {
  if (!isHorizontal.value || !menuRef.value?.$el) return
  const list = menuRef.value.$el.querySelectorAll<HTMLElement>(':scope > .el-menu-item, :scope > .el-sub-menu')
  widths.value = Array.from(list, (item) => item.getBoundingClientRect().width)
  buildOverflowMenus()
}

const refreshMenus = (next: RouteRecordRaw[]) => {
  state.rawMenus = next
  state.menus = next
  void nextTick(measureMenuWidths)
}

watch(
  sourceMenus,
  (next) => {
    refreshMenus(next)
  },
  { immediate: true, deep: false }
)

watch(
  () => props.menus,
  () => {
    refreshMenus(sourceMenus.value)
  }
)

watch(
  () => route.path,
  (path) => {
    if (!route.query.pop) state.currRoute = path
  }
)

useResizeObserver(
  () => menuRef.value?.$el?.parentElement,
  () => {
    if (!isHorizontal.value) return
    // 窗口或侧栏宽度变化后，恢复完整菜单再计算“更多”。
    state.menus = state.rawMenus
    void nextTick(measureMenuWidths)
  }
)

onMounted(() => {
  void nextTick(measureMenuWidths)
})
</script>
