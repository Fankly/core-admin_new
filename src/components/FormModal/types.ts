export interface FormField {
  prop: string
  label: string
  type:
    | 'input'
    | 'hidden'
    | 'textarea'
    | 'number'
    | 'select'
    | 'year'
    | 'date'
    | 'datetime'
    | 'switch'
    | 'radio'
    | 'checkbox'
    | 'slot'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
  maxlength?: number
  rows?: number
  min?: number
  max?: number
  precision?: number
  step?: number
  multiple?: boolean
  clearable?: boolean
  options?: Array<{ label?: string; value: any; name?: string; code?: string }>
  apiConfig?: {
    url: string
    method?: 'get' | 'post'
    params?: Record<string, any>
    labelField?: string
    valueField?: string
    transfrom?: (data: any) => Array<{ label?: string; value: any; name?: string; code?: string }>
  }
  activeValue?: any
  inactiveValue?: any
  rules?: any[]
  // 联动配置
  dependsOn?: string // 依赖的字段名
  optionsLoader?: (
    parentValue: any,
    formData: Record<string, any>
  ) =>
    | Promise<Array<{ label?: string; value: any; name?: string; code?: string }>>
    | Array<{ label?: string; value: any; name?: string; code?: string }>
  cascadeConfig?: {
    parentField: string
    optionsMap: Record<string, Array<{ label?: string; value: any; name?: string; code?: string }>>
  }
  multiDependsOn?: {
    fields: string[]
    apiConfig?: {
      url: string
      method?: 'get' | 'post'
      params?: Record<string, any>
      transfrom?: (data: any) => Array<{ label?: string; value: any; name?: string; code?: string }>
    }
    loader?: (
      dependentValues: Record<string, any>,
      formData: Record<string, any>
    ) => Promise<any> | any
    clearOnChange?: boolean
  }
}

export interface ModalProps {
  title?: string
  mode?: 'add' | 'edit' | 'view'
  showModeTitle?: boolean
  fields: FormField[]
  data?: Record<string, any>
  width?: string
  height?: string
}

export interface FormModalInstance {
  open: () => void
  close: () => void
  resetForm: () => void
}
