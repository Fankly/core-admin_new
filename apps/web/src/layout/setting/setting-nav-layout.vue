<template>
  <el-space direction="vertical" :size="15" alignment="flex-start" class="rr-theme">
    <span class="rr-setting-title text-2">布局模式</span>
    <el-space>
      <el-tooltip v-for="item in layouts" :key="item.value" effect="dark" :content="item.label" placement="top">
        <span
          :class="`card navlayout ${layoutToTheme[item.value]} ${preferences.navLayout === item.value ? 'active' : ''}`"
          @click="preferences.setNavLayout(item.value)"
        />
      </el-tooltip>
    </el-space>
    <el-space class="rr-switch">
      <span>内容区域铺满</span>
      <el-switch :model-value="contentFull" @change="onToggleContentFull" />
    </el-space>
  </el-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

/** 导航模式设置 */
defineOptions({ name: 'SettingNavLayout' })

const preferences = usePreferencesStore()

const layouts = [
  { label: '左侧菜单布局', value: ESidebarLayoutEnum.Left },
  { label: '顶部菜单布局', value: ESidebarLayoutEnum.Top },
  { label: '混合菜单布局', value: ESidebarLayoutEnum.Mix }
]
const layoutToTheme: Record<string, string> = {
  left: 'side dark',
  top: 'header dark',
  mix: 'header dark mix'
}
const contentFull = computed(() => Boolean(preferences.config[EThemeSetting.ContentFull]))

const onToggleContentFull = () => {
  preferences.set(EThemeSetting.ContentFull, !contentFull.value)
}
</script>
