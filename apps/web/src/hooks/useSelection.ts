import { useElTableSelectionHighlight } from '@/utils/tableSelectionHighlight'
import { computed, shallowRef, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { TableInstance } from 'element-plus'
import type { TableRow } from '@/components/ProTable/interface'

export const useSelection = (rowKey: MaybeRefOrGetter<string> = 'id', tableRef: Ref<TableInstance | null | undefined>) => {
  const selectedList = shallowRef<TableRow[]>([])
  const isSelected = computed(() => selectedList.value.length > 0)
  const selectedListIds = computed(() => selectedList.value.map((row) => row[toValue(rowKey)]))
  const { handleSelectionChange, resetSelction } = useElTableSelectionHighlight(tableRef)
  const selectionChange = (rows: TableRow[]) => {
    selectedList.value = rows
    if (rows.length) handleSelectionChange(rows)
    else resetSelction()
  }
  return { isSelected, selectedList, selectedListIds, selectionChange }
}
