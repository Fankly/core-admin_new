import { priorityOptions, statusOptions } from './constants'
import type { AttachTaskRow, EditForm, OptionItem, ProjectSearchForm, SearchForm } from './types'

export const createSearchForm = (): SearchForm => ({
  xmbm: '',
  xmmc: '',
  proTypes: [],
  jhssnd: String(new Date().getFullYear()),
  yjdw: '',
  attachName: '',
  attachType: '',
  priority: '',
  transcodeStatus: '',
  extractStatus: ''
})

export const createProjectSearchForm = (): ProjectSearchForm => ({
  xmbm: '',
  xmmc: '',
  jhssnd: '',
  yjdw: '',
  proTypeList: []
})

export const createDetailData = (): AttachTaskRow => ({
  attachId: '',
  proId: '',
  priority: '',
  content: '',
  wordCount: '',
  transcodeStatus: '',
  transcodeStartTime: '',
  transcodeEndTime: '',
  transcodeMessage: '',
  extractJson: '',
  extractSchema: '',
  extractStatus: '',
  extractStartTime: '',
  extractEndTime: '',
  extractMessage: '',
  createTime: ''
})

export const createEditForm = (): EditForm => ({
  attachId: '',
  content: '',
  extractJson: '',
  extractSchema: '',
  extractStatus: '',
  transcodeStatus: ''
})

export const formatEmpty = (value: any) => {
  if (value === undefined || value === null || value === '') return '-'
  return value
}

export const formatTimestamp = (value: any) => {
  if (value === undefined || value === null || value === '') return '-'
  const rawValue = String(value).trim()
  const normalizedValue = /^\d{10}$/.test(rawValue) ? Number(rawValue) * 1000 : /^\d{13}$/.test(rawValue) ? Number(rawValue) : value
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return rawValue || '-'

  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`
}

export const getOptionName = (options: OptionItem[], code?: string) => {
  if (!code) return '-'
  return options.find((item) => item.code === code)?.name || code
}

export const getPriorityName = (code?: string) => getOptionName(priorityOptions, code)

export const getStatusName = (code?: string) => getOptionName(statusOptions, code)

export const getAttachTypeName = (row: AttachTaskRow) => {
  return row.attachTypeName || row.fjName || row.attachType || row.fjId || '-'
}

const pickOptionValue = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '')

const normalizeOptionValue = (value: any) => (value === undefined || value === null ? '' : String(value))

export const normalizeOptionList = (data: any[]): OptionItem[] => {
  return (data || []).map((item) => {
    const code = pickOptionValue(item.code, item.value, item.dictValue, item.id)
    const name = pickOptionValue(item.name, item.label, item.dictLabel, item.text, item.code, item.value)
    return {
      code: normalizeOptionValue(code),
      name: normalizeOptionValue(name)
    }
  })
}

export const normalizeYearList = (data: any[]): OptionItem[] => {
  return (data || []).map((item) => ({
    code: item.yearCode || item.code || item.value || '',
    name: item.yearName || item.name || item.label || item.yearCode || item.code || ''
  }))
}

export const getAttachId = (row: AttachTaskRow) => row.id || row.attachId || ''

export const getProjectId = (row: { xmId?: string; proId?: string; id?: string }) => row.xmId || row.proId || row.id || ''

export const splitCodes = (value: string) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
