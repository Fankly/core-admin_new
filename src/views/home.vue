<template>
  <component :is="comp" />
</template>

<script setup lang="ts" name="/home">
import { useAppStore } from '@/store'
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { getSysRouteMap } from '@/router'
import { toSysViewComponentPath } from '@/router'
import { getMenuMessage } from '@/api/process'
import emits from '@/utils/emits'

const store = useAppStore()

const path = ref<string>('/baseHome')
const comp = ref<any>(null)
// 映射表
const componentMap = ref<Map<string, any>>(new Map())

const initComponentMap = () => {
  try {
    const sysRouteMap = getSysRouteMap()
    const route = store.routeToMeta
    for (const key in route) {
      const component = sysRouteMap[toSysViewComponentPath(key)]
      if (component) {
        componentMap.value.set(key, component)
      }
    }
  } finally {
    setPath()
  }
}

const setPath = async () => {
  const res = await getMenuMessage('/home')
  try {
    if (!res.success) throw new Error(res.msg)
    if (!res.data) throw new Error('未设置主页')
    path.value = res.data.url
    if (componentMap.value.has(path.value)) comp.value = defineAsyncComponent(componentMap.value.get(path.value))
    else comp.value = defineAsyncComponent(componentMap.value.get('/baseHome'))
  } catch (error) {
    comp.value = defineAsyncComponent(componentMap.value.get('/baseHome'))
  }
}

const setComponent = (isMainPageRole: boolean) => {
  if (!isMainPageRole) comp.value = defineAsyncComponent(componentMap.value.get('/baseHome'))
  else setPath()
}

// 防止没有用户选择的权限
emits.on('isMainPageRole', (isMainPageRole) => setComponent(isMainPageRole))

onMounted(() => {
  initComponentMap()
})
</script>

<style scoped></style>
