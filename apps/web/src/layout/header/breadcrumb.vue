<template>
  <el-breadcrumb separator="/" style="padding-top: 4px">
    <el-breadcrumb-item :to="{ path: home.path }">
      {{ '主页' }}
    </el-breadcrumb-item>
    <el-breadcrumb-item v-for="x in breadcrumbs" :key="x.path">{{ currentRoute.query._mt || x.meta.title || '' }} </el-breadcrumb-item>
  </el-breadcrumb>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, type RouteLocationMatched } from 'vue-router'

/**
 * 顶部面包屑
 */
defineOptions({ name: 'Breadcrumb' })

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
</script>
