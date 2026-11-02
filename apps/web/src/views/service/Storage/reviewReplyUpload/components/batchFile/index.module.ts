import { Result } from '@/views/service/Storage/interface'
export interface ModalProps {
  isView: boolean
  selectData: any[]
  searchCode: string
  inputText: string
  selectText?: string
  modalTitle: string
  allowedFileTypes: string[]
  maxFileSize: number
  submitApi: null | ((params: any) => Promise<Result>)
  searchApi: null | ((params: any) => Promise<Result>)
}
