import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'
import {
  cwxgxxPage,
  cwxgxxRemove,
  cwxgxxSubmit,
  cwxgxxSave,
  cwxgxxGetInfo,
  cwxgxxGetImportTemplate,
  cwxgxxImportExcel,
  cwxgxxExportExcel
} from '@/api/motivation/FinanceMotivation/index'

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

  const tables = ref<any>(
    {
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
          prop: 'qmzczy',
          label: '期末资产总额（合并口径）（元）',
          width: '180'
        },
        {
          prop: 'gdzcyz',
          label: '期末固定资产原值（不含运输设备及土地）（元）',
          width: '180'
        },
        {
          prop: 'snmyz',
          label: '上年末可摊销长期待摊费用原值（元）',
          width: '180'
        },
        {
          prop: 'snmtdsyq',
          label: '上年末可摊销无形资产原值-土地使用权（元）',
          width: '180'
        },
        {
          prop: 'yzqt',
          label: '上年末可摊销无形资产原值-其他（元）',
          width: '180'
        },
        {
          prop: 'wzcgje',
          label: '当年物资采购金额（元）',
          width: '180'
        },
        {
          prop: 'ysndbh',
          label: '电力产品主营业务收入净额（不含网间售电收入-预算年度前一年统计）（元）',
          width: '180'
        },
        {
          prop: 'ysndh',
          label: '电力产品主营业务收入净额（含网间售电收入-预算年度前一年统计）（元）',
          width: '180'
        },
        {
          prop: 'ywsrje',
          label: '综合能源公司主营业务收入净额（元）',
          width: '180'
        },
        {
          prop: 'ywsr',
          label: '节能服务费（元）',
          width: '180'
        },
        {
          prop: 'dfzfsf',
          label: '地方政府收费（预算年度预算）（元）',
          width: '180'
        },
        {
          prop: 'sfee',
          label: '水价（元/吨）',
          width: '180'
        },
        {
          prop: 'dfee',
          label: '电价（元/千瓦时）',
          width: '180'
        },
        {
          prop: 'yyzsrje',
          label: '营业总收入净额（万元）',
          width: '180'
        },
        {
          prop: 'zyysrje',
          label: '市场化单位主营业收入净额（万元）',
          width: '180'
        },
        {
          prop: 'gs',
          label: '分部、省公司本部个数',
          width: '180'
        },
        {
          prop: 'dwgs',
          label: '地市级供电单位个数',
          width: '180'
        },
        {
          prop: 'xdwgs',
          label: '县级供电单位个数（含直供直管县、控股县）',
          width: '180'
        },
        {
          prop: 'mdwgs',
          label: '母公司口径其他经费单位个数',
          width: '180'
        },
        {
          prop: 'gsdwsl',
          label: '增量配电公司单位数量',
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
          prop: 'qmzczy',
          label: '期末资产总额（合并口径）（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'gdzcyz',
          label: '期末固定资产原值（不含运输设备及土地）（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'snmyz',
          label: '上年末可摊销长期待摊费用原值（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'snmtdsyq',
          label: '上年末可摊销无形资产原值-土地使用权（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'yzqt',
          label: '上年末可摊销无形资产原值-其他（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'wzcgje',
          label: '当年物资采购金额（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'ysndbh',
          label: '电力产品主营业务收入净额（不含网间售电收入-预算年度前一年统计）（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'ysndh',
          label: '电力产品主营业务收入净额（含网间售电收入-预算年度前一年统计）（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'ywsrje',
          label: '综合能源公司主营业务收入净额（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'ywsr',
          label: '节能服务费（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'dfzfsf',
          label: '地方政府收费（预算年度预算）（元）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'sfee',
          label: '水价（元/吨）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'dfee',
          label: '电价（元/千瓦时）',
          type: 'input',
          rules: decimal2Rules()
        },
        {
          prop: 'yyzsrje',
          label: '营业总收入净额（万元）',
          type: 'input',
          rules: decimal6Rules()
        },
        {
          prop: 'zyysrje',
          label: '市场化单位主营业收入净额（万元）',
          type: 'input',
          rules: decimal6Rules()
        },
        {
          prop: 'gs',
          label: '分部、省公司本部个数',
          type: 'input',
          rules: integerRules()
        },
        {
          prop: 'dwgs',
          label: '地市级供电单位个数',
          type: 'input',
          rules: integerRules()
        },
        {
          prop: 'xdwgs',
          label: '县级供电单位个数（含直供直管县、控股县）',
          type: 'input',
          rules: integerRules()
        },
        {
          prop: 'mdwgs',
          label: '母公司口径其他经费单位个数',
          type: 'input',
          rules: integerRules()
        },
        {
          prop: 'gsdwsl',
          label: '增量配电公司单位数量',
          type: 'input',
          rules: integerRules()
        }
      ],
      importTitle: '财务相关信息',
      modalTitle: '财务相关信息',
      getTableList: cwxgxxPage,
      deleteApi: cwxgxxRemove,
      submitApi: cwxgxxSubmit,
      saveApi: cwxgxxSave,
      infoApi: cwxgxxGetInfo,
      tempApi: cwxgxxGetImportTemplate,
      importApi: cwxgxxImportExcel,
      exportApi: cwxgxxExportExcel
    }
  )

  return {
    tables
  }
}
