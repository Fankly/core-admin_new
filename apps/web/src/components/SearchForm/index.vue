<template>
  <div v-if="columns.length" class="table-search">
    <el-form label-width="auto" label-position="right" :model="searchParam" @submit.prevent="search">
      <Grid ref="gridRef" :collapsed="collapsed" :gap="[20, 0]" :cols="searchCol">
        <GridItem v-for="(item, index) in columns" :key="getSearchKey(item)" v-bind="getResponsive(item)" :index="index">
          <el-form-item>
            <template #label>
              <el-space :size="4">
                <span>{{ item.search?.label ?? item.label ?? '' }}</span>
                <el-tooltip v-if="item.search?.tooltip" effect="dark" :content="item.search?.tooltip" placement="top">
                  <i :class="'iconfont icon-yiwen'"></i>
                </el-tooltip>
              </el-space>
              <span>&nbsp;:</span>
            </template>
            <SearchFormItem :column="item" :search-param="searchParam" />
          </el-form-item>
        </GridItem>
        <GridItem suffix>
          <div class="operation" style="text-align: right; margin-bottom: 10px">
            <el-button size="small" type="primary" native-type="submit">查询</el-button>
            <el-button size="small" @click="reset">重置</el-button>
            <el-button v-if="showCollapse" size="small" text :aria-expanded="!collapsed" @click="collapsed = !collapsed">{{
              collapsed ? '展开筛选' : '收起筛选'
            }}</el-button>
          </div>
        </GridItem>
      </Grid>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { getSearchKey } from '@/components/ProTable/useColumns'
import type { ColumnProps } from '@/components/ProTable/interface'
import type { GridInstance, GridColumns } from '@/components/Grid/interface'
import { getGridColumns, getHiddenIndex } from '@/components/Grid/layout'
import type { SearchParams } from '@/components/ProTable/interface'
import SearchFormItem from './components/SearchFormItem.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'

defineOptions({ name: 'SearchForm' })

interface SearchFormProps {
  columns?: ColumnProps[]
  searchParam?: SearchParams
  searchCol: GridColumns
  search: () => void | Promise<void>
  reset: () => void | Promise<void>
}
const props = withDefaults(defineProps<SearchFormProps>(), { columns: () => [], searchParam: () => ({}) })

// 获取响应式设置
const getResponsive = (item: ColumnProps) => {
  return {
    span: item.search?.span,
    offset: item.search?.offset ?? 0,
    md: item.search?.md,
    lg: item.search?.lg,
    xl: item.search?.xl
  }
}

// 是否默认折叠搜索项
const collapsed = ref(false)

const gridRef = ref<GridInstance | null>(null)
const showCollapse = computed(() => {
  const breakpoint = gridRef.value?.breakPoint ?? 'xl'
  const cols = getGridColumns(props.searchCol, breakpoint)
  const fields = props.columns.map((column) => getResponsive(column))
  return getHiddenIndex([...fields, { suffix: true }], breakpoint, cols) !== -1
})
</script>
