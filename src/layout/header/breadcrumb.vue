<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { RouteLocationMatched, useRouter } from 'vue-router'

/**
 * 顶部面包屑
 */
export default defineComponent({
  name: 'Breadcrumb',
  setup() {
    const router = useRouter()
    const breadcrumbs = ref<RouteLocationMatched[]>([])
    const { currentRoute } = router
    const firstRoute = router.options.routes[0] as RouteLocationMatched
    const home: RouteLocationMatched =
      firstRoute.children && firstRoute.children.length > 0 ? (firstRoute.children[0] as RouteLocationMatched) : firstRoute
    watch(
      () => currentRoute.value,
      () => {
        breadcrumbs.value = currentRoute.value.path !== home.path ? currentRoute.value.matched : []
      }
    )

    return { breadcrumbs, currentRoute, home }
  }
})
</script>
<template>
  <el-breadcrumb separator="/" style="padding-top: 4px">
    <el-breadcrumb-item :to="{ path: home.path }">
      {{ '主页' }}
    </el-breadcrumb-item>
    <el-breadcrumb-item v-for="x in breadcrumbs" :key="x.path">{{ currentRoute.query._mt || x.meta.title || '' }} </el-breadcrumb-item>
  </el-breadcrumb>
</template>
