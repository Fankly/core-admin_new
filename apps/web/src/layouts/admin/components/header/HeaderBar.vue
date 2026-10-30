<template>
  <header class="ds-header">
    <router-link class="ds-header__brand" to="/home" aria-label="返回工作台">
      <BrandMark />
    </router-link>

    <div class="ds-header__bar">
      <div class="ds-header__leading">
        <CollapseSidebarBtn :show-collapse="!isTopLayout" />
        <BreadcrumbTrail v-if="isLeftLayout" />
        <HorizontalNav v-else-if="isTopLayout || isMixLayout" />
      </div>

      <HeaderActions />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { usePreferencesStore } from '@/store'
import { BrandMark } from '@/design-system'
import BreadcrumbTrail from './BreadcrumbTrail.vue'
import HeaderActions from './HeaderActions.vue'
import CollapseSidebarBtn from '../navigation/CollapseSidebarBtn.vue'
import HorizontalNav from '../navigation/HorizontalNav.vue'

defineOptions({ name: 'HeaderBar' })

const preferences = usePreferencesStore()

const isTopLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Top)
const isLeftLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Left)
const isMixLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Mix)
</script>
