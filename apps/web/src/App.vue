<template>
  <!--
    DIRECTION CONTRACT / 546242df
    THESIS: A project-governance control surface built as an institutional
    wayfinding system, refusing the stacked-card admin template.
    OWN-WORLD: deep jade rail, paper signage, hairline rules, station dots,
    one amber attention signal, compact Chinese UI sans.
    STORY: The manager sees where they are, what is reachable, and what to do
    next without decoding a legacy portal.
    FIRST VIEWPORT: 64px masthead, 248px route rail, one framed workspace with
    inline tabs; the greeting and the real menu-derived entries lead.
    FORM: transit wayfinding system (grounded candidate 6), seed 546242df.
    FINISH: unreviewed and undocumented is unfinished; this build ends with the
    finish review, the verdict, and DESIGN.md.
  -->
  <el-config-provider :locale="locale">
    <a v-if="showPageLayout" class="ds-skip-link" href="#workspace-main" @click.prevent="focusWorkspace">跳转到工作区</a>
    <div v-if="showLoading" class="app-boot" role="status" aria-live="polite">
      <div class="app-boot__lockup">
        <BrandMark />
        <p class="app-boot__title">正在载入工作区</p>
        <div class="app-boot__track ds-route-line" aria-hidden="true"></div>
        <p class="app-boot__hint">正在同步身份、权限与导航</p>
      </div>
    </div>
    <AdminLayout v-if="showPageLayout" />
    <FullscreenLayout v-else-if="showFullscreenLayout" />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { loadWorkspacePlugins } from '@/app/plugins'
import FullscreenLayout from '@/layouts/fullscreen/index.vue'
import { usePreferencesStore, useShellStore } from '@/store'
import { resolveLayoutMode } from '@/router/layout'
import { BrandMark } from '@/design-system'

defineOptions({ name: 'App' })

const route = useRoute()
const shell = useShellStore()
const preferences = usePreferencesStore()
const locale = zhCn
const focusWorkspace = () => {
  document.getElementById('workspace-main')?.focus()
}
const AdminLayout = defineAsyncComponent(async () => {
  await loadWorkspacePlugins()
  return import('@/layouts/admin/index.vue')
})

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
.app-boot {
  --ds-brand-text: #f3fbf8;
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  color: #f3fbf8;
  background:
    radial-gradient(circle at 76% 22%, rgb(44 168 152 / 10%), transparent 34%),
    radial-gradient(circle at 12% 84%, rgb(27 159 143 / 8%), transparent 30%), #07241f;
}

.app-boot__lockup {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(320px, calc(100vw - 64px));
}

.app-boot__title {
  margin-top: 28px;
  color: #f3fbf8;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.app-boot__track {
  width: 180px;
  height: 1px;
  margin-top: 16px;
  background: rgb(255 255 255 / 10%);
}

.app-boot__hint {
  margin-top: 14px;
  color: rgb(243 251 248 / 44%);
  font-size: 11px;
  letter-spacing: 0.05em;
}
</style>
