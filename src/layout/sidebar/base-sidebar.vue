<template>
  <sidebar-nav
    v-if="props.mode === 'vertical'"
    :menus="state.menus"
    :activePath="props.currRoute ?? state.currRoute"
    :collapsed="!props.isMobile && state.collapseSidebar"
    :popper-class="state.popClassName"
    :router="props.router"
    :onSelect="props.onSelect"
  ></sidebar-nav>
  <el-menu
    v-else
    ref="elm"
    :default-active="props.currRoute ?? state.currRoute"
    :mode="props.mode"
    :collapse="props.isMobile ? false : props.mode === 'vertical' && state.collapseSidebar"
    :router="props.router"
    :onSelect="props.onSelect"
    :collapse-transition="false"
    class="rr-sidebar-menu"
  >
    <sidebar-menus-items
      :className="state.popClassName"
      :menus="state.menus"
      :hiddenIndex="state.hiddenIndex"
      :allow-favorites="props.router"
    ></sidebar-menus-items>
  </el-menu>
</template>
<script lang="ts">
import { EMitt, EThemeSetting } from '@/constants/enum'
import { IObject } from '@/types/interface'
import baseView from '@/layout/view/base-view.vue'
import emits from '@/utils/emits'
import { toValidRoutes } from '@/utils/router'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import { useWindowSize } from '@vueuse/core'
import { defineComponent, onMounted, provide, reactive, ref, watch } from 'vue'
import { RouteRecordRaw, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import SidebarMenusItems from './sidebar-menus-items.vue'
import SidebarNav from './sidebar-nav.vue'
import { MenuFavoritesKey, useMenuFavorites } from './menu-favorites'
import logo from '@/assets/images/logo.png'

/**
 * 侧边栏导航菜单：纵向用 sidebar-nav（固定手风琴），水平（顶部 / 混合布局顶栏）仍用 el-menu
 */
export default defineComponent({
  name: 'BaseSidebar',
  components: { SidebarMenusItems, SidebarNav },
  props: {
    mode: { type: String, default: 'vertical' },
    menus: Array,
    currRoute: String,
    router: Boolean,
    onSelect: Function,
    isMobile: Boolean
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const win = useWindowSize()
    const store = useStore()
    provide(MenuFavoritesKey, useMenuFavorites())
    const defaultMenus = toValidRoutes((props.menus ?? store.state.routes) as RouteRecordRaw[])
    const getPopClassName = () => {
      const sidebarCache = getThemeConfigCacheByKey(EThemeSetting.Sidebar)
      return `rr-sidebar-menu-pop-${props.mode === 'vertical' && sidebarCache === 'dark' ? 'dark' : 'light'}`
    }
    const state = reactive({
      collapseSidebar: getThemeConfigCacheByKey(EThemeSetting.SidebarCollapse),
      windowWidth: win.width || 800,
      hiddenIndex: -1,
      rawMenus: defaultMenus,
      menus: defaultMenus,
      popClassName: getPopClassName(),
      currRoute: props.currRoute ?? route.path
    })
    const elm = ref({} as IObject)
    const li = ref({
      widths: [] as number[]
    })
    const initComputeSidebarLayout = (width: number) => {
      if (props.mode === 'horizontal') {
        //存储水平布局元素信息
        const el = elm.value.$el
        const lis = el.querySelectorAll('li')
        li.value.widths = []
        lis.forEach((x: Element) => {
          li.value.widths.push(x.getBoundingClientRect().width)
        })
        computeSidebarLayout(width)
      }
    }

    //
    onMounted(() => {
      initComputeSidebarLayout(state.windowWidth)
    })
    watch(
      () => props.menus,
      (vl) => {
        const ms = toValidRoutes((vl ? vl : router.options.routes) as RouteRecordRaw[])
        state.menus = ms
        state.rawMenus = ms
      }
    )
    watch(
      () => store.state.routes,
      (vl) => {
        const ms = toValidRoutes(vl as RouteRecordRaw[])
        state.rawMenus = ms
        state.menus = ms
      }
    )
    emits.on(EMitt.OnSwitchLeftSidebar, () => {
      state.collapseSidebar = !state.collapseSidebar
    })
    emits.on(EMitt.OnSetTheme, ([vl]) => {
      if (vl === EThemeSetting.Sidebar) {
        state.popClassName = getPopClassName()
      }
    })
    watch(
      () => route.path,
      (vl) => {
        if (!route.query.pop) {
          setTimeout(() => {
            state.currRoute = vl
          }, 10)
        }
      }
    )
    watch(
      () => state.windowWidth,
      (vl) => {
        computeSidebarLayout(vl)
      }
    )

    const computeSidebarLayout = (windowWidth: number) => {
      if (props.mode === 'horizontal' && windowWidth > 768 && elm.value.$el) {
        //菜单水平方向菜单过长，采用折叠效果
        const width = elm.value.$el.parentNode.getBoundingClientRect().width
        let liWidth = 0
        let index = -1
        for (let i = 0; i < li.value.widths.length; i++) {
          liWidth += li.value.widths[i]
          if (liWidth > width) {
            index = i - 1
            break
          }
        }

        state.hiddenIndex = index
        state.menus =
          index > -1
            ? state.rawMenus.slice(0, index).concat({
                path: '/__more',
                component: baseView,
                meta: { title: '更多菜单', icon: false, isMore: true },
                children: state.rawMenus.slice(index)
              })
            : state.rawMenus
      }
    }

    return { elm, props, state, logo }
  }
})
</script>
