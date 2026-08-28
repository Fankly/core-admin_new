<template>
  <!-- element 分页显示中文 -->
  <el-config-provider :locale="locale">
    <div
      v-if="!store.state.appIsRender && !(route.path.includes('workflow') && route.path !== '/workflow/todoTasks')"
      v-loading="true"
      :element-loading-fullscreen="true"
      :element-loading-lock="true"
      style="width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; z-index: 99999; background: #fff"
    ></div>
    <template v-if="store.state.appIsReady && !(route.path.includes('workflow') && route.path !== '/workflow/todoTasks')">
      <layout v-if="state.layout === pageTag"></layout>
      <fullscreen-layout v-else></fullscreen-layout>
    </template>
    <fullscreen-layout v-else-if="route.path.includes('workflow') && route.path !== '/workflow/todoTasks'"></fullscreen-layout>
    <AiChatWidget :available="chatAvailable" />
  </el-config-provider>
</template>

<script lang="ts">
import '@/assets/css/app.less'
import AiChatWidget from '@/components/AiChat/AiChatWidget.vue'
import Layout from '@/layout/index.vue'
import '@/assets/theme/index.less'
import { computed, defineComponent, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import app from './constants/app'
import { EMitt, EPageLayoutEnum, EThemeColor, EThemeSetting } from './constants/enum'
import { IObject } from './types/interface'
import FullscreenLayout from '@/layout/fullscreen-layout.vue'
import '@/assets/theme/mobile.less'
import emits from './utils/emits'
import { getThemeConfigCache, setThemeColor, updateTheme } from './utils/theme'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'

export default defineComponent({
  name: 'App',
  components: { Layout, FullscreenLayout, AiChatWidget },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const state = reactive({
      layout: location.href.includes('pop=true') ? EPageLayoutEnum.fullscreen : EPageLayoutEnum.page
    })
    const chatAvailable = computed(
      () =>
        store.state.appIsReady && state.layout === EPageLayoutEnum.page && !(route.path.includes('workflow') && route.path !== '/workflow/todoTasks')
    )
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
        state.layout = app.fullscreenPages.includes(path as string) || (query as IObject)['pop'] ? EPageLayoutEnum.fullscreen : EPageLayoutEnum.page
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
    return {
      store,
      route,
      router,
      state,
      pageTag: EPageLayoutEnum.page,
      chatAvailable,
      locale: zhCn //element 分页显示中文
    }
  }
})
</script>
