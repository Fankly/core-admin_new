import ImportExcel from '@/components/ImportExcel/index.vue'
import { getCompareColumn, getCompareData } from '@/api/targetBudget/provinceTarget'
import { IObject } from '@/types/interface'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { VxeGridListeners, VxeGridProps, VxeModalInstance, VxeTableInstance, VxeTablePropTypes } from 'vxe-table'
import { VersionCompareParams } from '../../types/provinceTarget'
import { TableCellColorMapper, TableStructure } from '@/utils/tableCellColorMapper'
import { exportVxeGrid } from '@/utils/excelExport'
import { formatNumValue } from '@/utils/utils'

export const useTargetBudgetVersionCompare = (tableStructure: TableStructure = 'flat') => {
  const DECIMAL_DIGITS = '6'
  const gridRef = ref<VxeTableInstance>()
  const targetBudgetVersionCompareRef = ref<VxeModalInstance>()
  const importRef = ref<InstanceType<typeof ImportExcel>>()
  const modalTitle = ref('版本比对')
  const isShowModal = ref(false)
  const loading = ref(false)
  const modalWidth = ref('90%')
  const modalHeight = ref('820')
  const tableData = ref<IObject[]>([])
  const tableCellColorMapper = new TableCellColorMapper({
    mode: 'text',
    structure: tableStructure
  })
  // 父组件传过来的参数
  const parameter = ref<VersionCompareParams>()

  const gridEvent = reactive<VxeGridListeners<IObject>>({})

  const cellStyle = ({ row, column }: any) => {
    return tableCellColorMapper.getCellStyle(row, column?.field) as any
  }

  const gridOptions = reactive<VxeGridProps<IObject>>({
    border: true,
    keepSource: true,
    columnConfig: {
      resizable: true
    },
    cellStyle,
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      enabled: true,
      showStatus: true
    },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    showHeaderOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32
    }
  })

  const getFlatColumns = (columns: VxeTablePropTypes.ColumnConfig[]) => {
    if (!columns || columns.length === 0) {
      return []
    }
    columns.forEach((column: any) => {
      if (column.children && column.children.length > 0) {
        getFlatColumns(column.children)
      } else {
        if (column['needFormat']) {
          column.align = 'right'
          column.headerAlign = 'center'
          column.formatter = ({ cellValue }: { cellValue: string }) => {
            if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
            if (cellValue === '-') return cellValue
            return formatNumValue(cellValue.toString(), 6)
          }
        }
      }
    })
  }

  // 获取表格数据
  const getDynamicColumnData = async () => {
    if (gridOptions.columns && gridOptions.columns.length > 0) {
      return
    }
    try {
      const versionIds = parameter.value?.selectedData.map((item) => item.id).join(',')
      const res = await getCompareColumn(versionIds as string)
      if (!res.success) throw new Error(res.msg)
      const cols = res.data || []
      gridOptions.columns = cols
      if (cols.length > 0) cols[0].fixed = 'left'
      if (cols.length > 1) cols[1].fixed = 'left'
      if (gridOptions.columns) getFlatColumns(gridOptions.columns)
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    }
  }

  // 获取表格数据
  const getTargetBudgetVersioCompareData = async () => {
    try {
      const versionIds = parameter.value?.selectedData.map((item) => item.id).join(',')
      const res = await getCompareData(versionIds as string)
      if (!res.success) throw new Error(res.msg)
      gridOptions.data = res.data
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
      return []
    }
  }

  // 页面导出
  const handlePageExport = async () => {
    loading.value = true
    try {
      exportVxeGrid(gridRef.value as any, {
        isTree: false,
        fileName: '版本比对',
        colorMapper: tableCellColorMapper
      })
    } finally {
      loading.value = false
    }
  }

  // 关闭窗口
  const handleCloseModal = () => {
    gridOptions.columns = []
    gridOptions.data = []
    isShowModal.value = false
  }

  // 接收父组件参数
  const acceptParams = async (params: VersionCompareParams) => {
    parameter.value = { ...parameter.value, ...params }
    isShowModal.value = true
    loading.value = true
    try {
      await Promise.all([getDynamicColumnData(), getTargetBudgetVersioCompareData()])
    } finally {
      loading.value = false
    }
  }

  return {
    modalTitle,
    modalWidth,
    modalHeight,
    isShowModal,
    acceptParams,
    parameter,
    loading,
    targetBudgetVersionCompareRef,
    importRef,
    handleCloseModal,
    handlePageExport,
    gridOptions,
    gridEvent,
    gridRef,
    tableData,
    DECIMAL_DIGITS
  }
}
