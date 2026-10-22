<template>
  <section class="module-directory" aria-labelledby="module-directory-title">
    <header class="module-directory__head">
      <div><h2 id="module-directory-title">业务模块</h2><p>选择模块开始工作，也可以按名称快速查找。</p></div>
      <span class="module-directory__count">{{ entries.length }} 个可用入口</span>
    </header>
    <div v-if="entries.length" class="module-directory__filters">
      <el-input v-model="query" clearable aria-label="搜索业务模块" placeholder="搜索模块名称" class="module-directory__search">
        <template #prefix><Search :size="16" aria-hidden="true" /></template>
      </el-input>
      <el-select v-model="group" aria-label="筛选业务分组" placeholder="全部分组" class="module-directory__group">
        <el-option label="全部分组" value="" />
        <el-option v-for="name in groups" :key="name" :label="name" :value="name" />
      </el-select>
    </div>
    <div v-if="visibleEntries.length" class="module-directory__list">
      <NavigationLink
        v-for="entry in visibleEntries"
        :key="entry.path"
        :to="entry.external ? entry.href : entry.path"
        :external="entry.external"
        class="module-entry"
      >
        <span class="module-entry__icon" aria-hidden="true"
          ><SvgIcon v-if="entry.icon" :name="entry.icon" /><LayoutGrid v-else :size="19" :stroke-width="1.6"
        /></span>
        <span class="module-entry__body"
          ><span class="module-entry__title">{{ entry.title }}</span
          ><span class="module-entry__group">{{ entry.group }}</span></span
        >
        <ArrowUpRight v-if="entry.external" :size="16" class="module-entry__arrow" aria-hidden="true" /><ChevronRight
          v-else
          :size="16"
          class="module-entry__arrow"
          aria-hidden="true"
        />
      </NavigationLink>
    </div>
    <EmptyState
      v-else
      :title="entries.length ? '没有找到匹配的模块' : '当前账号暂无可用模块'"
      :description="entries.length ? '试试其他名称，或切换到全部分组。' : '模块会根据账号权限开放；如需访问，请联系系统管理员。'"
    >
      <template #icon><Search v-if="entries.length" :size="28" /><LayoutGrid v-else :size="28" /></template>
      <template v-if="entries.length" #actions><button class="ds-button" type="button" @click="resetFilters">清除筛选</button></template>
    </EmptyState>
    <footer v-if="filteredEntries.length" class="module-directory__foot">
      <span role="status">显示 {{ visibleEntries.length }} / {{ filteredEntries.length }} 个入口</span>
      <button v-if="visibleEntries.length < filteredEntries.length" class="ds-button ds-button--quiet" type="button" @click="limit += 12"
        >显示更多 <ChevronDown :size="14" aria-hidden="true"
      /></button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpRight, ChevronDown, ChevronRight, LayoutGrid, Search } from '@lucide/vue'
import { EmptyState, NavigationLink } from '@/design-system'
import SvgIcon from '@/components/base/svg-icon'
import { searchNavigationEntries, type NavigationEntry } from '@/router/navigation'

const props = defineProps<{ entries: NavigationEntry[] }>()
const query = ref('')
const group = ref('')
const limit = ref(12)
const groups = computed(() => [...new Set(props.entries.map((entry) => entry.group))])
const filteredEntries = computed(() => searchNavigationEntries(props.entries, query.value, group.value))
const visibleEntries = computed(() => filteredEntries.value.slice(0, limit.value))
watch([query, group], () => {
  limit.value = 12
})
function resetFilters() {
  query.value = ''
  group.value = ''
}
</script>

<style scoped lang="less">
.module-directory {
  min-width: 0;
}
.module-directory__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 20px;
}
.module-directory__head h2 {
  font-size: var(--ds-text-lg);
}
.module-directory__head p {
  margin-top: 5px;
  font-size: var(--ds-text-md);
  color: var(--ds-ink-secondary);
}
.module-directory__count {
  flex-shrink: 0;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-sm);
}
.module-directory__filters {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.module-directory__search {
  flex: 1;
  min-width: 0;
}
.module-directory__group {
  width: 200px;
}
.module-directory__filters :deep(.el-input__wrapper),
.module-directory__filters :deep(.el-select__wrapper) {
  min-height: 38px;
}
.module-directory__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--ds-line);
}
.module-entry {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
  padding: 20px 12px;
  border-bottom: 1px solid var(--ds-line);
  transition: background var(--ds-duration-fast);
}
.module-entry:nth-child(odd) {
  margin-right: 20px;
}
.module-entry:hover {
  background: var(--ds-surface-subtle);
}
.module-entry__icon {
  flex: 0 0 24px;
  color: var(--ds-jade-600);
}
.module-entry__icon :deep(svg) {
  width: 20px;
  height: 20px;
}
.module-entry__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.module-entry__title {
  color: var(--ds-ink);
  font-size: var(--ds-text-base);
  font-weight: 550;
  overflow-wrap: anywhere;
}
.module-entry__group {
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-sm);
  overflow-wrap: anywhere;
}
.module-entry__arrow {
  flex-shrink: 0;
  color: var(--ds-ink-tertiary);
}
.module-entry:hover .module-entry__title,
.module-entry:hover .module-entry__arrow {
  color: var(--ds-jade-600);
}
.module-directory__foot {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-sm);
}
</style>
