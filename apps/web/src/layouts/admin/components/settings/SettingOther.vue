<template>
  <div class="ds-settings__group">
    <h3 class="ds-settings__label">标签页</h3>
    <div v-for="item in items" :key="item.key" class="ds-settings__row">
      <span>{{ item.label }}</span>
      <el-switch :model-value="Boolean(preferences.config[item.key])" :aria-label="item.label" @change="onToggle(item.key)" />
    </div>
    <div class="ds-settings__row">
      <span>标签页样式</span>
      <el-select
        :model-value="preferences.tabStyle"
        :disabled="!preferences.openTabsPage"
        aria-label="标签页样式"
        size="small"
        style="max-width: 110px"
        @change="onTabStyleChange"
      >
        <el-option v-for="item in tabStyles" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <p class="ds-settings__hint">开启标签页后，可保留并切换多个工作页面。</p>
  </div>
</template>

<script setup lang="ts">
import { EThemeSetting } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

defineOptions({ name: 'SettingOther' })

const preferences = usePreferencesStore()

const items = [{ label: '启用标签页', key: EThemeSetting.OpenTabsPage }]

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
