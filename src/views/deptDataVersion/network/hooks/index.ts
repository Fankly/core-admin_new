import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'
import {
  pdxlxxPageApi,
  pdxlxxRemoveApi,
  pdxlxxSubmit,
  pdxlxxSaveApi,
  pdxlxxGetInfoApi,
  pdxlxxgetImportTemplate,
  pdxlxxImportExcel,
  pdxlxxExportExcel
} from '@/api/motivation/distribution-network'

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
        prop: 'yjdw',
        label: '一级单位（市）',
        width: '180',
        search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
        isShow: false,
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        width: '180',
        search: { el: 'select', order: 2 },
        enum: ejdwList.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'status',
        label: '状态',
        width: '120',
        search: {
          el: 'select',
          order: 3
        },
        enum: () => getPublicData('DY_STATUS_COM'),
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'yjdwName',
        label: '一级单位（市）'
      },
      {
        prop: 'ejdwName',
        label: '二级单位（县）'
      },
      {
        prop: 'xlmc',
        label: '线路名称',
        width: '120'
      },
      {
        prop: 'xlzcd',
        label: '线路总长度（km）',
        width: '150'
      },
      {
        prop: 'jkcd',
        label: '架空长度（km）',
        width: '120'
      },
      {
        prop: 'dlcd',
        label: '电缆长度（km）',
        width: '120'
      },
      {
        prop: 'pbsl',
        label: '配变数量（个）',
        width: '120'
      },
      {
        prop: 'pbzrl',
        label: '配变总容量（VA）',
        width: '150'
      },
      {
        prop: 'pdzf',
        label: '配电站房（个）',
        width: '120'
      },
      {
        prop: 'dytq',
        label: '低压台区（个）',
        width: '120'
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
        prop: 'xlmc',
        label: '线路名称',
        type: 'input'
      },

      {
        prop: 'xlzcd',
        label: '线路总长度（km）',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'jkcd',
        label: '架空长度（km）',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'dlcd',
        label: '电缆长度（km）',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'pbsl',
        label: '配变数量（个）',
        rules: integerRules(),
        type: 'input'
      },

      {
        prop: 'pbzrl',
        label: '配变总容量（VA）',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'pdzf',
        label: '配电站房（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'dytq',
        label: '低压台区（个）',
        rules: integerRules(),
        type: 'input'
      }
    ],
    importTitle: '配电线路信息',
    modalTitle: '配电线路信息',
    getTableList: pdxlxxPageApi,
    deleteApi: pdxlxxRemoveApi,
    submitApi: pdxlxxSubmit,
    saveApi: pdxlxxSaveApi,
    infoApi: pdxlxxGetInfoApi,
    tempApi: pdxlxxgetImportTemplate,
    importApi: pdxlxxImportExcel,
    exportApi: pdxlxxExportExcel
  })

  return {
    tables
  }
}
