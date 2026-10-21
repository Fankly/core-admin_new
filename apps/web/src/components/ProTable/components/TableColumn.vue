<template>
  <RenderTableColumn v-bind="column" />
</template>

<script setup lang="ts">
import { Fragment, h, inject, ref, useSlots } from 'vue'
import type { VNode } from 'vue'
import { ElTableColumn, ElTag } from 'element-plus'
import type { ColumnProps, RenderScope, HeaderRenderScope, EnumMap, TableRow } from '@/components/ProTable/interface'
import { EnumMapInjectionKey } from '@/components/ProTable/interface'
import { filterEnum, formatValue, handleProp, handleRowAccordingToProp } from '@/utils'

defineOptions({ name: 'TableColumn' })

defineProps<{ column: ColumnProps }>()

const slots = useSlots()

const enumMap = inject(EnumMapInjectionKey, ref<EnumMap>(new Map()))

type CellScope = RenderScope<TableRow>

// 渲染表格数据。prop 缺省时按空串兜底，避免对可空字段做非空断言。
function renderCellData(item: ColumnProps, scope: CellScope) {
  const value = handleRowAccordingToProp(scope.row, item.prop ?? '')
  const enumItem = item.prop == null ? undefined : enumMap.value.get(item.prop)
  if (enumItem && item.isFilterEnum) return filterEnum(value, enumItem, item.fieldNames)
  return formatValue(value)
}

// 获取 tag 类型
function getTagType(item: ColumnProps, scope: CellScope) {
  const enumItem = item.prop == null ? undefined : enumMap.value.get(item.prop)
  return filterEnum(handleRowAccordingToProp(scope.row, item.prop ?? ''), enumItem, item.fieldNames, 'tag') || 'primary'
}

const RenderTableColumn = (item: ColumnProps): VNode => {
  const column = h(
    ElTableColumn,
    {
      ...item,
      align: item.align ?? 'center',
      showOverflowTooltip: item.showOverflowTooltip ?? item.prop !== 'operation'
    },
    {
      default: (scope: CellScope) => {
        if (item._children) return item._children.map((child) => RenderTableColumn(child))
        if (item.render) return item.render(scope)
        const slot = slots[handleProp(item.prop ?? '')]
        if (slot) return slot(scope)
        if (item.tag) return h(ElTag, { type: getTagType(item, scope) }, { default: () => renderCellData(item, scope) })
        return renderCellData(item, scope)
      },
      header: (scope: HeaderRenderScope<TableRow>) => {
        if (item.headerRender) return item.headerRender(scope)
        const headerSlot = slots[`${handleProp(item.prop ?? '')}Header`]
        if (headerSlot) return headerSlot(scope)
        return item.label
      }
    }
  )
  // 与原 JSX fragment 等价：isShow 为假时渲染空节点
  return h(Fragment, item.isShow ? [column] : [])
}
</script>
