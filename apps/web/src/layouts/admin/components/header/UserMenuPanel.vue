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
        <UserMenuNode v-for="item in items" :key="item.key" :item="item" :depth="0" :active-path="route.path" />
      </ul>
      <p v-else class="ds-user-menu__empty">暂无可访问的菜单</p>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Settings } from '@lucide/vue'
import { SYSTEM_MENU_TITLE, type UserMenuItem } from '@/utils/menu'
import UserMenuNode from './UserMenuNode.vue'

defineOptions({ name: 'UserMenuPanel' })

defineProps<{ items: UserMenuItem[] }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()

/** 叶子用 <a> 导航，点击后收起下拉；展开分组不收起。 */
const onPanelClick = (event: MouseEvent) => {
  const target = event.target
  if (target instanceof Element && target.closest('a')) emit('close')
}
</script>
