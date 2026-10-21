<template>
  <el-space direction="vertical" :size="15" alignment="flex-start" class="rr-theme">
    <span class="rr-setting-title text-2">{{ '布局模式' }}</span>
    <el-space>
      <el-tooltip v-for="x in layout" :key="x.value" effect="dark" :content="x.label" placement="top">
        <span
          :class="`card navlayout ${layoutToTheme[x.value]} ${state.active.layout === x.value ? 'active' : ''}`"
          @click="onSetTheme('layout', EThemeSetting.NavLayout, x.value)"
        ></span>
      </el-tooltip>
    </el-space>
    <el-space class="rr-switch">
      <span>{{ '内容区域铺满' }}</span>
      <el-switch :model-value="state.active.full" @change="onSetContentFull"></el-switch>
    </el-space>
  </el-space>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import { EMitt, ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import type { IObject } from '@/types/interface'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'

/**
 * 导航模式设置
 */
defineOptions({ name: 'SettingNavLayout' })

interface Props {
  value?: IObject
  onChange?: (key: EThemeSetting, value: string | boolean | number) => void
}
const props = defineProps<Props>()

const layout = [
  { label: '左侧菜单布局', value: ESidebarLayoutEnum.Left },
  { label: '顶部菜单布局', value: ESidebarLayoutEnum.Top },
  { label: '混合菜单布局', value: ESidebarLayoutEnum.Mix }
]
const layoutToTheme: IObject<string> = {
  left: 'side dark',
  top: 'header dark',
  mix: 'header dark mix'
}
const state = reactive<IObject>({
  active: {
    layout: getThemeConfigCacheByKey(EThemeSetting.NavLayout, props.value),
    full: getThemeConfigCacheByKey(EThemeSetting.ContentFull, props.value)
  },
  themeClass: {}
})
// 只被布局模式那一组 tooltip 调用，value 必然是 ESidebarLayoutEnum
const onSetTheme = (type: string, key: EThemeSetting, value: ESidebarLayoutEnum) => {
  onSet(type, key, value)
  emits.emit(EMitt.OnSetNavLayout, value)
}
const onSet = (type: string, key: EThemeSetting, value: string | boolean) => {
  state.active[type] = value
  state.themeClass[key] = value
  emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`])
  props.onChange && props.onChange(key, value)
}
const onSetContentFull = () => {
  onSet('full', EThemeSetting.ContentFull, !state.active.full)
}
</script>
