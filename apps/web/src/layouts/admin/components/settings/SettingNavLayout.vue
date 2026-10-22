<template>
  <div class="ds-settings__group">
    <h3 class="ds-settings__label">导航布局</h3>
    <div class="ds-layout-options">
      <button
        v-for="item in layouts"
        :key="item.value"
        class="ds-layout-option"
        :class="{ 'is-active': preferences.navLayout === item.value }"
        type="button"
        :aria-label="item.label"
        :aria-describedby="`layout-description-${item.value}`"
        :aria-pressed="preferences.navLayout === item.value"
        @click="preferences.setNavLayout(item.value)"
      >
        <span class="ds-layout-preview" :class="`ds-layout-preview--${item.value}`" aria-hidden="true">
          <i class="ds-layout-preview__rail"></i>
          <i class="ds-layout-preview__top"></i>
          <i class="ds-layout-preview__body"></i>
        </span>
        <span class="ds-layout-option__content">
          <span class="ds-layout-option__title">{{ item.label }}</span>
          <span :id="`layout-description-${item.value}`" class="ds-layout-option__description">{{ item.description }}</span>
        </span>
        <span class="ds-layout-option__check" aria-hidden="true"><Check v-if="preferences.navLayout === item.value" :size="14" /></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ESidebarLayoutEnum } from '@/constants/enum'
import { Check } from '@lucide/vue'
import { usePreferencesStore } from '@/store'

defineOptions({ name: 'SettingNavLayout' })

const preferences = usePreferencesStore()

const layouts = [
  { label: '左侧导航', description: '全部菜单在左侧，按层级展开。', value: ESidebarLayoutEnum.Left },
  { label: '顶部导航', description: '全部菜单在顶部，悬停展开子菜单。', value: ESidebarLayoutEnum.Top },
  { label: '混合导航', description: '顶部选择业务模块，左侧显示该模块菜单。', value: ESidebarLayoutEnum.Mix }
]
</script>

<style scoped lang="less">
.ds-layout-options {
  display: grid;
  gap: 8px;
}

.ds-layout-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-sm);
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

  &:focus-visible {
    outline: 2px solid var(--ds-jade-500);
    outline-offset: 2px;
  }
}

.ds-layout-option__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.ds-layout-option__title {
  font-size: var(--ds-text-md);
  font-weight: 600;
}

.ds-layout-option__description {
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-xs);
  line-height: 1.6;
}

.ds-layout-option__check {
  display: grid;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  color: var(--ds-surface);
  border: 1px solid var(--ds-line-strong);
  border-radius: 50%;
  place-items: center;
}

.is-active .ds-layout-option__check {
  background: var(--ds-jade-600);
  border-color: var(--ds-jade-600);
}

.ds-layout-preview {
  position: relative;
  display: block;
  flex: 0 0 78px;
  width: 78px;
  height: 48px;
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
      left: calc(24% + 5px);
    }
  }
}
</style>
