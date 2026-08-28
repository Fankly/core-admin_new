import { reactive, ref } from 'vue'
import { VxeGridProps } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { RowVO } from '@/views/service/project/projectActivation/interface'
import { searchHistoryPageData } from '@/api/service/xmgbdk'

interface RowVo {
  id: string
  uuid: string
  xmmc: string
  gwxmbm: string
  attachName: string
}

interface UserInfo {
  dwId: string
  bmId: string
  specialorgcode: string
  id: string
}

export const useHistoryCommon = () => {
  const userInfo = ref<UserInfo>({
    dwId: '',
    bmId: '',
    specialorgcode: '',
    id: ''
  })

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

  const selectedData = ref<RowVO[]>([])

  const setUserInfo = (user: UserInfo) => {
    userInfo.value = user
  }

  const getUserInfo = () => {
    return userInfo.value
  }

  const setSelectedData = (user: RowVO[]) => {
    selectedData.value = user
  }

  const getSelectedData = () => {
    return selectedData.value
  }

  const gridOptions = reactive<VxeGridProps<RowVo>>({
    border: true,
    showOverflow: true,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    loading: false,
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    formConfig: {
      enabled: true,
      span: 6,
      align: 'right',
      titleAlign: 'right',
      titleOverflow: true,
      titleColon: true,
      data: {
        responsemessage: '',
        pushmessage: ''
      },
      items: [
        {
          field: 'pushmessage',
          title: '推送报文',
          visible: true,
          slots: { default: 'pushmessage_item' }
        },
        {
          field: 'responsemessage',
          title: '响应报文',
          slots: { default: 'responsemessage_item' }
        },
        {
          align: 'right',
          span: '12',
          slots: { default: 'operate_item' }
        }
      ]
    },
    columns: [
      {
        field: 'gwxmbm',
        width: 140,
        title: '国网项目编码',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'updtime',
        width: 180,
        title: '推送时间',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'handler',
        width: 80,
        title: '处理人',
        headerAlign: 'center',
        align: 'center'
      },
      {
        field: 'operationcontent',
        width: 140,
        title: '操作内容',
        headerAlign: 'center',
        align: 'center'
      },
      {
        field: 'pushmessage',
        title: '推送报文',
        headerAlign: 'center',
        align: 'center'
      },
      {
        field: 'processtime',
        width: 140,
        title: '耗时时间',
        headerAlign: 'center',
        align: 'center'
      },
      {
        field: 'responsemessage',
        title: '响应报文',
        headerAlign: 'center',
        align: 'center'
      }
    ]
  })
  const handleError = (error: Error, message = '操作失败'): void => {
    console.error(`${message}`, error)
    ElMessage({
      message: `${error.message}`,
      type: 'error',
      duration: 5000
    })
  }

  const handleSearchPageData = async () => {
    gridOptions.loading = true
    try {
      const xmids = getSelectedData().map((item) => item.xmid)
      const res = await searchHistoryPageData({
        xmids: xmids,
        ...userInfo.value,
        ...getFormData(),
        ...page
      })
      if (!res.success) throw new Error(res.msg)
      gridOptions.data = res.data.records
      page.total = res.data.total
    } catch (error) {
      handleError(error as Error, '查询失败!')
    } finally {
      gridOptions.loading = false
    }
  }

  const getFormParams = (key: string): any => {
    if (gridOptions.formConfig) {
      return gridOptions.formConfig.data[key]
    }
  }

  const getFormData = (): any => {
    if (gridOptions.formConfig) {
      return gridOptions.formConfig.data
    }
  }

  const resetFormData = (): boolean => {
    if (gridOptions.formConfig) {
      const obj = gridOptions.formConfig.data
      if (typeof obj !== 'object' || obj === null) return false
      Object.keys(obj).forEach((key) => {
        const val = obj[key]
        if (Array.isArray(val)) {
          obj[key] = []
        } else if (typeof val === 'string') {
          obj[key] = ''
        } else if (typeof val === 'number') {
          obj[key] = 0
        } else if (typeof val === 'boolean') {
          obj[key] = false
        } else {
          obj[key] = null
        }
      })
      return true
    }
    return false
  }

  const handleResetFormData = () => {
    resetFormData()
    handleSearchPageData()
  }

  const pageChangeHandle = (currentPageNum: number) => {
    page.page = currentPageNum
    handleSearchPageData()
  }
  const limitChangeHandle = (currentLimitNum: number) => {
    page.page = 1
    page.limit = currentLimitNum
    handleSearchPageData()
  }
  return {
    pageChangeHandle,
    limitChangeHandle,
    handleSearchPageData,
    handleResetFormData,
    setSelectedData,
    getSelectedData,
    page,
    gridOptions,
    handleError,
    setUserInfo,
    getUserInfo
  }
}
