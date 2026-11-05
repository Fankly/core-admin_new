<script lang="ts">
import { EThemeSetting } from '@/constants/enum'
import { Settings2 } from 'lucide-vue-next'
import { getThemeConfigCache, resetThemeSetting, setThemeConfigToCache } from '@/utils/theme'
import { copyToClipboard } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { computed, defineComponent, reactive } from 'vue'
import SettingNavLayout from './setting-nav-layout.vue'
import SettingOther from './setting-other.vue'
import SettingTheme from './setting-theme.vue'
import '@/assets/css/setting.less'

/**
 * 可视化设置窗口
 */
export default defineComponent({
  name: 'SettingSidebar',
  components: { SettingNavLayout, SettingOther, SettingTheme, Settings2 },
  setup() {
    const state = reactive({ openDrawer: false, config: getThemeConfigCache(), resetKey: 0 })

    const onOpenSettingThemeWindow = () => {
      state.openDrawer = true
    }
    const navLayout = computed(() => String(state.config[EThemeSetting.NavLayout]))
    const onChange = (key: EThemeSetting, value: string | boolean | number) => {
      state.config = { ...state.config, [key]: value }
      setThemeConfigToCache(key, value)
    }
    const onReset = () => {
      resetThemeSetting()
      state.config = getThemeConfigCache()
      // 面板内的单选/开关各自持有本地状态，重置后重新挂载以同步到默认值
      state.resetKey += 1
      ElMessage.success('已恢复默认设置')
    }
    const onCopySetting = () => {
      const vl = getThemeConfigCache()
      copyToClipboard(JSON.stringify(vl, null, 2))
      ElMessage.success('配置已复制')
    }
    return { state, navLayout, onOpenSettingThemeWindow, onChange, onReset, onCopySetting }
  }
})
</script>

<template>
  <div class="rr-masthead__setting">
    <button class="rr-masthead__btn" type="button" aria-label="打开主题设置" title="主题设置" @click="onOpenSettingThemeWindow">
      <Settings2 :size="16" :stroke-width="1.8" aria-hidden="true" />
    </button>
    <el-drawer title="主题设置" v-model="state.openDrawer" :append-to-body="true" :size="400" custom-class="rr-setting-drawer">
      <div class="rr-setting">
        <p class="rr-setting__intro">选择适合工作习惯的导航布局与外观，修改会即时生效。</p>
        <setting-nav-layout :key="`nav-layout-${state.resetKey}`" :value="state.config" :onChange="onChange"></setting-nav-layout>
        <div class="rr-setting__divider"></div>
        <setting-theme :key="`theme-${state.resetKey}`" :value="state.config" :nav-layout="navLayout" :onChange="onChange"></setting-theme>
        <div class="rr-setting__divider"></div>
        <setting-other :key="`other-${state.resetKey}`" :value="state.config" :onChange="onChange"></setting-other>
        <div class="rr-setting__footer">
          <p class="rr-setting__hint">即时生效 · 自动保存在当前浏览器</p>
          <div class="rr-setting__actions">
            <button class="rr-setting__action" type="button" @click="onReset">恢复默认</button>
            <button class="rr-setting__action" type="button" @click="onCopySetting">复制配置</button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
