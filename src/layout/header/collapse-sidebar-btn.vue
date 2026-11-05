<script lang="ts">
import { EMitt, EThemeSetting } from '@/constants/enum'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey, toggleSidebarCollapse } from '@/utils/theme'
import { defineComponent, onBeforeUnmount, reactive } from 'vue'

/**
 * PC和移动端下的侧边栏展开收起按钮
 */
export default defineComponent({
  name: 'CollapseSidebarBtn',
  components: { PanelLeftClose, PanelLeftOpen },
  setup() {
    const state = reactive({
      collapseSidebar: getThemeConfigCacheByKey(EThemeSetting.SidebarCollapse)
    })
    // 侧栏收起态点击顶层分组也会展开侧栏，图标跟随事件而不是自己翻转
    const onSwitchLeftSidebar = () => {
      state.collapseSidebar = !state.collapseSidebar
    }
    emits.on(EMitt.OnSwitchLeftSidebar, onSwitchLeftSidebar)
    onBeforeUnmount(() => emits.off(EMitt.OnSwitchLeftSidebar, onSwitchLeftSidebar))
    const onClickSidebarSwitcher = () => {
      toggleSidebarCollapse()
    }
    const onClickSidebarSwitcherByMobile = () => {
      emits.emit(EMitt.OnMobileOpenSidebar)
    }
    return { state, onClickSidebarSwitcher, onClickSidebarSwitcherByMobile }
  }
})
</script>
<template>
  <button
    class="rr-masthead__btn hidden-xs-only"
    type="button"
    :aria-label="state.collapseSidebar ? '展开侧边导航' : '收起侧边导航'"
    :title="state.collapseSidebar ? '展开侧边导航' : '收起侧边导航'"
    @click="onClickSidebarSwitcher"
  >
    <PanelLeftOpen v-if="state.collapseSidebar" :size="17" :stroke-width="1.8" aria-hidden="true" />
    <PanelLeftClose v-else :size="17" :stroke-width="1.8" aria-hidden="true" />
  </button>
  <button class="rr-masthead__btn hidden-sm-and-up show-xs-only" type="button" aria-label="打开导航菜单" @click="onClickSidebarSwitcherByMobile">
    <PanelLeftOpen :size="17" :stroke-width="1.8" aria-hidden="true" />
  </button>
</template>
