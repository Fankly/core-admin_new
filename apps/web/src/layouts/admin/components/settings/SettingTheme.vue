<template>
  <div v-if="preferences.navLayout !== ESidebarLayoutEnum.Top" class="ds-settings__group">
    <h3 class="ds-settings__label">侧栏风格</h3>
    <div class="ds-settings__theme-pair">
      <button
        v-for="item in sidebarOptions"
        :key="item.value"
        class="ds-settings__theme-card"
        :class="{ 'is-active': sidebarValue === item.value }"
        type="button"
        :aria-pressed="sidebarValue === item.value"
        @click="preferences.set(EThemeSetting.Sidebar, item.value)"
      >
        <span class="ds-theme-preview" :class="`ds-theme-preview--sidebar-${item.value}`" aria-hidden="true"> <i></i><i></i><i></i> </span>
        {{ item.label }}
      </button>
    </div>
  </div>

  <div class="ds-settings__group">
    <h3 class="ds-settings__label">顶栏风格</h3>
    <div class="ds-settings__themes">
      <button
        v-for="item in headerOptions"
        :key="item.value"
        class="ds-settings__theme-card"
        :class="{ 'is-active': headerValue === item.value }"
        type="button"
        :aria-pressed="headerValue === item.value"
        @click="preferences.set(EThemeSetting.TopHeader, item.value)"
      >
        <span class="ds-theme-preview" :class="`ds-theme-preview--header-${item.value}`" aria-hidden="true"></span>
        {{ item.label }}
      </button>
    </div>
  </div>

  <div class="ds-settings__group">
    <h3 class="ds-settings__label">品牌色</h3>
    <div class="ds-settings__swatches">
      <button
        v-for="item in colorOptions"
        :key="item.value"
        class="ds-settings__swatch"
        :class="{ 'is-active': colorValue === item.value }"
        type="button"
        :style="{ backgroundColor: item.value }"
        :aria-label="item.label"
        :aria-pressed="colorValue === item.value"
        :title="item.label"
        @click="preferences.set(EThemeSetting.ThemeColor, item.value)"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

defineOptions({ name: 'SettingTheme' })

const preferences = usePreferencesStore()

const sidebarOptions = [
  { label: '深色导航', value: 'dark' },
  { label: '浅色导航', value: 'light' }
]

const headerOptions = [
  { label: '亮色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '品牌色', value: 'primary' }
]

const colorOptions = [
  { label: '深青', value: '#00706b' },
  { label: '松柏', value: '#1f6f55' },
  { label: '孔雀', value: '#0f7b8a' },
  { label: '靛蓝', value: '#3d5a80' },
  { label: '暮蓝', value: '#4c6a92' },
  { label: '赭石', value: '#8c633c' },
  { label: '绛红', value: '#9b4a44' },
  { label: '石墨', value: '#47524d' }
]

const sidebarValue = computed(() => String(preferences.config[EThemeSetting.Sidebar]))
const headerValue = computed(() => String(preferences.config[EThemeSetting.TopHeader]))
const colorValue = computed(() => String(preferences.config[EThemeSetting.ThemeColor]))
</script>

<style scoped lang="less">
.ds-settings__theme-pair {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.ds-theme-preview {
  position: relative;
  display: flex;
  width: 100%;
  height: 42px;
  padding: 7px;
  overflow: hidden;
  background: var(--ds-surface-subtle);
  border: 1px solid var(--ds-line);
  border-radius: 4px;
}

.ds-theme-preview--sidebar-dark {
  gap: 4px;
  align-items: flex-start;
  background: #f6f9f7;

  &::before {
    width: 28%;
    height: 100%;
    content: '';
    background: #082a25;
    border-radius: 2px;
  }

  i {
    width: 42%;
    height: 4px;
    background: var(--ds-line-strong);
    border-radius: 2px;

    &:nth-child(1) {
      margin-top: 3px;
    }
  }
}

.ds-theme-preview--sidebar-light {
  gap: 4px;
  align-items: flex-start;

  &::before {
    width: 28%;
    height: 100%;
    content: '';
    background: #eef4f0;
    border: 1px solid var(--ds-line);
    border-radius: 2px;
  }

  i {
    width: 42%;
    height: 4px;
    background: var(--ds-line-strong);
    border-radius: 2px;

    &:nth-child(1) {
      margin-top: 3px;
    }
  }
}

.ds-theme-preview--header-light {
  background: #fff;
  border-bottom-color: var(--ds-line);

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 12px;
    content: '';
    background: #fff;
    border-bottom: 1px solid var(--ds-line);
  }
}

.ds-theme-preview--header-dark {
  background: #f6f9f7;

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 12px;
    content: '';
    background: #0a2b26;
  }
}

.ds-theme-preview--header-primary {
  background: #f6f9f7;

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 12px;
    content: '';
    background: var(--ds-jade-600);
  }
}
</style>
