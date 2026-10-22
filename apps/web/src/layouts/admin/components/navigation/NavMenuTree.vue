<template>
  <template v-for="(item, index) in props.menus || []" :key="item.path">
    <el-sub-menu
      v-if="item.children && item.children.length > 0"
      :index="item.path"
      :popper-class="props.className"
      :aria-label="typeof item.meta?.title === 'string' ? item.meta.title : undefined"
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
      <NavMenuTree :menus="item.children" :class-name="props.className" :indent="getChildIndent(item)" />
    </el-sub-menu>

    <el-menu-item
      v-else
      :index="item.path"
      :aria-label="typeof item.meta?.title === 'string' ? item.meta.title : undefined"
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
import type { CSSProperties } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import ReText from '@/components/ReText/src/index.vue'
import SvgIcon from '@/components/base/svg-icon'

defineOptions({ name: 'NavMenuTree' })

interface Props {
  menus?: RouteRecordRaw[]
  hiddenIndex?: number
  className?: string
  indent?: number
}

const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
  hiddenIndex: -1,
  className: '',
  indent: 0
})

// 子级从父级文字起点再缩进；父级图标宽 18px，图标与文字间距 10px。
const getChildIndent = (item: RouteRecordRaw): number => {
  const iconWidth = typeof item.meta?.icon === 'string' && item.meta.icon ? 28 : 0
  return props.indent + iconWidth + 18
}

const getStyle = (index: number): CSSProperties => {
  const isHidden = props.hiddenIndex > -1 && index > props.hiddenIndex
  return { '--ds-nav-indent': `${String(props.indent)}px`, display: isHidden ? 'none' : undefined }
}
</script>
