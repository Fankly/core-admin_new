<script lang="ts">
import { themeSetting } from '@/constants/config'
import { EMitt, EThemeSetting } from '@/constants/enum'
import { IObject } from '@/types/interface'
import emits from '@/utils/emits'
import { defineComponent, reactive } from 'vue'
import SettingSwitch from '@/components/base/setting-switch.vue'

/**
 * 其他设置
 */
export default defineComponent({
  name: 'SettingOther',
  components: { SettingSwitch },
  props: {
    value: Object,
    onChange: Function
  },
  setup(props) {
    const state = reactive({
      items: [
        {
          label: '固定Logo栏',
          value: themeSetting.logoAuto,
          key: EThemeSetting.LogoAuto,
          emit: null
        },
        {
          label: '侧栏彩色图标',
          value: themeSetting.colorIcon,
          key: EThemeSetting.ColorIcon,
          emit: null
        },
        {
          label: '侧栏排他展开',
          value: themeSetting.sidebarUniOpened,
          key: EThemeSetting.SidebarUniOpened,
          emit: EMitt.OnSetThemeNotUniqueOpened
        },
        {
          label: '启用标签页',
          value: themeSetting.openTabsPage,
          key: EThemeSetting.OpenTabsPage,
          emit: EMitt.OnSetThemeTabsPage
        }
      ],
      tabStyles: [
        { label: '默认', value: 'default' },
        { label: '圆点', value: 'dot' },
        { label: '卡片', value: 'card' }
      ],
      tabStyle: props.value ? props.value[EThemeSetting.TabStyle] : themeSetting.tabStyle
    })
    state.items.forEach((x) => {
      if (props.value && Object.prototype.hasOwnProperty.call(props.value, x.key)) {
        x.value = props.value[x.key]
      }
    })
    const onSetSwitch = (index: number, { key, emit }: IObject) => {
      const value = !state.items[index].value
      state.items[index].value = value
      emit && emits.emit(emit, value)
      emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`])
      props.onChange && props.onChange(key, value)
    }
    const onSetTabStyle = (value: string) => {
      const key = EThemeSetting.TabStyle
      state.tabStyle = value
      emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`])
      props.onChange && props.onChange(key, value)
    }
    return { state, onSetSwitch, onSetTabStyle }
  }
})
</script>
<template>
  <el-space direction="vertical" alignment="flex-start" :size="30" class="rr-other">
    <span class="rr-setting-title text-2">{{ '其他配置' }}</span>
    <setting-switch
      v-for="(x, index) in state.items"
      :key="x.label"
      :title="x.label"
      :value="x.value"
      :onChange="() => onSetSwitch(index, x)"
    ></setting-switch>
    <el-space class="rr-switch">
      <span>{{ '标签显示风格' }}</span>
      <el-select v-model="state.tabStyle" placeholder="该功能可实时预览各种布局效果" size="mini" style="max-width: 80px" @change="onSetTabStyle">
        <el-option v-for="x in state.tabStyles" :key="x.value" :label="x.label" :value="x.value"></el-option>
      </el-select>
    </el-space>
  </el-space>
</template>
