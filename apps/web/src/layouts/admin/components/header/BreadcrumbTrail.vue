<template>
  <nav class="ds-breadcrumb" aria-label="面包屑">
    <ol class="ds-breadcrumb__list">
      <li class="ds-breadcrumb__item">
        <router-link v-if="!isHome" to="/home" class="ds-breadcrumb__root">
          <span class="ds-breadcrumb__root-mark" aria-hidden="true"></span>
          工作台
        </router-link>
        <span v-else class="ds-breadcrumb__current" aria-current="page">工作台</span>
      </li>
      <li v-for="item in crumbs" :key="`${item.path}-${item.title}`" class="ds-breadcrumb__item">
        <router-link v-if="item.path && !item.current" :to="item.path" class="ds-breadcrumb__link" :title="item.title">
          {{ item.title }}
        </router-link>
        <span v-else class="ds-breadcrumb__current" :aria-current="item.current ? 'page' : undefined" :title="item.title">
          {{ item.title }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'BreadcrumbTrail' })

const route = useRoute()

const isHome = computed(() => route.path === '/home' || route.path === '/baseHome')

const crumbs = computed(() => {
  const titles = new Set<string>()
  return route.matched
    .filter((record) => {
      const title = typeof record.meta.title === 'string' ? record.meta.title : ''
      if (!title || record.path === '/' || record.path === '/home' || record.path === '/baseHome') return false
      const key = `${record.path}:${title}`
      if (titles.has(key)) return false
      titles.add(key)
      return true
    })
    .map((record, index, list) => ({
      path: record.path,
      title: String(record.meta.title),
      current: index === list.length - 1
    }))
})
</script>

<style scoped>
.ds-breadcrumb__root-mark {
  width: 4px;
  height: 4px;
  background: var(--ds-jade-500);
  border-radius: 50%;
}
</style>
