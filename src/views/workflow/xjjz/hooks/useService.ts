import { exportData } from '@/api/service/xmgbdk'
import { queryData } from '@/api/workflow/xjjz'
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
  const wfDataParams = ref<IObject>()
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
      { field: 'proTypeName', width: 150, title: '项目类别', align: 'left', headerAlign: 'center' },
      { field: 'xmmc', width: 220, title: '项目名称', align: 'left', headerAlign: 'center' },
      { field: 'gwxmbm', width: 150, title: '国网项目编码' },
      {
        field: 'ztzjh',
        width: 180,
        title: '续建结转总投资计划(万元)',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      { field: 'kgsj', width: 150, title: '开工时间' },
      { field: 'yjwcsj', width: 150, title: '预计完成时间' },
      { field: 'jzyy', width: 150, title: '续建结转原因' },
      {
        field: 'yqljcwzc',
        width: 150,
        title: '累计财务支出(万元)',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      { field: 'xmxzName', width: 100, title: '项目性质' },
      {
        field: 'amount',
        width: 150,
        title: '总预算不含税(万元)',
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
        title: '本年投资计划(万元)',
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
        title: '当年投资计划(万元)',
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
        title: '本年预算不含税(万元)',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      { field: 'preArrStatusName', width: 100, title: '是否预安排' },
      {
        field: 'xjjzAttachname',
        width: 220,
        title: '附件',
        headerAlign: 'center',
        align: 'center',
        slots: { default: 'xjjzAttachname_default' }
      },
      { field: 'gwStatusName', width: 150, title: '国网状态' },
      { field: 'gwReason', width: 220, title: '发送国网结果' },
      { field: 'sbxmyssap', width: 150, title: '预算发送SAP状态' },
      { field: 'remark', width: 220, title: '发送SAP结果' },
      { field: 'xmbName', width: 220, title: '项目包名称' },
      { field: 'circulStatusName', width: 150, title: '项目流转状态' },

      { field: 'yjdwName', width: 150, title: '一级单位' },
      { field: 'ejdwName', width: 150, title: '二级单位' },
      { field: 'gkbm', width: 150, title: '归口部门' },
      { field: 'yjfl', width: 150, title: '一级分类' },
      { field: 'ejfl', width: 150, title: '二级分类' },
      { field: 'sjfl', width: 150, title: '三级分类' },
      {
        field: 'dncwzc',
        width: 150,
        title: '当年财务支出(万元)',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      {
        field: 'dnxmcn',
        width: 150,
        title: '当年项目承诺(万元)',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      {
        field: 'ljxmcn',
        width: 150,
        title: '累计项目承诺(万元)',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        }
      },
      { field: 'cnx1', width: 220, title: '承诺项' },
      { field: 'xmbm', width: 150, title: '储备编码' },
      { field: 'instime', width: 180, title: '转续建/结转时间' }
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

  const setDataParams = (params: IObject) => {
    wfDataParams.value = params
  }

  const getDataParams = () => {
    return wfDataParams.value
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
      gridOptions.loading = true
      const formParams = {
        ...getFormData(),
        ...page,
        xmids: xmids,
        bmId: wfDataParams.value?.spOrgId,
        dwId: wfDataParams.value?.dwId
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
    gridOptions,
    setDataParams,
    getDataParams
  }
}
