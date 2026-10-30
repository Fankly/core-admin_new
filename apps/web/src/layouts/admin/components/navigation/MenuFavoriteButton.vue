<template>
  <button
    type="button"
    class="rr-menu-favorite"
    :class="{ 'is-favorite': favorited }"
    :title="label"
    :aria-label="`${label}：${title}`"
    :aria-pressed="favorited"
    :disabled="disabled"
    @click.stop.prevent="toggle"
    @keydown.stop
    @keyup.stop
  >
    <Star :size="14" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@lucide/vue'
import { useFavoritesStore } from '@/store'

defineOptions({ name: 'MenuFavoriteButton' })

const props = defineProps<{
  menuId: string
  title?: string
  /** 初始是否收藏，来自 /sys/menu/nav 的 isFavorite */
  initialFavorite?: boolean
}>()

const favorites = useFavoritesStore()
const favorited = computed(() => favorites.isFavorite(props.menuId, props.initialFavorite))
const disabled = computed(() => !favorites.canFavorite || favorites.isPending(props.menuId))
const label = computed(() => (favorited.value ? '取消收藏' : '收藏菜单'))

const toggle = async (): Promise<void> => {
  if (disabled.value) return
  const ok = await favorites.toggleFavorite(props.menuId, props.initialFavorite)
  if (!ok) ElMessage.error('收藏操作失败，请稍后重试')
}
</script>
