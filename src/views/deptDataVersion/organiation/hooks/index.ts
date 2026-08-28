import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules } from '@/utils/rules'
import {
  ryhgzxxPage,
  ryhgzxxRemove,
  ryhgzxxSubmit,
  ryhgzxxSave,
  ryhgzxxGetInfo,
  ryhgzxxGetImportTemplate,
  ryhgzxxImportExcel,
  ryhgzxxExportExcel
} from '@/api/motivation/TissueMotivTation/index'

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
    tableColumns:  [
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
        enum: ()=>getPublicData('DY_STATUS_COM'),
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
        prop: 'zszgNum',
        label: '正式职工人数',
        width: '180'
      },
      {
        prop: 'wpryNum',
        label: '外聘人员数量',
        width: '180'
      },
      {
        prop: 'dbryNum',
        label: '定编人数',
        width: '180'
      },
      {
        prop: 'ndgNum',
        label: '农电工人数',
        width: '180'
      },
      {
        prop: 'ndgAvgSalary',
        label: '农电工平均工资水平（元）',
        width: '180'
      },
      {
        prop: 'ddshAvgSalary',
        label: '当地社会人均工资水平（元）',
        width: '180'
      },
      {
        prop: 'zszgqbNum',
        label: '正式职工缺编人数',
        width: '180'
      },
      {
        prop: 'totalSalary',
        label: '当年工资总额（元）',
        width: '180'
      },
      {
        prop: 'lastTotalSalary',
        label: '上年度职工工资总额（元）',
        width: '180'
      }
    ],
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
        prop: 'zszgNum',
        label: '正式职工人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'wpryNum',
        label: '外聘人员数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dbryNum',
        label: '定编人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ndgNum',
        label: '农电工人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ndgAvgSalary',
        label: '农电工平均工资水平（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'ddshAvgSalary',
        label: '当地社会人均工资水平（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'zszgqbNum',
        label: '正式职工缺编人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'totalSalary',
        label: '当年工资总额（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'lastTotalSalary',
        label: '上年度职工工资总额（元）',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '人员和工资信息',
    modalTitle: '人员和工资信息',
    getTableList: ryhgzxxPage,
    deleteApi: ryhgzxxRemove,
    submitApi: ryhgzxxSubmit,
    saveApi: ryhgzxxSave,
    infoApi: ryhgzxxGetInfo,
    tempApi: ryhgzxxGetImportTemplate,
    importApi: ryhgzxxImportExcel,
    exportApi: ryhgzxxExportExcel
  })

  return {
    tables
  }
}
