import { getPublicCodeList } from '@/api/common'

interface PublicCodeItem {
  code: string
  name: string
  parentCode?: string
}

interface PublicCodeMap {
  [key: string]: PublicCodeItem[]
}

interface ColumnConfig {
  field: string
  publicCodeKey?: string
  defaultValue?: string
  formatter?: (value: any, row?: any) => string
}

class TableFormatter {
  private publicCodeCache: PublicCodeMap = {}
  private loadingCodes: Set<string> = new Set()

  async getPublicCodes(codes: string[]): Promise<PublicCodeMap> {
    const needLoadCodes = codes.filter((code) => !this.publicCodeCache[code] && !this.loadingCodes.has(code))
    if (needLoadCodes.length === 0) {
      return this.publicCodeCache
    }
    needLoadCodes.forEach((code) => this.loadingCodes.add(code))

    try {
      const res = await getPublicCodeList({ codes: needLoadCodes })
      if (res.success && res.data) {
        Object.assign(this.publicCodeCache, res.data)
      }
    } catch (error) {
      console.warn('获取公共代码失败:', error)
    } finally {
      needLoadCodes.forEach((code) => this.loadingCodes.delete(code))
    }
    return this.publicCodeCache
  }

  formatValue(value: any, publicCodeKey?: string, defaultValue = ''): string {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }

    if (!publicCodeKey) {
      return String(value)
    }

    const publicCodes = this.publicCodeCache[publicCodeKey]
    if (!publicCodes || !Array.isArray(publicCodes)) {
      return String(value)
    }

    const normalizedValue = this.normalizeValue(value)

    const found = publicCodes.find((item) => {
      const normalizedCode = this.normalizeValue(item.code)
      return normalizedCode === normalizedValue
    })
    return found ? found.name : String(value)
  }

  private normalizeValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }
    const strValue = String(value).trim()
    if (value === true || strValue.toLowerCase() === 'true') {
      return '1'
    }
    if (value === false || strValue.toLowerCase() === 'false') {
      return '0'
    }
    return strValue
  }

  createColumnFormatter(config: ColumnConfig) {
    return (row: any) => {
      const value = row[config.field]
      if (config.formatter) {
        return config.formatter(value, row)
      }

      return this.formatValue(value, config.publicCodeKey, config.defaultValue)
    }
  }

  async preloadPublicCodes(configs: ColumnConfig[]): Promise<void> {
    const codes = configs.map((config) => config.publicCodeKey).filter((code): code is string => !!code)
    if (codes.length > 0) {
      await this.getPublicCodes(codes)
    }
  }

  clearCache(): void {
    this.publicCodeCache = {}
    this.loadingCodes.clear()
  }
}
const tableFormatter = new TableFormatter()

export const createTableColumns = async (columns: ColumnConfig[]) => {
  await tableFormatter.preloadPublicCodes(columns)

  return columns.map((column) => ({
    ...column,
    formatter: tableFormatter.createColumnFormatter(column)
  }))
}

export const formatTableData = async (data: any[], columns: ColumnConfig[]) => {
  await tableFormatter.preloadPublicCodes(columns)

  return data.map((row) => {
    const formattedRow = { ...row }
    columns.forEach((column) => {
      if (column.publicCodeKey || column.formatter) {
        const formatter = tableFormatter.createColumnFormatter(column)
        formattedRow[`${column.field}_formatted}`] = formatter(row)
      }
    })
    return formattedRow
  })
}

export const formatSingleValue = (value: any, publicCodeKey?: string, defaultValue = ''): string => {
  return tableFormatter.formatValue(value, publicCodeKey, defaultValue)
}

export const getPublicCodeMap = async (codes: string[]): Promise<PublicCodeMap> => {
  return await tableFormatter.getPublicCodes(codes)
}

export const clearPublicCodeCache = (): void => {
  tableFormatter.clearCache()
}

export const formatMultipleValues = async (values: any[], publicCodeKey: string, defaultValue = ''): Promise<string[]> => {
  await tableFormatter.getPublicCodes([publicCodeKey])
  return values.map((value) => tableFormatter.formatValue(value, publicCodeKey, defaultValue))
}

export const createBatchFormatter = (publcCodeKey: string, defaultValue = '') => {
  return (values: any[]) => {
    return values.map((value) => tableFormatter.formatValue(value, publcCodeKey, defaultValue))
  }
}

export default tableFormatter
