<template>
  <template v-for="(item, index) in props.menus || []" :key="item.path">
    <el-sub-menu
      v-if="item.children && item.children.length > 0"
      :index="item.path"
      :popper-class="props.className"
      :class="classNames('rr-sidebar-menu-entry', { isMore: item.meta?.isMore })"
      :style="getStyle(index)"
    >
      <template #title>
        <el-icon v-if="typeof item.meta?.icon === 'string' && item.meta.icon" class="rr-sidebar-menu-entry__icon">
          <svg-icon :name="item.meta.icon" />
        </el-icon>
        <span class="rr-sidebar-menu-entry__label" :title="item.meta?.title">
          <ReText :preserve-whitespace="true">{{ item.meta?.title }}</ReText>
        </span>
      </template>
      <NavMenuTree :menus="item.children" :class-name="props.className" />
    </el-sub-menu>

    <el-menu-item
      v-else
      :index="item.path"
      :class="classNames('rr-sidebar-menu-entry', { isLink: !!item.meta?.isNewPage, isMore: item.meta?.isMore })"
      :style="getStyle(index)"
    >
      <el-icon v-if="typeof item.meta?.icon === 'string' && item.meta.icon" class="rr-sidebar-menu-entry__icon">
        <svg-icon :name="item.meta.icon" />
      </el-icon>
      <template #title>
        <span class="rr-sidebar-menu-entry__label" :title="item.meta?.title">
          <a v-if="item.meta?.isNewPage" :href="String(item.meta.url)" target="_blank" rel="noopener noreferrer">
            <ReText :preserve-whitespace="true">{{ item.meta?.title }}</ReText>
          </a>
          <ReText v-else :preserve-whitespace="true">{{ item.meta?.title }}</ReText>
        </span>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import classNames from 'classnames'
import type { RouteRecordRaw } from 'vue-router'
import ReText from '@/components/ReText/src/index.vue'
import SvgIcon from '@/components/base/svg-icon'

defineOptions({ name: 'NavMenuTree' })

interface Props {
  menus?: RouteRecordRaw[]
  hiddenIndex?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
  hiddenIndex: -1,
  className: ''
})

const getStyle = (index: number): string => {
  const isHidden = props.hiddenIndex > -1 && index > props.hiddenIndex
  return isHidden ? 'display: none' : ''
}
</script>
