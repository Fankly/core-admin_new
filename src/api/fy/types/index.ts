import { Result } from '@/api/types'

export interface FormStatus {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  xsws: string
}

export interface ImportData extends FormStatus {
  excelFormData: Promise<Result>
  specialorgid: string
  xsws: string
}

// 公共代码
export interface PublicCode {
  code: string
  name: string
}
