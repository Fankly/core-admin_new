import { ComponentPublicInstance } from 'vue'

export interface RowVO {
  code: string
  dataType: string
  id: string
  isShow: string
  name: string
  sort: string
}

export interface IModalInstance {
  comp: any
  ref: ComponentPublicInstance | null
  props: Record<string, any>
}
