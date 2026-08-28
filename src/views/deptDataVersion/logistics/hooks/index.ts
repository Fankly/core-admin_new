import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'
import {
  glyfwxxPage,
  glyfwxxRemove,
  glyfwxxSubmit,
  glyfwxxSave,
  glyfwxxGetInfo,
  glyfwxxGetImportTemplate,
  glyfwxxImportExcel,
  glyfwxxExportExcel,
  cnxxPage,
  cnxxRemove,
  cnxxSubmit,
  cnxxSave,
  cnxxGetInfo,
  cnxxGetImportTemplate,
  cnxxImportExcel,
  cnxxExportExcel,
  qtxxPage,
  qtxxRemove,
  qtxxSubmit,
  qtxxSave,
  qtxxGetInfo,
  qtxxGetImportTemplate,
  qtxxImportExcel,
  qtxxExportExcel
} from '@/api/motivation/RearMotivation/index'

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
        prop: 'mc',
        label: '名称',
        width: '180'
      },
      {
        prop: 'addr',
        label: '地址',
        width: '180'
      },
      {
        prop: 'jzmj',
        label: '建筑面积(㎡)',
        width: '180'
      },
      {
        prop: 'cqmj',
        label: '产权面积(㎡)',
        width: '180'
      },
      {
        prop: 'cqzh',
        label: '产权证号',
        width: '180'
      },
      {
        prop: 'tdzh',
        label: '土地证号',
        width: '180'
      },
      {
        prop: 'gdzckh',
        label: '固定资产卡片号',
        width: '180'
      },
      {
        prop: 'yz',
        label: '原值（元）',
        width: '180'
      },
      {
        prop: 'jz',
        label: '净值（元）',
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
        prop: 'mc',
        label: '名称',
        type: 'input',
        required: true
      },
      {
        prop: 'addr',
        label: '地址',
        type: 'input',
        required: true
      },
      {
        prop: 'jzmj',
        label: '建筑面积(㎡)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'cqmj',
        label: '产权面积(㎡)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'cqzh',
        label: '产权证号',
        type: 'input'
      },
      {
        prop: 'tdzh',
        label: '土地证号',
        type: 'input'
      },
      {
        prop: 'gdzckh',
        label: '固定资产卡片号',
        type: 'input'
      },
      {
        prop: 'yz',
        label: '原值（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'jz',
        label: '净值（元）',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '管理用房屋信息',
    modalTitle: '管理用房屋信息',
    getTableList: glyfwxxPage,
    deleteApi: glyfwxxRemove,
    submitApi: glyfwxxSubmit,
    saveApi: glyfwxxSave,
    infoApi: glyfwxxGetInfo,
    tempApi: glyfwxxGetImportTemplate,
    importApi: glyfwxxImportExcel,
    exportApi: glyfwxxExportExcel
  })

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
        prop: 'cphm',
        label: '车牌号码'
      },
      {
        prop: 'cnsyxz',
        label: '车辆使用性质',
        width: '180'
      },
      {
        prop: 'cnyt',
        label: '车辆用途',
        width: '80'
      },
      {
        prop: 'cnlx',
        label: '车辆类型',
        width: '180'
      },
      {
        prop: 'sfdb',
        label: '是否定编',
        width: '180'
      },
      {
        prop: 'lcdj',
        label: '裸车单价（万元）',
        width: '180'
      },
      {
        prop: 'hsdj',
        label: '含税单价（万元）',
        width: '180'
      },
      {
        prop: 'gzrq',
        label: '购置日期',
        width: '180'
      },
      {
        prop: 'clpp',
        label: '车辆品牌',
        width: '180'
      },
      {
        prop: 'clxh',
        label: '车辆型号',
        width: '180'
      },
      {
        prop: 'dllx',
        label: '动力类型',
        width: '180'
      },
      {
        prop: 'gdzckph',
        label: '固定资产卡号',
        width: '180'
      },
      {
        prop: 'bs',
        label: '是否供电所车辆标识',
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
        prop: 'cphm',
        label: '车牌号码',
        type: 'input',
        required: true
      },
      {
        prop: 'cnsyxz',
        label: '车辆使用性质',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_CLSXXZ_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
      {
        prop: 'cnyt',
        label: '车辆用途',
        type: 'input'
      },
      {
        prop: 'cnlx',
        label: '车辆类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'DY_CLLX_COM'},
          valueField: 'code',
          labelField: 'name'
        },
      },
      {
        prop: 'sfdb',
        label: '是否定编',
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
        prop: 'lcdj',
        label: '裸车单价（万元）',
        type: 'input',
        rules: decimal6Rules()
      },
      {
        prop: 'hsdj',
        label: '含税单价（万元）',
        type: 'input',
        rules: decimal6Rules()
      },
      {
        prop: 'gzrq',
        label: '购置日期',
        type: 'date'
      },
      {
        prop: 'clpp',
        label: '车辆品牌',
        type: 'input'
      },
      {
        prop: 'clxh',
        label: '车辆型号',
        type: 'input'
      },
      {
        prop: 'dllx',
        label: '动力类型',
        type: 'input'
      },
      {
        prop: 'gdzckph',
        label: '固定资产卡号',
        type: 'input'
      },
      {
        prop: 'bs',
        label: '是否供电所车辆标识',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params:{code:'GY_SF'},
          valueField: 'code',
          labelField: 'name'
        },
      }
    ],
    importTitle: '车辆信息',
    modalTitle: '车辆信息',
    getTableList: cnxxPage,
    deleteApi: cnxxRemove,
    submitApi: cnxxSubmit,
    saveApi: cnxxSave,
    infoApi: cnxxGetInfo,
    tempApi: cnxxGetImportTemplate,
    importApi: cnxxImportExcel,
    exportApi: cnxxExportExcel
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
        prop: 'qmfwzcyz',
        label: '期末房屋资产原值（元）'
      },
      {
        prop: 'zyfwcqmj',
        label: '自有房屋产权面积(㎡)',
        width: '180'
      },
      {
        prop: 'bgmj',
        label: '办公经营场所土地面积(㎡)',
        width: '180'
      },
      {
        prop: 'zlfze',
        label: '租赁费总额（元）',
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
        prop: 'qmfwzcyz',
        label: '期末房屋资产原值（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'zyfwcqmj',
        label: '自有房屋产权面积(㎡)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'bgmj',
        label: '办公经营场所土地面积(㎡)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'zlfze',
        label: '租赁费总额（元）',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '其他信息',
    modalTitle: '其他信息',
    getTableList: qtxxPage,
    deleteApi: qtxxRemove,
    submitApi: qtxxSubmit,
    saveApi: qtxxSave,
    infoApi: qtxxGetInfo,
    tempApi: qtxxGetImportTemplate,
    importApi: qtxxImportExcel,
    exportApi: qtxxExportExcel
  })
  return {
    tables,
    tableCon,
    tableRow
  }
}
