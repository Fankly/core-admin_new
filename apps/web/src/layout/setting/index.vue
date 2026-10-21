<template>
  <button class="rr-setting-trigger" type="button" aria-label="打开主题设置" @click="openDrawer = true">
    <span class="rr-header-right-items-icon">
      <svg-icon name="morevertical" />
    </span>
  </button>
  <el-drawer v-model="openDrawer" title="主题设置" :append-to-body="true" :size="300" class="rr-setting-wrap">
    <div class="rr-setting">
      <setting-theme />
      <el-divider />
      <setting-nav-layout />
      <el-divider />
      <setting-other />
      <el-divider />
      <el-alert title="该功能可实时预览各种布局效果" type="warning" class="ele-alert-border" :closable="false" />
      <el-button class="copybtn" size="small" :round="false" :icon="CopyDocument" @click="onCopySetting"> 拷贝设置 </el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SvgIcon from '@/components/base/svg-icon'
import { usePreferencesStore } from '@/store'
import { copyToClipboard } from '@/utils/utils'
import SettingNavLayout from './setting-nav-layout.vue'
import SettingOther from './setting-other.vue'
import SettingTheme from './setting-theme.vue'
import '@/assets/css/setting.less'

/** 可视化设置窗口 */
defineOptions({ name: 'SettingSidebar' })

const preferences = usePreferencesStore()
const openDrawer = ref(false)

const onCopySetting = () => {
  copyToClipboard(JSON.stringify({ ...preferences.config, '//': '该功能可实时预览各种布局效果' }, null, 2))
  ElMessage.success('拷贝成功')
}
</script>

<style scoped>
.rr-setting-trigger {
  padding: 0;
  cursor: pointer;
  background: none;
  border: 0;
}

.copybtn {
  width: 100%;
  margin: 15px 0 30px;
  font-weight: 400;
}
</style>
