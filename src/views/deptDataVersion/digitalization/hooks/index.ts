import { ref } from 'vue'
import { getEjdw, getPublicData } from '@/api/common' //公共代码
import { decimal2Rules, integerRules } from '@/utils/rules'
import {
  xxhxgxxPageApi,
  xxhxgxxRemoveApi,
  xxhxgxxSubmit,
  xxhxgxxSaveApi,
  xxhxgxxGetInfoApi,
  xxhxgxxgetImportTemplate,
  xxhxgxxImportExcel,
  xxhxgxxExportExcel
} from '@/api/motivation/informatiozation'

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
        prop: 'xxhzbxxmDntzys',
        label: '信息化资本性项目当年投资预算（元）',
        width: '150'
      },
      {
        prop: 'fwqjccsbNum',
        label: '服务器及存储设备数量（台）',
        width: '180'
      },
      {
        prop: 'jgNum',
        label: '机构数量（台）',
        width: '180'
      },
      {
        prop: 'softNum',
        label: '软件套数（套）',
        width: '180'
      },
      {
        prop: 'wljaqsbNum',
        label: '网络及安全设备数量（个）',
        width: '180'
      },
      {
        prop: 'syxtNum',
        label: '上云系统数（套）',
        width: '180'
      },
      {
        prop: 'yjdpNum',
        label: '运监大屏数（套）',
        width: '180'
      },
      {
        prop: 'jfjfzsbNum',
        label: '机房及辅助设备数（个）',
        width: '180'
      },
      {
        prop: 'sxtsbNum',
        label: '省信通服务器、存储设备、网络及安全设备数量（台）',
        width: '180'
      },
      {
        prop: 'dlsjzxjgNum',
        label: '独立数据中心机柜数量（个）',
        width: '180'
      },
      {
        prop: 'sjjrJrztNum',
        label: '数据接入-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        width: '180'
      },
      {
        prop: 'sjbzhJrztNum',
        label: '数据标准化-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        width: '180'
      },
      {
        prop: 'sjscyxzJrztNum',
        label: '数据上传与下发-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        width: '150'
      },
      {
        prop: 'sjpdJrztNum',
        label: '数据盘点-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        width: '180'
      },
      {
        prop: 'sjzymlglJrztNum',
        label: '数据资源目录管理-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        width: '180'
      },
      {
        prop: 'sjzlglJrztNum',
        label: '数据质量管理-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        width: '180'
      },
      {
        prop: 'jcsjztNum',
        label: '监测设计主题数量（总部、大数据中心、省公司）（项）',
        width: '180'
      },
      {
        prop: 'jcyxztNum',
        label: '监测运行主题数量（总部、大数据中心、省公司）（项）',
        width: '180'
      },
      {
        prop: 'sjwjfxztNum',
        label: '数据挖掘分析主题数量（总部、大数据中心、省公司）（项）',
        width: '200'
      },
      {
        prop: 'dsjyytgcpNum',
        label: '大数据应用推广产品数量（总部、大数据中心、省公司）（项）',
        width: '220'
      },
      {
        prop: 'rgznybyycjNum',
        label: '人工智能样本应用场景数量（总部、大数据中心、省公司）（个）',
        width: '220'
      },
      {
        prop: 'jsztzjNum',
        label: '技术中台组件数量（总部、大数据中心、省公司）',
        width: '180'
      },
      {
        prop: 'sjztNum',
        label: '数据中台（个）',
        width: '180'
      },
      {
        prop: 'dwzyywztNum',
        label: '电网资源业务中台（个）',
        width: '180'
      },
      {
        prop: 'khfwywztNum',
        label: '客户服务业务中台（个）',
        width: '180'
      },
      {
        prop: 'xmglywztNum',
        label: '项目管理业务中台（个）',
        width: '180'
      },
      {
        prop: 'cwglywztNum',
        label: '财务管理业务中台（个）',
        width: '180'
      },
      {
        prop: 'hxywxtNum',
        label: '核心业务系统（个）',
        width: '180'
      },
      {
        prop: 'qtywxtNum',
        label: '其他业务系统（个）',
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
        prop: 'xxhzbxxmDntzys',
        label: '信息化资本性项目当年投资预算（元）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
    
      {
        prop: 'fwqjccsbNum',
        label: '服务器及存储设备数量（台）',
        rules: integerRules(),
    
        type: 'input'
      },
      {
        prop: 'jgNum',
        label: '机构数量（台）',
        rules: decimal2Rules(),
    
        type: 'input'
      },
      {
        prop: 'softNum',
        label: '软件套数（套）',
        rules: integerRules(),
    
        type: 'input'
      },
      {
        prop: 'wljaqsbNum',
        label: '网络及安全设备数量（个）',
        rules: integerRules(),
    
        type: 'input'
      },
    
      {
        prop: 'syxtNum',
        label: '上云系统数（套）',
        rules: integerRules(),
    
        type: 'input'
      },
      {
        prop: 'yjdpNum',
        label: '运监大屏数（套）',
        rules: integerRules(),
    
        type: 'input'
      },
      {
        prop: 'jfjfzsbNum',
        label: '机房及辅助设备数（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sxtsbNum',
        label: '省信通服务器、存储设备、网络及安全设备数量（台）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'dlsjzxjgNum',
        label: '独立数据中心机柜数量（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjjrJrztNum',
        label: '数据接入-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjbzhJrztNum',
        label: '数据标准化-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjscyxzJrztNum',
        label: '数据上传与下发-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjpdJrztNum',
        label: '数据盘点-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjzymlglJrztNum',
        label: '数据资源目录管理-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjzlglJrztNum',
        label: '数据质量管理-接入数据中台系统数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'jcsjztNum',
        label: '监测设计主题数量（总部、大数据中心、省公司）（项）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'jcyxztNum',
        label: '监测运行主题数量（总部、大数据中心、省公司）（项）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjwjfxztNum',
        label: '数据挖掘分析主题数量（总部、大数据中心、省公司）（项）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'dsjyytgcpNum',
        label: '大数据应用推广产品数量（总部、大数据中心、省公司）（项）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'rgznybyycjNum',
        label: '人工智能样本应用场景数量（总部、大数据中心、省公司）（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'jsztzjNum',
        label: '技术中台组件数量（总部、大数据中心、省公司）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'sjztNum',
        label: '数据中台（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'dwzyywztNum',
        label: '电网资源业务中台（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'khfwywztNum',
        label: '客户服务业务中台（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'xmglywztNum',
        label: '项目管理业务中台（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'cwglywztNum',
        label: '财务管理业务中台（个）',
        rules: integerRules(),
        type: 'input'
      },
      {
        prop: 'hxywxtNum',
        label: '核心业务系统（个）',
        rules: integerRules(),
        type: 'input'
      },
    
      {
        prop: 'qtywxtNum',
        label: '其他业务系统（个）',
        rules: integerRules(),
        type: 'input'
      }
    ],
    importTitle: '信息化相关信息',
    modalTitle: '信息化相关信息',
    getTableList: xxhxgxxPageApi,
    deleteApi: xxhxgxxRemoveApi,
    submitApi: xxhxgxxSubmit,
    saveApi: xxhxgxxSaveApi,
    infoApi: xxhxgxxGetInfoApi,
    tempApi: xxhxgxxgetImportTemplate,
    importApi: xxhxgxxImportExcel,
    exportApi: xxhxgxxExportExcel
  })

  return {
    tables
  }
}
