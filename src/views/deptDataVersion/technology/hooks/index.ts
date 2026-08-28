import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules } from '@/utils/rules'
import {
  zlhyffyxxPageApi,
  zlhyffyxxRemoveApi,
  zlhyffyxxSubmit,
  zlhyffyxxSaveApi,
  zlhyffyxxGetInfoApi,
  zlhyffyxxgetImportTemplate,
  zlhyffyxxImportExcel,
  zlhyffyxxExportExcel
} from '@/api/motivation/science'

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
        search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
        isShow: false,
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
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
        prop: 'fmzlgs',
        label: '发明专利个数'
      },
      {
        prop: 'syxywazlgs',
        label: '实用型与外观专利个数'
      },
      {
        prop: 'yjkff',
        label: '总部确定研究开发费（元）'
      }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'Id',
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
        prop: 'fmzlgs',
        label: '发明专利个数',
        type: 'input',
        rules: integerRules()
      },

      {
        prop: 'syxywazlgs',
        label: '实用型与外观专利个数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'yjkff',
        label: '总部确定研究开发费（元）',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '专利和研发费用信息',
    modalTitle: '专利和研发费用信息',
    getTableList: zlhyffyxxPageApi,
    deleteApi: zlhyffyxxRemoveApi,
    submitApi: zlhyffyxxSubmit,
    saveApi: zlhyffyxxSaveApi,
    infoApi: zlhyffyxxGetInfoApi,
    tempApi: zlhyffyxxgetImportTemplate,
    importApi: zlhyffyxxImportExcel,
    exportApi: zlhyffyxxExportExcel
  })

  return {
    tables
  }
}
