<script lang="ts">
import { EMitt, ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import { RotateCw } from 'lucide-vue-next'
import { defineComponent, reactive } from 'vue'
import { useStore } from 'vuex'
import BaseSidebar from '../sidebar/base-sidebar.vue'
import Breadcrumb from './breadcrumb.vue'
import CollapseSidebarBtn from './collapse-sidebar-btn.vue'
import Expand from './expand.vue'
import HeaderMixNavMenus from './header-mix-nav-menus.vue'
import markImage from '@/assets/images/masthead-mark.png'
import '@/assets/css/header.less'

/**
 * 顶部主区域：品牌区（与侧栏同宽）+ 工具条（收起 / 刷新 / 面包屑或横向导航）+ 右侧操作区
 */
export default defineComponent({
  name: 'Header',
  components: { BaseSidebar, Breadcrumb, CollapseSidebarBtn, Expand, HeaderMixNavMenus, RotateCw },
  setup() {
    const store = useStore()
    const state = reactive({
      sidebarLayout: getThemeConfigCacheByKey(EThemeSetting.NavLayout)
    })
    emits.on(EMitt.OnSetNavLayout, (vl) => {
      state.sidebarLayout = vl
    })
    const onRefresh = () => {
      emits.emit(EMitt.OnReloadTabPage)
    }
    return { store, state, onRefresh, ESidebarLayoutEnum, markImage }
  }
})
</script>
<template>
  <div class="rr-masthead">
    <router-link class="rr-masthead__brand hidden-xs-only" to="/home" aria-label="返回主页">
      <span class="rr-masthead__mark" aria-hidden="true">
        <img class="rr-masthead__mark-img" :src="markImage" alt="" />
      </span>
      <span class="rr-masthead__type">
        <span class="rr-masthead__name">项目过程管控平台</span>
        <span class="rr-masthead__descriptor">Project Governance</span>
      </span>
    </router-link>
    <div class="rr-masthead__bar">
      <div class="rr-masthead__leading">
        <collapse-sidebar-btn v-if="state.sidebarLayout !== ESidebarLayoutEnum.Top"></collapse-sidebar-btn>
        <button class="rr-masthead__btn" type="button" aria-label="刷新当前页面" title="刷新当前页面" @click="onRefresh">
          <RotateCw :size="16" :stroke-width="1.8" aria-hidden="true" />
        </button>
        <nav
          v-if="state.sidebarLayout === ESidebarLayoutEnum.Top || state.sidebarLayout === ESidebarLayoutEnum.Mix"
          class="rr-masthead__nav hidden-xs-only"
          aria-label="主导航"
        >
          <base-sidebar v-if="state.sidebarLayout === ESidebarLayoutEnum.Top" mode="horizontal" :router="true"></base-sidebar>
          <header-mix-nav-menus v-else></header-mix-nav-menus>
        </nav>
        <breadcrumb v-else class="hidden-xs-only"></breadcrumb>
      </div>
      <expand :userName="store.state.user.name"></expand>
    </div>
  </div>
</template>
