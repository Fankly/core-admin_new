<script lang="ts">
import { computed, defineComponent } from 'vue'
import { RouteLocationMatched, useRouter } from 'vue-router'
import { useStore } from 'vuex'

interface ICrumb {
  path: string
  title: string
}

/**
 * 顶部面包屑：主页 + 菜单层级；query._mt 覆盖末级标题
 * 路由是拍平注册的（registerToRouter），route.matched 只有当前页，菜单层级取 mergeServerRoute 写入的 meta.matched；
 * 刷新后路由会被同名无 meta 的动态路由覆盖，和页签一样回退到 store.state.routeToMeta
 */
export default defineComponent({
  name: 'Breadcrumb',
  setup() {
    const router = useRouter()
    const store = useStore()
    const { currentRoute } = router
    const titleOf = (x: RouteLocationMatched): string => String(x.meta?.title || store.state.routeToMeta[x.path]?.title || '')
    const firstRoute = router.options.routes[0] as RouteLocationMatched
    const home: RouteLocationMatched =
      firstRoute.children && firstRoute.children.length > 0 ? (firstRoute.children[0] as RouteLocationMatched) : firstRoute

    // 菜单内页面用菜单层级；白名单、详情等非菜单页面退回路由链
    const trailOf = (): ICrumb[] => {
      const route = currentRoute.value
      const menuTrail = (route.meta?.matched || store.state.routeToMeta[route.path]?.matched) as ICrumb[] | undefined
      if (menuTrail && menuTrail.length) return menuTrail
      return route.matched.map((x) => ({ path: x.path, title: titleOf(x) }))
    }

    const isHome = computed(() => currentRoute.value.path === home.path)
    const crumbs = computed(() => {
      if (isHome.value) return []
      // 白名单页面的路由链带着布局外壳（「工作台」），它不是菜单层级
      const titled = trailOf().filter((x) => x.title && x.path !== home.path && x.path !== firstRoute.path)
      return titled.map((x, index) => {
        const current = index === titled.length - 1
        const override = current ? currentRoute.value.query._mt : ''
        return { path: x.path, title: String(override || x.title), current }
      })
    })

    return { home, isHome, crumbs }
  }
})
</script>
<template>
  <nav class="rr-crumb" aria-label="面包屑">
    <ol class="rr-crumb__list">
      <li class="rr-crumb__item">
        <span v-if="isHome" class="rr-crumb__current" aria-current="page">主页</span>
        <router-link v-else :to="home.path" class="rr-crumb__root">
          <span class="rr-crumb__root-mark" aria-hidden="true"></span>
          主页
        </router-link>
      </li>
      <li v-for="x in crumbs" :key="x.path" class="rr-crumb__item">
        <span :class="x.current ? 'rr-crumb__current' : 'rr-crumb__link'" :aria-current="x.current ? 'page' : undefined" :title="x.title">
          {{ x.title }}
        </span>
      </li>
    </ol>
  </nav>
</template>
