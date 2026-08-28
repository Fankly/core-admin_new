import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'

import {
  zycxxPage,
  zycxxInfo,
  zycxxSave,
  zycxxRemove,
  zycxxSubmit,
  zycxxImportExcel,
  zycxxExportExcel,
  zycxxGetImportTemplate,
  zckxxPage,
  zckxxInfo,
  zckxxSave,
  zckxxRemove,
  zckxxSubmit,
  zckxxImportExcel,
  zckxxExportExcel,
  zckxxGetImportTemplate
} from '@/api/motivation/goods'

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

  const tableCon = ref<any>({
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
        prop: 'gkzybm',
        label: '归口专业部门',
        width: '180'
      },
      {
        prop: 'zycName',
        label: '专业仓名称',
        width: '180'
      },
      {
        prop: 'zycAddr',
        label: '地址',
        width: '180'
      },
      {
        prop: 'jzArea',
        label: '建筑面积(m²)',
        width: '180'
      }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'id',
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
        prop: 'gkzybm',
        label: '归口专业部门',
        type: 'input'
      },
      {
        prop: 'zycName',
        label: '专业仓名称',
        type: 'input',
        required: true
      },
      {
        prop: 'zycAddr',
        label: '地址',
        type: 'input'
      },
      {
        prop: 'jzArea',
        label: '建筑面积(m²)',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '专业仓信息',
    modalTitle: '专业仓信息',
    getTableList: zycxxPage,
    deleteApi: zycxxRemove,
    submitApi: zycxxSubmit,
    saveApi: zycxxSave,
    infoApi: zycxxInfo,
    tempApi: zycxxGetImportTemplate,
    importApi: zycxxImportExcel,
    exportApi: zycxxExportExcel
  })

  const tableRow = ref<any>({
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
        prop: 'zckName',
        label: '注册库名称',
        width: '180'
      },
      {
        prop: 'zckAddr',
        label: '地址',
        width: '180'
      },
      {
        prop: 'zdArea',
        label: '占地面积(m²)',
        width: '180'
      },
      {
        prop: 'kfArea',
        label: '库房面积(m²)',
        width: '180'
      },
      {
        prop: 'dcArea',
        label: '堆场面积(m²)',
        width: '180'
      },
      {
        prop: 'hpArea',
        label: '货棚面积(m²)',
        width: '180'
      },
      {
        prop: 'tdzArea',
        label: '土地证面积(m²)',
        width: '180'
      },
      {
        prop: 'ckzcxz',
        label: '仓库资产性质',
        width: '180'
      },
      {
        prop: 'ckzcgs',
        label: '仓库资产归属',
        width: '180'
      },
      {
        prop: 'ckjgyssj',
        label: '仓库竣工验收时间',
        width: '180'
      }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'id',
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
        prop: 'zckName',
        label: '注册库名称',
        type: 'input',
        required: true
      },
      {
        prop: 'zckAddr',
        label: '地址',
        type: 'input'
      },
      {
        prop: 'zdArea',
        label: '占地面积(m²)',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'kfArea',
        label: '库房面积(m²)',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'dcArea',
        label: '堆场面积(m²)',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'hpArea',
        label: '货棚面积(m²)',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'tdzArea',
        label: '土地证面积(m²)',
        rules: decimal2Rules(),
        type: 'input'
      },
      {
        prop: 'ckzcxz',
        label: '仓库资产性质',
        type: 'input'
      },
      {
        prop: 'ckzcgs',
        label: '仓库资产归属',
        type: 'input'
      },
      {
        prop: 'ckjgyssj',
        label: '仓库竣工验收时间',
        type: 'date'
      }
    ],
    importTitle: '注册库信息',
    modalTitle: '注册库信息',
    getTableList: zckxxPage,
    deleteApi: zckxxRemove,
    submitApi: zckxxSubmit,
    saveApi: zckxxSave,
    infoApi: zckxxInfo,
    tempApi: zckxxGetImportTemplate,
    importApi: zckxxImportExcel,
    exportApi: zckxxExportExcel
  })
  return {
    tableCon,
    tableRow
  }
}
