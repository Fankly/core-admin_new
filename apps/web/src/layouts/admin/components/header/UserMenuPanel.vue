<template>
  <nav class="ds-user-menu" :aria-label="SYSTEM_MENU_TITLE" @click="onPanelClick">
    <header class="ds-user-menu__head">
      <span class="ds-user-menu__mark" aria-hidden="true">
        <Settings :size="15" :stroke-width="1.8" />
      </span>
      <span class="ds-user-menu__title">{{ SYSTEM_MENU_TITLE }}</span>
    </header>

    <div class="ds-user-menu__body">
      <ul v-if="items.length" class="ds-user-menu__list">
        <UserMenuNode
          v-for="item in items"
          :key="item.key"
          :item="item"
          :depth="0"
          :active-path="route.path"
          :expanded-path="expandedPath"
          @toggle="toggleGroup"
        />
      </ul>
      <p v-else class="ds-user-menu__empty">暂无可访问的菜单</p>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Settings } from '@lucide/vue'
import { SYSTEM_MENU_TITLE, type UserMenuItem } from '@/utils/menu'
import UserMenuNode from './UserMenuNode.vue'

defineOptions({ name: 'UserMenuPanel' })

const props = defineProps<{ items: UserMenuItem[] }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const expandedPath = ref<string[]>([])

/** 面板只保留一条展开路径：同级互斥，切换子级时保留所有祖先。 */
const toggleGroup = (key: string, depth: number) => {
  const ancestors = expandedPath.value.slice(0, depth)
  expandedPath.value = expandedPath.value[depth] === key ? ancestors : [...ancestors, key]
}

const findActiveBranch = (items: UserMenuItem[], path: string): string[] | null => {
  for (const item of items) {
    if (item.path === path) return item.children.length ? [item.key] : []
    const branch = findActiveBranch(item.children, path)
    if (branch) return [item.key, ...branch]
  }
  return null
}

// 每次打开面板或路由 / 菜单变化时，展开当前页所在的完整分支。
watch(
  [() => props.items, () => route.path],
  () => {
    expandedPath.value = findActiveBranch(props.items, route.path) ?? []
  },
  { immediate: true }
)

/** 叶子用 <a> 导航，点击后收起下拉；展开分组不收起。 */
const onPanelClick = (event: MouseEvent) => {
  const target = event.target
  if (target instanceof Element && target.closest('a')) emit('close')
}
</script>
