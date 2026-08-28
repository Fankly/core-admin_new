import { IFunction, IObject } from '@/types/interface'
import Decimal from 'decimal.js'
import { debounce, DebouncedFunc, DebounceSettings } from 'lodash'
import type { App, Plugin } from 'vue'
import { VxeTablePropTypes } from 'vxe-table'
import XEUtils from 'xe-utils'

// 判断是否是数字,如果不是返回0
export const toValidNumber = (value: any): any => {
  if (value === null || value === '') return '0'
  const num = Number(value)
  return Number.isFinite(num) ? value : '0'
}

export const isValidNumber = (value: any): any => {
  if (value === null || value === '') return false
  const num = Number(value)
  return Number.isFinite(num)
}

/**
 * 获取对象下的字段值
 * @param record {}
 * @param key 'a.b.c'
 * @param defaultValue
 * @returns
 */
export const getValueByKeys = (record: IObject = {}, key: string, defaultValue?: unknown): any => {
  const keys = key.split('.')
  for (let i = 0; i < keys.length; i++) {
    record = record[keys[i]] || (i === keys.length - 1 ? defaultValue : {})
  }
  return record || defaultValue
}

export const formatValue = (value: string, decimalPart = 2) => {
  if (!value) return new Decimal('0').toFixed(decimalPart)
  else {
    if (isCovertibleNumber(value)) {
      const newVal = new Decimal(value).toFixed(decimalPart)
      return newVal.replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
    } else {
      return value
    }
  }
}

export const formatNumValue = (value: number | string, decimalPart = 2) => {
  if (value === null || value === undefined || value === '') return '-'
  else {
    if (isCovertibleNumber(value)) {
      const newVal = new Decimal(value).toFixed(decimalPart)
      const [intPart, decPart] = newVal.split('.')
      const formattedInt = intPart.replace(/(\d)(?=(\d{3})+$)/g, '$1,')
      return decPart != undefined ? `${formattedInt}.${decPart}` : formattedInt
    } else {
      return value
    }
  }
}

export const formatNumber = (cellValue: any, digits = 2) => {
  if (cellValue === null || cellValue === '') return '-'
  try {
    return new Decimal(cellValue).toFixed(digits)
  } catch {
    return cellValue
  }
}

/**
 * 数组转对象
 * @param {*} rs 集合
 * @param {*} key 需要转换目标key的名称
 */
export const arrayToObject = (rs: any[] = [], key: string | IFunction, render?: IFunction): IObject => {
  const o: IObject = {}
  rs.forEach((x) => {
    o[typeof key === 'function' ? key(x) : x[key]] = render ? render(x) : x
  })
  return o
}

/**
 * 数组转换格式
 * @param rs
 * @param render
 * @returns
 */
export const arrayToKeyValueArray = (rs: any[] = [], render?: IFunction): any[] => {
  return rs.map((x) => (render ? render(x) : typeof x === 'object' ? x : { label: x, value: x }))
}

/**
 *
 * @param timestamp
 * @param format
 */
export const formatDate = (timestamp: string, format: string): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  if (format === 'yyyy-mm-dd') {
    return `${year}-${month}-${day}`
  } else if (format === 'yyyy/mm/dd') {
    return `${year}/${month}/${day}`
  } else if (format === 'yyyy:mm:dd') {
    return `${year}:${month}:${day}`
  } else {
    return ''
  }
}

/**
 * 是否只null和undefined值和""
 * @param vl
 * @returns
 */
export const isNullOrUndefined = (vl: unknown): boolean => {
  return (vl === '' || vl) === null || typeof vl === 'undefined'
}

/**
 * 判断是否是对象
 * @param vl
 * @returns
 */
export const isPlainObject = (value: any) => {
  return value !== null && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * 是否外链
 * @param path
 * @returns
 */
export const isExternalLink = (path: string): boolean => {
  return /^(https?:|\/\/|mailto:|tel:|^{{\s?ApiUrl\s?}})/.test(path)
}

/**
 * 复制
 * @param value
 */
export const copyToClipboard = (value: string): void => {
  const transfer = document.createElement('textarea')
  document.body.appendChild(transfer)
  transfer.value = value
  transfer.focus()
  transfer.select()
  if (document.execCommand('copy')) {
    document.execCommand('copy')
  }
  transfer.blur()
  document.body.removeChild(transfer)
}

/**
 * 检查是否有权限
 * @param permission
 * @param key
 * @returns
 */
export const checkPermission = (permission: string[], key: string): boolean => {
  return permission.includes(key)
}

/**
 * 获取uuid
 */
export const getUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 邮箱
 * @param {*} s
 */
export const isEmail = (s: string): boolean => {
  return /^([a-zA-Z0-9._-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,3}){1,2})$/.test(s)
}

/**
 * 手机号码
 * @param {*} s
 */
export const isMobile = (s: string): boolean => {
  return /^1[0-9]{10}$/.test(s)
}

/**
 * 电话号码
 * @param {*} s
 */
export const isPhone = (s: string): boolean => {
  return /^([0-9]{3,4}-)?[0-9]{7,8}$/.test(s)
}

/**
 * URL地址
 * @param {*} s
 */
export const isURL = (s: string): boolean => {
  return /^http[s]?:\/\/.*/.test(s)
}

/**
 * 正整数
 * @param {*} s
 */
export const isNumber = (s: string): boolean => {
  return /^\+?[1-9][0-9]*$/.test(s)
}

/**
 * 获取字典数据列表
 * @param dictType  字典类型
 */
export const getDictDataList = (list: IObject[], dictType?: string): IObject[] => {
  const type = list.find((element: IObject) => element.dictType === dictType)
  if (type) {
    return type.dataList
  } else {
    return []
  }
}

/**
 * 获取字典名称
 * @param dictType  字典类型
 * @param dictValue  字典值
 */
export const getDictLabel = (list: IObject[], dictType: string, dictValue: number): string | number => {
  const type = list.find((element: IObject) => element.dictType === dictType)
  if (type) {
    const val = type.dataList.find((element: IObject) => element.dictValue === dictValue + '')
    if (val) {
      return val.dictLabel
    } else {
      return dictValue
    }
  } else {
    return dictValue
  }
}

/**
 * 获取svg图标(id)列表
 */
export const getIconList = (): string[] => {
  const rs: string[] = []
  const list = document.querySelectorAll('svg symbol')
  for (let i = 0; i < list.length; i++) {
    rs.push(list[i].id)
  }
  return rs
}

/**
 * 树形数据转换
 * @param {*} data
 * @param {*} id
 * @param {*} pid
 */
export const treeDataTranslate = (data: IObject[], id?: string, pid?: string): IObject[] => {
  const res: IObject[] = []
  const temp: IObject = {}
  id = id || 'id'
  pid = pid || 'pid'
  for (let i = 0; i < data.length; i++) {
    temp[data[i][id]] = data[i]
  }
  for (let k = 0; k < data.length; k++) {
    if (!temp[data[k][pid]] || data[k][id] === data[k][pid]) {
      res.push(data[k])
      continue
    }
    if (!temp[data[k][pid]]['children']) {
      temp[data[k][pid]]['children'] = []
    }
    temp[data[k][pid]]['children'].push(data[k])
    data[k]['_level'] = (temp[data[k][pid]]._level || 0) + 1
  }
  return res
}

/**
 * 全局组件安装
 * @param component
 * @param alias
 * @returns
 */
export const withInstall = <T>(component: T, alias?: string): T & Plugin => {
  const comp = component as any
  comp.install = (app: App) => {
    app.component(comp.name || comp.displayName, component as any)
    if (alias) {
      app.config.globalProperties[alias] = component
    }
  }
  return component as T & Plugin
}
/**
 * 数组转换已逗号拼接的字符串
 * @param array
 */
export const arrayToString = (array: any[]) => {
  if (array && array.length != 1 && array[0] != '') {
    const newarray = array
    const newstring = newarray.join(',')
    return newstring
  }
}

/**
 * 以逗号拼接的字符串转换数组
 * @param string
 */
export const stringToArray = (string: string) => {
  const typehobby = string

  if (typehobby != null && typehobby != '') {
    const newarray = typehobby.split(',')
    return newarray
  }
  return []
}

/**
 * 图片上传处理
 * @param string 需要处理的值
 * @param setImg 处理完成
 */
export const setImgs = (setImg: any, string: string) => {
  console.log('图片上传处理', setImg, string)
  if (string != '') {
    const imgIds = stringToArray(string)
    const newimgs = JSON.stringify(imgIds)
    // setImg = stringToArray(setImg)
    // setImg = []
    // console.log('asdasdwwwwww',setImg,typeof(setImg))

    setImg.push(...(JSON.parse(newimgs) || []))
    console.log('dasdasdddddddddddd', setImg)

    // return setImg
  }
}
/**
 * 图片上传处理
 * @param introduce 需要处理的值
 * @param complete  处理完成
 */
export const setEditor = (introduce: any, complete: any) => {
  introduce = complete == null ? JSON.parse(`[{"type":"paragraph","children":[{"text":""}]}]`) : JSON.parse(complete)
  return introduce
}
/**
 * 节流函数 `created() {this.dataFormSubmitHandle = useDebounce(this.dataFormSubmitHandle);}`
 * @param fn
 * @param wait
 * @returns
 */
export const useDebounce = (fn: (e?: any) => any, wait?: number, options?: DebounceSettings): DebouncedFunc<any> => {
  return debounce(fn, wait ?? 1000, {
    leading: true,
    trailing: false,
    ...options
  })
}

export const pickerOptions = () => {
  return {
    shortcuts: [
      {
        text: '今天',
        onClick(picker: { $emit: (arg0: string, arg1: Date) => void }) {
          picker.$emit('pick', new Date())
        }
      },
      {
        text: '昨天',
        onClick(picker: { $emit: (arg0: string, arg1: Date) => void }) {
          const date = new Date()
          date.setTime(date.getTime() - 3600 * 1000 * 24)
          picker.$emit('pick', date)
        }
      },
      {
        text: '一周前',
        onClick(picker: { $emit: (arg0: string, arg1: Date) => void }) {
          const date = new Date()
          date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
          picker.$emit('pick', date)
        }
      }
    ]
  }
}

// 根据末节点找到上一级节点
export const getParentNode = (rootNodeList: any[], nodeObj: any) => {
  let parent = null

  function findParent(nodes: any) {
    return nodes.some((node: any) => {
      if (node.id === nodeObj.parentId) {
        parent = node
        return true
      }
      if (node.children) {
        return findParent(node.children)
      }
      return false
    })
  }

  findParent(rootNodeList)
  return parent
}

// 根据末节点找到上一级节点
export const findPrevNode = (data: any, selectData: any) => {
  let result: any = []
  const path: any = []
  let find = false

  function dfs(data: any) {
    if (find) return
    for (let i = 0; i < data.length; i++) {
      path.push(data[i].id)
      if (data[i].id === selectData.id) {
        find = true
        result = path.slice()
        return
      }
      if (data[i].children) {
        dfs(data[i].children)
      }
      path.pop()
    }
  }

  dfs(data)
  return result
}

export const getMaxLength = (arr: any[]) => {
  return arr.reduce((acc, item) => {
    if (item) {
      const calcLen = getTextWidth(item)
      if (acc < calcLen) {
        acc = calcLen
      }
    }
    return acc
  }, 0)
}

let pxWidthCanvas: HTMLCanvasElement | null = null

/**
 * 获取文本px宽度
 * @param text 文本
 * @param font 字体样式
 */
export const pxWidth = (text: string, font?: string): number => {
  if (!pxWidthCanvas) {
    pxWidthCanvas = document.createElement('canvas')
  }
  const context = pxWidthCanvas.getContext('2d')
  if (!context) return 0
  if (font) {
    context.font = font
  }
  return context.measureText(text).width
}

export const getTextWidth = (str: string) => {
  let width = 0
  const html = document.createElement('span')
  html.innerText = str
  html.className = 'getTextWidth'
  document.querySelector('body')?.appendChild(html)
  const getTextWidth = document.querySelector('.getTextWidth') as any
  width = getTextWidth.offsetWidth
  document.querySelector('.getTextWidth')?.remove()
  return width
}

export const isCovertibleNumber = (value: any): boolean => {
  if (typeof value === 'number' && !isNaN(value)) return true
  if (typeof value !== 'string') return false
  value = value.trim()
  if (value === '') return false
  return /^-?\d*\.?\d+$/.test(value)
}

// 判断数据中多个对象的某个属性是否相同
export const checkSameProperty = (array: any[], propertyName: string) => {
  if (!Array.isArray(array) || array.length === 0) {
    return true
  }
  const firstValue = array[0][propertyName]
  return array.every((obj) => obj[propertyName] === firstValue)
}

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

const calcSum = (data: any, key: string, filterStr: string, columnKeys?: any, sumKey?: string, pos = 2) => {
  const topLevelItems = data.filter((item: any) => item[filterStr])
  if (topLevelItems && topLevelItems > 0) {
    const totalSum = topLevelItems.reduce((prev: number, cur: any) => {
      return Decimal.add(prev, cur[key] ? cur[key] : 0)
    }, 0)

    if (topLevelItems.length === 1) {
      topLevelItems[0][key] = totalSum.toFixed(pos)
    }

    const result: any = { totalSum: totalSum.toFixed(pos) }
    if (columnKeys && sumKey) {
      let sumValue: any = 0
      if (topLevelItems.length === 1) {
        for (let i = 0; i < columnKeys.length; i++) {
          const item = columnKeys[i]
          sumValue = Decimal.add(sumValue, topLevelItems[0][item.columnKey] ? topLevelItems[0][item.columnKey] : 0)
        }
        topLevelItems[0][sumKey] = sumValue.toFixed(pos)
      } else {
        for (let i = 0; i < columnKeys.length; i++) {
          const item = columnKeys[i]
          const columnSum = topLevelItems.reduce((prev: number, cur: any) => {
            return Decimal.add(prev, cur[item.columnKey] ? cur[item.columnKey] : 0)
          }, 0)
          sumValue = Decimal.add(sumValue, columnSum)
        }
      }
      result[sumKey] = sumValue.toFixed(pos)
    }
    return result
  }
  return null
}

/**
 * 普通表格合计计算(使用Decimal精确计算)
 * @param data 表格数据数组
 * @param columns 需要合计的列字段(单个字段或字段数组)
 * @param decimalPlaces 保留小数位数,默认2
 * @param formatThousands 是否千分位格式化,默认true
 * @returns 合计结果对象,key为列字段,value为合计值
 */
export const calclateTableSum = (data: IObject[], columns: string | string[], decimalPlaces = 2, formatThousands = true): Record<string, string> => {
  const formatNumber = (num: string) => {
    return formatThousands ? num.replace(/(\d)(?=(\d{3})+\.)/g, '$1,') : num
  }
  if (!data || data.length === 0) {
    const result: Record<string, string> = {}
    const cols = Array.isArray(columns) ? columns : [columns]
    cols.forEach((col) => {
      result[col] = formatNumber(new Decimal(0).toFixed(decimalPlaces))
    })
    return result
  }
  const cols = Array.isArray(columns) ? columns : [columns]
  const result: Record<string, string> = {}

  cols.forEach((col) => {
    let sum = new Decimal(0)
    data.forEach((row) => {
      const value = getValueByKeys(row, col)
      if (value !== null && value !== undefined && value !== '' && isCovertibleNumber(value)) {
        sum = sum.add(new Decimal(value))
      }
    })
    result[col] = formatNumber(sum.toFixed(decimalPlaces))
  })
  return result
}

export const formatValueOrDefault = (value: any, decimalPlaces = 2) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (isCovertibleNumber(value)) {
    const numValue = new Decimal(value).toFixed(decimalPlaces)
    return numValue.replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
  }
  return value
}

export const freezeColumns = (columns: any[], count: number): any[] => {
  if (!Array.isArray(columns) || count <= 0) return columns
  const freezeCount = Math.min(count, columns.length)
  for (let i = 0; i < freezeCount; i++) {
    columns[i].fixed = 'left'
  }
  return columns
}
