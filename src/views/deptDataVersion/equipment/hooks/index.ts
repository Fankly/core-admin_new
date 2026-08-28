import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'
import {
  bdzxxPageApi,
  bdzxxRemoveApi,
  bdzxxSubmit,
  bdzxxSaveApi,
  bdzxxGetInfoApi,
  bdzxxgetImportTemplate,
  bdzxxImportExcel,
  bdzxxExportExcel,
  sdxlxxPageApi,
  sdxlxxRemoveApi,
  sdxlxxSubmit,
  sdxlxxSaveApi,
  sdxlxxGetInfoApi,
  sdxlxxgetImportTemplate,
  sdxlxxImportExcel,
  sdxlxxExportExcel,
  zsjxjxxPageApi,
  zsjxjxxRemoveApi,
  zsjxjxxSubmit,
  zsjxjxxSaveApi,
  zsjxjxxGetInfoApi,
  zsjxjxxgetImportTemplate,
  zsjxjxxImportExcel,
  zsjxjxxExportExcel
} from '@/api/motivation/device'

export const tableForm = (userInfo: any, protableCurdRef: any, yjdwList: any) => {
  const ejdwList = ref<any[]>([]) // 二级单位（县）

  const selectYjdwChange = async (val: any) => {
    const params = protableCurdRef.value?.getParams()
    params.ejdw = ''
    ejdwList.value.length = 0
    const ejdwRes = await getEjdw({
      YJDW: val,
      parentCode: val,
      dwId: userInfo.value.dwId,
      bmId: userInfo.value.deptId
    })
    if (ejdwRes.success && ejdwRes.data.length !== 0) {
      ejdwList.value.push(...ejdwRes.data)
    }
  }

  const tables = ref<any>({
    tableColumns: [
      { type: 'selection', width: 50 },
        { type: 'index', width: 50, label: '序号' },
        {
          prop: 'statusName',
          label: '状态',
          width: '80'
        },
        {
          prop: 'yjdw',
          label: '一级单位（市）',
          search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
          enum: yjdwList.value,
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'ejdw',
          label: '二级单位（县）',
          search: { el: 'select', order: 2 },
          enum: ejdwList.value,
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'status',
          label: '状态',
          search: { el: 'select', order: 3 },
          enum: () => getPublicData('DY_STATUS_COM'),
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'yjdwName',
          label: '一级单位（市）',
          width: '180'
        },
        {
          prop: 'ejdwName',
          label: '二级单位（县）',
          width: '180'
        },
      {
        prop: 'zcTypeName',
        label: '资产类型',
        width: '180'
      },
      {
        prop: 'dydjName',
        label: '电压等级',
        width: '180'
      },
      {
        prop: 'lineTypeName',
        label: '线路类型',
        width: '180'
      },
      {
        prop: 'lineName',
        label: '线路名称',
        width: '180'
      },
      {
        prop: 'lineLength',
        label: '线路总长度（km）',
        width: '180'
      },
      {
        prop: 'jkzlLineLength',
        label: '架空直流长度（km）',
        width: '180'
      },
      {
        prop: 'jkjlLineLength',
        label: '架空交流长度（km）',
        width: '180'
      },
      {
        prop: 'dlzlLineLength',
        label: '电缆直流长度（km）',
        width: '180'
      },
      {
        prop: 'dljlLineLength',
        label: '电缆交流长度（km）',
        width: '180'
      },
      {
        prop: 'remark',
        label: '备注',
        width: '180'
      }
    ],
    formFields:[
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        type: 'select',
        required: true,
        options: yjdwList.value as any
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        type: 'select',
        required: true,
        dependsOn: 'yjdw',
        optionsLoader: async (yjdwValue: string, formData: Record<string, any>) => {
          const response = await getEjdw({
            YJDW: yjdwValue,
            parentCode: yjdwValue,
            dwId: userInfo.value.dwId,
            bmId: userInfo.value.deptId
          })
          return response.data.map((ejdw: any) => ({
            label: ejdw.name,
            value: ejdw.code
          }))
        }
      },
    
      {
        prop: 'zcType',
        label: '资产类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_ZCLX_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
    
      {
        prop: 'dydj',
        label: '电压等级',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_SDDYDJ_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
    
      {
        prop: 'lineType',
        label: '线路类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_XLLX_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
    
      {
        prop: 'lineName',
        label: '线路名称',
        type: 'input'
      },
    
      {
        prop: 'lineLength',
        label: '线路总长度（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
    
      {
        prop: 'jkzlLineLength',
        label: '架空直流长度（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'jkjlLineLength',
        label: '架空交流长度（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
    
      {
        prop: 'dlzlLineLength',
        label: '电缆直流长度（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'dljlLineLength',
        label: '电缆交流长度（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'remark',
        label: '备注',
        type: 'textarea'
      }
    ] ,
    importTitle: '输电线路信息',
    modalTitle: '输电线路信息',
    getTableList: sdxlxxPageApi,
    deleteApi: sdxlxxRemoveApi,
    submitApi: sdxlxxSubmit,
    saveApi: sdxlxxSaveApi,
    infoApi: sdxlxxGetInfoApi,
    tempApi: sdxlxxgetImportTemplate,
    importApi: sdxlxxImportExcel,
    exportApi: sdxlxxExportExcel
  })

  const tableCon = ref<any>({
    tableColumns:[
      { type: 'selection', width: 50 },
        { type: 'index', width: 50, label: '序号' },
        {
          prop: 'statusName',
          label: '状态',
          width: '80'
        },
        {
          prop: 'yjdw',
          label: '一级单位（市）',
          search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
          enum: yjdwList.value,
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'ejdw',
          label: '二级单位（县）',
          search: { el: 'select', order: 2 },
          enum: ejdwList.value,
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'status',
          label: '状态',
          search: { el: 'select', order: 3 },
          enum: () => getPublicData('DY_STATUS_COM'),
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'yjdwName',
          label: '一级单位（市）',
          width: '180'
        },
        {
          prop: 'ejdwName',
          label: '二级单位（县）',
          width: '180'
        },
      {
        prop: 'cgzsjHxlc',
        label: '常规直升机航巡里程（km）',
        width: '180'
      },
      {
        prop: 'jgsmzsjHxlc',
        label: '激光扫描直升机航巡里程（km）',
        width: '220'
      },
      {
        prop: 'yjtxHxlc',
        label: '应急特巡巡里程（km）',
        width: '180'
      },
      {
        prop: 'zdxwrjFshHxlc',
        label: '中大型无人机防山火巡视里程（km）',
        width: '220'
      },
      {
        prop: 'zdxwrjTdjcHxlc',
        label: '中大型无人机通道检测巡视里程（km）',
        width: '240'
      },
      {
        prop: 'zdxwrjSzjcHxlc',
        label: '中大型无人机树障检测巡视里程（km）',
        width: '240'
      },
      {
        prop: 'zzxzsjDyds',
        label: '中重型直升机吊运吨数（t）',
        width: '180'
      },
    
      {
        prop: 'remark',
        label: '备注',
        width: '180'
      }
    ] ,
    formFields: [
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        type: 'select',
        required: true,
        options: yjdwList.value as any
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        type: 'select',
        required: true,
        dependsOn: 'yjdw',
        optionsLoader: async (yjdwValue: string, formData: Record<string, any>) => {
          const response = await getEjdw({
            YJDW: yjdwValue,
            parentCode: yjdwValue,
            dwId: userInfo.value.dwId,
            bmId: userInfo.value.deptId
          })
          return response.data.map((ejdw: any) => ({
            label: ejdw.name,
            value: ejdw.code
          }))
        }
      },
    
      {
        prop: 'xjzcType',
        label: '巡检资产类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_ZCLX_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
    
      {
        prop: 'cgzsjHxlc',
        label: '常规直升机航巡里程（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
    
      {
        prop: 'jgsmzsjHxlc',
        label: '激光扫描直升机航巡里程（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'yjtxHxlc',
        label: '应急特巡巡里程（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
    
      {
        prop: 'zdxwrjFshHxlc',
        label: '中大型无人机防山火巡视里程（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'zdxwrjTdjcHxlc',
        label: '中大型无人机通道检测巡视里程（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'zdxwrjSzjcHxlc',
        label: '中大型无人机树障检测巡视里程（km）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'zzxzsjDyds',
        label: '中重型直升机吊运吨数（t）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'remark',
        label: '备注',
        type: 'textarea'
      }
    ],
    importTitle: '直升机巡检信息',
    modalTitle: '直升机巡检信息',
    getTableList: zsjxjxxPageApi,
    deleteApi: zsjxjxxRemoveApi,
    submitApi: zsjxjxxSubmit,
    saveApi: zsjxjxxSaveApi,
    infoApi: zsjxjxxGetInfoApi,
    tempApi: zsjxjxxgetImportTemplate,
    importApi: zsjxjxxImportExcel,
    exportApi: zsjxjxxExportExcel
  })

  const tableRow = ref<any>({
    tableColumns:[
      { type: 'selection', width: 50 },
        { type: 'index', width: 50, label: '序号' },
        {
          prop: 'statusName',
          label: '状态',
          width: '80'
        },
        {
          prop: 'yjdw',
          label: '一级单位（市）',
          search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
          enum: yjdwList.value,
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'ejdw',
          label: '二级单位（县）',
          search: { el: 'select', order: 2 },
          enum: ejdwList.value,
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'status',
          label: '状态',
          search: { el: 'select', order: 3 },
          enum: () => getPublicData('DY_STATUS_COM'),
          fieldNames: { label: 'name', value: 'code' },
          isShow: false
        },
        {
          prop: 'yjdwName',
          label: '一级单位（市）',
          width: '180'
        },
        {
          prop: 'ejdwName',
          label: '二级单位（县）',
          width: '180'
        },
      {
        prop: 'bdzmc',
        label: '变电站名称',
        width: '180'
      },
      {
        prop: 'bdzaddr',
        label: '变电站地址',
        width: '180'
      },
      {
        prop: 'zclxName',
        label: '资产类型',
        width: '180'
      },
      {
        prop: 'dydjName',
        label: '电压等级',
        width: '180'
      },
      {
        prop: 'tyrq',
        label: '投运日期',
        width: '180'
      },
      {
        prop: 'zbts',
        label: '主变台数（台）',
        width: '180'
      },
      {
        prop: 'zbzrl',
        label: '主变总容量（MVA）',
        width: '180'
      },
      {
        prop: 'txjs',
        label: '调相机数（台）',
        width: '180'
      },
      {
        prop: 'sfsnzName',
        label: '是否枢纽站',
        width: '180'
      },
      {
        prop: 'zyjb',
        label: '重要级别',
        width: '180'
      },
      {
        prop: 'sfjzjkName',
        label: '是否集中监控',
        width: '180'
      },
      {
        prop: 'dyjkzmc',
        label: '对应集控站名称',
        width: '180'
      },
      {
        prop: 'jzmj',
        label: '建筑面积（㎡）',
        width: '180'
      },
      {
        prop: 'zdmj',
        label: '占地面积（㎡）',
        width: '180'
      },
      {
        prop: 'bz',
        label: '备注',
        width: '180'
      }
    ],
    formFields:[
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        type: 'select',
        required: true,
        options: yjdwList.value as any
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        type: 'select',
        required: true,
        dependsOn: 'yjdw',
        optionsLoader: async (yjdwValue: string, formData: Record<string, any>) => {
          const response = await getEjdw({
            YJDW: yjdwValue,
            parentCode: yjdwValue,
            dwId: userInfo.value.dwId,
            bmId: userInfo.value.deptId
          })
          return response.data.map((ejdw: any) => ({
            label: ejdw.name,
            value: ejdw.code
          }))
        }
      },
      {
        prop: 'bdzmc',
        label: '变电站名称',
        type: 'input'
      },
    
      {
        prop: 'bdzaddr',
        label: '变电站地址',
        type: 'input'
      },
    
      {
        prop: 'zclx',
        label: '资产类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_ZCLX_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
    
      {
        prop: 'dydj',
        label: '电压等级',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_BDDYDJ_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
      {
        prop: 'tyrq',
        label: '投运日期',
        type: 'date'
      },
    
      {
        prop: 'zbts',
        label: '主变台数（台）',
        rules: integerRules(),
    
        type: 'input'
      },
    
      {
        prop: 'zbzrl',
        label: '主变总容量（MVA）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'txjs',
        label: '调相机数（台）',
        rules: integerRules(),
    
        type: 'input'
      },
      {
        prop: 'sfsnz',
        label: '是否枢纽站',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'GY_SF'},
          valueField: 'code',
          labelField: 'name'
        },
      },
      {
        prop: 'zyjb',
        label: '重要级别',
        type: 'input'
      },
      {
        prop: 'sfjzjk',
        label: '是否集中监控',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'GY_SF'},
          valueField: 'code',
          labelField: 'name'
        },
      },
      {
        prop: 'dyjkzmc',
        label: '对应集控站名称',
        type: 'input'
      },
    
      {
        prop: 'jzmj',
        label: '建筑面积（㎡）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'zdmj',
        label: '占地面积（㎡）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'bz',
        label: '备注',
        type: 'textarea'
      }
    ],
    importTitle: '变电站信息',
    modalTitle: '变电站信息',
    getTableList: bdzxxPageApi,
    deleteApi: bdzxxRemoveApi,
    submitApi: bdzxxSubmit,
    saveApi: bdzxxSaveApi,
    infoApi: bdzxxGetInfoApi,
    tempApi: bdzxxgetImportTemplate,
    importApi: bdzxxImportExcel,
    exportApi: bdzxxExportExcel
  })
  return {
    tables,
    tableCon,
    tableRow
  }
}
