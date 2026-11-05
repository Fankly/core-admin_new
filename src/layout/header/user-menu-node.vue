<template>
  <li v-if="hasChildren" class="rr-user-menu__group">
    <button
      class="rr-user-menu__toggle"
      :class="{ 'is-active': containsActive }"
      type="button"
      :style="indentStyle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="rr-user-menu__label">{{ item.title }}</span>
      <ChevronDown class="rr-user-menu__chevron" :class="{ 'is-open': open }" :size="13" :stroke-width="2" aria-hidden="true" />
    </button>
    <ul v-if="open" class="rr-user-menu__children">
      <user-menu-node v-for="child in item.children" :key="child.key" :item="child" :depth="depth + 1" :active-path="activePath"></user-menu-node>
    </ul>
  </li>
  <el-dropdown-item v-else :command="item" :class="['rr-user-menu__leaf', { 'is-active': item.path === activePath }]" :style="indentStyle">
    <span class="rr-user-menu__label">{{ item.title }}</span>
  </el-dropdown-item>
</template>

<script setup lang="ts" name="userMenuNode">
import { ChevronDown } from 'lucide-vue-next'
import { computed, PropType, ref, watch } from 'vue'
import type { IUserMenuItem } from '@/utils/menu'

const props = defineProps({
  item: { type: Object as PropType<IUserMenuItem>, required: true },
  depth: { type: Number, default: 0 },
  activePath: { type: String, default: '' }
})

const hasChildren = computed(() => props.item.children.length > 0)
const containsActive = computed(() => {
  const walk = (item: IUserMenuItem): boolean => item.path === props.activePath || item.children.some(walk)
  return !!props.activePath && walk(props.item)
})
const open = ref(containsActive.value)

// 从页签 / 面包屑切到系统管理页面后再次打开下拉时，自动展开所在分组
watch(
  () => props.activePath,
  (path, prev) => {
    if (path && path !== prev && containsActive.value) open.value = true
  }
)

// 与 el-dropdown-item 的默认横向内边距对齐，再按层级递进
const indentStyle = computed(() => ({ paddingLeft: `${16 + props.depth * 16}px` }))
</script>
