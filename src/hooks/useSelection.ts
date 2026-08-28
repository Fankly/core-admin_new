import { useElTableSelectionHighlight } from "@/utils/tableSelectionHighlight";
import { ref, computed } from "vue";

interface returnValue {
  [key: string]: any;
}
/**
 * @description 表格多选数据操作
 * @param {String} rowKey 当表格可以多选时，所指定的 id
 * */
export const useSelection = (rowKey = "id", tableRef: any): returnValue => {
  const isSelected = ref<boolean>(false);
  const selectedList = ref<{ [key: string]: any }[]>([]);

  const { handleSelectionChange: eltableSelectionChange, resetSelction } =
    useElTableSelectionHighlight(tableRef);

  // 当前选中的所有 ids 数组
  const selectedListIds = computed((): string[] => {
    const ids: string[] = [];
    selectedList.value.forEach((item) => ids.push(item[rowKey]));
    return ids;
  });

  /**
   * @description 多选操作
   * @param {Array} rowArr 当前选择的所有数据
   * @return void
   */
  const selectionChange = (rowArr: { [key: string]: any }[]) => {
    rowArr.length ? (isSelected.value = true) : (isSelected.value = false);
    rowArr.length ? eltableSelectionChange(rowArr) : resetSelction();
    selectedList.value = rowArr;
  };

  return {
    isSelected,
    selectedList,
    selectedListIds,
    selectionChange
  };
};
