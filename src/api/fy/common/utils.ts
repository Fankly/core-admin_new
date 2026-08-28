import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface ImportData {
  sysParamCode: string
  tabName: string
  excelFormData: any
}

// 批量处理导入接口
export const batchUpdateData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/dataUtil/batchUpdateData?sysParamCode=${params.sysParamCode}&tabName=${params.tabName}`,
    params.excelFormData,
    {},
    false
  )
}

export const getBatchOperationTemplate = (sysParamCode: string, tabName: string): Promise<Result> => {
  return otherOperatingCose.exportFile(`/dataUtil/getBatchOperationTemplate?sysParamCode=${sysParamCode}&tabName=${tabName}`, {}, {}, false)
}
