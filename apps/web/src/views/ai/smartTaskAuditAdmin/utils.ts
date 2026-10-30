import type { OptionItem, ProjectSearchForm, SearchForm } from './types'

const pickOptionValue = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '')

const normalizeOptionValue = (value: any) => (value === undefined || value === null ? '' : String(value))

export const createSearchForm = (): SearchForm => ({
  xmbm: '',
  proTypeList: [],
  jhssnd: '',
  yjdw: '',
  ejdwList: [],
  taskName: '',
  status: '',
  docPreStatus: '',
  isHis: '0',
  priority: '',
  createStartTime: '',
  createFinishTime: ''
})

export const createProjectSearchForm = (): ProjectSearchForm => ({
  xmmc: '',
  xmbm: '',
  jhssnd: String(new Date().getFullYear()),
  yjdw: '',
  proTypeList: [],
  ejdwList: [],
  yjfl: '',
  ejfl: '',
  sjflList: [],
  flowStatusList: []
})

export const formatEmpty = (value: any) => {
  if (value === undefined || value === null || value === '') return '-'
  return value
}

export const normalizeOptionList = (data: any[]): OptionItem[] => {
  return (data || []).map((item) => {
    const code = pickOptionValue(item.code, item.value, item.dictValue, item.id)
    const name = pickOptionValue(item.name, item.label, item.dictLabel, item.text, item.code, item.value)
    return {
      ...item,
      code: normalizeOptionValue(code),
      name: normalizeOptionValue(name)
    }
  })
}

export const normalizeTreeOptionList = (data: any[]): OptionItem[] => {
  return normalizeOptionList(data).map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? normalizeTreeOptionList(item.children) : item.children
  }))
}

export const normalizeYearList = (data: any[]): OptionItem[] => {
  return (data || []).map((item) => {
    const code = pickOptionValue(item.yearCode, item.code, item.value)
    const name = pickOptionValue(item.yearName, item.name, item.label, item.yearCode, item.code)
    return {
      ...item,
      code: normalizeOptionValue(code),
      name: normalizeOptionValue(name)
    }
  })
}

export const splitCodes = (value: string) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
