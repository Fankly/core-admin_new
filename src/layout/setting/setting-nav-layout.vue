<script lang="ts">
import { EMitt, ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import { Check } from 'lucide-vue-next'
import { defineComponent, reactive } from 'vue'

const layoutOptions = [
  { label: '左侧导航', description: '全部菜单在左侧，按层级展开。', value: ESidebarLayoutEnum.Left },
  { label: '顶部导航', description: '全部菜单在顶部，悬停展开子菜单。', value: ESidebarLayoutEnum.Top },
  { label: '混合导航', description: '顶部选择业务模块，左侧显示该模块菜单。', value: ESidebarLayoutEnum.Mix }
]

/**
 * 导航模式设置
 */
export default defineComponent({
  name: 'SettingNavLayout',
  components: { Check },
  props: { value: Object, onChange: Function },
  setup(props) {
    const state = reactive({
      layout: String(getThemeConfigCacheByKey(EThemeSetting.NavLayout, props.value)) as ESidebarLayoutEnum
    })

    const onSetLayout = (value: ESidebarLayoutEnum) => {
      state.layout = value
      emits.emit(EMitt.OnSetTheme, [EThemeSetting.NavLayout, `${EThemeSetting.NavLayout}-${value}`])
      emits.emit(EMitt.OnSetNavLayout, value)
      props.onChange && props.onChange(EThemeSetting.NavLayout, value)
    }

    return { state, layoutOptions, ESidebarLayoutEnum, onSetLayout }
  }
})
</script>

<template>
  <div class="rr-setting__group">
    <h3 class="rr-setting__label">导航布局</h3>
    <div class="rr-layout-options">
      <button
        v-for="item in layoutOptions"
        :key="item.value"
        class="rr-layout-option"
        :class="{ 'is-active': state.layout === item.value }"
        type="button"
        :aria-pressed="state.layout === item.value"
        @click="onSetLayout(item.value)"
      >
        <span class="rr-layout-preview" :class="`rr-layout-preview--${item.value}`" aria-hidden="true">
          <i class="rr-layout-preview__rail"></i>
          <i class="rr-layout-preview__top"></i>
          <i class="rr-layout-preview__body"></i>
        </span>
        <span class="rr-layout-option__content">
          <span class="rr-layout-option__title">{{ item.label }}</span>
          <span class="rr-layout-option__desc">{{ item.description }}</span>
        </span>
        <span class="rr-layout-option__check" aria-hidden="true">
          <Check v-if="state.layout === item.value" :size="12" :stroke-width="2.4" />
        </span>
      </button>
    </div>
  </div>
</template>
