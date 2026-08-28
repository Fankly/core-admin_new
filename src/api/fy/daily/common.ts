import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface TzDetail {
  kmlx: string
  limit: number
  nd: string
  xsws: string
  page: number
  specialorgid: string
  tzType: string
  yskmId: string
}

interface DataList {
  dwId: string
  kmlx: string
  nd: string
  pageType: string
  parentId: string
  orgId: string
}

export const getTzDetail = (params: TzDetail): Promise<Result> => {
  return otherOperatingCose.post('/rc/provYsAdjust/getTzDetail', params, {}, false)
}

export const getDataListByWf = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/provYsAdjust/getDataListByWf?dwId=${params.orgId}&kmlx=${params.kmlx}&nd=${params.nd}&pageType=${params.pageType}&parentId=${params.parentId}`,
    {},
    {},
    false
  )
}

export const getDynamicColumnByWf = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/provYsAdjust/getDynamicColumnByWf?dwId=${params.orgId}&kmlx=${params.kmlx}&pageType=${params.pageType}`,
    {},
    {},
    false
  )
}
