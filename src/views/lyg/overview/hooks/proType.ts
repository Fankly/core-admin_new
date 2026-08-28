import { reactive, ref } from 'vue'
import { exportCqwlxXmmx, getCqwlxXmmxPage, exportCqwqdhtXmmx, getCqwqdhtXmmxPage, exportCqwtxqjhXmmx, getCqwtxqjhXmmxPage } from '@/api/lyg/index'
export const proTypeParam = () => {
  const xmzs = ref<number | string>(0)
  const xmzys = ref<number | string>(0)
  const dataList = ref([
    {
      name: '已出库',
      code: 'yck',
      url: 'pm_ck',
      isEcharts: false,
      background: 'linear-gradient(to bottom right, #eef5fe, #dbeafe)',
      fontColor: '#1b8afb',
      children: [
        {
          key: 'yck_yckxms',
          name: '已出库项目数',
          num: '0'
        },
        {
          key: 'yck_cqwlxxms',
          name: '超期未立项项目数',
          num: '0'
        }
      ]
    },
    {
      name: '已立项',
      code: 'ylx',
      url: 'pm_lx',
      isEcharts: false,
      color: '#4fa8a4',
      children: [
        {
          key: 'ylx_ylxxms',
          name: '已立项项目数',
          num: '0'
        },
        {
          key: 'ylx_lxcqxms',
          name: '立项超期项目数',
          num: '0'
        },
        {
          key: 'ylx_cqwtxqjhxms',
          name: '超期未提需求计划项目数',
          num: '0'
        },
        {
          key: 'ylx_lxcql',
          name: '立项超期率',
          num: 0.0
        }
      ]
    },
    {
      name: '已报招',
      code: 'ybz',
      url: 'pm_ybz',
      isEcharts: true,
      color: '#06b6a9',
      children: [
        {
          key: 'ybz_ybzxms',
          name: '已报招项目数量',
          num: '0'
        },
        {
          key: 'ybz_bzcqxms',
          name: '报招超期项目数',
          num: '0'
        },
        {
          key: 'ybz_bcql',
          name: '报超期率',
          num: 0.0
        }
      ]
    },
    {
      name: '已中标',
      code: 'yzb',
      url: 'pm_yzb',
      isEcharts: false,
      background: 'linear-gradient(to bottom right, #ECFDF5, #D1FAE5)',
      fontColor: '#19cad9',
      children: [
        {
          key: 'yzb_yzbxms',
          name: '已中标项目数量',
          num: '0'
        },
        {
          key: 'yzb_cqwqdhtxms',
          name: '超期未签订合同项目数',
          num: '0'
        }
      ]
    },
    {
      name: '已签订合同',
      code: 'yqdht',
      url: 'pm_yqdht',
      isEcharts: false,
      color: '#6cdbfa',
      children: [
        {
          key: 'yqdht_yqdhtxms',
          name: '已签订合同数',
          num: '0'
        },
        {
          key: 'yqdht_htqdcqxms',
          name: '合同签订超期数',
          num: '0'
        },
        {
          key: 'yqdht_htqdcql',
          name: '合同签订超期率',
          num: 0.0
        }
      ]
    },
    {
      name: '实施中',
      code: 'ssz',
      url: 'pm_ssz',
      isEcharts: false,
      background: 'linear-gradient(to bottom right, #FFF8EB, #FFEDC2)',
      fontColor: '#faa855',
      children: [
        {
          key: 'ssz_ykgxms',
          name: '已开工项目数',
          num: '0'
        },
        {
          key: 'ssz_wzxqje',
          name: '物资需求金额(万元)',
          num: '0'
        },
        {
          key: 'ssz_fwwjsxms',
          name: '服务未结算项目数',
          num: 0.0
        }
      ]
    },
    {
      name: '已结算',
      code: 'yjs',
      url: 'pm_yjs',
      isEcharts: false,
      color: '#fad955',
      children: [
        {
          key: 'yjs_yjsxms',
          name: '已结算项目数',
          num: '0'
        },
        {
          key: 'yjs_ygbxms',
          name: '应关闭项目数',
          num: '0'
        },
        {
          key: 'yjs_wzlyje',
          name: '物资领用金额(万元)',
          num: '0'
        },
        {
          key: 'yjs_wzlywcl',
          name: '物资领用完成率',
          num: 0.0
        }
      ]
    },
    {
      name: '已关闭',
      code: 'ygb',
      url: 'pm_gb',
      isEcharts: false,
      background: 'linear-gradient(to bottom right, #E6FAF7, #C4F0E8)',
      fontColor: '#b2cbff',
      children: [
        {
          key: 'ygb_ygbxms',
          name: '已关闭项目数',
          num: '0'
        }
      ]
    }
  ])

  const buildList = ref([
    {
      name: '项目审计(建设中)',
      code: 'ygb',
      url: 'pm_gb',
      isEcharts: false,
      background: 'linear-gradient(to bottom right, #E6FAF7, #C4F0E8)',
      fontColor: '#009689',
      children: [
        { key: 'xmsj_ygssxms', name: '应送审项目数', num: '0' },
        { key: 'xmsj_yjssxms', name: '已送审项目数', num: '0' },
        { key: 'xmsj_xmssyjs', name: '项目送审预警数', num: '0' },
        { key: 'xmsj_wssxms', name: '未送审项目数', num: '0' },
        { key: 'xmsj_ysdxms', name: '已审定项目数', num: '0' },
        { key: 'xmsj_xmsdyjs', name: '项目审定预警数', num: '0' }
      ]
    },
    {
      name: '服务付款(建设中)',
      code: 'ygb',
      url: 'pm_gb',
      isEcharts: false,
      background: 'linear-gradient(to bottom right, #E6FAF7, #C4F0E8)',
      fontColor: '#009689',
      children: [
        { key: 'fwfk_yfje', name: '应付金额', num: '0' },
        { key: 'fwfk_qzje', name: '清账金额', num: '0' },
        { key: 'fwfk_yfye', name: '应付余额', num: '0' },
        { key: 'fwfk_zlcqyj', name: '账龄超期预期', num: '0' },
        { key: 'fwfk_zlycq', name: '账龄已超期', num: '0' }
      ]
    }
  ])

  const DETAIL_API_MAP: Record<string, { exportApi: any; getTableList: any; prop: string }> = {
    yck_cqwlxxms: { exportApi: exportCqwlxXmmx, getTableList: getCqwlxXmmxPage, prop: 'xmckrq' },
    yzb_cqwqdhtxms: { exportApi: exportCqwqdhtXmmx, getTableList: getCqwqdhtXmmxPage, prop: 'firstWinBidDate' },
    ylx_cqwtxqjhxms: { exportApi: exportCqwtxqjhXmmx, getTableList: getCqwtxqjhXmmxPage, prop: 'erdat' }
  }
  const DETAIL_DATA_MAP: Record<string, { status: string }> = {
    yck_yckxms: { status: '1' },
    ylx_ylxxms: { status: '2' },
    ybz_ybzxms: { status: '3' },
    yzb_yzbxms: { status: '4' },
    yqdht_yqdhtxms: { status: '5' },
    ssz_ykgxms: { status: '6' },
    yjs_yjsxms: { status: '7' },
    ygb_ygbxms: { status: '8' }
  }
  return {
    xmzs,
    xmzys,
    dataList,
    DETAIL_API_MAP,
    DETAIL_DATA_MAP,
    buildList
  }
}
