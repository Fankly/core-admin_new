<script lang="ts">
import { EMitt, EThemeColor, EThemeSetting } from '@/constants/enum'
import { IObject } from '@/types/interface'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey, setThemeColor, updateTheme } from '@/utils/theme'
import { defineComponent, reactive } from 'vue'

/**
 * 主题设置
 */
export default defineComponent({
  name: 'SettingTheme',
  props: { value: Object, onChange: Function },
  setup(props) {
    const sidebar = [
      { label: '暗色侧边栏', value: 'dark' },
      { label: '亮色侧边栏', value: 'light' }
    ]
    const header = [
      { label: '暗色顶栏', value: 'light' },
      { label: '亮色顶栏', value: 'dark' },
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
      {
        label: '暗黑',
        value: '#141414'
      },
      { label: '深绿色', value: '#00706b' },
      { label: '深蓝色', value: '#007cba' }
    ]
    const state = reactive({
      themeClass: {} as IObject<string>,
      active: {
        sidebar: getThemeConfigCacheByKey(EThemeSetting.Sidebar, props.value),
        header: getThemeConfigCacheByKey(EThemeSetting.TopHeader, props.value),
        color: getThemeConfigCacheByKey(EThemeSetting.ThemeColor, props.value)
      } as IObject<string>
    })
    const onSetTheme = (key: EThemeSetting, type: string, value: string) => {
      if (key === EThemeSetting.ThemeColor) {
        setThemeColor(EThemeColor.ThemeColor, value)
        updateTheme(value)
      }
      state.active[type] = value
      state.themeClass[key] = value
      props.onChange && props.onChange(key, value)
      emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`])
    }
    return { sidebar, state, header, colors, EThemeSetting, onSetTheme }
  }
})
</script>
<template>
  <el-space direction="vertical" alignment="flex-start" class="rr-theme">
    <el-space>
      <el-tooltip
        v-for="x in sidebar"
        :class="`card side ${x.value} ${state.active.sidebar === x.value ? 'active' : ''}`"
        effect="dark"
        :content="x.label"
        placement="top"
        :key="x.value"
      >
        <span @click="onSetTheme(EThemeSetting.Sidebar, 'sidebar', x.value)"></span>
      </el-tooltip>
    </el-space>
    <el-space>
      <el-tooltip
        v-for="x in header"
        :key="x.value"
        :class="`card header ${x.value} ${state.active.header === x.value ? 'active' : ''}`"
        effect="dark"
        :content="x.label"
        placement="top"
      >
        <span @click="onSetTheme(EThemeSetting.TopHeader, 'header', x.value)"></span>
      </el-tooltip>
    </el-space>
    <el-space :size="2" style="flex-wrap: wrap">
      <el-tooltip
        v-for="x in colors"
        :key="x.value"
        :class="`color ${state.active.color === x.value ? 'active' : ''}`"
        effect="dark"
        :content="x.label"
        placement="top"
        :style="`background-color: ${x.value}`"
      >
        <span @click="onSetTheme(EThemeSetting.ThemeColor, 'color', x.value)"></span>
      </el-tooltip>
    </el-space>
  </el-space>
</template>
