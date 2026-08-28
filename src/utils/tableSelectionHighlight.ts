import { ref, onMounted, onBeforeUnmount, Ref } from "vue";
import type { ElTable } from "element-plus";
import { debounce } from "lodash";

type ElTableInstance = InstanceType<typeof ElTable>;

type VxeTableInstance = {
  getTableData: () => {
    fullData?: any[];
  };
  getRowById: (rowid: string) => any;
  getCheckboxRecords?: () => any;
  $el: HTMLElement;
};

type TableRowData = Record<string, any>;

const SELECTED_ROW_CLASS = "checked-row";

let styleElement: HTMLStyleElement | null = null;

const rowKeyCache = new WeakMap<TableRowData, string>();

const ensureStyleElement = () => {
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.innerHTML = `
      .el-table .${SELECTED_ROW_CLASS} td {
        background-color: rgba(3, 112, 107, 0.5) !important;
      }
      .vxe-table .${SELECTED_ROW_CLASS} td {
        background-color: rgba(3, 112, 107, 0.5) !important;
      }
    `;
    document.head.appendChild(styleElement);
  }
};

const getRowKey = (row: any): string => {
  if (!row) return "";
  if (rowKeyCache.has(row)) {
    return rowKeyCache.get(row) || "";
  }

  for (const key of ["id", "_X_ROW_KEY", "rowId", "rowkey", "key"]) {
    if (row[key] !== undefined) {
      const keyValue = String(row[key]);
      rowKeyCache.set(row, keyValue);
      return keyValue;
    }
  }

  try {
    const keyValue = JSON.stringify(row);
    rowKeyCache.set(row, keyValue);
    return keyValue;
  } catch (error) {
    return "";
  }
};

export const useElTableSelectionHighlight = (tableRef: Ref<ElTableInstance | null>) => {
  ensureStyleElement();

  const selectedRows = ref<TableRowData[]>([]);

  const debouncedApplyRowHighlights = debounce(() => {
    if (!tableRef.value || selectedRows.value.length === 0) return;
    const tableData = tableRef.value.data || [];
    const rows = tableRef.value.$el.querySelectorAll(".el-table__row");
    const rowKey = (tableRef.value.rowKey as string) || "";

    const selectedKeys = new Set(
      selectedRows.value.map((row) =>
        rowKey && row[rowKey] !== undefined ? row[rowKey] : getRowKey(row)
      )
    );

    rows.forEach((row: Element, index: number) => {
      const rowData = tableData[index];
      if (!rowData) return;

      const rowKeyValue =
        rowKey && rowData[rowKey] !== undefined ? rowData[rowKey] : getRowKey(rowData);
      const isSelected = selectedKeys.has(rowKeyValue);

      if (isSelected) {
        row.classList.add(SELECTED_ROW_CLASS);
      } else {
        row.classList.remove(SELECTED_ROW_CLASS);
      }
    });
  }, 16);

  const cleanupRowClasses = () => {
    if (tableRef.value) {
      const rows = tableRef.value.$el.querySelectorAll(`.${SELECTED_ROW_CLASS}`);
      rows.forEach((row: Element) => {
        row.classList.remove(SELECTED_ROW_CLASS);
      });
    }
  };

  const handleSelectionChange = (selection: TableRowData[]) => {
    selectedRows.value = selection;
    debouncedApplyRowHighlights();
  };

  onMounted(() => {
    setTimeout(debouncedApplyRowHighlights, 100);
  });

  const resetSelction = () => {
    selectedRows.value = [];
    cleanupRowClasses();
    debouncedApplyRowHighlights.cancel();
  };

  onBeforeUnmount(() => {
    cleanupRowClasses();
    debouncedApplyRowHighlights.cancel();
  });

  return {
    handleSelectionChange,
    resetSelction
  };
};

export const useVxeTableSelectionHighlight = (
  tableRef: Ref<VxeTableInstance | null>,
  mode: "single" | "multiple" = "multiple"
) => {
  ensureStyleElement();

  const selectedRows = ref<TableRowData[]>([]);

  const debouncedUpdateRowHighlights = debounce(() => {
    if (!tableRef.value) return;

    const allRows = tableRef.value.$el.querySelectorAll(".vxe-body--row");

    const selectedKey = new Set(selectedRows.value.map(getRowKey));

    allRows.forEach((row: Element) => {
      const rowid = row.getAttribute("rowid");
      if (!rowid) return;

      const rowData = tableRef.value?.getRowById(rowid);
      if (!rowData) return;

      const rowkey = getRowKey(rowData);

      const isSelected = selectedKey.has(rowkey);

      if (isSelected) {
        row.classList.add(SELECTED_ROW_CLASS);
      } else {
        row.classList.remove(SELECTED_ROW_CLASS);
      }
    });
  }, 16);

  const cleanupRowHighlights = () => {
    if (tableRef.value) {
      const rows = tableRef.value.$el.querySelectorAll(`.${SELECTED_ROW_CLASS}`);
      rows.forEach((row: Element) => {
        row.classList.remove(SELECTED_ROW_CLASS);
      });
    }
  };

  const handleSelectionChange = (params: {
    selection?: TableRowData[];
    checked?: boolean;
    records?: TableRowData[];
  }) => {
    if (!tableRef.value) return;

    let allSelected: TableRowData[] = [];

    if (typeof tableRef.value.getCheckboxRecords === "function") {
      try {
        allSelected = tableRef.value.getCheckboxRecords() || [];
      } catch (e) {
        console.warn("getCheckboxRecords method failed:", e);
      }
    }

    if (allSelected.length === 0) {
      if (params.selection && params.selection.length > 0) {
        allSelected = params.selection;
      } else if (params.checked !== undefined && params.records) {
        if (mode === "single") {
          allSelected = params.checked ? params.records : [];
        } else {
          if (params.checked) {
            const newSelectedRows = params.records.filter((record) => {
              !selectedRows.value.some((row) => getRowKey(row) === getRowKey(record));
            });
            allSelected = [...selectedRows.value, ...newSelectedRows];
          } else {
            const deselectedKeys = params.records.map(getRowKey);
            allSelected = selectedRows.value.filter(
              (row) => !deselectedKeys.includes(getRowKey(row))
            );
          }
        }
      }
    }

    if (
      allSelected.length === 0 &&
      params.checked === false &&
      params.records &&
      params.records.length > 0
    ) {
      const deselectedKeys = params.records.map(getRowKey);
      allSelected = selectedRows.value.filter((row) => !deselectedKeys.includes(getRowKey(row)));
    }

    if (mode === "single" && allSelected.length > 1) {
      allSelected = [allSelected[allSelected.length - 1]];
    }

    selectedRows.value = allSelected;
    debouncedUpdateRowHighlights();
  };

  const handleCheckboxAll = (params: { checked: boolean; records: TableRowData[] }) => {
    if (!tableRef.value) return;
    if (mode === "single") {
      selectedRows.value = [];
    } else {
      selectedRows.value = params.checked ? params.records : [];
    }
    debouncedUpdateRowHighlights();
  };

  const resetSelction = () => {
    selectedRows.value = [];
    cleanupRowHighlights();
    debouncedUpdateRowHighlights.cancel();
  };

  onMounted(() => {
    setTimeout(debouncedUpdateRowHighlights, 100);
  });
  onBeforeUnmount(() => {
    cleanupRowHighlights();
    debouncedUpdateRowHighlights.cancel();
  });

  return {
    handleCheckboxAll,
    resetSelction,
    handleSelectionChange
  };
};
