import { inject, reactive, Ref, ref, watch } from 'vue'
import { VxeGridListeners, VxeGridProps, VxeTableInstance } from 'vxe-table'
import { Page } from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import { RowVO, TableProps } from '@/views/service/approval/batch/types'

type StatusTagType = {
  label: string
  type: 'info' | 'warning' | 'success' | 'danger'
  effect?: 'light' | 'plain'
}
export const useBatchTable = (props: TableProps) => {
  const page = inject<Page>('page')!
  const selectedData = inject<Ref<RowVO[]>>('selectedData')!
  const tableData = inject<Ref<RowVO[]>>('tableData')!

  const gridRef = ref<VxeTableInstance>()

  const STATUS_TAG_MAP: Record<number, StatusTagType> = {
    0: { label: '未激活', type: 'info' },
    1: { label: '激活', type: 'success' }
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

  const gridOptions = reactive<VxeGridProps<RowVO>>({
    border: true,
    keepSource: true,
    columnConfig: {
      resizable: true
    },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
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
        width: 80
      },
      {
        type: 'seq',
        width: 80,
        title: '序号'
      },
      {
        field: 'status',
        width: 120,
        title: '状态',
        slots: { default: 'statusSlot' }
      },
      {
        field: 'pspcCode',
        width: 160,
        title: '批次编号'
      },
      {
        field: 'pspcName',
        width: 220,
        title: '批次名称'
      },
      {
        field: 'pspcTypeName',
        width: 140,
        title: '批次类型'
      },
      {
        field: 'nd',
        width: 140,
        title: '年度'
      },
      {
        field: 'lhhsSkTime',
        width: 130,
        title: '需求申请与提报阶段截止时间'
      },
      {
        field: 'lhhsOneStartTime',
        title: '线上预审开始日期',
        width: 160
      },
      {
        field: 'lhhsOneEndTime',
        width: 160,
        title: '线上预审结束日期'
      },
      {
        field: 'lhhsTwoStartTime',
        width: 160,
        title: '线下会审开始日期'
      },
      {
        field: 'lhhsTwoEndTime',
        width: 160,
        title: '线下会审结束日期'
      },
      {
        field: 'lhhsThreeStartTime',
        width: 120,
        title: '出具可研评审意见开始日期'
      },
      {
        field: 'lhhsThreeEndTime',
        width: 120,
        title: '出具可研评审意见结束日期'
      },
      {
        field: 'lhhsFourStartTime',
        width: 130,
        title: '专业批复合规性审查开始日期'
      },
      {
        field: 'lhhsFourEndTime',
        width: 130,
        title: '专业批复合规性审查结束日期'
      }
    ]
  })

  const normalizeStatus = (value: unknown): number | null => {
    const num = Number(value)
    return Number.isInteger(num) ? num : null
  }

  const getStatusTag = (rawStatus: unknown) => {
    const status = normalizeStatus(rawStatus)
    if (status === 0) return STATUS_TAG_MAP[status]
    else {
      return (
        (status && STATUS_TAG_MAP[status]) ?? {
          label: '未知状态',
          type: 'info'
        }
      )
    }
  }

  watch(tableData, () => {
    selectedData.value = []
    gridRef.value?.clearCheckboxRow()
  })

  return {
    gridEvent,
    gridOptions,
    tableData,
    selectedData,
    gridRef,
    page,
    pageChangeHandle,
    limitChangeHandle,
    getStatusTag
  }
}
