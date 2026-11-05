<template>
  <RenderTableColumn v-bind="column" />
</template>

<script lang="tsx">
export default {
  name: 'TableColumn'
}
</script>
<script setup lang="tsx" name="TableColumn">
import { inject, ref, useSlots } from 'vue'
import { ColumnProps, RenderScope, HeaderRenderScope } from '../interface'
import { filterEnum, formatValue, handleProp, handleRowAccordingToProp } from '@/utils'
import ColumnFilterPanel from './ColumnFilterPanel.vue'

defineProps<{ column: ColumnProps }>()

const slots = useSlots()

const enumMap = inject('enumMap', ref(new Map()))

// 字段来源说明行显示状态
const showSource = inject('showSource', ref(false))

// 渲染表格数据
const renderCellData = (item: ColumnProps, scope: RenderScope<any>) => {
  return enumMap.value.get(item.prop) && item.isFilterEnum
    ? filterEnum(handleRowAccordingToProp(scope.row, item.prop!), enumMap.value.get(item.prop)!, item.fieldNames)
    : formatValue(handleRowAccordingToProp(scope.row, item.prop!))
}

// 获取 tag 类型
const getTagType = (item: ColumnProps, scope: RenderScope<any>) => {
  return filterEnum(handleRowAccordingToProp(scope.row, item.prop!), enumMap.value.get(item.prop), item.fieldNames, 'tag') || 'primary'
}

const RenderTableColumn = (item: ColumnProps) => {
  return (
    <>
      {item.isShow && (
        <el-table-column {...item} align={item.align ?? 'center'} showOverflowTooltip={item.showOverflowTooltip ?? item.prop !== 'operation'}>
          {{
            default: (scope: RenderScope<any>) => {
              if (item._children) return item._children.map((child) => RenderTableColumn(child))
              if (item.render) return item.render(scope)
              if (slots[handleProp(item.prop!)]) return slots[handleProp(item.prop!)]!(scope)
              if (item.tag) return <el-tag type={getTagType(item, scope)}>{renderCellData(item, scope)}</el-tag>
              return renderCellData(item, scope)
            },
            header: (scope: HeaderRenderScope<any>) => {
              // 原表头内容：headerRender → 具名插槽 → label
              const baseHeader = item.headerRender
                ? item.headerRender(scope)
                : slots[`${handleProp(item.prop!)}Header`]
                ? slots[`${handleProp(item.prop!)}Header`]!(scope)
                : item.label
              // 字段来源说明：仅末级列且开启时，label 下方显示 source
              const showSourceCell = showSource.value && item.source && !item._children
              if (item.filter) {
                // 有筛选图标
                return (
                  <span class="pro-filter-th">
                    <span class="pro-filter-th__label">
                      {showSourceCell ? (
                        <span style="display: flex; flex-direction: column; line-height: 1.4;">
                          <span>{baseHeader}</span>
                          <span style="font-size: 12px; color: #909399; white-space: normal;">{item.source}</span>
                        </span>
                      ) : (
                        baseHeader
                      )}
                    </span>
                    <ColumnFilterPanel column={item} />
                  </span>
                )
              }
              if (showSourceCell) {
                return (
                  <div style="display: flex; flex-direction: column; line-height: 1.4;">
                    <span>{baseHeader}</span>
                    <span style="font-size: 12px; color: #909399; white-space: normal;">{item.source}</span>
                  </div>
                )
              }
              return baseHeader
            }
          }}
        </el-table-column>
      )}
    </>
  )
}
</script>

<style lang="less" scoped>
:deep(.pro-filter-th) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
