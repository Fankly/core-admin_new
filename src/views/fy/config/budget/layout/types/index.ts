import { VxeGridPropTypes } from 'vxe-table'

export interface Props {
  columns: VxeGridPropTypes.Columns // 列配置项  ==> 必传
  data?: any[] // 静态 table data 数据，若存在则不会使用 requestApi 返回的 data ==> 非必传
  requestApi?: (params: any) => Promise<any> // 请求表格数据的 api ==> 非必传
}
