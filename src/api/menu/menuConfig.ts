import baseService from '@/service/baseService'

interface Params {
  appNo: string
  label: string
}

export const getConfigDetail = (path: string, tabFlag?: string) => {
  if (tabFlag) {
    return baseService.get(`/sys/menuConfig/getConfigDetail?path=${path}&tabFlag=${tabFlag}`)
  } else {
    return baseService.get(`/sys/menuConfig/getConfigDetail?path=${path}`)
  }
}

export const getConfigInfo = (path: string) => {
  return baseService.get(`/sys/menuConfig/getConfigInfo?path=${path}`)
}

export const getAppMenu = (params: Params) => {
  return baseService.post(`/sys/appMenu/list`, params)
}
