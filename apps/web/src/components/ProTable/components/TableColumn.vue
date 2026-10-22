<template><RenderTableColumn :column="column" /></template>

<script setup lang="ts">
import { h, inject, ref, unref, useSlots } from 'vue'
import type { VNode } from 'vue'
import { ElTableColumn, ElTag } from 'element-plus'
import type { ColumnProps, RenderScope, HeaderRenderScope, EnumMap } from '../interface'
import { EnumMapInjectionKey } from '../interface'
import { findEnumItem, formatCellValue, getCellValue, getTagType } from '../cell'

defineOptions({ name: 'TableColumn' })
defineProps<{ column: ColumnProps }>()
const slots = useSlots()
const enumMap = inject(EnumMapInjectionKey, ref<EnumMap>(new Map()))
const slotKey = (column: ColumnProps) => column.prop?.split('.').pop() ?? ''
const renderColumn = (item: ColumnProps): VNode | null => {
  if (unref(item.isShow) === false) return null
  const { _children, render, headerRender, tag, isFilterEnum, fieldNames } = item
  const columnProps = { ...item }
  delete columnProps._children
  delete columnProps.render
  delete columnProps.headerRender
  delete columnProps.enum
  delete columnProps.search
  delete columnProps.tag
  delete columnProps.isShow
  delete columnProps.isHide
  delete columnProps.isFilterEnum
  delete columnProps.fieldNames
  return h(
    ElTableColumn,
    {
      ...columnProps,
      align: item.align ?? 'center',
      showOverflowTooltip: item.showOverflowTooltip ?? item.prop !== 'operation'
    },
    {
      default: (scope: RenderScope) => {
        if (_children?.length) return _children.map(renderColumn)
        if (render) return render(scope)
        const slot = slots[slotKey(item)]
        if (slot) return slot(scope)
        const value = getCellValue(scope.row, item.prop ?? '')
        const option = findEnumItem(enumMap.value.get(item.prop ?? '') ?? [], value, fieldNames)
        const label = unref(isFilterEnum) !== false && option ? option[fieldNames?.label ?? 'label'] : value
        const text = formatCellValue(label)
        return unref(tag) ? h(ElTag, { type: getTagType(option) }, () => text) : text
      },
      header: (scope: HeaderRenderScope) => headerRender?.(scope) ?? slots[`${slotKey(item)}Header`]?.(scope) ?? item.label
    }
  )
}
const RenderTableColumn = ({ column }: { column: ColumnProps }) => renderColumn(column)
</script>
