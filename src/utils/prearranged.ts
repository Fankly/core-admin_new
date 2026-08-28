import Decimal from 'decimal.js'
import { VxeTablePropTypes } from 'vxe-table'
import XEUtils from 'xe-utils'

const handleSummary = (children: any, key: string, pos = 2) => {
  if (children && children.length > 0) {
    let sum: any = 0
    children.forEach((item: any) => {
      sum = Decimal.add(sum, item[key] ? item[key] : 0)
    })
    return {
      [key]: sum.toFixed(pos)
    }
  }
}

/**
 *
 * @param data 树形表格数据
 * @param config 树形treeconfig配置
 * @param key 合计的key
 * @param leaf 是否更具末级节点合计
 * @param filterStr 过滤所需要的参数名
 */
export const getGroupSummary = (
  data: any,
  config: VxeTablePropTypes.TreeConfig,
  key: string,
  pos = 2,
  leaf: string,
  filterStr: string,
  columnKeys?: any,
  sumKey?: string
) => {
  XEUtils.eachTree(
    data,
    (row, index, items, _path, _parent, nodes) => {
      const children = row.children
      if (children && children.length) {
        Object.assign(row, handleSummary(children, key, pos))
        if (sumKey) Object.assign(row, handleSummary(children, sumKey, pos))
      } else {
        if (index === items.length - 1) {
          for (let len = nodes.length - 2; len >= 0; len--) {
            Object.assign(nodes[len], handleSummary(nodes[len].children, key, pos))
            if (sumKey) Object.assign(nodes[len], handleSummary(nodes[len].children, sumKey, pos))
          }
        }
      }
    },
    config
  )
  return calcSum(data, key, filterStr, columnKeys, sumKey, pos)
}

/**
 *
 * @param data 树形表格数据
 * @param config 树形treeconfig配置
 * @param key 合计的key
 * @param pos 位数
 * @param filterStr 过滤所需要的参数名
 */
export const summaryValue = (
  data: any,
  config: VxeTablePropTypes.TreeConfig,
  key: string,
  pos: number,
  filterStr: string,
  columnKeys?: any,
  sumKey?: string
) => {
  XEUtils.eachTree(
    data,
    (row, index, items, _path, _parent, nodes) => {
      const children = row.children
      if (children && children.length) {
        Object.assign(row, handleSummary(children, key, pos))
        if (sumKey) Object.assign(row, handleSummary(children, sumKey, pos))
      } else {
        if (index === items.length - 1) {
          for (let len = nodes.length - 2; len >= 0; len--) {
            Object.assign(nodes[len], handleSummary(nodes[len].children, key, pos))
            if (sumKey) Object.assign(nodes[len], handleSummary(nodes[len].children, sumKey, pos))
          }
        }
      }
    },
    config
  )
  return calcSum(data, key, filterStr, columnKeys, sumKey, pos)
}

const calcSum = (
  data: any,
  key: string,
  filterStr: string,
  columnKeys?: any,
  sumKey?: string,
  pos = 2
) => {
  const items = data.filter((item: any) => item[filterStr])
  if (items && items.length > 0) {
    const sumSbje = items.reduce((prev: number, cur: any) => {
      return Decimal.add(prev, cur[key] ? cur[key] : 0)
    }, 0)
    data[0][key] = sumSbje.toFixed(pos)
  }

  if (columnKeys && sumKey) {
    // 计算合计问题
    let sumValue: any = 0
    for (let i = 0; i < columnKeys.length; i++) {
      const item = columnKeys[i]
      sumValue = Decimal.add(sumValue, data[0][item.columnKey] ? data[0][item.columnKey] : 0)
    }
    data[0][sumKey] = sumValue.toFixed(pos)
    return data[0][sumKey]
  }
}

export const inputSxysHandle = (event: any) => {
  event.target.value = '' + event.target.value
  event.target.value =
    event.target.value
      .replace(/[^\d^.\-]+/g, '') // 包括负号的匹配
      .replace(/^0+(\d)/, '$1')
      .replace(/^\./, '0.')
      .match(/^[-]?\d{0,12}(?:\.\d{0,2})?/)[0] || ''
}

export const inputLimit4Handle = (event: any) => {
  event.target.value = '' + event.target.value
  event.target.value =
    event.target.value
      .replace(/[^\d^.\-]+/g, '') // 包括负号的匹配
      .replace(/^0+(\d)/, '$1')
      .replace(/^\./, '0.')
      .match(/^[-]?\d{0,8}(?:\.\d{0,4})?/)[0] || ''
}

export const inputLimit10Handle = (event: any) => {
  event.target.value = '' + event.target.value
  event.target.value =
    event.target.value
      .replace(/[^\d^.\-]+/g, '') // 包括负号的匹配
      .replace(/^0+(\d)/, '$1')
      .replace(/^\./, '0.')
      .match(/^[-]?\d{0,10}(?:\.\d{0,4})?/)[0] || ''
}
