<template>
  <button
    type="button"
    :class="['rr-menu-favorite', { 'is-favorite': favorited }]"
    :title="label"
    :aria-label="`${label}：${title}`"
    :aria-pressed="favorited"
    :disabled="disabled"
    @click.stop.prevent="toggle"
    @keydown.stop
    @keyup.stop
  >
    <star aria-hidden="true" />
  </button>
</template>
<script lang="ts">
import { ElMessage } from 'element-plus'
import { Star } from 'lucide-vue-next'
import { computed, defineComponent } from 'vue'
import { useMenuFavoritesContext } from './menu-favorites'

export default defineComponent({
  name: 'MenuFavoriteButton',
  components: { Star },
  props: {
    menuId: { type: String, required: true },
    title: { type: String, default: '' },
    /** 初始是否收藏，来自菜单数据（/sys/menu/nav 的 isFavorite） */
    isFavorite: Boolean
  },
  setup(props) {
    const favorites = useMenuFavoritesContext()
    const favorited = computed(() => favorites.isFavorite(props.menuId, props.isFavorite))
    const disabled = computed(() => !favorites.canFavorite.value || favorites.isPending(props.menuId))
    const label = computed(() => (favorited.value ? '取消收藏' : '收藏菜单'))
    const toggle = async () => {
      if (favorites.isPending(props.menuId)) return
      const ok = await favorites.toggleFavorite(props.menuId, props.isFavorite)
      if (!ok) ElMessage.error('收藏操作失败，请稍后重试')
    }
    return { favorites, favorited, disabled, label, toggle }
  }
})
</script>
<style lang="less">
.rr-menu-favorite {
  display: inline-flex;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--nav-text-dim, #94a3b8);
  vertical-align: middle;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;

  svg {
    width: 15px;
    height: 15px;
    stroke-width: 1.75;
  }

  &:hover {
    color: var(--nav-primary, #00706b);
    background: var(--nav-hover, rgb(0 112 107 / 8%));
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -2px;
  }

  &.is-favorite {
    color: #b77908;

    svg {
      fill: currentColor;
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.ui-sidebar-dark .rr-menu-favorite.is-favorite {
  color: #f6cc6a;
}
</style>
