/**
 * 需求录入（/service/xq/Requirement）「设备资产信息」步骤 mock。
 *
 * 目标：不改动任何业务组件，仅通过 mock 数据让需求录入流程放出
 * src/views/service/xq/components/AssetDetails.vue。
 * 原理：xmAttributeConfig/getTabColumns 返回的步骤里带上 stepEnname='AssetDetails'，
 * useRequirementForm 的 componentMap 命中后该步骤不再渲染 DynamicForm，而是渲染该组件；
 * 组件内部的数据由 ./assetDetails（xmSbzc/getSbzcInfoByXmId）提供。
 *
 * 注意：
 * - mockjs 按注册顺序取首个匹配（node_modules/mockjs find() 遍历 _mocked），
 *   本模块必须在 mock/index.ts 中先于 ./modules/requirementEntry 注册才能覆盖步骤配置。
 * - 因此这里的步骤配置与 requirementEntry 保持一致，仅多出「设备资产信息」一步，
 *   如另一边调整了字段请同步修改。
 */
import Mock from 'mockjs'
import { success } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const YEAR = String(new Date().getFullYear())

const steps = [
  {
    stepId: 'xqlr-basic', stepName: '基本信息', stepType: '2',
    columns: [
      { prop: 'XMMC', label: '项目名称', type: 'input', required: true, rules: { required: true, message: '请输入项目名称', trigger: 'blur' } },
      { prop: 'ND', label: '申报年度', type: 'input', required: true, defaultValue: YEAR, rules: { required: true, message: '请输入申报年度', trigger: 'blur' } },
      { prop: 'YJDW', label: '一级单位', type: 'select', options: [{ code: 'DW001', name: '国网江苏省电力有限公司' }, { code: 'DW002', name: '国网南京供电公司' }] },
      { prop: 'XMBM', label: '项目编码', type: 'input', disabled: true }
    ]
  },
  {
    stepId: 'xqlr-declare', stepName: '申报信息', stepType: '3',
    columns: [
      { prop: 'SQJE', label: '申报金额（万元）', type: 'number' },
      { prop: 'XMNR', label: '项目内容', type: 'textarea' }
    ]
  },
  // stepEnname 命中组件映射表：该步骤放出 AssetDetails 组件
  { stepId: 'xqlr-asset', stepName: '设备资产信息', stepType: '3', stepEnname: 'AssetDetails', columns: [] },
  {
    stepId: 'xqlr-attach', stepName: '附件信息', stepType: '4',
    columns: [{ prop: 'BZ', label: '备注', type: 'textarea' }]
  }
]

// 与 requirementEntry 里同接口的正则保持“不同的源码文本”：mockjs 以 `rurl + rtype` 字符串为 key
// 存模板，源码完全一致会被后者覆盖；这里另外靠注册顺序（先注册）保证本模板被优先命中。
Mock.mock(/xmAttributeConfig\/getTabColumns\?([^#]*&)?yssxId=mock-matter-[^&#]*/, 'get', () => success(clone(steps)))
