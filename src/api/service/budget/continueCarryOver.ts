import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface SearchParams {
  [key: string]: any
}

export const queryXjjzPage = (params: SearchParams): Promise<Result> => {
  return baseService.post('/xjjz/queryXjjzPage', params)
}

export const getChoosePage = (params: SearchParams): Promise<Result> => {
  return baseService.post('/xjjz/getChoosePage', params)
}
