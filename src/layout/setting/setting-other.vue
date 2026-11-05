<script lang="ts">
import { EMitt, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import { defineComponent, reactive } from 'vue'

const tabStyles = [
  { label: '默认', value: 'default' },
  { label: '圆点', value: 'dot' },
  { label: '卡片', value: 'card' }
]

/**
 * 其他设置
 */
export default defineComponent({
  name: 'SettingOther',
  props: { value: Object, onChange: Function },
  setup(props) {
    const state = reactive({
      openTabsPage: Boolean(getThemeConfigCacheByKey(EThemeSetting.OpenTabsPage, props.value)),
      tabStyle: String(getThemeConfigCacheByKey(EThemeSetting.TabStyle, props.value))
    })

    const onSetSwitch = (key: EThemeSetting, value: string | boolean | number) => {
      emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`])
      if (key === EThemeSetting.OpenTabsPage) emits.emit(EMitt.OnSetThemeTabsPage, value)
      props.onChange && props.onChange(key, value)
    }
    const onSetTabsPage = (value: boolean) => {
      state.openTabsPage = value
      onSetSwitch(EThemeSetting.OpenTabsPage, value)
    }
    const onSetTabStyle = (value: string) => {
      state.tabStyle = value
      onSetSwitch(EThemeSetting.TabStyle, value)
    }

    return { state, tabStyles, onSetTabsPage, onSetTabStyle }
  }
})
</script>

<template>
  <div class="rr-setting__group">
    <h3 class="rr-setting__label">标签页</h3>
    <div class="rr-setting__row">
      <span>启用标签页</span>
      <el-switch :model-value="state.openTabsPage" aria-label="启用标签页" @change="onSetTabsPage"></el-switch>
    </div>
    <div class="rr-setting__row">
      <span>标签页样式</span>
      <el-select
        :model-value="state.tabStyle"
        :disabled="!state.openTabsPage"
        aria-label="标签页样式"
        size="small"
        style="max-width: 110px"
        @change="onSetTabStyle"
      >
        <el-option v-for="item in tabStyles" :key="item.value" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </div>
    <p class="rr-setting__hint">开启标签页后，可保留并切换多个工作页面。</p>
  </div>
</template>
