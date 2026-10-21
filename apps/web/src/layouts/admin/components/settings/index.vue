<template>
  <button class="ds-icon-button" type="button" aria-label="打开界面设置" title="界面设置" @click="openDrawer = true">
    <Settings2 :size="16" :stroke-width="1.8" aria-hidden="true" />
  </button>

  <el-drawer v-model="openDrawer" title="界面设置" :append-to-body="true" :size="320" class="ds-settings-drawer">
    <div class="ds-settings">
      <SettingTheme />
      <div class="ds-settings__divider"></div>
      <SettingNavLayout />
      <div class="ds-settings__divider"></div>
      <SettingOther />
      <div class="ds-settings__divider"></div>
      <div class="ds-settings__footer">
        <p class="ds-settings__hint">设置会立即生效，并保存在当前浏览器中。</p>
        <div class="ds-settings__footer-actions">
          <button class="ds-button" type="button" @click="onCopySetting">复制配置</button>
          <button class="ds-button" type="button" @click="onReset">恢复默认</button>
        </div>
      </div>
    </div>
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

<style scoped lang="less">
.ds-settings-drawer {
  :deep(.el-drawer__header) {
    padding: 18px 22px;
    margin-bottom: 0;
    color: var(--ds-ink);
    font-size: var(--ds-text-base);
    font-weight: 600;
    border-bottom: 1px solid var(--ds-line);
  }

  :deep(.el-drawer__body) {
    padding: 22px;
  }
}

.ds-settings__hint {
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
  line-height: 1.6;
}

.ds-settings__footer-actions {
  display: flex;
  gap: 8px;
}
</style>
