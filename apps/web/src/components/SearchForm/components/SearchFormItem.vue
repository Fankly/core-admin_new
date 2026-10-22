<template>
  <component
    style="width: 100%"
    :is="column.search?.render ?? `el-${column.search?.el}`"
    v-bind="{ ...handleSearchProps, ...placeholder, searchParam: _searchParam, clearable }"
    v-model="_searchParam[searchKey]"
    :data="column.search?.el === 'tree-select' ? columnEnum : []"
    :options="['cascader', 'select-v2'].includes(column.search?.el ?? '') ? columnEnum : []"
  >
    <template v-if="column.search?.el === 'cascader'" #default="{ data }">
      <span>{{ data[fieldNames.label] }}</span>
    </template>
    <template v-if="column.search?.el === 'select'">
      <component
        :is="`el-option`"
        v-for="(col, index) in columnEnum"
        :key="index"
        :label="String(col[fieldNames.label] ?? '')"
        :value="col[fieldNames.value]"
      ></component>
    </template>
    <slot v-else></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, inject, ref, unref } from 'vue'
import { formatCellValue } from '@/components/ProTable/cell'
import { getSearchKey } from '@/components/ProTable/useColumns'
import type { ColumnProps, EnumMap, EnumProps, SearchParams } from '@/components/ProTable/interface'
import { EnumMapInjectionKey } from '@/components/ProTable/interface'

interface SearchFormItem {
  column: ColumnProps
  searchParam: SearchParams
}
const props = defineProps<SearchFormItem>()

// Re receive SearchParam
defineOptions({ name: 'SearchFormItem' })
const searchKey = computed(() => getSearchKey(props.column))
const _searchParam = computed(() => props.searchParam)

// 判断 fieldNames 设置 label && value && children 的 key 值
const fieldNames = computed(() => {
  return {
    label: props.column.fieldNames?.label ?? 'label',
    value: props.column.fieldNames?.value ?? 'value',
    children: props.column.fieldNames?.children ?? 'children'
  }
})

// 接收 enumMap (el 为 select-v2 需单独处理 enumData)
const enumMap = inject(EnumMapInjectionKey, ref<EnumMap>(new Map()))
const columnEnum = computed<EnumProps[]>(() => {
  const enumData = enumMap.value.get(props.column.prop ?? '')
  if (!enumData) return []
  if (props.column.search?.el === 'select-v2' && props.column.fieldNames) {
    return enumData.map((item) => {
      return { ...item, label: formatCellValue(item[fieldNames.value.label]), value: item[fieldNames.value.value] as EnumProps['value'] }
    })
  }
  return enumData
})

// 处理透传的 searchProps (el 为 tree-select、cascader 的时候需要给下默认 label && value && children)
const asRecord = (value: unknown): Record<string, unknown> => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {})
const handleSearchProps = computed(() => {
  const label = fieldNames.value.label
  const value = fieldNames.value.value
  const children = fieldNames.value.children
  const searchEl = props.column.search?.el
  let searchProps = props.column.search?.props ?? {}
  if (searchEl === 'tree-select') {
    searchProps = { ...searchProps, props: { ...asRecord(searchProps.props), label, children }, nodeKey: value }
  }
  if (searchEl === 'cascader') {
    searchProps = { ...searchProps, props: { ...asRecord(searchProps.props), label, value, children } }
  }
  return searchProps
})

// 处理默认 placeholder
const placeholder = computed(() => {
  const search = props.column.search
  if (
    ['datetimerange', 'daterange', 'monthrange'].includes(typeof search?.props?.type === 'string' ? search.props.type : '') ||
    search?.props?.isRange
  ) {
    return {
      rangeSeparator: search?.props?.rangeSeparator ?? '至',
      startPlaceholder: search?.props?.startPlaceholder ?? '开始时间',
      endPlaceholder: search?.props?.endPlaceholder ?? '结束时间'
    }
  }
  const placeholder = typeof search?.props?.placeholder === 'string' ? search.props.placeholder : search?.el?.includes('input') ? '请输入' : '请选择'
  return { placeholder }
})

// 是否有清除按钮 (当搜索项有默认值时，清除按钮不显示)
const clearable = computed(() => {
  const search = props.column.search
  return typeof search?.props?.clearable === 'boolean' ? search.props.clearable : unref(search?.defaultValue) == null
})
</script>

<style scoped>
:deep(.el-range-separator) {
  width: 8% !important;
}
</style>
