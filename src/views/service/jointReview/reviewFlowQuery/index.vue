<script lang="ts">
export default {
  name: '/service/jointReview/reviewFlowQuery/index'
}
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, provide, reactive, ref } from 'vue'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import ElTreeSelect from '@/components/ElTreeSelect'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { getButtonList } from '@/api/common'
import { getAppMenu } from '@/api/menu/menuConfig'
import baseService from '@/service/baseService'
import type { Configs, MenuConfig } from '@/views/service/xq/interface'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue, freezeColumns, pxWidth } from '@/utils/utils'
import { getDynamicSearchColumn } from '@/api/service/requirement'
import { exportReviewFlowQuery, getCtData, getReviewFlowQuerySchema, pageReviewFlowQuery } from '@/api/service/IhhsMeeting/reviewFlowQuery'
import ReviewFlowQuerySetting from './ReviewFlowQuerySetting.vue'

type ReviewFlowUserInfo = {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  roleId: string
  spRoleId: string
  specialorgcode: string
  fqzzFlag?: string
}

type ReviewFlowSearchConfig = Configs & {
  dateType?: string
  valueFormat?: string
}

const store = useStore()
const router = useRouter()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const settingRef = ref()
const gridRef = ref<VxeGridInstance>()
const loadingCount = ref(0)
const loading = computed(() => loadingCount.value > 0)
const exportLoading = ref(false)
const isShowPage = ref(false)
const title = '高级设置'
const searchCode = ref('LHHS-LZQK')
const dynamciSearch = ref<ReviewFlowSearchConfig[]>([])
const dynamicSearchMap = ref<Map<string, ReviewFlowSearchConfig>>(new Map())
const searchDatas = ref<Record<string, any>>({})
const defaultValueProp = ref<Record<string, any>>({})
const linkLength = ref(0)
let searchRequestSeq = 0

const tableColumnFont = '14px Microsoft YaHei'
const tableColumnPadding = 56
const tableColumnDefaultMinWidth = 100
const tableFreezeLeftCount = 1
const ctStorageKeyPrefix = 'reviewFlowQuery:ct:'
const requireDetailRouteName = '/service/xq/RequireDetailSearch'
const requireDetailAppNo = 'XQK'
const requireDetailMenuLabels = ['1', '2']
const requireDetailRetainedPermissions = ['VIEW', 'EXPORT', 'BATCH_DOWNLOAD_ATTACH', 'PROCESS']
const ctProjectCodeField = 'xmbm'
const ctColumnClassName = 'review-flow-query__ct-column'

const userInfo = ref<ReviewFlowUserInfo>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  roleId: '',
  spRoleId: '',
  specialorgcode: ''
})

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

const spanComp = computed(() =>
  linkLength.value % 4 === 0 ? 24 : linkLength.value % 4 === 1 ? 18 : linkLength.value % 4 === 2 ? 12 : linkLength.value % 4 === 3 ? 6 : 24
)
const actionDisabled = computed(() => loading.value || exportLoading.value)
const canExport = computed(() => userRoleSelectorRef.value?.permissions.includes('EXPORT') || false)

const startLoading = () => {
  loadingCount.value += 1
}

const stopLoading = () => {
  loadingCount.value = Math.max(loadingCount.value - 1, 0)
}

async function runWithLoading<T>(handler: () => Promise<T>) {
  startLoading()
  try {
    return await handler()
  } finally {
    stopLoading()
  }
}

const gridOptions = reactive<VxeGridProps<any>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columns: [],
  data: [],
  rowStyle: ({ row }: any) => {
    if (row['pspc_type'] == '2') {
      return { color: 'red' }
    }
  }
})
const hasTableData = computed(() => Array.isArray(gridOptions.data) && gridOptions.data.length > 0)

const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

provide('currentUserRole', currentUserRole)
provide(PermissionInjectionKey, {
  get permissions() {
    return userRoleSelectorRef.value?.permissions || []
  },
  get isLoading() {
    return userRoleSelectorRef.value?.loading || false
  }
})

const getReviewAuthParams = () => ({
  bmId: userInfo.value.deptId || '',
  dwId: userInfo.value.dwId || '',
  roleId: userInfo.value.roleId || '',
  spRoleId: userInfo.value.spRoleId || '',
  searchCode: searchCode.value
})

const buildRequestParams = () => ({
  ...searchDatas.value,
  ...getReviewAuthParams(),
  limit: page.limit,
  page: page.page,
  current: page.page,
  size: page.limit
})

const getCurrentYear = () => new Date().getFullYear().toString()

const hasDefaultValue = (value: any) => value !== undefined && value !== null && value !== ''

const cloneDefaultValue = (value: any) => (Array.isArray(value) ? [...value] : value)

const normalizeBoolean = (value: any, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue
  if (typeof value === 'string') return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase())
  return value === true || value === 1
}

const isPlanYearField = (column: ReviewFlowSearchConfig) =>
  column.code?.toLowerCase() === 'jhssnd' || column.name?.includes('计划实施年度') || column.name?.includes('计划实施年份')

const getColumnDefaultValue = (column: ReviewFlowSearchConfig) => {
  if (hasDefaultValue(column.defaultValue)) {
    if (column.multiple && typeof column.defaultValue === 'string') {
      return column.defaultValue.split(',')
    }
    return column.defaultValue
  }
  if (isPlanYearField(column)) {
    return column.multiple ? [getCurrentYear()] : getCurrentYear()
  }
}

const setDefaultSearchValue = (column: ReviewFlowSearchConfig) => {
  const defaultValue = getColumnDefaultValue(column)
  if (defaultValue === undefined) return
  const normalizedDefaultValue = column.type === 'inputText' ? normalizeMultipleTextValue(defaultValue) : defaultValue
  defaultValueProp.value[column.code] = cloneDefaultValue(normalizedDefaultValue)
  searchDatas.value[column.code] = cloneDefaultValue(normalizedDefaultValue)
}

const normalizeMultipleTextValue = (value: any) => {
  if (Array.isArray(value)) return value.map((item) => `${item}`.trim()).filter(Boolean)
  if (value === undefined || value === null || value === '') return []
  return `${value}`
    .replace(/\r\n/g, '\n')
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const createEmptySearchValue = (column: ReviewFlowSearchConfig) => (column.multiple || column.type === 'inputText' ? [] : '')

const getMultipleTextModelValue = (value: any) => normalizeMultipleTextValue(value).join(',')

const setMultipleTextValue = (code: string, value: any) => {
  searchDatas.value[code] = normalizeMultipleTextValue(value)
}

const normalizeSearchType = (column: any) => {
  const type = column.type || column.el || column.component || column.searchType || ''
  const normalizedType = String(type).toLowerCase()
  if (['select', 'el-select'].includes(normalizedType)) return 'select'
  if (['treeselect', 'tree-select', 'eltreeselect'].includes(normalizedType)) return 'treeSelect'
  if (['inputtext', 'multipletext', 'remultipletext'].includes(normalizedType)) return 'inputText'
  if (['date', 'datetime', 'daterange', 'datetimerange', 'date-picker', 'el-date-picker'].includes(normalizedType)) return 'date'
  return type || 'input'
}

const normalizeSearchColumn = (column: any): ReviewFlowSearchConfig => {
  const code = column.code || column.field || column.prop || column.key || column.columnKey || column.name
  const name = column.name || column.label || column.title || column.columnValue || code
  const valueKey = code === 'zt' ? 'code' : column.nodeKey || column.valueKey || 'id'
  const treeProps = column.treeProps || column.props || { children: 'children', label: 'name', value: valueKey }

  return {
    ...column,
    code,
    name,
    dependOnColumn: column.dependOnColumn || '',
    dyff: column.dyff || column.method || '',
    ggdm: column.ggdm || column.dictCode || '',
    id: column.id || code,
    link: normalizeBoolean(column.link ?? column.isShow ?? column.visible, true),
    type: normalizeSearchType(column),
    nodeKey: valueKey,
    placeholder: column.placeholder || '请选择' + name,
    disabled: normalizeBoolean(column.disabled, false),
    clearable: column.clearable !== false,
    filterable: column.filterable !== false,
    multiple: normalizeBoolean(column.multiple, false),
    defaultValue: column.defaultValue,
    options: column.options || column.enum || column.data || column.list || column.dictData || [],
    treeProps
  }
}

const clearSearchItem = (column?: ReviewFlowSearchConfig) => {
  if (!column) return
  column.options = []
  searchDatas.value[column.code] = createEmptySearchValue(column)
}

const initParamsData = async (method: string, params: any): Promise<any[]> => {
  const res = await baseService.post(method, params)
  if (res.success) {
    return res.data || []
  }
  ElMessage.error(res.msg)
  return []
}

const hasSearchValue = (value: any) => (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '')

const getDependentColumns = (parentCode: string) => dynamciSearch.value.filter((item) => item.dependOnColumn === parentCode)

const clearDependentSearchItems = (parentCode: string, clearedCodes = new Set<string>()) => {
  getDependentColumns(parentCode).forEach((child) => {
    if (clearedCodes.has(child.code)) return
    clearedCodes.add(child.code)
    clearSearchItem(child)
    clearDependentSearchItems(child.code, clearedCodes)
  })
}

const buildDependentRequestParams = (prop: string, value: any, column: ReviewFlowSearchConfig) => {
  if (column.ggdm) {
    return {
      bmId: userInfo.value.deptId || '',
      dwId: userInfo.value.dwId || '',
      code: column.ggdm,
      ggdm: column.ggdm,
      parentCode: value
    }
  }

  return {
    [prop.toUpperCase()]: value,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || '',
    parentCode: value
  }
}

const handleFieldChange = async (prop: string, value: any, column: ReviewFlowSearchConfig) => {
  const dependentColumns = getDependentColumns(prop)
  clearDependentSearchItems(prop)
  if (!hasSearchValue(value)) return

  await Promise.all(
    dependentColumns.map(async (dependentColumn) => {
      if (!dependentColumn.dyff) return
      const res = await baseService.post(dependentColumn.dyff, buildDependentRequestParams(prop, value, column))
      if (res.success) {
        dependentColumn.options = res.data || []
      } else {
        dependentColumn.options = []
        ElMessage.error(res.msg)
      }
    })
  )
}

const getArrayByKeys = (data: any, keys: string[]): any[] => {
  if (!data || typeof data !== 'object') return []
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key]
  }
  for (const key of ['config', 'schema', 'pageConfig', 'queryConfig']) {
    if (data[key] && typeof data[key] === 'object') {
      const value = getArrayByKeys(data[key], keys)
      if (value.length) return value
    }
  }
  return []
}

const normalizeSearchColumnsResult = (data: any): any[] =>
  Array.isArray(data)
    ? data
    : getArrayByKeys(data, [
        'searchColumns',
        'queryColumns',
        'searchFields',
        'conditions',
        'queryFields',
        'queryConfigList',
        'searchConfigList',
        'dynamicSearchColumns',
        'fieldList'
      ])

const normalizeTableColumnsResult = (data: any): any[] =>
  Array.isArray(data)
    ? data
    : getArrayByKeys(data, ['tableColumns', 'columns', 'headers', 'tableHeaders', 'tableHeaderList', 'columnList', 'tableColumnList'])

const normalizeCtProjectCodes = (data: any): string[] => {
  const source = Array.isArray(data)
    ? data
    : getArrayByKeys(data, [ctProjectCodeField, 'projectCodes', 'projectCodeList', 'xmbmList', 'records', 'list', 'rows', 'data'])

  return source
    .map((item: any) => {
      if (item === undefined || item === null) return ''
      if (typeof item === 'string' || typeof item === 'number') return `${item}`.trim()
      return `${item[ctProjectCodeField] ?? item.projectCode ?? item.project_code ?? item.code ?? item.id ?? ''}`.trim()
    })
    .filter(Boolean)
}

const createCtStorageKey = () => `${ctStorageKeyPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}`

const setCtProjectCodes = (projectCodes: string[]) => {
  const ctKey = createCtStorageKey()
  sessionStorage.setItem(
    ctKey,
    JSON.stringify({
      [ctProjectCodeField]: projectCodes
    })
  )
  return ctKey
}

const isCtColumn = (column: any) => normalizeBoolean(column?.canBeCt ?? column?.params?.canBeCt)

const getCtColumnField = (column: any) => column?.field || column?.property || column?.params?.field || ''

const getCtGlobalInfo = () => ({
  deptId: userInfo.value.deptId || '',
  deptName: userInfo.value.deptName || '',
  dwId: userInfo.value.dwId || '',
  dwName: userInfo.value.dwName || '',
  roleId: userInfo.value.roleId || '',
  roleCode: userInfo.value.roleCode || '',
  spRoleId: userInfo.value.spRoleId || '',
  specialorgcode: userInfo.value.specialorgcode || '',
  fqzzFlag: userInfo.value.fqzzFlag || ''
})

const normalizeMenuUrl = (url?: string | null) => `${url || ''}`.replace(/\/+$/, '')

const getRouteMetaMenuCode = () => {
  const routeMeta = (store.state.routeToMeta || {})[requireDetailRouteName] as Partial<MenuConfig> | undefined
  return routeMeta?.outsideMenu || ''
}

const getRequireDetailMenuCode = async () => {
  const routeMetaMenuCode = getRouteMetaMenuCode()
  if (routeMetaMenuCode) return routeMetaMenuCode

  const menuResults = await Promise.all(requireDetailMenuLabels.map((label) => getAppMenu({ appNo: requireDetailAppNo, label })))
  const requireDetailMenu = menuResults
    .flatMap((res: any) => (res.success && Array.isArray(res.data) ? res.data : []))
    .find((item: MenuConfig) => normalizeMenuUrl(item.url) === requireDetailRouteName)

  return requireDetailMenu?.outsideMenu || ''
}

const mergeRequireDetailPermissions = (permissions: any) =>
  Array.from(new Set([...(Array.isArray(permissions) ? permissions : []), ...requireDetailRetainedPermissions]))

const ensureRequireDetailPermissions = async () => {
  const spRoleId = userInfo.value.spRoleId || currentUserRole.value.spRoleId
  let permissions: string[] = []

  try {
    const menuCode = spRoleId ? await getRequireDetailMenuCode() : ''
    if (menuCode && spRoleId) {
      const permissionRes = await getButtonList(menuCode, spRoleId)
      permissions = permissionRes.success && Array.isArray(permissionRes.data) ? permissionRes.data : []
    }
  } catch (e) {
    console.error(e)
  }

  store.commit('setPermissions', mergeRequireDetailPermissions(permissions))
}

const buildCtDataParams = (meetingId: string, searchType: string) => ({
  ...searchDatas.value,
  ...getReviewAuthParams(),
  meeting_id: meetingId,
  roleCode: userInfo.value.roleCode || '',
  searchType
})

const isNeedFormatColumn = (column: any) => normalizeBoolean(column?.needFormat) || String(column?.needFormat).toLowerCase() === 'true'

const formatNeedFormatValue = (value: any) => {
  if (value === undefined || value === null || value === '') return '-'
  if (value === '-') return value
  return formatNumValue(`${value}`, 6)
}

const getTableColumnMinWidth = (column: any) => {
  const minWidth = Number(column?.minWidth || tableColumnDefaultMinWidth)
  return Number.isFinite(minWidth) ? minWidth : tableColumnDefaultMinWidth
}

const getTableDisplayValue = (column: any, value: any) => (isNeedFormatColumn(column) ? formatNeedFormatValue(value) : value)

const getTableCellText = (value: any): string => {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) return value.map(getTableCellText).join(',')
  if (typeof value === 'object') {
    const textValue = value.name ?? value.label ?? value.title ?? value.value ?? value.code ?? value.id
    if (textValue !== undefined && textValue !== null) return `${textValue}`
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return `${value}`
}

const getRowFieldValue = (row: any, field?: string) => {
  if (!field || !row || typeof row !== 'object') return ''
  if (Object.prototype.hasOwnProperty.call(row, field)) return row[field]
  return field.split('.').reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), row)
}

const getTextWidthWithPadding = (value: any) => Math.ceil(pxWidth(getTableCellText(value), tableColumnFont) + tableColumnPadding)

const getTableColumnWidth = (column: any, rows: any[] = []) => {
  const minWidth = getTableColumnMinWidth(column)
  const titleWidth = getTextWidthWithPadding(column.title)
  const contentWidth = column.field
    ? rows.reduce((width, row) => Math.max(width, getTextWidthWithPadding(getTableDisplayValue(column, getRowFieldValue(row, column.field)))), 0)
    : 0
  return Math.max(minWidth, titleWidth, contentWidth)
}

const getColumnsWithWidth = (columns: any[] = [], rows: any[] = []): any[] =>
  columns.map((column) => {
    if (Array.isArray(column.children) && column.children.length) {
      return {
        ...column,
        children: getColumnsWithWidth(column.children, rows)
      }
    }
    if (!column.field || column.type) return column
    return {
      ...column,
      width: getTableColumnWidth(column, rows)
    }
  })

const refreshTableColumnWidth = async (rows: any[] = []) => {
  if (!Array.isArray(gridOptions.columns)) return
  gridOptions.columns = getColumnsWithWidth(gridOptions.columns, rows)
  await nextTick()
  await gridRef.value?.refreshColumn?.()
  await gridRef.value?.recalculate?.(true)
}

const normalizeTableColumn = (column: any): any | null => {
  const children = Array.isArray(column.children) ? column.children.map(normalizeTableColumn).filter(Boolean) : []
  const field = column.field || column.prop || column.key || column.code || column.columnKey
  const title = column.title || column.label || column.name || column.columnValue || field

  if (!field && !children.length && !column.type) return null
  const canBeCt = normalizeBoolean(column.canBeCt ?? column.params?.canBeCt)

  const normalizedColumn = {
    ...column,
    field,
    title,
    canBeCt,
    params: {
      ...column.params,
      canBeCt
    }
  }

  if (children.length) {
    normalizedColumn.children = children
  } else {
    delete normalizedColumn.children
    normalizedColumn.className = [column.className, canBeCt ? ctColumnClassName : ''].filter(Boolean).join(' ')
    normalizedColumn.minWidth = column.minWidth || tableColumnDefaultMinWidth
    if (isNeedFormatColumn(normalizedColumn)) {
      normalizedColumn.align = 'right'
      normalizedColumn.headerAlign = 'center'
      normalizedColumn.formatter = ({ cellValue }: { cellValue: any }) => formatNeedFormatValue(cellValue)
    }
    normalizedColumn.width = getTableColumnWidth(normalizedColumn) || column.width
  }

  return normalizedColumn
}

const normalizePageData = (data: any) => {
  if (Array.isArray(data)) {
    return {
      records: data,
      total: data.length
    }
  }

  const records = data?.records || data?.list || data?.rows || (Array.isArray(data?.data) ? data.data : [])
  return {
    records,
    total: data?.total || data?.totalCount || data?.count || records.length || 0
  }
}

const searchConfigHandle = async () => {
  startLoading()
  try {
    const searchResData = await getDynamicSearchColumn({
      searchCode: searchCode.value
    })
    if (!searchResData.success) {
      ElMessage.error(searchResData.msg)
      return
    }

    const searchColumns = normalizeSearchColumnsResult(searchResData.data || [])
      .map(normalizeSearchColumn)
      .filter((item) => item.code)
    const commonCodeConfigs: Array<{ code: string; ggdm: string }> = []
    const customData: Array<{ dyff: string; code: string }> = []

    searchDatas.value = {}
    defaultValueProp.value = {}
    searchColumns.forEach((item: ReviewFlowSearchConfig) => {
      searchDatas.value[item.code] = createEmptySearchValue(item)
      setDefaultSearchValue(item)
      if (item.dyff && item.ggdm && !item.dependOnColumn) {
        commonCodeConfigs.push({
          ggdm: item.ggdm,
          code: item.code
        })
      }
      if (item.dyff && !item.ggdm && !item.dependOnColumn) {
        customData.push({
          dyff: item.dyff,
          code: item.code
        })
      }
    })

    linkLength.value = searchColumns.filter((item: ReviewFlowSearchConfig) => item.link).length
    dynamciSearch.value = searchColumns
    dynamicSearchMap.value = new Map(dynamciSearch.value.map((item) => [item.code, item]))

    await Promise.all(
      customData.map(async (item) => {
        const findData = dynamicSearchMap.value.get(item.code)
        if (!findData) return
        if (item.code !== 'xmlxs') {
          findData.options = await initParamsData(item.dyff, {
            bmId: userInfo.value.deptId || '',
            dwId: userInfo.value.dwId || ''
          })
        } else {
          const initCustomData = await baseService.get(item.dyff)
          findData.options = initCustomData.data || []
        }
      })
    )

    if (commonCodeConfigs.length > 0) {
      const initData = await initParamsData('/commonCode/getCommonCode', {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        codes: commonCodeConfigs.map((item) => item.ggdm)
      })
      commonCodeConfigs.forEach((item, index) => {
        const findData = dynamicSearchMap.value.get(item.code)
        if (findData) {
          findData.options = initData[index]?.codes || []
        }
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
    stopLoading()
  }
}

const tableColumnConfigHandle = async () => {
  startLoading()
  try {
    const tableResData = await getReviewFlowQuerySchema(getReviewAuthParams())
    if (!tableResData.success) {
      ElMessage.error(tableResData.msg)
      gridOptions.columns = []
      return
    }

    const columns = normalizeTableColumnsResult(tableResData.data || [])
      .map(normalizeTableColumn)
      .filter(Boolean)
    freezeColumns(columns, tableFreezeLeftCount)
    gridOptions.columns = columns
  } catch (e) {
    console.error(e)
    gridOptions.columns = []
  } finally {
    stopLoading()
  }
}

const searchDataHandle = async () => {
  const currentSeq = ++searchRequestSeq
  startLoading()
  try {
    const getPageData = await pageReviewFlowQuery(buildRequestParams())
    if (currentSeq !== searchRequestSeq) return
    if (getPageData.success) {
      const pageData = normalizePageData(getPageData.data)
      gridOptions.data = pageData.records
      page.total = pageData.total
      await refreshTableColumnWidth(pageData.records)
    } else {
      ElMessage.error(getPageData.msg)
      gridOptions.data = []
      page.total = 0
      await refreshTableColumnWidth([])
    }
  } catch (e) {
    console.error(e)
  } finally {
    stopLoading()
  }
}

const searchHandle = () => {
  if (actionDisabled.value) return
  page.page = 1
  searchDataHandle()
}

const resetHandle = () => {
  if (actionDisabled.value) return
  dynamciSearch.value.forEach((item) => {
    if (item.dependOnColumn && item.options && Array.isArray(item.options)) {
      item.options = []
    }
  })
  for (const valueKey in searchDatas.value) {
    if (Object.prototype.hasOwnProperty.call(defaultValueProp.value, valueKey)) {
      searchDatas.value[valueKey] = cloneDefaultValue(defaultValueProp.value[valueKey])
      continue
    }
    searchDatas.value[valueKey] = Array.isArray(searchDatas.value[valueKey]) ? [] : ''
  }
  page.page = 1
  searchDataHandle()
}

const pageChangeHandle = (currentPageNum: number) => {
  if (actionDisabled.value) return
  page.page = currentPageNum
  searchDataHandle()
}

const limitChangeHandle = (currentLimitNum: number) => {
  if (actionDisabled.value) return
  page.page = 1
  page.limit = currentLimitNum
  searchDataHandle()
}

const exportHandle = async () => {
  if (actionDisabled.value) return
  exportLoading.value = true
  try {
    await apiExportHandle(buildRequestParams(), '会审流转情况查询', exportReviewFlowQuery)
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  } finally {
    exportLoading.value = false
  }
}

const cellClickHandle = async ({ row, column }: any) => {
  if (actionDisabled.value || !isCtColumn(column) || column?.type) return
  const meetingId = row?.meeting_id
  const searchType = getCtColumnField(column)
  if (!meetingId || !searchType) {
    ElMessage.warning('缺少穿透参数')
    return
  }

  await runWithLoading(async () => {
    const ctRes = await getCtData(buildCtDataParams(`${meetingId}`, searchType))
    if (!ctRes.success) {
      ElMessage.error(ctRes.msg)
      return
    }

    const projectCodes = normalizeCtProjectCodes(ctRes.data)
    if (!projectCodes.length) {
      ElMessage.warning('暂无可穿透项目')
      return
    }

    const ctKey = setCtProjectCodes(projectCodes)
    await ensureRequireDetailPermissions()
    store.commit('setXqGlobalInfo', getCtGlobalInfo())
    await router.push({
      name: requireDetailRouteName,
      params: { formJsc: '1' },
      query: { ctKey }
    })
  })
}

const showHandle = async () => {
  await runWithLoading(async () => {
    await searchConfigHandle()
    await tableColumnConfigHandle()
    await searchDataHandle()
  })
}

const showModalHandle = async () => {
  await showHandle()
}

const settingHandle = () => {
  if (actionDisabled.value) return
  settingRef.value.isShowDrawer = true
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const getOptionKey = (option: any) => option.code ?? option.value ?? option.id ?? option.name
const getOptionLabel = (option: any) => option.name ?? option.label ?? option.title ?? option.value ?? option.code ?? option.id
const getOptionValue = (option: any) => option.code ?? option.value ?? option.id ?? option.name

const getRoleHandle = async () => {
  try {
    isShowPage.value = false
    if (!currentUserRole.value.bmId) return
    const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${currentUserRole.value.bmId}`)
    if (flagData.success && flagData.data) {
      const globalInfo: ReviewFlowUserInfo = {
        deptId: currentUserRole.value.bmId,
        deptName: currentUserRole.value.bmName,
        dwId: currentUserRole.value.dwId,
        dwName: currentUserRole.value.dwName,
        roleId: currentUserRole.value.roleId,
        roleCode: currentUserRole.value.roleCode,
        spRoleId: currentUserRole.value.spRoleId,
        specialorgcode: currentUserRole.value.specialOrgCode,
        fqzzFlag: flagData.data
      }
      userInfo.value = globalInfo
      store.commit('setJRGlobalInfo', globalInfo)
      isShowPage.value = true
      await showHandle()
    } else {
      ElMessage.error(flagData.msg)
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await userRoleSelectorRef.value?.getUser()
})
</script>

<template>
  <div class="main review-flow-query" v-if="isShowPage" v-loading="loading">
    <div class="opeartion review-flow-query__toolbar">
      <div class="left">
        <el-button v-if="canExport" plain type="primary" size="mini" :loading="exportLoading" :disabled="actionDisabled" @click="exportHandle"
          >导 出</el-button
        >
      </div>
      <div class="right review-flow-query__toolbar-right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search review-flow-query__search">
      <el-form ref="formRef" :model="searchDatas" label-position="right" label-width="120px" @submit.prevent @keyup.enter="searchHandle">
        <el-row :gutter="24">
          <template v-for="column in dynamciSearch" :key="column.code">
            <el-col class="review-flow-query__search-col" :span="6" v-if="column.link">
              <el-form-item :label="column.name">
                <el-select
                  collapse-tags
                  class="review-flow-query__control"
                  v-if="column.type === 'select'"
                  v-model="searchDatas[column.code]"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  :clearable="column.clearable !== false"
                  :multiple="column.multiple"
                  :filterable="column.filterable"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                >
                  <el-option
                    v-for="option in column.options"
                    :key="getOptionKey(option)"
                    :label="getOptionLabel(option)"
                    :value="getOptionValue(option)"
                    :disabled="option.disabled"
                  />
                </el-select>
                <ElTreeSelect
                  v-else-if="column.type === 'treeSelect'"
                  :collapseTags="true"
                  v-model="searchDatas[column.code]"
                  :data="column.options"
                  :props="column.treeProps"
                  :node-key="column.nodeKey || 'id'"
                  :multiple="column.multiple"
                  :showCheckbox="column.multiple"
                  :clearable="column.clearable !== false"
                  :filterable="column.filterable"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                ></ElTreeSelect>
                <ReMultipleText
                  :placeholder="column.placeholder"
                  :dialog-title="column.name"
                  :tooltip-text="column.name"
                  v-else-if="column.type === 'inputText'"
                  :model-value="getMultipleTextModelValue(searchDatas[column.code])"
                  @update:model-value="setMultipleTextValue(column.code, $event)"
                />
                <el-date-picker
                  v-else-if="column.type === 'date'"
                  v-model="searchDatas[column.code]"
                  class="review-flow-query__control"
                  :type="column.dateType || 'date'"
                  :value-format="column.valueFormat || 'YYYY-MM-DD'"
                  :placeholder="column.placeholder"
                  :clearable="column.clearable !== false"
                  :disabled="column.disabled"
                />
                <el-input maxlength="127" v-model="searchDatas[column.code]" v-else class="review-flow-query__control"></el-input>
              </el-form-item>
            </el-col>
          </template>
          <el-col class="review-flow-query__action-col" :span="spanComp">
            <div class="operation review-flow-query__actions">
              <el-button plain type="primary" size="mini" :loading="loading" :disabled="actionDisabled" @click="searchHandle">查 询</el-button>
              <el-button plain size="mini" :disabled="actionDisabled" @click="resetHandle">重 置</el-button>
              <el-button plain type="primary" size="mini" :disabled="actionDisabled" @click="settingHandle">高级设置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table review-flow-query__table" :class="{ 'is-empty': !hasTableData }">
      <vxe-grid ref="gridRef" height="100%" v-bind="gridOptions" @cell-click="cellClickHandle">
        <template #empty>
          <div class="review-flow-query__empty">
            <div class="review-flow-query__empty-title">暂无数据</div>
            <div class="review-flow-query__empty-text">请调整查询条件后重试</div>
          </div>
        </template>
      </vxe-grid>
    </div>
    <div class="bottom review-flow-query__pagination">
      <el-pagination
        :current-page="page.page"
        background
        align="right"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        :disabled="actionDisabled"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <ReviewFlowQuerySetting :search-code="searchCode" :title="title" ref="settingRef" @show-modal="showModalHandle"></ReviewFlowQuerySetting>
  <HelpModal ref="helpModalRef" />
</template>

<style scoped lang="less">
.opeartion {
  display: flex;
  min-width: 0;
  min-height: 0;

  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    min-height: 0;
  }
}

:deep(.el-button) {
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item__label) {
  color: var(--el-text-color-regular, #606266);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  height: auto !important;
  min-height: 32px;
}

:deep(.el-select__tags) {
  height: auto !important;
  max-height: none !important;
  flex-wrap: wrap;
  padding: 2px 0;

  .el-select__input {
    max-width: 110px !important;
  }
}

:deep(.el-input__wrapper) {
  height: auto !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color, #dcdfe6) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary, #409eff) inset;
}

.main {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;

  .opeartion {
    padding: 8px 0;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}

.review-flow-query {
  &__toolbar {
    align-items: center;
    min-height: 40px;
    border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  }

  &__guide-icon {
    cursor: pointer;
    color: var(--el-text-color-regular, #606266);
    font-size: 18px;
    line-height: 1;
  }

  &__search {
    padding-top: 12px;
  }

  &__search-col {
    min-height: 44px;
  }

  &__control {
    width: 100%;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-height: 32px;
    margin-bottom: 12px;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__empty {
    display: flex;
    min-height: 180px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary, #909399);
  }

  &__empty-title {
    color: var(--el-text-color-regular, #606266);
    font-size: 14px;
    line-height: 22px;
  }

  &__empty-text {
    margin-top: 4px;
    font-size: 12px;
    line-height: 20px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
  }
}

:deep(.review-flow-query__ct-column) {
  cursor: pointer;
  color: var(--el-color-primary, #409eff);
  text-decoration: underline;
  text-underline-offset: 2px;
}

:deep(.review-flow-query__ct-column:hover) {
  color: var(--el-color-primary-light-3, #79bbff);
}
</style>
