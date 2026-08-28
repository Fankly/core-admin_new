import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface Params {
  [key: string]: string
}

export const getMainOpLog = (params: Params): Promise<Result> => {
  return baseService.post(`/xmMainLog/getMainOpLog`, params)
}
