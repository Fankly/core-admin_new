<template>
  <div class="ds-settings__group">
    <span class="ds-settings__label">交互偏好</span>
    <div v-for="item in items" :key="item.key" class="ds-settings__row">
      <span>{{ item.label }}</span>
      <el-switch :model-value="Boolean(preferences.config[item.key])" @change="onToggle(item.key)" />
    </div>
    <div class="ds-settings__row">
      <span>标签页样式</span>
      <el-select :model-value="preferences.tabStyle" size="small" style="max-width: 92px" @change="onTabStyleChange">
        <el-option v-for="item in tabStyles" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EThemeSetting } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

defineOptions({ name: 'SettingOther' })

const preferences = usePreferencesStore()

const items = [
  { label: '固定 Logo 栏', key: EThemeSetting.LogoAuto },
  { label: '彩色导航图标', key: EThemeSetting.ColorIcon },
  { label: '导航排他展开', key: EThemeSetting.SidebarUniOpened },
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
