<template>
  <el-space direction="vertical" alignment="flex-start" class="rr-theme">
    <el-space>
      <el-tooltip v-for="item in sidebar" :key="item.value" effect="dark" :content="item.label" placement="top">
        <!-- el-tooltip 是多节点组件，class/style 不会透传到触发元素，预览样式必须挂在 span 上 -->
        <span
          :class="`card side ${item.value} ${active.sidebar === item.value ? 'active' : ''}`"
          @click="onSetTheme(EThemeSetting.Sidebar, 'sidebar', item.value)"
        />
      </el-tooltip>
    </el-space>
    <el-space>
      <el-tooltip v-for="item in header" :key="item.value" effect="dark" :content="item.label" placement="top">
        <span
          :class="`card header ${item.value} ${active.header === item.value ? 'active' : ''}`"
          @click="onSetTheme(EThemeSetting.TopHeader, 'header', item.value)"
        />
      </el-tooltip>
    </el-space>
    <el-space :size="2" style="flex-wrap: wrap">
      <el-tooltip v-for="item in colors" :key="item.value" effect="dark" :content="item.label" placement="top">
        <span
          :class="`color ${active.color === item.value ? 'active' : ''}`"
          :style="`background-color: ${item.value}`"
          @click="onSetTheme(EThemeSetting.ThemeColor, 'color', item.value)"
        />
      </el-tooltip>
    </el-space>
  </el-space>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { EThemeSetting } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

/** 主题设置 */
defineOptions({ name: 'SettingTheme' })

const preferences = usePreferencesStore()

const sidebar = [
  { label: '暗色侧边栏', value: 'dark' },
  { label: '亮色侧边栏', value: 'light' }
]
const header = [
  { label: '亮色顶栏', value: 'light' },
  { label: '暗色顶栏', value: 'dark' },
  { label: '主题色顶栏', value: 'primary' }
]
const colors = [
  { label: '拂晓蓝', value: '#409eff' },
  { label: '青色', value: '#0BB2D4' },
  { label: '蓝色', value: '#3E8EF7' },
  { label: '绿色', value: '#11C26D' },
  { label: '蓝绿色', value: '#17B3A3' },
  { label: '靛青色', value: '#667AFA' },
  { label: '棕色', value: '#997B71' },
  { label: '紫色', value: '#9463F7' },
  { label: '灰色', value: '#757575' },
  { label: '橙色', value: '#EB6709' },
  { label: '混红色', value: '#F74584' },
  { label: '黄色', value: '#FCB900' },
  { label: '红色', value: '#FF4C52' },
  { label: '暗黑', value: '#141414' },
  { label: '深绿色', value: '#00706b' },
  { label: '深蓝色', value: '#007cba' }
]

const active = reactive({
  sidebar: String(preferences.config[EThemeSetting.Sidebar]),
  header: String(preferences.config[EThemeSetting.TopHeader]),
  color: String(preferences.config[EThemeSetting.ThemeColor])
})

const onSetTheme = (key: EThemeSetting, type: keyof typeof active, value: string) => {
  active[type] = value
  preferences.set(key, value)
}
</script>
