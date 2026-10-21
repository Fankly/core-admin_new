<template>
  <header class="ds-header">
    <router-link class="ds-header__brand" to="/home" aria-label="返回工作台">
      <BrandMark :compact="preferences.sidebarCollapse" />
    </router-link>

    <div class="ds-header__bar">
      <div class="ds-header__leading">
        <CollapseSidebarBtn :show-collapse="!isTopLayout" />
        <button class="ds-icon-button" type="button" aria-label="刷新当前页面" title="刷新当前页面" @click="shell.reloadCurrentPage()">
          <RotateCw :size="16" :stroke-width="1.8" aria-hidden="true" />
        </button>

        <BreadcrumbTrail v-if="isLeftLayout" />
        <HorizontalNav v-else-if="isTopLayout || isMixLayout" />
      </div>

      <HeaderActions />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RotateCw } from '@lucide/vue'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { usePreferencesStore, useShellStore } from '@/store'
import { BrandMark } from '@/design-system'
import BreadcrumbTrail from './BreadcrumbTrail.vue'
import HeaderActions from './HeaderActions.vue'
import CollapseSidebarBtn from '../navigation/CollapseSidebarBtn.vue'
import HorizontalNav from '../navigation/HorizontalNav.vue'

defineOptions({ name: 'HeaderBar' })

const preferences = usePreferencesStore()
const shell = useShellStore()

const isTopLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Top)
const isLeftLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Left)
const isMixLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Mix)
</script>
