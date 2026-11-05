<template>
  <template v-for="(x, index) in props.menus || []" :key="x.path">
    <el-submenu
      v-if="x.children && x.children.length > 0"
      :index="x.path"
      :popper-class="props.className"
      :class="classNames('rr-sidebar-menu-entry', { isMore: x.meta?.isMore })"
      :style="getStyle(index)"
    >
      <template #title>
        <i v-if="x.meta?.icon" class="el-icon-dot rr-sidebar-menu-entry__icon">
          <svg-icon :name="`${x.meta.icon}`"></svg-icon>
        </i>
        <span class="rr-sidebar-menu-entry__label">
          <a tabindex="-1">
            <ReText :preserve-whitespace="true">
              {{ x.meta?.title }}
            </ReText>
          </a>
        </span>
      </template>
      <sidebar-menus-items :menus="x.children" :className="props.className" :allow-favorites="props.allowFavorites"></sidebar-menus-items>
    </el-submenu>

    <el-menu-item
      v-else
      :index="x.path"
      :class="classNames('rr-sidebar-menu-entry', { isLink: !!x.meta?.isNewPage, isMore: x.meta?.isMore, 'has-favorite': props.allowFavorites })"
      :style="getStyle(index)"
    >
      <i v-if="x.meta?.icon" class="el-icon-dot rr-sidebar-menu-entry__icon">
        <svg-icon :name="`${x.meta.icon}`"></svg-icon>
      </i>
      <template #title>
        <span class="rr-sidebar-menu-entry__label">
          <a v-if="x.meta?.isNewPage" :href="`${x.meta.url}`" target="_blank">
            <ReText :preserve-whitespace="true">
              {{ x.meta.title }}
            </ReText>
          </a>
          <a v-else tabindex="-1">
            <ReText :preserve-whitespace="true">
              {{ x.meta?.title }}
            </ReText>
          </a>
        </span>
        <menu-favorite-button
          v-if="props.allowFavorites && !!x.meta?.id"
          :menu-id="String(x.meta?.id)"
          :title="String(x.meta?.title || '')"
          :is-favorite="!!x.meta?.isFavorite"
        />
      </template>
    </el-menu-item>
  </template>
</template>
<script lang="ts">
import ReText from '@/components/ReText/src/index.vue'
import SvgIcon from '@/components/base/svg-icon'
import classNames from 'classnames'
import { defineComponent, PropType } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import MenuFavoriteButton from './menu-favorite-button.vue'

export default defineComponent({
  name: 'SidebarMenusItems',
  components: { ReText, SvgIcon, MenuFavoriteButton },
  props: {
    menus: Array as PropType<RouteRecordRaw[]>,
    hiddenIndex: Number,
    allowFavorites: Boolean,
    className: String
  },
  setup(props) {
    const getStyle = (index: number): string => {
      const isHidden = typeof props.hiddenIndex === 'number' && props.hiddenIndex > -1 && index > props.hiddenIndex
      return isHidden ? 'display:none' : ''
    }
    return { props, classNames, getStyle }
  }
})
</script>
<style lang="less">
.rr-sidebar-menu-entry.el-menu-item.has-favorite {
  display: flex;
  align-items: center;
  gap: 8px;

  > .rr-sidebar-menu-entry__label {
    flex: 1;
    min-width: 0;
  }
}
</style>
