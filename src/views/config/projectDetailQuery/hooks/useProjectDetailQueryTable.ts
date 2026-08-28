import { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { RowVO } from '@/views/config/projectDetailQuery/types/projectDetailQuery'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { BaseMethod } from '@/api/base/BaseMethod'
import { ElMessage } from 'element-plus'
import { inject, reactive, ref, Ref } from 'vue'

export const useProjectDetailQueryTable = () => {
  const checkedData = inject<Ref<RowVO[]>>('checkedData', ref([]))
  const baseMethod = new BaseMethod()
  const currentUserRole = inject<Ref<UserRole>>(
    'currentUserRole',
    ref({
      bmName: '',
      dwName: '',
      bmId: '',
      roleId: '',
      roleCode: '',
      dwId: '',
      specialOrgCode: '',
      spRoleId: ''
    })
  )
  const dataType = inject<Ref<string>>('dataType', ref('1'))
  const gridRef = inject<Ref<any>>('gridRef', ref(null))

  const page = reactive<{
    currentPage: number | string
    total: number | string
    pageSize: number | string
  }>({
    currentPage: 1,
    pageSize: 20,
    total: 0
  })

  const gridOptions = reactive<VxeGridProps<RowVO>>({
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
    columns: [
      { type: 'checkbox', width: 60, headerAlign: 'center', align: 'center' },
      { field: 'code', title: '字段编码', headerAlign: 'center', align: 'center', visible: true },
      { field: 'name', title: '字段名', headerAlign: 'center', align: 'center', visible: true },
      {
        field: 'isShow',
        title: '是否默认展示',
        headerAlign: 'center',
        align: 'center',
        visible: true,
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (cellValue === '1') return '是'
          else return '否'
        }
      },
      { field: 'sort', title: '排序', headerAlign: 'center', align: 'center', visible: true }
    ],
    data: []
  })

  const searchData = async () => {
    try {
      const searchPageRes = await baseMethod.get('/xmmxConfig/getPage', {
        current: page.currentPage,
        size: page.pageSize,
        dataType: dataType.value
      })
      if (!searchPageRes.success) throw new Error(searchPageRes.msg)
      gridOptions.data = searchPageRes.data.records
      page.total = searchPageRes.data.total
    } catch (e) {
      handleError((e as Error).message)
    }
  }

  const handleChangeSizeChange = async (val: number) => {
    try {
      if (val > 0) {
        page.pageSize = val
        page.currentPage = 1
        await searchData()
      }
    } catch (e) {
      handleError((e as Error).message)
    }
  }
  const handleChangeCurrentChange = async (val: number) => {
    try {
      if (val > 0) {
        page.currentPage = val
        await searchData()
      }
    } catch (e) {
      handleError((e as Error).message)
    }
  }

  const gridEvents: VxeGridListeners<RowVO> = {
    cellClick: ({ row, column }: { row: RowVO; column: any }) => {
      if (column.type === 'checkbox') return
      checkedData.value = []
      gridRef.value.clearCheckboxRow()
      gridRef.value.setCheckboxRow(row, true)
      checkedData.value.push(row)
    },
    checkboxAll: ({ records }: { records: RowVO[] }) => {
      checkedData.value = records
    },
    checkboxChange: ({ records }: { records: RowVO[] }) => {
      checkedData.value = records
    }
  }

  const handleError = (message = '操作失败'): void => {
    ElMessage({
      message: `${message}`,
      type: 'error',
      duration: 5000
    })
  }

  return {
    page,
    gridRef,
    handleChangeSizeChange,
    handleChangeCurrentChange,
    currentUserRole,
    searchData,
    gridOptions,
    gridEvents
  }
}
