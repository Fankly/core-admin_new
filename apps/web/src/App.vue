<template>
  <!-- element 分页显示中文 -->
  <el-config-provider :locale="locale">
    <div
      v-if="!store.appIsRender && !(route.path.includes('workflow') && route.path !== '/workflow/todoTasks')"
      v-loading="true"
      :element-loading-fullscreen="true"
      :element-loading-lock="true"
      style="width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; z-index: 99999; background: #fff"
    ></div>
    <template v-if="store.appIsReady && !(route.path.includes('workflow') && route.path !== '/workflow/todoTasks')">
      <layout v-if="layout === pageTag"></layout>
      <fullscreen-layout v-else></fullscreen-layout>
    </template>
    <fullscreen-layout v-else-if="route.path.includes('workflow') && route.path !== '/workflow/todoTasks'"></fullscreen-layout>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store'
import app from '@/constants/app'
import { EMitt, EPageLayoutEnum, EThemeColor, EThemeSetting } from '@/constants/enum'
import type { IObject } from '@/types/interface'
import Layout from '@/layout/index.vue'
import FullscreenLayout from '@/layout/fullscreen-layout.vue'
import emits from '@/utils/emits'
import { getThemeConfigCache, setThemeColor, updateTheme } from '@/utils/theme'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import '@/assets/css/app.less'
import '@/assets/theme/index.less'
import '@/assets/theme/mobile.less'

defineOptions({ name: 'App' })

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const layout = ref(location.href.includes('pop=true') ? EPageLayoutEnum.fullscreen : EPageLayoutEnum.page)
const pageTag = EPageLayoutEnum.page
const locale = zhCn //element 分页显示中文

onMounted(() => {
  //读取主题色缓存
  const themeCache = getThemeConfigCache()
  const themeColor = themeCache[EThemeSetting.ThemeColor]
  setThemeColor(EThemeColor.ThemeColor, themeColor)
  updateTheme(themeColor)
})

watch(
  () => [route.path, route.query],
  ([path, query]) => {
    layout.value = app.fullscreenPages.includes(path as string) || (query as IObject)['pop'] ? EPageLayoutEnum.fullscreen : EPageLayoutEnum.page
  }
)
watch(
  () => route.fullPath,
  (vl) => {
    if (!route.query.pop) {
      emits.emit(EMitt.OnPushMenuToTabs, {
        label: route.query._mt || router.currentRoute.value.meta.title || route.path,
        value: vl,
        mete: router.currentRoute.value.meta
      })
    }
  }
)
</script>
