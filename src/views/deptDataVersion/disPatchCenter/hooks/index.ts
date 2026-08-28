import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'
import {
  txxlxxPage,
  txxlxxInfo,
  txxlxxSave,
  txxlxxRemove,
  txxlxxSubmit,
  txxlxxImportExcel,
  txxlxxExportExcel,
  txxlxxGetImportTemplate,
  txzdxxPage,
  txzdxxInfo,
  txzdxxSave,
  txzdxxRemove,
  txzdxxSubmit,
  txzdxxImportExcel,
  txzdxxExportExcel,
  txzdxxGetImportTemplate,
  txqtxxPage,
  txqtxxInfo,
  txqtxxSave,
  txqtxxRemove,
  txqtxxSubmit,
  txqtxxImportExcel,
  txqtxxExportExcel,
  txqtxxGetImportTemplate
} from '@/api/motivation/adjustCenter'

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
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: () => getPublicData('DY_STATUS_COM'),
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
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
        prop: 'statusName',
        label: '状态',
        width: '80'
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
        prop: 'lineName',
        label: '线路名称',
        width: '180'
      },
      {
        prop: 'lineType',
        label: '线路类型',
        fieldNames: { label: 'label', value: 'value' },
        width: '280'
      },
      {
        prop: 'lineLength',
        label: '线路总长度(km)',
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
        prop: 'lineName',
        label: '线路名称',
        type: 'input',
        required: true
      },
      {
        prop: 'lineType',
        label: '线路类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'DY_GLXLLX_COM' },
          valueField: 'code',
          labelField: 'name'
        }
      },
      {
        prop: 'lineLength',
        label: '线路总长度(km)',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '通信线路信息',
    modalTitle: '通信线路信息',
    getTableList: txxlxxPage,
    deleteApi: txxlxxRemove,
    submitApi: txxlxxSubmit,
    saveApi: txxlxxSave,
    infoApi: txxlxxInfo,
    tempApi: txxlxxGetImportTemplate,
    importApi: txxlxxImportExcel,
    exportApi: txxlxxExportExcel
  })

  const tableCon = ref<any>({
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: () => getPublicData('DY_STATUS_COM'),
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
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
        prop: 'statusName',
        label: '状态',
        width: '80'
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
        prop: 'stationName',
        label: '站点名称',
        width: '180'
      },
      {
        prop: 'stationType',
        label: '站点类型',
        width: '180'
      },
      {
        prop: 'equipNum',
        label: '光传输设备个数',
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
        prop: 'stationName',
        label: '站点名称',
        type: 'input'
      },
      {
        prop: 'stationType',
        label: '站点类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'DY_ZDLX_COM' },
          valueField: 'code',
          labelField: 'name'
        }
      },
      {
        prop: 'equipNum',
        label: '光传输设备个数',
        type: 'input',
        rules: integerRules()
      }
    ],
    importTitle: '通信站点信息',
    modalTitle: '通信站点信息',
    getTableList: txzdxxPage,
    deleteApi: txzdxxRemove,
    submitApi: txzdxxSubmit,
    saveApi: txzdxxSave,
    infoApi: txzdxxInfo,
    tempApi: txzdxxGetImportTemplate,
    importApi: txzdxxImportExcel,
    exportApi: txzdxxExportExcel
  })

  const tableRow = ref<any>({
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: () => getPublicData('DY_STATUS_COM'),
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
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
        prop: 'statusName',
        label: '状态',
        width: '80'
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
        prop: 'orgType',
        label: '调度机构类型',
        width: '180'
      },
      {
        prop: 'orgNum',
        label: '机构数量',
        width: '180'
      },
      {
        prop: 'cz220Num',
        label: '厂站数量(220kV)',
        width: '180'
      },
      {
        prop: 'cz330Num',
        label: '厂站数量(330kV)',
        width: '180'
      },
      {
        prop: 'cz500Num',
        label: '厂站数量(500kV)',
        width: '180'
      },
      {
        prop: 'cz750Num',
        label: '厂站数量(750kV)',
        width: '180'
      },
      {
        prop: 'cz1000Num',
        label: '厂站数量(1000kV)',
        width: '180'
      },
      {
        prop: 'zddcNum',
        label: '直调电厂数量(个)',
        width: '180'
      },
      {
        prop: 'jfjdkdtfzssNum',
        label: '机房及调控大厅辅助设施数量(套)',
        width: '220'
      },
      {
        prop: 'ywyyNum',
        label: '业务应用数量(个)',
        width: '180'
      },
      {
        prop: 'fwqNum',
        label: '服务器数量(个)',
        width: '180'
      },
      {
        prop: 'ccsbNum',
        label: '存储设备数量(个)',
        width: '180'
      },
      {
        prop: 'wlsbNum',
        label: '网络设备数量(个)',
        width: '180'
      },
      {
        prop: 'aqfhsbNum',
        label: '安全防护设备数量(个)',
        width: '180'
      },
      {
        prop: 'xtrjNum',
        label: '系统软件数量(个)',
        width: '180'
      },
      {
        prop: 'jcptNum',
        label: '基础平台数量(个)',
        width: '180'
      },
      {
        prop: 'szxtNum',
        label: '时钟系统(套)',
        width: '180'
      },
      {
        prop: 'wbxtNum',
        label: '微波系统(套)',
        width: '180'
      },
      {
        prop: 'glsbNum',
        label: '光缆设备(套)',
        width: '180'
      },
      {
        prop: 'dsdhhyxtNum',
        label: '电视电话会议系统(套)',
        width: '180'
      },
      {
        prop: 'xzjhxtNum',
        label: '行政交换系统(套)',
        width: '180'
      },
      {
        prop: 'txjkxtNum',
        label: '通信监控系统(套)',
        width: '180'
      },
      {
        prop: 'fzsssbJgNum',
        label: '辅助设施设备-机柜(套)',
        width: '180'
      },
      {
        prop: 'fzsssbYjzhtxxtNum',
        label: '辅助设施设备-应急指挥通信系统（套）',
        width: '240'
      },
      {
        prop: 'fzsssbHsshyspsbNum',
        label: '辅助设施设备-会商室会议视频设备（套）',
        width: '260'
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
        prop: 'orgType',
        label: '调度机构类型',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'DY_DDJGLX_COM' },
          valueField: 'code',
          labelField: 'name'
        }
      },
      {
        prop: 'orgNum',
        label: '机构数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'cz220Num',
        label: '厂站数量(220kV)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'cz330Num',
        label: '厂站数量(330kV)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'cz500Num',
        label: '厂站数量(500kV)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'cz750Num',
        label: '厂站数量(750kV)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'cz1000Num',
        label: '厂站数量(1000kV)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zddcNum',
        label: '直调电厂数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'jfjdkdtfzssNum',
        label: '机房及调控大厅辅助设施数量(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ywyyNum',
        label: '业务应用数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'fwqNum',
        label: '服务器数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ccsbNum',
        label: '存储设备数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'wlsbNum',
        label: '网络设备数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'aqfhsbNum',
        label: '安全防护设备数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xtrjNum',
        label: '系统软件数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'jcptNum',
        label: '基础平台数量(个)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'szxtNum',
        label: '时钟系统(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'wbxtNum',
        label: '微波系统(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'glsbNum',
        label: '光缆设备(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dsdhhyxtNum',
        label: '电视电话会议系统(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xzjhxtNum',
        label: '行政交换系统(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'txjkxtNum',
        label: '通信监控系统(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'fzsssbJgNum',
        label: '辅助设施设备-机柜(套)',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'fzsssbYjzhtxxtNum',
        label: '辅助设施设备-应急指挥通信系统（套）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'fzsssbHsshyspsbNum',
        label: '辅助设施设备-会商室会议视频设备（套）',
        type: 'input',
        rules: integerRules()
      }
    ],
    importTitle: '其他信息',
    modalTitle: '其他信息',
    getTableList: txqtxxPage,
    deleteApi: txqtxxRemove,
    submitApi: txqtxxSubmit,
    saveApi: txqtxxSave,
    infoApi: txqtxxInfo,
    tempApi: txqtxxGetImportTemplate,
    importApi: txqtxxImportExcel,
    exportApi: txqtxxExportExcel
  })
  return {
    tables,
    tableCon,
    tableRow
  }
}
