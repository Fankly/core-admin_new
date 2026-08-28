import type { Component, ComponentPublicInstance, InjectionKey, Ref } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import type { FormField } from '@/components/FormModal'

export type CrudMode = 'add' | 'edit' | 'view'

export type CrudQueryParams = Record<string, any>

export type CrudRequest = (params: CrudQueryParams) => Promise<any>

export interface CrudPageConfig<T = any> {
  columns: VxeGridProps<T>['columns']
  searchApi: CrudRequest
  defaultSearchParams?: CrudQueryParams
}

export interface CrudPagination {
  page: number
  limit: number
  total: number | string
}

export interface CrudPageResult<T = any> {
  records: T[]
  total: number | string
}

export interface CrudTableExpose {
  searchData: (searchParams?: CrudQueryParams, options?: CrudSearchOptions) => Promise<void>
  reloadData: () => Promise<void>
  getSearchParams: () => CrudQueryParams
}

export interface CrudSearchOptions {
  resetPage?: boolean
}

export interface CrudToolbarConfig<T = any> {
  formFields: FormField[]
  saveApi: (data: CrudQueryParams) => Promise<any>
  addApi: (data: CrudQueryParams) => Promise<any>
  editApi: (data: CrudQueryParams) => Promise<any>
  deleteApi: (data: CrudQueryParams) => Promise<any>
  exportApi?: (data: CrudQueryParams) => Promise<any>
  exportFileName?: string
  useResponseFileName?: boolean
  getRowId?: (row: T) => string | number | undefined | null
  getDefaultFormData?: () => CrudQueryParams
  buildSaveData?: (data: CrudQueryParams, mode: CrudMode) => CrudQueryParams
  singleSelectMessage?: string
  emptyDeleteMessage?: string
}

export const defaultUserRole = (): UserRole => ({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

export const CurrentUserRoleInjectionKey: InjectionKey<Ref<UserRole>> = Symbol('SuzhouCurrentUserRole')
export const CheckedRowsInjectionKey: InjectionKey<Ref<any[]>> = Symbol('SuzhouCheckedRows')
export const CrudTableRefInjectionKey: InjectionKey<Ref<CrudTableExpose | undefined>> = Symbol('SuzhouCrudTableRef')
export const CrudSearchApiInjectionKey: InjectionKey<CrudRequest> = Symbol('SuzhouCrudSearchApi')

export type CrudComponent = Component | ComponentPublicInstance
