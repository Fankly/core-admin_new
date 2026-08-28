import { getProtypeTree } from '@/api/common'
import baseService from '@/service/baseService'
import { formatNumber, formatNumValue } from '@/utils/utils'
import { RowVO } from '@/views/service/project/projectActivation/interface'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { VxeGridProps, VxeTablePropTypes } from 'vxe-table'

export interface PublicCode {
  code: string
  name: string
}

export const useCommon = () => {
  const dwList = ref<PublicCode[]>([])
  const wclList = ref<PublicCode[]>([])
  const dydjList = ref<PublicCode[]>([])
  const xmxzList = ref<PublicCode[]>([])
  const sfList = ref<PublicCode[]>([])
  const yssfStatusList = ref<PublicCode[]>([])
  const xmzxStatusList = ref<PublicCode[]>([])
  const projectTypeList = ref<PublicCode[]>([])
  const gbdkStatusList = ref<PublicCode[]>([])

  const rowClassName: VxeTablePropTypes.RowClassName<RowVO> = ({ row }) => {
    const status = ['12', '22']
    if (status.includes(row.xmgbdkzt)) {
      return 'col-red'
    }
    return null
  }

  const gridOptions = reactive<VxeGridProps<RowVO>>({
    border: true,
    showOverflow: true,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    loading: false,
    rowClassName: rowClassName,
    checkboxConfig: {
      trigger: 'row',
      highlight: true
    },
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
      titleWidth: 160,
      titleColon: true,
      data: {
        xmmc: '',
        xmbm: '',
        gwxmbm: '',
        xmbmc: '',
        ndyswcl_start_qj: '',
        ndyswcl_start_num: '',
        ndyswcl_end_qj: '',
        ndyswcl_end_num: '',
        xmljwcl_start_qj: '',
        xmljwcl_start_num: '',
        xmljwcl_end_qj: '',
        xmljwcl_end_num: '',
        ysqj_start: '',
        circul_status: '',
        ysqj_end: '',
        nd: '',
        yd_start: '',
        yd_end: '',
        yjdw: '',
        ejdw: '',
        yjfl: '',
        yjflObj: null,
        ejfl: '',
        ejflObj: null,
        sjfl: '',
        xmxz: '',
        xmlx_id: '',
        yssfzt: '',
        publisetime_start: '',
        publisetime_end: '',
        gbdk_status: '',
        xmlx_ids: [],
        xmxzs: [],
        ispack: ''
      },
      items: [
        {
          field: 'xmmc',
          title: '项目名称',
          visible: true,
          slots: { default: 'xmmc_item' }
        },
        {
          field: 'xmbm',
          title: '储备编码',
          slots: { default: 'xmbm_item' }
        },
        {
          field: 'gwxmbm',
          title: '国网项目编码',
          visible: true,
          slots: { default: 'gwxmbm_item' }
        },
        {
          field: 'xmbmc',
          title: '项目包名称',
          visible: true,
          slots: { default: 'xmbmc_item' }
        },
        {
          field: 'dw',
          title: '一二级单位',
          visible: true,
          folding: false,
          slots: { default: 'dw_item' }
        },
        {
          field: 'yjfl',
          title: '一级分类',
          visible: true,
          folding: false,
          slots: { default: 'yjfl_item' }
        },
        {
          field: 'ejfl',
          title: '二级分类',
          visible: true,
          folding: false,
          slots: { default: 'ejfl_item' }
        },
        {
          field: 'sjfl',
          title: '三级分类',
          visible: true,
          slots: { default: 'sjfl_item' }
        },
        {
          field: 'xmlx_id',
          title: '项目类型',
          visible: true,
          folding: false,
          slots: { default: 'xmlx_id_item' }
        },
        {
          field: 'xmxz',
          title: '项目性质',
          folding: false,
          visible: true,
          slots: { default: 'xmxz_item' }
        },
        {
          field: 'ispack',
          title: '是否打捆',
          folding: false,
          visible: true,
          slots: { default: 'ispack_item' }
        },
        {
          field: 'dydj',
          title: '电压等级',
          folding: false,
          visible: true,
          slots: { default: 'dydj_item' }
        },
        {
          field: 'ndyswcl_start_qj',
          title: '年度预算完成率（%）',
          folding: false,
          visible: true,
          slots: { default: 'ndyswcl_start_qj_item' }
        },
        {
          field: 'ndyswcl_end_qj',
          title: '至',
          visible: true,
          slots: { default: 'ndyswcl_end_qj_item' }
        },
        {
          field: 'xmljwcl_start_qj',
          title: '项目累计完成率（%）',
          folding: false,
          visible: true,
          slots: { default: 'xmljwcl_start_qj_item' }
        },
        {
          field: 'xmljwcl_end_qj',
          title: '至',
          folding: false,
          visible: true,
          slots: { default: 'xmljwcl_end_qj_item' }
        },
        {
          field: 'ysqj_start',
          title: '预算期间',
          folding: false,
          visible: true,
          slots: { default: 'ysqj_start_item' }
        },
        {
          field: 'ysqj_end',
          title: '至',
          folding: false,
          visible: true,
          slots: { default: 'ysqj_end_item' }
        },
        {
          field: 'publisetime_start',
          title: '出库时间',
          folding: false,
          visible: true,
          slots: { default: 'publisetime_start_item' }
        },
        {
          field: 'publisetime_end',
          title: '至',
          folding: false,
          visible: true,
          slots: { default: 'publisetime_end_item' }
        },
        {
          field: 'circul_status',
          title: '项目执行状态',
          folding: false,
          visible: true,
          slots: { default: 'circul_status_item' }
        },
        {
          field: 'yssfzt',
          title: '预算释放状态',
          folding: false,
          visible: true,
          slots: { default: 'yssfzt_item' }
        },
        {
          field: 'gbdk_status',
          title: '项目打开关闭状态',
          folding: false,
          visible: true,
          slots: { default: 'gbdk_status_item' }
        },
        {
          align: 'right',
          slots: { default: 'operate_item' }
        }
      ]
    },
    columns: [
      { type: 'checkbox', width: 60 },
      {
        field: 'xmmc',
        width: 250,
        title: '项目名称',
        align: 'left',
        headerAlign: 'center',
        visible: true
      },
      {
        field: 'xmbm',
        width: 120,
        title: '储备编码',
        visible: true
      },
      {
        field: 'gwxmbm',
        width: 120,
        title: '国网项目编码',
        visible: true
      },
      { field: 'xmbmc', width: 250, title: '项目包名称', visible: true },
      { field: 'circulStatusName', width: 100, title: '项目执行状态', visible: true },
      { field: 'xmgbdkztName', width: 150, title: '项目打开关闭状态', visible: true },
      { field: 'yssfztName', width: 150, title: '预算释放状态', visible: true },
      { field: 'yssffhxx', width: 200, title: '预算释放返回信息', visible: true },
      { field: 'erpgbdkztName', width: 150, title: 'ERP关闭打开状态', visible: true },
      { field: 'erpgbdkfhxx', width: 200, title: 'ERP关闭打开返回信息', visible: true },
      { field: 'jhxttsztName', width: 150, title: '计划系统推送状态', visible: true },
      { field: 'jhxttsfhxx', width: 200, title: '计划系统推送返回信息', visible: true },
      {
        field: 'amount',
        width: 150,
        title: '项目总预算（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'yqljtzjh',
        width: 150,
        title: '累计投资计划（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'yqljcwzc',
        width: 150,
        title: '累计财务支出（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'xmljwcl',
        width: 150,
        title: '项目累计完成率（%）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumber(cellValue, 2)
        },
        visible: true
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
        },
        visible: true
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
        },
        visible: true
      },
      {
        field: 'dncwzc',
        width: 150,
        title: '当年财务支出（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'dnxmcn',
        width: 150,
        title: '当年项目承诺（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'ljxmcn',
        width: 150,
        title: '累计项目承诺（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'ndyswcl',
        width: 150,
        title: '年度预算完成率（%）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumber(cellValue.toString(), 2)
        },
        visible: true
      },
      {
        field: 'zjgcye',
        width: 150,
        title: '在建工程余额（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      {
        field: 'ljcn',
        width: 150,
        title: '累计承诺（万元）',
        align: 'right',
        headerAlign: 'center',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
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
      { field: 'cnx1', width: 180, title: '承诺项', visible: true },
      { field: 'proType', width: 150, title: '项目类型', visible: true },
      { field: 'yjflName', width: 130, title: '一级分类', visible: true },
      { field: 'ejflName', width: 130, title: '二级分类', visible: true },
      { field: 'sjflName', width: 130, title: '三级分类', visible: true },
      { field: 'xmxzName', width: 100, title: '项目性质', visible: true },
      { field: 'yjdwName', width: 150, title: '一级单位', visible: true },
      { field: 'ejdwName', width: 150, title: '二级单位', visible: true },
      { field: 'gkbmName', width: 150, title: '归口部门', visible: true },
      { field: 'dydj', width: 150, title: '电压等级', visible: true },
      { field: 'nd', width: 80, title: '年度', visible: true },
      { field: 'ispackname', width: 80, title: '是否打捆', visible: true },
      { field: 'publisetime', width: 150, title: '项目出库时间', visible: true },
      {
        field: 'jyys',
        width: 120,
        title: '建议预算（万元）',
        headerAlign: 'center',
        align: 'right',
        formatter: ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          return formatNumValue(cellValue.toString(), 6)
        },
        visible: true
      },
      { field: 'kgsj', width: 150, title: '开工时间', visible: true },
      { field: 'yjwcsj', width: 150, title: '预计完成时间', visible: true },
      { field: 'jzyy', width: 200, title: '续建结转原因', visible: true }
    ]
  })

  const getDwList = () => {
    const params = {
      parentCode: null,
      rootCode: 'childtree:DW_COM',
      objId: -1,
      level: 0
    }
    baseService.post('process40/getTreeNode/', params).then((res) => {
      if (res.success) {
        dwList.value = res.data
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
  }

  const getPublicCodeData = () => {
    const publicParams = [
      'GY_TJFH', // 当年完成率
      'XMXZ', // 项目性质
      'GY_SF', // 是否
      'DYDJ', // 电压等级
      'XMZX_STATUS', //项目执行状态
      'YSSF_STATUS', //项目释放状态
      'XMGBDK_STATUS' //项目关闭打开状态
    ]
    baseService
      .post('process40/getComCodeByCode/', {
        codes: publicParams
      })
      .then((res) => {
        if (res.success) {
          const data = res.data
          for (const key in res.data) {
            switch (key) {
              case 'GY_TJFH':
                wclList.value = data[key]
                break
              case 'XMXZ':
                xmxzList.value = data[key]
                break
              case 'DYDJ':
                dydjList.value = data[key]
                break
              case 'GY_SF':
                sfList.value = data[key]
                break
              case 'XMZX_STATUS':
                xmzxStatusList.value = data[key]
                break
              case 'YSSF_STATUS':
                yssfStatusList.value = data[key]
                break
              case 'XMGBDK_STATUS':
                gbdkStatusList.value = data[key]
                break
            }
          }
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
  }

  const getProtypeTreeData = async () => {
    const res = await getProtypeTree()
    if (res.success) {
      projectTypeList.value = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }

  const initFormData = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    setFormParams('ysqj_start', year + '-01-01')
    setFormParams('ysqj_end', year + '-' + month + '-' + day)
  }

  const initParams = () => {
    initFormData()
    getDwList()
    getPublicCodeData()
    getProtypeTreeData()
  }

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
      initFormData()
      return true
    }
    return false
  }

  return {
    getFormParams,
    resetFormParams,
    setFormParams,
    getFormData,
    resetFormData,
    gridOptions,
    dwList,
    wclList,
    xmxzList,
    dydjList,
    sfList,
    projectTypeList,
    xmzxStatusList,
    yssfStatusList,
    gbdkStatusList,
    initParams
  }
}
