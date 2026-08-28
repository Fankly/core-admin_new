import { inject, reactive, ref, Ref } from 'vue'
import { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { RowVO, SearchParams } from '@/views/service/budget/budgeting/types/budgeting'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { BaseMethod } from '@/api/base/BaseMethod'
import { ElMessage } from 'element-plus'

export const useBudgetingTable = () => {
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
  const gridRef = inject<Ref<any>>('gridRef', ref(null))
  const activeTab = inject<Ref<string>>('activeTab', ref('0'))
  const year = inject<Ref<string>>('year', ref(''))
  const searchForm = inject<Ref<SearchParams>>(
    'searchForm',
    ref({
      ejdw: '',
      gwxmbms: '',
      xmStatus: '',
      xmbName: '',
      xmbms: '',
      xmmc: '',
      yjdw: '',
      ysStatus: ''
    })
  )

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
      { type: 'checkbox', width: 60 },
      { field: '', title: '项目名称', width: 260, visible: true },
      { field: '', title: '储备编码', width: 260, visible: true },
      { field: '', title: '国网项目编码', width: 260, visible: true },
      { field: '', title: '总投资计划(万元)', width: 180, visible: true },
      { field: '', title: '总预算含税(万元)', width: 180, visible: true },
      { field: '', title: '总预算不含税(万元)', width: 180, visible: true },
      { field: '', title: '当年预算含税(万元)', width: 180, visible: true },
      { field: '', title: '当年预算不含税(万元)', width: 180, visible: true },
      { field: '', title: '当年预算投资计划(万元)', width: 180, visible: true },
      { field: '', title: '累计财务支出(万元)', width: 180, visible: true },
      { field: '', title: '累计承诺(万元)', width: 180, visible: true },
      { field: '', title: '累计投资计划(万元)', width: 180, visible: true },
      { field: '', title: '预算发送SAP状态', width: 120, visible: true },
      { field: '', title: '发送SAP结果', width: 260, visible: true },
      { field: '', title: '项目计划类型', width: 160, visible: true },
      { field: '', title: '项目流转状态', width: 160, visible: true },
      { field: '', title: '项目类别', width: 160, visible: true },
      { field: '', title: '一级单位', width: 160, visible: true },
      { field: '', title: '二级单位', width: 160, visible: true },
      { field: '', title: '成本中心', width: 160, visible: true },
      { field: '', title: '项目包名称', width: 260, visible: true },
      { field: '', title: '预算事项名称', width: 160, visible: true },
      { field: '', title: '重点投向', width: 160, visible: true },
      { field: '', title: '项目性质', width: 160, visible: true },
      { field: '', title: '是否打捆', width: 120, visible: true },
      { field: '', title: '是否安全生产', width: 120, visible: true },
      { field: '', title: '安全生产费用类型', width: 160, visible: true }
    ],
    data: []
  })

  const searchData = async () => {
    try {
      let gwxmbms: string[] = []
      let xmbms: string[] = []
      if (searchForm.value.gwxmbms) gwxmbms = searchForm.value.gwxmbms.split(',')
      if (searchForm.value.xmbms) xmbms = searchForm.value.xmbms.split(',')
      const searchPageRes = await baseMethod.post('xmysbz/getXmysbzPage', {
        page: page.currentPage,
        limit: page.pageSize,
        bmId: currentUserRole.value.bmId,
        dwId: currentUserRole.value.dwId,
        roleId: currentUserRole.value.roleId,
        roleCode: currentUserRole.value.roleCode,
        ...searchForm.value,
        gwxmbms: gwxmbms,
        xmbms: xmbms
      })
      if (!searchPageRes.success) throw new Error(searchPageRes.msg)
      gridOptions.data = searchPageRes.data
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
      } else {
        throw new Error('页面大小必须大于0')
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
      } else {
        throw new Error('页码必须大于0')
      }
    } catch (e) {
      handleError((e as Error).message)
    }
  }

  const getColumnsData = () => {
    return gridOptions.columns!.filter((item: any) => {
      return item.visible
    })
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
    getColumnsData,
    handleChangeSizeChange,
    handleChangeCurrentChange,
    currentUserRole,
    year,
    searchForm,
    activeTab,
    searchData,
    gridOptions,
    gridEvents
  }
}
