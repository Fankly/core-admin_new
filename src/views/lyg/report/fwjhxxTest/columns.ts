import { formatNumValue } from '@/utils/utils'

// 金额列统一渲染：保留2位小数并千分位分隔，空值显示 '-'
const renderAmount = (raw: any) => formatNumValue(raw, 2)

// 金额列公共配置
const amountCol = (prop: string, label: string) => ({
  prop,
  label,
  width: 150,
  align: 'right',
  headerAlign: 'center',
  render: ({ row }: any) => renderAmount(row[prop])
})

// 服务计划信息查询表头
export const columns = [
  {
    prop: 'xmxx',
    label: '项目信息',
    _children: [
      { prop: 'pspid', label: '项目编码', width: 150, fixed: 'left' },
      { prop: 'post1', label: '项目名称', width: 180, fixed: 'left' },
      {
        prop: 'zyear',
        label: '年度',
        width: 80,
        render: ({ row }: any) => {
          return row.zyear
        }
      },
      { prop: 'qkjyjdwName', label: '一级单位', width: 150 },
      { prop: 'qkjejdwName', label: '二级单位', width: 150 },
      { prop: 'applyCenterName', label: '实施部门', width: 150 },
      { prop: 'qkjgkbmName', label: '项目归口部门', width: 150 },
      { prop: 'qkjxmlxmc', label: '项目类型', width: 150 },
      { prop: 'projectManagerName', label: '责任人', width: 120 }
    ]
  },
  {
    prop: 'zbjh',
    label: '招标计划',
    _children: [
      { prop: 'banfn', label: '采购申请', width: 150 },
      { prop: 'bnfpo', label: '行项目', width: 100 },
      { prop: 'asnum', label: '物料编码', width: 130 },
      { prop: 'asktx', label: '物料描述', width: 200 },
      { prop: 'zcjrq', label: '申请日期', width: 120 },
      amountCol('preis', '申请金额')
    ]
  },
  {
    prop: 'zbjg',
    label: '中标结果',
    _children: [
      { prop: 'zzbjhbh', label: '计划批次号', width: 150 },
      { prop: 'zzbpcmc', label: '计划批次名称', width: 180 },
      { prop: 'zdate', label: '中标日期', width: 120 },
      amountCol('zfxjj', '中标金额'),
      { prop: 'lifnrName', label: '中标供应商', width: 200 }
    ]
  },
  {
    prop: 'htqd',
    label: '合同签订',
    _children: [
      { prop: 'ebeln', label: '采购订单', width: 150 },
      { prop: 'ebelp', label: '订单行项目', width: 100 },
      { prop: 'htbh', label: '经法合同编号', width: 150 },
      { prop: 'zhtmc', label: '经法合同名称', width: 200 },
      amountCol('htje', '合同金额'),
      { prop: 'zqdrq', label: '签订日期', width: 120 },
      { prop: 'htbhKj', label: '经法合同编号（框架）', width: 180 },
      { prop: 'zhtmcKj', label: '经法合同名称（框架）', width: 200 },
      { prop: 'zsfzb', label: '是否招标', width: 100 }
    ]
  },
  {
    prop: 'fwqr',
    label: '服务确认',
    _children: [amountCol('menge', '服务确认含税金额'), amountCol('zhxmzfje', '资金支付')]
  }
]
