import { reactive, ref } from 'vue'
import { DropdownData, FormParams, Params } from '../interface'
import { User, RowVo } from '@/views/goalValue/interface'
import { formatDate, formatValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { getVersionCode, Result } from '@/api/mbz'
import { FormField } from '@/components/FormModal'
import { getPublicData, getYearData } from '@/api/common'

export const useData = (api: (params: any) => Promise<Result>) => {
  const tableData = ref<RowVo[]>([])
  const formParams = reactive<FormParams>({
    nd: '',
    ndList: []
  })
  const userInfo = ref<User>({
    code: '',
    id: '',
    info: '',
    name: '',
    org_id: '',
    org_name: '',
    role_id: '',
    rolename: '',
    spRoleCode: '',
    specialorgid: '',
    specialorgname: '',
    systemId: '',
    systemName: ''
  })
  //  表单字段
  const editformFields: FormField[] = [
    {
      prop: 'id',
      label: 'ID',
      type: 'hidden'
    },
    {
      prop: 'versionName',
      label: '版本名称',
      type: 'input',
      fullWidth: true,
      maxlength: 64,
      required: true
    },
    {
      fullWidth: true,
      prop: 'sfyap',
      label: '是否预安排',
      type: 'select',
      clearable: false,
      options: [
        {
          label: '否',
          value: '0'
        },
        {
          label: '是',
          value: '1'
        }
      ],
      required: true
    },
    {
      prop: 'remark',
      label: '备注',
      rows: 4,
      type: 'textarea',
      fullWidth: true,
      required: true,
      maxlength: 256
    }
  ]
  const addformFields: FormField[] = [
    {
      prop: 'versionCode',
      label: '版本编号',
      type: 'input',
      disabled: true,
      multiDependsOn: {
        fields: ['dwId', 'nd'],
        async loader(dependentValues: { dwId: any; nd: any }, formData: any) {
          const { dwId, nd } = dependentValues
          const res = await getVersionCode(dwId, nd)
          return res.data || ''
        },
        clearOnChange: true
      },
      required: true
    },
    {
      prop: 'versionName',
      label: '版本名称',
      type: 'input',
      maxlength: 64,
      required: true
    },
    {
      prop: 'dwId',
      label: '一级单位',
      type: 'select',
      required: true,
      clearable: false,
      apiConfig: {
        method: 'post',
        url: 'bizOrgTree/getYjdw',
        valueField: 'code',
        labelField: 'name',
        params: {}
      }
    },
    {
      prop: 'nd',
      label: '年度',
      type: 'select',
      clearable: false,
      disabled: true,
      apiConfig: {
        method: 'post',
        url: 'comPz/getNdTreeNode',
        valueField: 'yearCode',
        labelField: 'yearName'
      },
      required: true
    },
    {
      fullWidth: true,
      prop: 'sfyap',
      label: '是否预安排',
      type: 'select',
      clearable: false,
      options: [
        {
          label: '否',
          value: '0'
        },
        {
          label: '是',
          value: '1'
        }
      ],
      required: true
    },
    {
      prop: 'remark',
      label: '备注',
      rows: 4,
      type: 'textarea',
      required: true,
      maxlength: 256,
      fullWidth: true
    }
  ]
  const dwName = ref('')
  const fromSearch = reactive<{
    dwId: string
    versionName: string
    zt: string
  }>({
    dwId: '',
    versionName: '',
    zt: ''
  })

  const pageInfo = reactive({
    loading: false,
    isShowPage: false
  })

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1,
    current: '1'
  })
  const statusList = ref<
    {
      code: string
      name: string
    }[]
  >([])
  const dropdownData = ref<DropdownData[]>([
    {
      label: '版本管理',
      icon: 'el-icon-arrow-down',
      value: 'version',
      permission: 'VERSION',
      children: [
        {
          label: '版本创建',
          value: 'versionAdd',
          permission: 'VERSIONADD'
        },
        {
          label: '版本修改',
          value: 'versionEdit',
          permission: 'VERSIONEDIT'
        },
        {
          label: '版本查看',
          value: 'versionView',
          permission: 'VERSIONVIEW'
        },
        {
          label: '版本删除',
          value: 'versionDelete',
          permission: 'VERSIONDELETE'
        },
        {
          label: '设置年度目标值',
          value: 'annualTargetValue',
          permission: 'VERSIONNDTARGETVALUE'
        }
      ]
    },
    {
      label: '目标值管理',
      icon: 'el-icon-arrow-down',
      value: 'targetValue"',
      permission: 'TARGETVALUE',
      children: [
        {
          label: '目标值分解',
          value: 'targetValueBreakdown',
          permission: 'TARGETVALUEBREAKDOWN'
        },
        {
          label: '目标值查看',
          value: 'targetValueView',
          permission: 'TARGETVALUEVIEW'
        }
      ]
    }
  ])
  const columns = reactive<
    {
      field: string
      title: string
      align: 'right' | 'left' | 'center'
      headerAlign: 'right' | 'left' | 'center'
      formatter?: ({ cellValue }: { cellValue: string }) => string
    }[]
  >([
    {
      field: 'dwName',
      title: '一级单位',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'versionCode',
      title: '版本编号',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'versionName',
      title: '版本名称',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'mbz',
      title: '成本性目标值(万元)',
      align: 'right',
      headerAlign: 'center',
      formatter: ({ cellValue }) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
        return formatValue(cellValue.toString(), 6)
      }
    },
    {
      field: 'nd',
      title: '年度',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'sfnd',
      title: '年度目标值',
      align: 'center',
      headerAlign: 'center',
      formatter: ({ cellValue }) => {
        if (cellValue === undefined || cellValue === null || cellValue === '') return '-'
        if (`${cellValue}` === '1') return '是'
        if (`${cellValue}` === '0') return '否'
        return '-'
      }
    },
    {
      field: 'ztName',
      title: '版本状态',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'sfyapName',
      title: '是否预安排',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'jhTime',
      title: '激活时间',
      align: 'center',
      headerAlign: 'center',
      formatter: ({ cellValue }) => {
        if (cellValue === undefined || cellValue === null || cellValue === '') return '-'
        return formatDate(cellValue, 'yyyy-mm-dd')
      }
    },
    {
      field: 'createTime',
      title: '创建时间',
      align: 'center',
      headerAlign: 'center',
      formatter: ({ cellValue }) => {
        if (cellValue === undefined || cellValue === null || cellValue === '') return '-'
        return formatDate(cellValue, 'yyyy-mm-dd')
      }
    },
    {
      field: 'cjr',
      title: '创建人',
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'remark',
      title: '备注',
      align: 'center',
      headerAlign: 'center'
    }
  ])
  const searchHandle = async () => {
    if (!api) return
    pageInfo.loading = true
    tableData.value.length = 0
    const params: Params = {
      versionName: fromSearch.versionName,
      zt: fromSearch.zt,
      roleId: userInfo.value.role_id,
      dwId: fromSearch.dwId || userInfo.value.specialorgid,
      nd: Number(formParams.nd),
      page: Number(page.page),
      limit: Number(page.limit)
    }
    const res = await api(params)
    if (res.success) {
      page.total = res.data.total
      tableData.value = res.data.records
      pageInfo.loading = false
    } else {
      ElMessage.error(res.msg)
      pageInfo.loading = false
    }
  }
  const pageChangeHandle = (currentPageNum: number) => {
    page.page = currentPageNum
    searchHandle()
  }
  const limitChangeHandle = (currentLimitNum: number) => {
    page.page = 1
    page.limit = currentLimitNum
    searchHandle()
  }
  const initParams = async () => {
    const res = await getYearData()
    if (res.success) {
      formParams.ndList = res.data
      formParams.nd = new Date().getFullYear().toString()
    } else {
      ElMessage.error(res.msg)
    }
  }
  const getPublicCode = async () => {
    const res = await getPublicData('ZLYS_MBZFJ_ZT')
    if (res.success) {
      statusList.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  }
  return {
    dropdownData,
    userInfo,
    tableData,
    statusList,
    fromSearch,
    pageInfo,
    page,
    columns,
    formParams,
    pageChangeHandle,
    limitChangeHandle,
    initParams,
    searchHandle,
    getPublicCode,
    dwName,
    editformFields,
    addformFields
  }
}
