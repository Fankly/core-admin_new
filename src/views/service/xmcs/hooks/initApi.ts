import { fourZeroSixQueryDy } from '@/api/service/xmcs/fourZeroSix'
import { queryQuotaDy } from '@/api/service/xmcs/quota'
import { queryById, queryRgJxList } from '@/api/service/xmcs/index'
import { getPublicData } from '@/api/common/index'

export const initApi = () => {
  /**406号文 开始  */
  async function fetchDetailfourZeroSix(xmid: any) {
    let tableDataList = []
    const res = await fourZeroSixQueryDy({ xmid: xmid })
    if (res.success && res.data.length != 0) {
      res.data.forEach((item: any) => {
        item.datalist = {
          labor: item.fourZeroSixVo.filter((item1: any) => item1.lx == '人工'),
          machine: item.fourZeroSixVo.filter((item1: any) => item1.lx == '机械')
        }
      })
      tableDataList = res.data.filter((sheet: any) => sheet.sheetid != null)
      if (tableDataList.length == 0) {
        tableDataList = [
          {
            sheetid: '406-template-sheet',
            sheetname: '406号文测算',
            datalist: {
              labor: [],
              machine: []
            }
          }
        ]
      }
    } else {
      tableDataList = [
        {
          sheetid: '406-template-sheet',
          sheetname: '406号文测算',
          datalist: {
            labor: [],
            machine: []
          }
        }
      ]
    }
    return {
      importedData: tableDataList
    }
  }

  /**
   * 从API获取价格库数据
   */
  async function fetchCatalogfourZeroSix() {
    const dataList = { labor: [], machine: [] }
    const res = await queryRgJxList()
    if (res.success && res.data) {
      dataList.labor = res.data.rgList || []
      dataList.machine = res.data.jxList || []
    }
    return {
      importedData: dataList
    }
  }

  /**
   * 从API获取数量来源类型
   */
  async function fetchSourcefourZeroSix() {
    let dataList = []
    const res = await getPublicData('NUMSOURCE_COM')
    if (res.success && res.data) {
      dataList = res.data
    }

    return {
      importedData: dataList
    }
  }

  // 查询项目信息
  const queryInfoById = async (xmid: any, creatorAccount: any) => {
    let xmInfoData = {}
    const res = await queryById({ id: xmid, creatorAccount: creatorAccount })
    if (res.success && res.data.records.length != 0) {
      xmInfoData = res.data.records[0]
    }
    return xmInfoData
  }

  /**定额 开始  */
  async function fetchDetailQuota(xmid: any) {
    let tableDataList = []
    const res = await queryQuotaDy({ xmid: xmid })
    if (res.success && res.data.length != 0) {
      res.data.forEach((item: any) => {
        item.datalist = {
          quotaLabor: item.quotaVo.filter((item1: any) => (item1.lx == '人工' && item.pricesource == '定额') || item1.lx == '定额人工'),
          quotaMachine: item.quotaVo.filter((item1: any) => (item1.lx == '机械' && item.pricesource == '定额') || item1.lx == '定额机械'),
          nonQuotaLabor: item.quotaVo.filter((item1: any) => (item1.lx == '人工' && item.pricesource !== '定额') || item1.lx == '非定额人工'),
          nonQuotaMachine: item.quotaVo.filter((item1: any) => (item1.lx == '机械' && item.pricesource !== '定额') || item1.lx == '非定额机械')
        }
      })
      tableDataList = res.data.filter((sheet: any) => sheet.sheetid != null)
      if (tableDataList.length == 0) {
        tableDataList = [
          {
            sheetid: 'quota-template-sheet',
            sheetname: '定额测算',
            datalist: {
              quotaLabor: [],
              quotaMachine: [],
              nonQuotaLabor: [],
              nonQuotaMachine: []
            }
          }
        ]
      }
    } else {
      tableDataList = [
        {
          sheetid: 'quota-template-sheet',
          sheetname: '定额测算',
          datalist: {
            quotaLabor: [],
            quotaMachine: [],
            nonQuotaLabor: [],
            nonQuotaMachine: []
          }
        }
      ]
    }
    return {
      importedData: tableDataList
    }
  }

  /**
   * 从API获取价格库数据
   */
  async function fetchCatalogQuota() {
    const dataList = { quotaLabor: [], quotaMachine: [], nonQuotaLabor: [], nonQuotaMachine: [] }
    const res = await queryRgJxList()
    if (res.success) {
      dataList.quotaLabor = res.data.rgList.filter((item: any) => item.pricesource == '定额')
      dataList.quotaMachine = res.data.jxList.filter((item: any) => item.pricesource == '定额')
      dataList.nonQuotaLabor = res.data.rgList.filter((item: any) => item.pricesource != '定额')
      dataList.nonQuotaMachine = res.data.jxList.filter((item: any) => item.pricesource != '定额')
    }
    return {
      importedData: dataList
    }
  }

  return {
    fetchDetailfourZeroSix,
    fetchCatalogfourZeroSix,
    fetchSourcefourZeroSix,
    fetchDetailQuota,
    fetchCatalogQuota,
    queryInfoById
  }
}
