<template>
  <button class="ds-icon-button" type="button" aria-label="打开界面设置" title="界面设置" @click="openDrawer = true">
    <Settings2 :size="16" :stroke-width="1.8" aria-hidden="true" />
  </button>

  <el-drawer v-model="openDrawer" title="界面设置" :append-to-body="true" :size="400" class="ds-settings-drawer">
    <div class="ds-settings">
      <p class="ds-settings__intro">选择适合工作习惯的导航布局和外观。</p>
      <SettingNavLayout />
      <div class="ds-settings__divider"></div>
      <SettingTheme />
      <div class="ds-settings__divider"></div>
      <SettingOther />
    </div>
    <template #footer>
      <div class="ds-settings__footer">
        <p class="ds-settings__hint">即时生效 · 自动保存在当前浏览器</p>
        <div class="ds-settings__footer-actions">
          <button class="ds-button" type="button" @click="onReset">恢复默认</button>
          <button class="ds-button" type="button" @click="onCopySetting">复制配置</button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Settings2 } from '@lucide/vue'
import { ElMessage } from 'element-plus'
import { usePreferencesStore } from '@/store'
import { copyToClipboard } from '@/utils/utils'
import SettingNavLayout from './SettingNavLayout.vue'
import SettingOther from './SettingOther.vue'
import SettingTheme from './SettingTheme.vue'

defineOptions({ name: 'SettingSidebar' })

const preferences = usePreferencesStore()
const openDrawer = ref(false)

const onCopySetting = () => {
  copyToClipboard(JSON.stringify(preferences.config, null, 2))
  ElMessage.success('配置已复制')
}

const onReset = () => {
  preferences.reset()
  ElMessage.success('已恢复默认设置')
}
</script>
