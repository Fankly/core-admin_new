<template>
  <div class="ds-settings__group">
    <span class="ds-settings__label">布局模式</span>
    <div class="ds-layout-options">
      <button
        v-for="item in layouts"
        :key="item.value"
        class="ds-layout-option"
        :class="{ 'is-active': preferences.navLayout === item.value }"
        type="button"
        :aria-pressed="preferences.navLayout === item.value"
        @click="preferences.setNavLayout(item.value)"
      >
        <span class="ds-layout-preview" :class="`ds-layout-preview--${item.value}`" aria-hidden="true">
          <i class="ds-layout-preview__rail"></i>
          <i class="ds-layout-preview__top"></i>
          <i class="ds-layout-preview__body"></i>
        </span>
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ESidebarLayoutEnum } from '@/constants/enum'
import { usePreferencesStore } from '@/store'

defineOptions({ name: 'SettingNavLayout' })

const preferences = usePreferencesStore()

const layouts = [
  { label: '左侧导航', value: ESidebarLayoutEnum.Left },
  { label: '顶部导航', value: ESidebarLayoutEnum.Top },
  { label: '混合导航', value: ESidebarLayoutEnum.Mix }
]
</script>

<style scoped lang="less">
.ds-layout-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.ds-layout-option {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 9px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-xs);
  text-align: left;
  background: var(--ds-surface);
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-sm);

  &:hover {
    border-color: var(--ds-jade-300);
  }

  &.is-active {
    color: var(--ds-jade-700);
    background: var(--ds-jade-50);
    border-color: var(--ds-jade-500);
  }
}

.ds-layout-preview {
  position: relative;
  display: block;
  width: 100%;
  height: 36px;
  overflow: hidden;
  background: var(--ds-surface-subtle);
  border: 1px solid var(--ds-line);
  border-radius: 3px;

  i {
    position: absolute;
    display: block;
    background: var(--ds-line-strong);
  }

  &__rail {
    top: 0;
    bottom: 0;
    left: 0;
    width: 24%;
    background: #d6e5e0;
  }

  &__top {
    top: 0;
    right: 0;
    left: 24%;
    height: 8px;
    background: #e6efe9;
  }

  &__body {
    top: 11px;
    right: 5px;
    bottom: 5px;
    left: calc(24% + 5px);
    background: #f8fbf9;
    border: 1px solid var(--ds-line);
  }

  &--top {
    .ds-layout-preview__rail {
      display: none;
    }

    .ds-layout-preview__top {
      left: 0;
      height: 9px;
      background: #d6e5e0;
    }

    .ds-layout-preview__body {
      left: 5px;
    }
  }

  &--mix {
    .ds-layout-preview__rail {
      top: 9px;
      background: #d6e5e0;
    }

    .ds-layout-preview__top {
      left: 0;
      height: 9px;
      background: #e6efe9;
    }

    .ds-layout-preview__body {
      left: calc(34% + 5px);
    }
  }
}
</style>
