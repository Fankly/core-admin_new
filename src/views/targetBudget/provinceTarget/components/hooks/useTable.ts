import { inject, reactive, Ref, ref, watch } from 'vue'
import { VxeGridListeners, VxeGridProps, VxeTableInstance } from 'vxe-table'
import { Page, RowVO, TableProps } from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import { formatValue } from '@/utils/utils'

export const useTable = (props: TableProps) => {
  const selectedData = inject<Ref<RowVO[]>>('selectedData')!
  const page = inject<Page>('page')!
  const tableData = inject<Ref<RowVO[]>>('tableData')!

  const gridRef = ref<VxeTableInstance>()

  watch(tableData, () => {
    selectedData.value = []
    gridRef.value?.clearCheckboxRow()
  })

  type StatusTagType = {
    label: string
    type: 'info' | 'warning' | 'success' | 'danger'
    effect?: 'light' | 'plain'
  }

  const STATUS_TAG_MAP: Record<number, StatusTagType> = {
    1: { label: '草稿', type: 'info' },
    2: { label: '已提交', type: 'warning' },
    3: { label: '审核通过', type: 'success' },
    4: { label: '审核驳回', type: 'danger' },
    5: { label: '已过期', type: 'info', effect: 'plain' }
  }

  const pageChangeHandle = (currentPageNum: number) => {
    page.page = currentPageNum
    props.search()
  }
  const limitChangeHandle = (currentLimitNum: number) => {
    page.page = 1
    page.limit = currentLimitNum
    props.search()
  }

  const checkChangeHandle = ({ records }: { records: RowVO[] }) => {
    selectedData.value = records
  }
  const checkChangeAllHandle = ({ records }: { records: RowVO[] }) => {
    selectedData.value = records
  }

  const cellClickHandle = async ({ row, column }: any) => {
    if (column.type === 'checkbox') return
    selectedData.value = []
    if (gridRef.value) {
      await gridRef.value.clearCheckboxRow()
      await gridRef.value.setCheckboxRow(row, true)
      selectedData.value.push(row)
    }
  }

  const gridEvent = reactive<VxeGridListeners<RowVO>>({
    checkboxChange: checkChangeHandle,
    checkboxAll: checkChangeAllHandle,
    cellClick: cellClickHandle
  })

  const normalizeStatus = (value: unknown): number | null => {
    const num = Number(value)
    return Number.isInteger(num) ? num : null
  }

  const getStatusTag = (rawStatus: unknown) => {
    const status = normalizeStatus(rawStatus)
    return (
      (status && STATUS_TAG_MAP[status]) ?? {
        label: '未知状态',
        type: 'info'
      }
    )
  }

  const gridOptions = reactive<VxeGridProps<RowVO>>({
    border: true,
    keepSource: true,
    columnConfig: {
      resizable: true
    },
    headerAlign: 'center',
    align: 'left',
    showOverflow: true,
    showHeaderOverflow: true,
    checkboxConfig: {
      highlight: true
    },
    height: '100%',
    rowConfig: {
      height: 32
    },
    columns: [
      {
        type: 'checkbox',
        width: 64,
        align: 'center',
        headerAlign: 'center'
      },
      {
        type: 'seq',
        width: 72,
        title: '序号',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'status',
        width: 120,
        title: '状态',
        align: 'center',
        headerAlign: 'center',
        slots: { default: 'statusSlot' }
      },
      {
        field: 'versionNo',
        width: 180,
        title: '版本编号'
      },
      {
        field: 'versionName',
        width: 280,
        title: '版本名称'
      },
      {
        field: 'mbz',
        width: 180,
        title: '目标值(万元)',
        headerAlign: 'center',
        align: 'right',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (cellValue === null || cellValue === undefined || cellValue === '') return '-'
          return formatValue(cellValue, 6)
        }
      },
      {
        field: 'gkbmName',
        width: 180,
        title: '归口部门',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'remark',
        title: '备注',
        width: 260
      },
      {
        field: 'activeTime',
        width: 180,
        title: '激活时间',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'createUserName',
        width: 180,
        title: '创建人',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'createTime',
        width: 180,
        title: '创建时间',
        align: 'center',
        headerAlign: 'center'
      }
    ]
  })

  return {
    tableData,
    gridEvent,
    gridOptions,
    selectedData,
    gridRef,
    page,
    getStatusTag,
    pageChangeHandle,
    limitChangeHandle
  }
}
