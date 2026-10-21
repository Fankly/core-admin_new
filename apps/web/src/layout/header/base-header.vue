<template>
  <div class="rr-header-ctx">
    <div class="rr-header-ctx-logo hidden-xs-only">
      <img src="../../assets/images/logo-dark.ab519d9f.png" class="rr-header-ctx-logo-img" alt="项目过程管控平台" />
      <Logo :logo-url="logo" logo-name="项目过程管控平台" />
    </div>
    <div class="rr-header-right">
      <div class="rr-header-right-left">
        <div v-show="sidebarLayout !== ESidebarLayoutEnum.Top" class="rr-header-right-items rr-header-action">
          <collapse-sidebar-btn />
          <button class="rr-header-icon-btn" type="button" aria-label="刷新当前页" @click="shell.reloadCurrentPage()">
            <el-icon class="rr-header-refresh-icon"><RefreshRight /></el-icon>
          </button>
        </div>
        <div class="rr-header-right-left-br ele-scrollbar-hide hidden-xs-only">
          <base-sidebar v-if="sidebarLayout === ESidebarLayoutEnum.Top" mode="horizontal" :router="true" />
          <header-mix-nav-menus v-else-if="sidebarLayout === ESidebarLayoutEnum.Mix" />
          <breadcrumb v-else />
        </div>
      </div>
      <div style="flex-shrink: 0">
        <expand :user-name="session.userName" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'
import { usePreferencesStore, useSessionStore, useShellStore } from '@/store'
import { ESidebarLayoutEnum } from '@/constants/enum'
import logo from '@/assets/images/logo.png'
import BaseSidebar from '../sidebar/base-sidebar.vue'
import Breadcrumb from './breadcrumb.vue'
import CollapseSidebarBtn from './collapse-sidebar-btn.vue'
import Expand from './expand.vue'
import HeaderMixNavMenus from './header-mix-nav-menus.vue'
import Logo from './logo.vue'
import '@/assets/css/header.less'

/** 顶部主区域 */
defineOptions({ name: 'AppHeader' })

const shell = useShellStore()
const session = useSessionStore()
const preferences = usePreferencesStore()
const sidebarLayout = computed(() => preferences.navLayout)
</script>

<style scoped lang="less">
.rr-header-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: none;
  border: 0;
}
</style>
