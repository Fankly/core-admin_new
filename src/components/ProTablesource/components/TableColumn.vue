<template>
  <RenderColumn v-bind="column" />
</template>

<script lang="tsx">
export default {
  name: 'TableColumn'
}
</script>
<script setup lang="tsx" name="TableColumn">
import { inject, ref, useSlots } from 'vue'
import { ColumnProps, RenderScope, HeaderRenderScope } from '@/components/ProTablesource/interface'
import { filterEnum, formatValue, handleProp, handleRowAccordingToProp } from '@/utils'

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
              if (item._children) return item._children.map((child) => RenderColumn(child))
              if (item.render) return item.render(scope)
              if (slots[handleProp(item.prop!)]) return slots[handleProp(item.prop!)]!(scope)
              if (item.tag) return <el-tag type={getTagType(item, scope)}>{renderCellData(item, scope)}</el-tag>
              return renderCellData(item, scope)
            },
            header: (scope: HeaderRenderScope<any>) => {
              if (item.headerRender) return item.headerRender(scope)
              if (slots[`${handleProp(item.prop!)}Header`]) return slots[`${handleProp(item.prop!)}Header`]!(scope)
              // 字段来源说明：仅末级列且开启时，在 label 下方显示 source
              if (showSource.value && item.source && !item._children) {
                return (
                  <div class="pro-source-header" style="display: flex; flex-direction: column; line-height: 1.4;">
                    <span class="pro-source-label">{item.label}</span>
                    <span class="pro-source-cell" style="font-size: 12px; color: #909399; white-space: normal;">
                      {item.source}
                    </span>
                  </div>
                )
              }
              return item.label
            }
          }}
        </el-table-column>
      )}
    </>
  )
}

const RenderColumn = (item: ColumnProps) => {
  return RenderTableColumn(item)
}
</script>
