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
    <Transition name="ds-fade">
      <div v-if="showLoading" class="app-boot" role="status" aria-live="polite">
        <div class="app-boot__lockup">
          <BrandMark />
          <p class="app-boot__title">正在载入工作区</p>
          <div class="app-boot__track ds-route-line" aria-hidden="true"></div>
          <p class="app-boot__hint">正在同步身份、权限与导航</p>
        </div>
      </div>
    </Transition>
    <AdminLayout v-if="showPageLayout" />
    <FullscreenLayout v-else-if="showFullscreenLayout" />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { loadWorkspacePlugins } from '@/app/plugins'
import FullscreenLayout from '@/layouts/fullscreen/index.vue'
import { useShellStore } from '@/store'
import { resolveLayoutMode } from '@/router/layout'
import { BrandMark } from '@/design-system'

defineOptions({ name: 'App' })

const route = useRoute()
const shell = useShellStore()
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
</script>

<style scoped>
/* 首屏遮罩跟随品牌色：底色取品牌色最深的 jade-950，光晕与文字走同一色族，
   换主题后不会停在固定的深青上。变量由 setThemeColor 在 mount 前写到 body。 */
.app-boot {
  --ds-brand-text: var(--ds-ink-inverse);
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  color: var(--ds-ink-inverse);
  background:
    radial-gradient(circle at 76% 22%, color-mix(in srgb, var(--ds-jade-400) 12%, transparent), transparent 34%),
    radial-gradient(circle at 12% 84%, color-mix(in srgb, var(--ds-jade-500) 10%, transparent), transparent 30%), var(--ds-jade-950);
}

.app-boot__lockup {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(320px, calc(100vw - 64px));
}

.app-boot__title {
  margin-top: 28px;
  color: var(--ds-ink-inverse);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.app-boot__track {
  width: 180px;
  height: 1px;
  margin-top: 16px;
  background: color-mix(in srgb, var(--ds-ink-inverse) 10%, transparent);
}

.app-boot__hint {
  margin-top: 14px;
  color: color-mix(in srgb, var(--ds-ink-inverse) 44%, transparent);
  font-size: 11px;
  letter-spacing: 0.05em;
}
</style>
