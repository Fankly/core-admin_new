<template>
  <el-config-provider :locale="locale">
    <div v-if="showLoading" class="app-bootstrap" v-loading="true" element-loading-background="#fff">
      <div class="app-bootstrap__brand">
        <span class="app-bootstrap__mark">项</span>
        <div>
          <p class="app-bootstrap__title">项目过程管控平台</p>
          <p class="app-bootstrap__hint">正在加载工作台…</p>
        </div>
      </div>
    </div>
    <layout v-if="showPageLayout" />
    <fullscreen-layout v-else-if="showFullscreenLayout" />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import Layout from '@/layout/index.vue'
import FullscreenLayout from '@/layout/fullscreen-layout.vue'
import { usePreferencesStore, useShellStore } from '@/store'
import { resolveLayoutMode } from '@/router/layout'
import '@/assets/css/app.less'
import '@/assets/theme/index.less'
import '@/assets/theme/mobile.less'

defineOptions({ name: 'App' })

const route = useRoute()
const shell = useShellStore()
const preferences = usePreferencesStore()
const locale = zhCn

const layoutMode = computed(() => resolveLayoutMode(route))
const isStandalone = computed(() => layoutMode.value === 'standalone')
/** 首屏遮罩：流程页直出，其余页面等应用完成一次渲染。 */
const showLoading = computed(() => !isStandalone.value && !shell.isRendered)
const showPageLayout = computed(() => shell.isReady && !isStandalone.value && layoutMode.value === 'page')
const showFullscreenLayout = computed(() => isStandalone.value || (shell.isReady && layoutMode.value === 'fullscreen'))

onMounted(() => {
  preferences.applyTheme()
})
</script>

<style scoped>
.app-bootstrap {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  background: #fff;
}

.app-bootstrap__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.app-bootstrap__mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #0f766e, #0ea5a4);
  box-shadow: 0 10px 24px rgb(15 118 110 / 24%);
}

.app-bootstrap__title {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.app-bootstrap__hint {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}
</style>
