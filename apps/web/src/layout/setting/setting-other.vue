<template>
  <el-space direction="vertical" alignment="flex-start" :size="30" class="rr-other">
    <span class="rr-setting-title text-2">其他配置</span>
    <el-space v-for="item in items" :key="item.key" class="rr-switch">
      <span>{{ item.label }}</span>
      <el-switch :model-value="Boolean(preferences.config[item.key])" @change="onToggle(item.key)" />
    </el-space>
    <el-space class="rr-switch">
      <span>标签显示风格</span>
      <el-select :model-value="preferences.tabStyle" placeholder="选择标签风格" size="small" style="max-width: 80px" @change="onTabStyleChange">
        <el-option v-for="item in tabStyles" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-space>
  </el-space>
</template>

<script setup lang="ts">
import { EThemeSetting } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

/** 其他设置 */
defineOptions({ name: 'SettingOther' })

const preferences = usePreferencesStore()

const items = [
  { label: '固定Logo栏', key: EThemeSetting.LogoAuto },
  { label: '侧栏彩色图标', key: EThemeSetting.ColorIcon },
  { label: '侧栏排他展开', key: EThemeSetting.SidebarUniOpened },
  { label: '启用标签页', key: EThemeSetting.OpenTabsPage }
]
const tabStyles = [
  { label: '默认', value: 'default' },
  { label: '圆点', value: 'dot' },
  { label: '卡片', value: 'card' }
]

const onToggle = (key: EThemeSetting) => {
  preferences.set(key, !preferences.config[key])
}

const onTabStyleChange = (value: string) => {
  preferences.set(EThemeSetting.TabStyle, value)
}
</script>
