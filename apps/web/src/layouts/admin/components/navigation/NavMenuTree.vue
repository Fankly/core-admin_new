<template>
  <template v-for="(item, index) in props.menus || []" :key="item.path">
    <el-sub-menu
      v-if="item.children && item.children.length > 0"
      :index="item.path"
      :popper-class="props.className"
      :aria-label="typeof item.meta?.title === 'string' ? item.meta.title : undefined"
      :class="classNames('rr-sidebar-menu-entry', { isMore: item.meta?.isMore })"
      :style="getStyle(index)"
      :data-nav-level="Math.min(props.level, 4)"
      :data-nav-path="item.path"
    >
      <template #title>
        <el-icon
          v-if="props.levelIcons || (typeof item.meta?.icon === 'string' && item.meta.icon)"
          class="rr-sidebar-menu-entry__icon"
          aria-hidden="true"
        >
          <component :is="levelIcon" v-if="levelIcon" />
          <span v-else-if="props.levelIcons" class="rr-sidebar-menu-entry__dot"></span>
          <svg-icon v-else :name="String(item.meta?.icon)" />
        </el-icon>
        <span v-if="props.levelIcons && props.level === 1" class="rr-sidebar-menu-entry__short" aria-hidden="true">{{ shortTitle(item) }}</span>
        <span class="rr-sidebar-menu-entry__label" :title="item.meta?.title">
          <ReText :preserve-whitespace="true">{{ item.meta?.title }}</ReText>
        </span>
      </template>
      <NavMenuTree
        :menus="item.children"
        :class-name="props.className"
        :indent="getChildIndent()"
        :level="props.level + 1"
        :level-icons="props.levelIcons"
      />
    </el-sub-menu>

    <el-menu-item
      v-else
      :index="item.path"
      :aria-label="typeof item.meta?.title === 'string' ? item.meta.title : undefined"
      :class="
        classNames('rr-sidebar-menu-entry', {
          isLink: !!item.meta?.isNewPage,
          isMore: item.meta?.isMore,
          'has-favorite': Boolean(item.meta?.id)
        })
      "
      :style="getStyle(index)"
      :data-nav-level="Math.min(props.level, 4)"
      :data-nav-path="item.path"
    >
      <el-icon
        v-if="props.levelIcons || (typeof item.meta?.icon === 'string' && item.meta.icon)"
        class="rr-sidebar-menu-entry__icon"
        aria-hidden="true"
      >
        <component :is="levelIcon" v-if="levelIcon" />
        <span v-else-if="props.levelIcons" class="rr-sidebar-menu-entry__dot"></span>
        <svg-icon v-else :name="String(item.meta?.icon)" />
      </el-icon>
      <span v-if="props.levelIcons && props.level === 1" class="rr-sidebar-menu-entry__short" aria-hidden="true">{{ shortTitle(item) }}</span>
      <template #title>
        <span class="rr-sidebar-menu-entry__label" :title="item.meta?.title">
          <a v-if="item.meta?.isNewPage" :href="String(item.meta.url)" target="_blank" rel="noopener noreferrer">
            <ReText :preserve-whitespace="true">{{ item.meta?.title }}</ReText>
          </a>
          <ReText v-else :preserve-whitespace="true">{{ item.meta?.title }}</ReText>
        </span>
        <MenuFavoriteButton
          v-if="item.meta?.id"
          :menu-id="item.meta.id"
          :title="typeof item.meta?.title === 'string' ? item.meta.title : ''"
          :initial-favorite="Boolean(item.meta.isFavorite)"
        />
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import classNames from 'classnames'
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { FileText, Folder, Layers } from '@lucide/vue'
import ReText from '@/components/ReText/src/index.vue'
import SvgIcon from '@/components/base/svg-icon'
import MenuFavoriteButton from './MenuFavoriteButton.vue'

defineOptions({ name: 'NavMenuTree' })

interface Props {
  menus?: RouteRecordRaw[]
  hiddenIndex?: number
  className?: string
  indent?: number
  /** 1 为一级菜单；子级递归 +1 */
  level?: number
  /**
   * 纵向侧栏使用「层级图标」：L1 层叠 / L2 文件夹 / L3 文件 / L4 及更深圆点。
   * 顶部与混合布局的横排导航仍显示服务端配置的图标。
   */
  levelIcons?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
  hiddenIndex: -1,
  className: '',
  indent: 0,
  level: 1,
  levelIcons: false
})

/** 图标只由层级决定：L1 层叠 · L2 文件夹 · L3 文件 · L4 及以下圆点 */
const LEVEL_ICONS = [Layers, Folder, FileText]

const levelIcon = computed(() => (props.levelIcons ? LEVEL_ICONS[props.level - 1] : undefined))

const shortTitle = (item: RouteRecordRaw): string => {
  const title = item.meta?.title
  return typeof title === 'string' ? title.slice(0, 2) : ''
}

// 参考 `sidebar-nav.less`：缩进按层级累加，每级固定 14px，与图标宽度无关。
const STEP = 14

const getChildIndent = (): number => props.indent + STEP

const getStyle = (index: number): CSSProperties => {
  const isHidden = props.hiddenIndex > -1 && index > props.hiddenIndex
  return { '--ds-nav-indent': `${String(props.indent)}px`, display: isHidden ? 'none' : undefined }
}
</script>
