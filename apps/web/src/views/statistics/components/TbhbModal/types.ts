export type TbhbType = 'tb' | 'hb'

export interface TbhbRowVo {
  // 行元数据（接口稳定返回）
  rownumber: number | string
  dwCode: string
  dwName: string
  dwType: string
  // 前端运行时注入的分组/合计/待分解标记
  _isGroupRow?: boolean
  _isTotalRow?: boolean
  _isDfjRow?: boolean
  _parentGroup?: string
  _groupType?: string
  // 接口动态返回的数值列（本月/同期/增幅/完成率等），字段名由后端决定
  [key: string]: any
}

export interface TbhbApi {
  tbgetDynamicColumn: (params: any) => Promise<any>
  getTbData: (params: any) => Promise<any>
  hbgetDynamicColumn: (params: any) => Promise<any>
  getHbData: (params: any) => Promise<any>
  tbGetFxbg?: (params: any) => Promise<any>
  hbGetFxbg?: (params: any) => Promise<any>
}

export interface TbhbModalParams {
  type: TbhbType
  formData: Record<string, any>
  dwId: string
  xsws: string
  api?: TbhbApi
}

export const DW_TYPE_ORDER: string[] = ['1', '2', '3', '4']

export const DW_TYPE_NAME: Record<string, string> = {
  '1': '供电公司',
  '2': '直属单位（分公司）',
  '3': '机关本部',
  '4': '直属单位（子公司）'
}
