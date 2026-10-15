<template>
  <div class="rr-view-tab-wrap">
    <el-tabs class="rr-view-tab" v-model="activeTabName" @tab-click="onTabClick" @tab-remove="onTabRemove">
      <el-tab-pane :name="'/home'" :closable="false">
        <template #label>
          {{ '主页' }}
        </template>
      </el-tab-pane>
      <el-tab-pane :name="'/workflow/todoTasks'" :closable="false">
        <template #label>
          {{ '待办事宜' }}
        </template>
      </el-tab-pane>

      <template v-for="x in tabs.slice(1)" :key="x.value">
        <el-tab-pane
          :label="x.label"
          :name="x.value"
          :closable="true"
          v-if="activeTabName == x.value && x.label != '登录' && x.label != '待办事宜'"
        ></el-tab-pane>
        <el-tab-pane
          :label="x.label"
          :name="x.value"
          :closable="false"
          v-if="activeTabName != x.value && x.label != '登录' && x.label != '待办事宜'"
        ></el-tab-pane>
      </template>
    </el-tabs>
    <el-dropdown trigger="click" placement="bottom-end" class="rr-view-tab-ops" @command="onClose">
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="x in ops" :key="x.value" :icon="x.icon" :command="x.value">
            {{ x.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
      <span class="el-dropdown-link">
        <i class="el-icon-arrow-down el-icon--right"></i>
      </span>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { findIndex } from 'lodash'
import { ElMessage } from 'element-plus'
import type { TabsPaneContext, TabPaneName } from 'element-plus'
import { useRouter, type RouteLocationMatched } from 'vue-router'
import { useAppStore } from '@/store'
import { EMitt } from '@/constants/enum'
import type { IObject } from '@/types/interface'
import emits from '@/utils/emits'
import { arrayToObject } from '@/utils/utils'

defineOptions({ name: 'Tabs' })

interface Props {
  tabs?: IObject[]
  activeTabName?: string
}
const props = defineProps<Props>()

const ops = [
  { label: '关闭当前标签页', value: 5, icon: 'el-icon-close' },
  { label: '关闭其他标签页', value: 1, icon: 'el-icon-close' },
  { label: '关闭全部标签页', value: 4, icon: 'el-icon-circle-close' }
]
const router = useRouter()
const store = useAppStore()

const firstRoute = (router.options.routes[0] || {}) as RouteLocationMatched
const home: RouteLocationMatched =
  firstRoute.children && firstRoute.children.length > 0 ? (firstRoute.children[0] as RouteLocationMatched) : firstRoute
const defaultTab = { label: '', value: home.path }

// tabs/activeTabName 只在初始化时读取 props，之后由内部事件驱动（保持原行为）
const activeTabName = ref<string>(props.activeTabName || defaultTab.value)
const tabs = ref<IObject[]>(props.tabs && props.tabs.length ? props.tabs : [defaultTab])

watch(
  () => tabs.value,
  (res) => {
    store.updateState({ tabs: res })
  },
  { deep: true }
)

const onTabClick = (tab: TabsPaneContext) => {
  tab.props.name && router.push(tab.props.name as string)
}
const onTabRemove = (targetName: TabPaneName) => {
  const index = findIndex(tabs.value, (x: any) => x.value === targetName)
  if (tabs.value.length > 1) {
    updateClosedTabs([...store.closedTabs, targetName], false)
    if (activeTabName.value === targetName) {
      const toIndex = index === 0 ? index + 1 : index - 1
      activeTabName.value = tabs.value[toIndex].value
      router.push(activeTabName.value)
    }
    tabs.value.splice(index, 1)
    store.remove(targetName as string)
  } else {
    ElMessage({ type: 'error', message: '只剩下一个标签页，不支持关闭', offset: 0 })
  }
}
const updateClosedTabs = (closedTabs: any[], isTransform = true) => {
  if (isTransform) {
    closedTabs = closedTabs.map((x) => x.value)
  }
  store.updateState({ closedTabs })
}
const onClose = (value: number) => {
  let index: number
  const rawTabs = tabs.value
  switch (value) {
    case 1:
      //其他
      tabs.value = tabs.value.filter((x: any) => [home.path, activeTabName.value].includes(x.value))
      store.setTabs(tabs.value)
      store.clear()
      store.add(activeTabName.value)
      updateClosedTabs(rawTabs.filter((x: any) => ![home.path, activeTabName.value].includes(x.value)))
      break
    case 2:
      //右侧
      index = findIndex(tabs.value, (x: any) => x.value === activeTabName.value)
      tabs.value.splice(index + 1, tabs.value.length - (index + 1))
      store.setTabs(tabs.value)
      updateClosedTabs(rawTabs.slice(index + 1))
      break
    case 3:
      //左侧
      index = findIndex(tabs.value, (x: any) => x.value === activeTabName.value)
      tabs.value.splice(1, index - 1)
      store.setTabs(tabs.value)
      updateClosedTabs(rawTabs.slice(1, index - 1))
      break
    case 4:
      //全部
      tabs.value = [defaultTab]
      activeTabName.value = defaultTab.value
      store.clear()
      store.setTabs([defaultTab])
      updateClosedTabs(rawTabs)
      router.push(activeTabName.value)
      break
    case 5:
      //当前
      if (activeTabName.value !== defaultTab.value) {
        updateClosedTabs([...store.closedTabs, activeTabName.value], false)
        index = findIndex(tabs.value, (x: any) => x.value === activeTabName.value)
        tabs.value.splice(index, 1)
        activeTabName.value = tabs.value[tabs.value.length - 1].value
        store.setTabs(tabs.value)
        router.push(activeTabName.value)
      }
      break
    default:
      break
  }
}

emits.on(EMitt.OnPushMenuToTabs, (route) => {
  const path: string = route.value
  if (path.includes('/error')) {
    return
  }
  const tabKeys: IObject<number> = arrayToObject(tabs.value, 'value', () => 1)
  if (!tabKeys[path]) {
    tabs.value.push(route)
  }
  if (activeTabName.value !== path) {
    activeTabName.value = path
  }
  store.add(path)
})
emits.on(EMitt.OnCloseCurrTab, () => {
  onClose(5)
})
</script>
