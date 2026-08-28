import { PublicCode } from '@/api/fy/types'
import { ref, reactive, inject, Ref } from 'vue'
import { VxeGridListeners, VxeGridProps, VxeTableInstance } from 'vxe-table'
import { Props } from './types'

export const useBudgetConfig = (props: Props) => {
  // 年度数据
  const selectedData = ref<Record<string, any>[]>([])
  const ndList = ref<PublicCode[]>([])
  const nd = inject<Ref<string>>('nd')
  const gridRef = ref<VxeTableInstance>()

  const page = reactive<{
    currentPage: number | string
    total: number | string
    pageSize: number | string
  }>({
    currentPage: 1,
    pageSize: 20,
    total: 0
  })

  const gridOptions = reactive<VxeGridProps>({
    border: true,
    stripe: true,
    loading: false,
    loadingConfig: {
      icon: 'el-icon-loading',
      text: '正在加载中...'
    },
    headerAlign: 'center',
    showHeaderOverflow: true,
    showOverflow: true,
    checkboxConfig: {
      trigger: 'row',
      highlight: true
    },
    height: '100%',
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    columns: props.columns
  })

  const checkChangeHandle = ({ records }: { records: any[] }) => {
    selectedData.value = records
  }
  const checkChangeAllHandle = ({ records }: { records: any[] }) => {
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

  const gridEvents = reactive<VxeGridListeners>({
    checkboxChange: checkChangeHandle,
    checkboxAll: checkChangeAllHandle,
    cellClick: cellClickHandle
  })

  const pageChangeHandle = (currentPageNum: number) => {
    page.currentPage = currentPageNum
    // props.search()
  }
  const limitChangeHandle = (currentLimitNum: number) => {
    page.currentPage = 1
    page.pageSize = currentLimitNum
    // props.search()
  }

  return {
    nd,
    gridOptions,
    page,
    gridEvents,
    ndList,
    pageChangeHandle,
    limitChangeHandle
  }
}
