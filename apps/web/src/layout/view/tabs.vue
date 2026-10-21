<template>
  <div class="rr-view-tab-wrap">
    <el-tabs class="rr-view-tab" v-model="activePath" @tab-click="onTabClick" @tab-remove="onTabRemove">
      <el-tab-pane v-for="tab in tabs.tabs" :key="tab.path" :name="tab.path" :closable="!tab.affix">
        <template #label>
          <span class="rr-view-tab-label">{{ tab.title }}</span>
        </template>
      </el-tab-pane>
    </el-tabs>
    <el-dropdown trigger="click" placement="bottom-end" class="rr-view-tab-ops" @command="onCommand">
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="item in operations" :key="item.command" :icon="item.icon" :command="item.command">
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
      <span class="el-dropdown-link" role="button" aria-label="标签页操作" tabindex="0">
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </span>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, Back, Close, CircleClose, Right } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import type { TabPaneName, TabsPaneContext } from 'element-plus'
import { useTabsStore } from '@/store'

defineOptions({ name: 'Tabs' })

const router = useRouter()
const tabs = useTabsStore()

const activePath = computed({
  get: () => tabs.activePath,
  set: (path: string) => tabs.activate(path)
})

const operations = [
  { label: '关闭当前标签页', command: 'closeCurrent', icon: Close },
  { label: '关闭其他标签页', command: 'closeOthers', icon: Close },
  { label: '关闭左侧标签页', command: 'closeLeft', icon: Back },
  { label: '关闭右侧标签页', command: 'closeRight', icon: Right },
  { label: '关闭全部标签页', command: 'closeAll', icon: CircleClose }
]

const navigate = (path?: string) => {
  if (path && path !== router.currentRoute.value.fullPath) void router.push(path)
}

const onTabClick = (pane: TabsPaneContext) => {
  const path = pane.paneName
  if (typeof path === 'string') navigate(path)
}

const onTabRemove = (name: TabPaneName) => {
  if (typeof name !== 'string') return
  navigate(tabs.closeTab(name))
}

const onCommand = (command: string) => {
  switch (command) {
    case 'closeCurrent':
      navigate(tabs.closeCurrent())
      break
    case 'closeOthers':
      tabs.closeOthers()
      break
    case 'closeLeft':
      tabs.closeLeft()
      break
    case 'closeRight':
      tabs.closeRight()
      break
    case 'closeAll':
      navigate(tabs.closeAll())
      break
  }
}
</script>

<style scoped lang="less">
.rr-view-tab-label {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}
</style>
