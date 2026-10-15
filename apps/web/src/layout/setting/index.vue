<template>
  <div @click="onOpenSettingThemeWindow">
    <span class="rr-header-right-items-icon">
      <svg-icon name="morevertical"></svg-icon>
    </span>
    <el-drawer title="主题设置" v-model="openDrawer" :append-to-body="true" :size="300" class="rr-setting-wrap">
      <div class="rr-setting">
        <setting-theme :value="config" :onChange="onChange"></setting-theme>
        <el-divider></el-divider>
        <setting-nav-layout :value="config" :onChange="onChange"></setting-nav-layout>
        <el-divider></el-divider>
        <setting-other :value="config" :onChange="onChange"></setting-other>
        <el-divider></el-divider>
        <el-alert title="该功能可实时预览各种布局效果" type="warning" class="ele-alert-border" :closable="false"></el-alert>
        <div class="copybtn" :onClick="onCopySetting">
          <el-button size="small" :round="false" :icon="CopyDocument" style="width: 100%; margin: 15px 0 30px 0; font-weight: 400">
            {{ '拷贝设置' }}
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SvgIcon from '@/components/base/svg-icon'
import { EThemeSetting } from '@/constants/enum'
import { getThemeConfigCache, setThemeConfigToCache } from '@/utils/theme'
import { copyToClipboard } from '@/utils/utils'
import SettingNavLayout from './setting-nav-layout.vue'
import SettingOther from './setting-other.vue'
import SettingTheme from './setting-theme.vue'
import '@/assets/css/setting.less'

/**
 * 可视化设置窗口
 */
defineOptions({ name: 'SettingSidebar' })

const openDrawer = ref(false)
const config = getThemeConfigCache()

const onOpenSettingThemeWindow = () => {
  openDrawer.value = true
}
const onChange = (key: EThemeSetting, value: string | boolean | number) => {
  setThemeConfigToCache(key, value)
}
const onCopySetting = () => {
  const vl = getThemeConfigCache()
  copyToClipboard(JSON.stringify({ ...vl, '//': '该功能可实时预览各种布局效果' }, null, 2))
  ElMessage.success('拷贝成功')
}
</script>
