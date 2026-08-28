import { exportData } from '@/api/service/xmgbdk'
import { queryData } from '@/api/workflow/xmgbdk'
import { IObject } from '@/types/interface'
import { formatNumValue } from '@/utils/utils'
import { RowVO } from '@/views/service/project/projectActivation/interface'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { VxeGridProps } from 'vxe-table'

export interface PublicCode {
  code: string
  name: string
}

export const useService = () => {
  const wfDataString = ref<IObject>()
  const wfCodeString = ref<string>('')
  const gridOptions = reactive<VxeGridProps<RowVO>>({
    border: true,
    showOverflow: true,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    loading: false,
    rowConfig: {
      height: 32,
      isCurrent: true
    },
    columnConfig: {
      resizable: true
    },
    formConfig: {
      span: 6,
      align: 'right',
      titleAlign: 'right',
      titleOverflow: true,
      titleWidth: 120,
      titleColon: true,
      data: {
        xmmc: ''
      },
      items: [
        {
          field: 'xmmc',
          title: '项目名称',
          span: 8,
          slots: { default: 'xmmc_item' }
        },
        {
          span: 16,
          align: 'right',
          slots: { default: 'operate_item' }
        }
      ]
    },
    columns: [
      { field: 'xmmc', width: 250, title: '项目名称', align: 'left', headerAlign: 'center' },
      {
        field: 'xmbm',
        width: 120,
        title: '储备编码'
      },
      {
        field: 'gwxmbm',
        width: 120,
        title: '国网项目编码'
      },
      {
        field: 'attachName',
        width: 260,
        title: '附件名称',
        headerAlign: 'center',
        align: 'center',
        slots: { default: 'attachName_default' }
      },
      {
        field: 'amount',
        width: 150,
        title: '项目总预算（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      {
        field: 'dnys',
        width: 150,
        title: '当年预算（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      {
        field: 'dntzjh',
        width: 150,
        title: '当年投资计划（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      { field: 'xmbmc', width: 150, title: '项目包名称' },
      {
        field: 'gbqys',
        width: 150,
        title: '关闭前预算（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      { field: 'cnx1', width: 180, title: '承诺项' },
      { field: 'proType', width: 150, title: '项目类型' },
      { field: 'origin', width: 120, title: '发起人' },
      { field: 'createDep', width: 120, title: '发起人部门' },
      { field: 'yjdwName', width: 150, title: '一级单位' },
      { field: 'ejdwName', width: 150, title: '二级单位' },
      { field: 'gkbmName', width: 150, title: '归口部门' },
      { field: 'ispackname', width: 80, title: '是否打捆' }
    ]
  })

  const resetFormParams = (key: string) => {
    if (gridOptions.formConfig) {
      const isArray = Array.isArray(gridOptions.formConfig.data[key])
      if (isArray) {
        gridOptions.formConfig.data[key] = []
      } else {
        gridOptions.formConfig.data[key] = ''
      }
    }
  }

  const getWfDataString = () => {
    return wfDataString.value
  }

  const setWfDataString = (wfData: IObject) => {
    wfDataString.value = wfData
  }

  const getWfCodeString = () => {
    return wfCodeString.value
  }

  const setWfCodeString = (wfCode: string) => {
    wfCodeString.value = wfCode
  }

  const setFormParams = (key: string, value: any) => {
    if (gridOptions.formConfig) {
      const isArray = Array.isArray(gridOptions.formConfig.data[key])
      if (isArray) {
        gridOptions.formConfig.data[key].push(value)
      } else {
        gridOptions.formConfig.data[key] = value
      }
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

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

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

  const pageChangeHandle = (currentPageNum: number) => {
    page.page = currentPageNum
    handleSearchPageData()
  }
  const limitChangeHandle = (currentLimitNum: number) => {
    page.page = 1
    page.limit = currentLimitNum
    handleSearchPageData()
  }

  const handleResetFormData = () => {
    resetFormData()
    handleSearchPageData()
  }

  const handleSearchPageData = async () => {
    try {
      const xmids = getWfDataString()?.XMID.split(',')
      const lx = getWfCodeString() === 'WF_MISXMGBSHLC' ? '01' : '02'
      gridOptions.loading = true
      const formParams = {
        ...getFormData(),
        ...page,
        lx: lx,
        xmids: xmids
      }
      const res = await queryData(formParams)
      if (!res.success) throw new Error(res.msg)
      gridOptions.data = res.data.records
      page.total = res.data.total
      gridOptions.loading = false
    } catch (error) {
      ElMessage.error((error as Error).message)
      gridOptions.loading = false
    }
  }

  const handleDownloadFile = async (uuid: string, fileName: string) => {
    gridOptions.loading = true
    const res = await exportData(uuid)
    const blob: any = res
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    dom.download = `${decodeURI(decodeURI(fileName))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    gridOptions.loading = false
  }

  const handleError = (error: Error, message = '操作失败'): void => {
    console.error(`${message}`, error)
    ElMessage({
      message: `${message}:${error.message}`,
      type: 'error',
      duration: 5000
    })
  }

  const checkedData = ref<any[]>([])
  const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

  const cellClickHandle = async ({ row }: any) => {
    checkedData.value = []
    checkedData.value.push({
      ...row,
      id: row['xmId'],
      xmlx: row['proTypeId']
    })
  }

  return {
    checkedData,
    hasSelectedProjects,
    getWfDataString,
    setWfDataString,
    setWfCodeString,
    getWfCodeString,
    cellClickHandle,
    handleDownloadFile,
    handleError,
    getFormParams,
    resetFormParams,
    pageChangeHandle,
    limitChangeHandle,
    handleResetFormData,
    handleSearchPageData,
    setFormParams,
    page,
    gridOptions
  }
}
