export interface FileItem {
  name: string
  url?: string
  status: string
  uid?: string
  uuid?: string
  raw?: File
  response?: any
  prop?: string
  fjId?: string
  sfzdsc?: string | number | null
  file?: File
}
export interface UploadRequestParams {
  records: FileItem[]
  fjId: string
  selectData: any
}
