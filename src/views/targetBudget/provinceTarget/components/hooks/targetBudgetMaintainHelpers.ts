interface MaintainColumnLike {
  dataType?: string | null
  field?: string
  title?: string
}

interface MaintainRowLike {
  [key: string]: any
  edit?: number | string
  id?: number | string
  name?: string
  ysly?: string | null
  dataType?: string | null
}

interface MaintainSpanMethodParams {
  mergeFields: string[]
  row: MaintainRowLike
  column: {
    field?: string
  }
  visibleData: MaintainRowLike[]
  _rowIndex: number
}

export interface MaintainDataTypeOption {
  label: string
  value: string
  code?: string
}

interface MaintainPublicCodeLike {
  code?: string | null
  name?: string | null
}

export type MaintainDataTypeKind = 'before' | 'after' | 'range'

export const MAINTAIN_DATA_TYPE_OPTIONS: MaintainDataTypeOption[] = [
  {
    label: '调整前',
    value: '1'
  },
  {
    label: '调整后',
    value: '2'
  },
  {
    label: '调整幅度',
    value: '3'
  }
]

export const MAINTAIN_DEFAULT_DATA_TYPES = MAINTAIN_DATA_TYPE_OPTIONS.map((item) => item.value)

export const getMaintainDefaultDataTypes = (options: MaintainDataTypeOption[]) => options.map((item) => item.value)

export const shouldFilterMaintainDataTypes = (selectedDataType: string | string[] | null | undefined) => {
  if (Array.isArray(selectedDataType)) return selectedDataType.length > 0
  return String(selectedDataType ?? '').trim() !== ''
}

export const resolveMaintainSelectedDataTypes = (selectedDataType: string | string[] | null | undefined, options: MaintainDataTypeOption[]) => {
  const selectedValues = Array.isArray(selectedDataType) ? selectedDataType : [String(selectedDataType ?? '').trim()].filter(Boolean)

  if (selectedValues.length === 0) {
    return getMaintainDefaultDataTypes(options)
  }

  const optionMatchValues = (option: MaintainDataTypeOption) => {
    return [option.value, option.code, option.label].filter((item): item is string => !!String(item || '').trim())
  }

  const normalizedSelectedValues = selectedValues.map((item) => normalizeDataType(item))
  const matchedOptions = options.filter((option) => {
    const matchValues = optionMatchValues(option).map((item) => normalizeDataType(item))
    return normalizedSelectedValues.some((selectedValue) => matchValues.includes(selectedValue))
  })

  if (matchedOptions.length === 0) {
    return selectedValues
  }

  return Array.from(new Set(matchedOptions.flatMap((option) => optionMatchValues(option))))
}

export const buildMaintainDataTypeOptions = (publicCodes: MaintainPublicCodeLike[] = []): MaintainDataTypeOption[] => {
  const optionsMap = new Map<string, MaintainDataTypeOption>()

  publicCodes.forEach((item) => {
    const code = String(item?.code || item?.name || '').trim()
    const displayText = String(item?.name || item?.code || '').trim()
    if (!displayText || !code || optionsMap.has(code)) return
    optionsMap.set(code, {
      code,
      label: displayText,
      value: code
    })
  })

  const options = Array.from(optionsMap.values())
  return options.length > 0 ? options : MAINTAIN_DATA_TYPE_OPTIONS
}

const normalizeDataType = (value?: string | null) => {
  return String(value ?? '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\s+/g, '')
    .trim()
}

const normalizeMaintainKeyword = (value?: string | null) => {
  return normalizeDataType(value).toLowerCase().replace(/[_-]+/g, '')
}

const MAINTAIN_DATA_TYPE_KIND_KEYWORDS: Record<MaintainDataTypeKind, string[]> = {
  before: ['1', '调整前', 'beforeadjust', 'beforeadjustment', 'before', 'preadjust', 'preadjustment'],
  after: ['2', '调整后', 'afteradjust', 'afteradjustment', 'after', 'postadjust', 'postadjustment'],
  range: ['3', '调整幅度', '调整差额', '调整差异', 'adjustdiff', 'adjustrange', 'adjustdelta', 'diff', 'delta']
}

const hasDisplayValue = (value: unknown) => {
  return value !== undefined && value !== null && value !== ''
}

const matchesSelectedDataType = (column: MaintainColumnLike, selectedDataTypes: string[]) => {
  const currentDataType = normalizeDataType(column.dataType || column.title)
  if (!currentDataType) return false
  return selectedDataTypes.some((item) => {
    const selectedDataType = normalizeDataType(item)
    return selectedDataType.includes(currentDataType) || currentDataType.includes(selectedDataType)
  })
}

export const filterMaintainColumns = <T extends MaintainColumnLike>(columns: T[], selectedDataTypes: string[], lockedColumnCount = 2) => {
  return columns.filter((column, index) => {
    if (index < lockedColumnCount) return true
    if (!column.dataType) return true
    return matchesSelectedDataType(column, selectedDataTypes)
  })
}

export const isSummaryMaintainRow = (row: MaintainRowLike) => {
  const rowId = row?.id
  if (rowId === null || rowId === undefined) return true
  const normalizedRowId = String(rowId).trim()
  return normalizedRowId === '' || normalizedRowId === '-1'
}

export const canEditMaintainCell = (row: MaintainRowLike) => {
  return !isSummaryMaintainRow(row) && Number(row?.edit) === 1
}

export const getMaintainRowDataTypeKind = (row: MaintainRowLike) => {
  const currentDataType = normalizeMaintainKeyword(row?.dataType)
  if (!currentDataType) return null

  for (const [kind, keywords] of Object.entries(MAINTAIN_DATA_TYPE_KIND_KEYWORDS) as [MaintainDataTypeKind, string[]][]) {
    if (keywords.some((keyword) => currentDataType === keyword || currentDataType.includes(keyword))) {
      return kind
    }
  }

  return null
}

export const getMaintainMergeFields = <T extends MaintainColumnLike>(columns: T[], count = 2) => {
  return columns
    .map((column) => column.field)
    .filter((field): field is string => !!field)
    .slice(0, count)
}

const isSameGroupRow = (currentRow: MaintainRowLike, compareRow: MaintainRowLike, mergeFields: string[], field: string) => {
  const fieldIndex = mergeFields.indexOf(field)
  if (fieldIndex === -1) return false

  const allowEmptyValue = isSummaryMaintainRow(currentRow) && isSummaryMaintainRow(compareRow)
  return mergeFields.slice(0, fieldIndex + 1).every((mergeField) => {
    if (allowEmptyValue) {
      return currentRow?.[mergeField] === compareRow?.[mergeField]
    }
    return hasDisplayValue(currentRow?.[mergeField]) && currentRow?.[mergeField] === compareRow?.[mergeField]
  })
}

export const getMaintainSpanMethod = ({ mergeFields, row, column, visibleData, _rowIndex }: MaintainSpanMethodParams) => {
  const field = column.field
  if (!field || !mergeFields.includes(field)) return undefined

  const prevRow = visibleData[_rowIndex - 1]
  if (prevRow && isSameGroupRow(row, prevRow, mergeFields, field)) {
    return {
      rowspan: 0,
      colspan: 0
    }
  }

  let rowspan = 1
  for (let index = _rowIndex + 1; index < visibleData.length; index++) {
    const nextRow = visibleData[index]
    if (!nextRow || !isSameGroupRow(row, nextRow, mergeFields, field)) {
      break
    }
    rowspan++
  }

  if (rowspan > 1) {
    return {
      rowspan,
      colspan: 1
    }
  }

  return undefined
}
