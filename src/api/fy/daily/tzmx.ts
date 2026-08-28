import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface TzmxctData {
  parentId: string | number
  pch: string
  xsws: string
}

export const getTzmxctData = (params: TzmxctData): Promise<Result> => {
  return otherOperatingCose.post(`/tzmx/getTzmxctData?parentId=${params.parentId}&pch=${params.pch}&xsws=${params.xsws}`, params, {}, false)
}

export const getTzmxctDynamicColumn = (pch: string): Promise<Result> => {
  return otherOperatingCose.post(`/tzmx/getTzmxctDynamicColumn?pch=${pch}`, {}, {}, false)
}
