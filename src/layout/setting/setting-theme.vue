<script lang="ts">
import { EMitt, ESidebarLayoutEnum, EThemeColor, EThemeSetting } from '@/constants/enum'
import { IObject } from '@/types/interface'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey, setThemeColor, updateTheme } from '@/utils/theme'
import { defineComponent, reactive } from 'vue'

const sidebarOptions = [
  { label: '深色导航', value: 'dark' },
  { label: '浅色导航', value: 'light' }
]

const headerOptions = [
  { label: '亮色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '品牌色', value: 'primary' }
]

// 与 core-admin_new 设计系统一致的品牌色（默认深青 #00706b）
const colorOptions = [
  { label: '深青', value: '#00706b' },
  { label: '松柏', value: '#1f6f55' },
  { label: '孔雀', value: '#0f7b8a' },
  { label: '靛蓝', value: '#3d5a80' },
  { label: '暮蓝', value: '#4c6a92' },
  { label: '赭石', value: '#8c633c' },
  { label: '绛红', value: '#9b4a44' },
  { label: '石墨', value: '#47524d' }
]

/**
 * 主题设置：侧栏 / 顶栏风格与品牌色
 */
export default defineComponent({
  name: 'SettingTheme',
  props: { value: Object, navLayout: String, onChange: Function },
  setup(props) {
    const state = reactive({
      active: {
        sidebar: String(getThemeConfigCacheByKey(EThemeSetting.Sidebar, props.value)),
        header: String(getThemeConfigCacheByKey(EThemeSetting.TopHeader, props.value)),
        color: String(getThemeConfigCacheByKey(EThemeSetting.ThemeColor, props.value))
      } as IObject<string>
    })

    const onSetTheme = (key: EThemeSetting, type: string, value: string) => {
      if (key === EThemeSetting.ThemeColor) {
        setThemeColor(EThemeColor.ThemeColor, value)
        updateTheme(value)
      }
      state.active[type] = value
      emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`])
      props.onChange && props.onChange(key, value)
    }

    return { state, sidebarOptions, headerOptions, colorOptions, EThemeSetting, ESidebarLayoutEnum, onSetTheme }
  }
})
</script>

<template>
  <div v-if="navLayout !== ESidebarLayoutEnum.Top" class="rr-setting__group">
    <h3 class="rr-setting__label">侧栏风格</h3>
    <div class="rr-setting__theme-pair">
      <button
        v-for="item in sidebarOptions"
        :key="item.value"
        class="rr-setting__theme-card"
        :class="{ 'is-active': state.active.sidebar === item.value }"
        type="button"
        :aria-pressed="state.active.sidebar === item.value"
        @click="onSetTheme(EThemeSetting.Sidebar, 'sidebar', item.value)"
      >
        <span class="rr-theme-preview" :class="`rr-theme-preview--sidebar-${item.value}`" aria-hidden="true"><i></i><i></i><i></i></span>
        {{ item.label }}
      </button>
    </div>
  </div>

  <div class="rr-setting__group">
    <h3 class="rr-setting__label">顶栏风格</h3>
    <div class="rr-setting__themes">
      <button
        v-for="item in headerOptions"
        :key="item.value"
        class="rr-setting__theme-card"
        :class="{ 'is-active': state.active.header === item.value }"
        type="button"
        :aria-pressed="state.active.header === item.value"
        @click="onSetTheme(EThemeSetting.TopHeader, 'header', item.value)"
      >
        <span class="rr-theme-preview" :class="`rr-theme-preview--header-${item.value}`" aria-hidden="true"></span>
        {{ item.label }}
      </button>
    </div>
  </div>

  <div class="rr-setting__group">
    <h3 class="rr-setting__label">品牌色</h3>
    <div class="rr-setting__swatches">
      <button
        v-for="item in colorOptions"
        :key="item.value"
        class="rr-setting__swatch"
        :class="{ 'is-active': state.active.color === item.value }"
        type="button"
        :style="{ backgroundColor: item.value }"
        :aria-label="item.label"
        :aria-pressed="state.active.color === item.value"
        :title="item.label"
        @click="onSetTheme(EThemeSetting.ThemeColor, 'color', item.value)"
      ></button>
    </div>
  </div>
</template>
