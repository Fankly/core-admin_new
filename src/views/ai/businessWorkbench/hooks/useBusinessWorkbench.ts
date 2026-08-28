import { computed, nextTick, provide, ref, unref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { getButtonList, getPublicCodeList, getYearData } from '@/api/common'
import { getAppMenuData } from '@/api/lkyptzl/index'
import {
  buildBusinessWorkbenchModuleParams,
  getBusinessWorkbenchProjectStatistics,
  meetingInfoPage,
  requirementLibraryProjectPage,
  reserveLibraryProjectPage
} from '@/api/ai/businessWorkbench'
import type { BusinessWorkbenchModuleParams, ProjectStatisticsResult } from '@/api/ai/businessWorkbench'
import type { FilterOption, LevelFilter, Meeting, MeetingStatus, MenuConfig, ModuleId, Statistics, StatusFilter, YearOption } from '../types'
import { defaultModuleId, getWorkbenchModule, workbenchModules } from '../modules'

interface CommonCodeOption {
  code: string
  name: string
}

const projectStatusPublicCodeMap: Partial<Record<ModuleId, string>> = {
  create: 'LYGXQKSTATUS_COM',
  opinion: 'CBKSTATUS_COM'
}

const projectLevelPublicCodeMap: Partial<Record<ModuleId, string>> = {
  create: 'PROJECT_LEVEL_COM',
  opinion: 'PROJECT_LEVEL_COM',
  review: 'REVIEW_LEVEL_COM'
}

const allLevelOption: FilterOption<LevelFilter> = { value: 'all', label: '全部' }

const allStatusOption: FilterOption<StatusFilter> = { value: 'all', label: '全部' }

const emptyStatistics: Statistics = {
  totalCount: 0,
  requirementEntryRate: 0,
  notInRequirementEntryRate: 0,
  requirementCount: 0,
  jointReviewCount: 0,
  reserveCount: 0,
  budgetingCount: 0,
  approvedCount: 0,
  closedCount: 0,
  jointReviewPassRate: 0,
  totalCount2: 0,
  reviewingCount: 0,
  reviewPassedCount: 0,
  reviewRejectedCount: 0,
  reviewOpinionPendingCount: 0,
  pendingFeasibilityUploadCount: 0,
  complianceReviewingCount: 0,
  approvalRate: 0,
  totalCount3: 0,
  pendingOutboundCount: 0,
  pendingOutboundConfirmCount: 0,
  pendingBudgetingCount: 0,
  budgetingReviewingCount: 0,
  pendingApprovalCount: 0,
  approvedCount3: 0
}

const getCurrentYear = () => String(new Date().getFullYear())

const toNumber = (value: any, defaultValue = 0) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : defaultValue
}

const isEmptyValue = (value: any) => {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return false

  const trimmedValue = value.trim().toLowerCase()
  return trimmedValue === '' || trimmedValue === 'null' || trimmedValue === 'undefined'
}

const pickNumber = (source: Record<string, any>, keys: string[], defaultValue = 0) => {
  const key = keys.find((item) => !isEmptyValue(source[item]))
  return key ? toNumber(source[key], defaultValue) : defaultValue
}

const pickString = (source: Record<string, any>, keys: string[], defaultValue = '') => {
  const key = keys.find((item) => !isEmptyValue(source[item]))
  return key ? String(source[key]).trim() : defaultValue
}

const formatTimestamp = (value: any) => {
  if (isEmptyValue(value)) return ''

  const rawValue = String(value).trim()
  const dateMatch = rawValue.match(/^\d{4}-\d{2}-\d{2}/)
  if (dateMatch) return dateMatch[0]
  if (!/^\d{10}$|^\d{13}$/.test(rawValue)) return rawValue

  const timestamp = rawValue.length === 10 ? Number(rawValue) * 1000 : Number(rawValue)
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return rawValue

  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const getPayloadObject = (data: any): Record<string, any> => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return data
}

const getPayloadList = (data: any): any[] => {
  if (Array.isArray(data)) return data
  const payload = getPayloadObject(data)
  const list =
    payload.records ||
    payload.list ||
    payload.rows ||
    payload.projects ||
    payload.projectList ||
    payload.meetings ||
    payload.meetingList ||
    payload.xmList
  return Array.isArray(list) ? list : []
}

const pickBoolean = (source: Record<string, any>, keys: string[], defaultValue = false) => {
  const key = keys.find((item) => !isEmptyValue(source[item]))
  if (!key) return defaultValue

  const value = source[key]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return ['TRUE', '1', 'Y', 'YES', '是', '有权限'].includes(value.toUpperCase())

  return defaultValue
}

const getPayloadTotal = (data: any, defaultValue: number) => {
  const payload = getPayloadObject(data)
  return pickNumber(payload, ['total', 'count', 'totalCount', 'recordCount'], defaultValue)
}

const statusKeywordMap: { status: MeetingStatus; keywords: string[] }[] = [
  { status: 'cancelled', keywords: ['出库', '取消', '撤销', '关闭', '退回', '废弃', '终止', 'reject', 'cancel', 'close'] },
  { status: 'completed', keywords: ['在库', '入库', '立项', '已完成', '完成', '通过', '已结束', '结束', 'done', 'finish', 'pass'] },
  { status: 'reviewing', keywords: ['流转', '编制', '审核', '评审', '进行', '处理中', 'review', 'processing'] },
  { status: 'pending', keywords: ['待提交', '待开始', '待出库', '待审', '未开始', '未发布', '未提交', '草稿', '暂存', 'draft', 'pending', 'wait'] }
]

const matchStatusByKeyword = (value: string): MeetingStatus => {
  for (const { status, keywords } of statusKeywordMap) {
    if (keywords.some((keyword) => value.includes(keyword))) return status
  }
  return 'unknown'
}

const normalizeStatus = (source: Record<string, any>, statusNameMap?: Record<string, string>): MeetingStatus => {
  const value = pickString(source, ['status', 'zt', 'flowStatus', 'projectStatus', 'state', 'statusCode', 'ztName', 'statusName']).toLowerCase()

  if (['pending', 'reviewing', 'completed', 'cancelled'].includes(value)) return value as MeetingStatus
  if (['0', '00', '待提交', '待开始', '待出库', '未开始', '未发布'].includes(value)) return 'pending'
  if (['1', '01', '流转中', '评审中', '计划预算编制中', '审核中', '进行中'].includes(value)) return 'reviewing'
  if (['2', '02', '在库', '已结束', '已立项', '已完成', '完成', '通过'].includes(value)) return 'completed'
  if (['3', '4', '已出库', '已取消', '已撤销', '关闭', '已关闭', '退回'].includes(value)) return 'cancelled'

  if (!value) return 'unknown'

  const matched = matchStatusByKeyword(value)
  if (matched !== 'unknown') return matched

  if (statusNameMap) {
    const rawStatus = pickString(source, ['status', 'zt', 'flowStatus', 'projectStatus', 'state', 'statusCode'])
    const resolvedName = (statusNameMap[rawStatus] || '').toLowerCase()
    if (resolvedName) {
      const nameMatched = matchStatusByKeyword(resolvedName)
      if (nameMatched !== 'unknown') return nameMatched
    }
  }

  return 'unknown'
}

const normalizeLevel = (source: Record<string, any>): 'city' | 'province' => {
  const value = pickString(source, ['level', 'xmLevel', 'sourceLevel', 'tclx', 'levelName', 'typeName', '统筹类型', 'ysly'])
  const lower = value.toLowerCase()
  if (value.includes('省') || lower === 'province' || lower === '1') return 'province'
  if (value.includes('市') || lower === 'city' || lower === '2') return 'city'
  return 'city'
}

const normalizeProjectCode = (source: Record<string, any>, moduleId: ModuleId, defaultValue: string) => {
  if (moduleId === 'create' || moduleId === 'opinion') return pickString(source, ['gwxmbm'])
  return pickString(source, ['projectCode', 'xmbm', 'proCode', 'projectNo', 'code'], defaultValue)
}

const normalizeMeetings = (data: any, moduleId: ModuleId, statusNameMap?: Record<string, string>): Meeting[] => {
  return getPayloadList(data).map((item, index) => {
    const source = getPayloadObject(item)
    const id = pickString(source, ['id', 'xmId', 'proId', 'projectId', 'meetingId', 'hyId', 'xmbm'], `${moduleId}-${index + 1}`)
    const name = pickString(source, ['name', 'xmmc', 'projectName', 'proName', 'meetingName', 'hymc', 'title'], '未命名项目')
    const rawStatus = pickString(source, ['status', 'zt', 'flowStatus', 'projectStatus', 'state', 'statusCode'])
    const reviewStartDate = formatTimestamp(pickString(source, ['startTime', 'reviewStartDate', 'startDate', 'kssj', 'createTime', 'beginTime']))
    const reviewEndDate = formatTimestamp(pickString(source, ['endTime', 'reviewEndDate', 'endDate', 'jssj', 'updateTime', 'finishTime']))
    const projectCount = toNumber(source.projectCount, 0)
    const passedCount = pickNumber(source, ['passedCount', 'passCount', 'approvedCount', 'tgCount'])
    const returnedCount = pickNumber(source, ['returnedCount', 'returnCount', 'rejectCount', 'thCount'])
    const pendingCount = pickNumber(source, ['pendingCount', 'waitCount', 'todoCount'], Math.max(0, projectCount - passedCount - returnedCount))

    return {
      id,
      name,
      status: normalizeStatus(source, statusNameMap),
      statusName: statusNameMap?.[rawStatus] || '',
      meetingCode: pickString(source, ['meetingCode', 'hybh', 'meetingNo', 'code'], id),
      projectCode: normalizeProjectCode(source, moduleId, ''),
      declaredBudget: pickNumber(source, ['amount']),
      primaryUnit: pickString(source, ['primaryUnit', 'yjdwName', 'yjdw', 'dwName']),
      secondaryUnit: pickString(source, ['secondaryUnit', 'ejdwName', 'ejdw']),
      cityManagementDepartment: pickString(source, ['ctbmName', 'cityManagementDepartment', 'zgkbm', 'ctbm', 'gkbmName']),
      createDepartment: pickString(source, ['createDeptName', 'createDepartment', 'createDep', 'cjbmmc', 'bmName']),
      reviewStartDate,
      reviewEndDate,
      expertCount: toNumber(source.expertCount),
      projectCount,
      passedCount,
      returnedCount,
      pendingCount,
      level: normalizeLevel(source)
    }
  })
}

const normalizeModuleMenus = (data: any, moduleId: ModuleId): any[] => {
  const module = getWorkbenchModule(moduleId)
  const appMenus = getPayloadObject(data)[module.config.appNo] || {}
  const menus = [...(Array.isArray(appMenus['1']) ? appMenus['1'] : []), ...(Array.isArray(appMenus['2']) ? appMenus['2'] : [])]

  return menus
    .map((item, index) => {
      const source = getPayloadObject(item)
      const id = pickString(source, ['id', 'menuId', 'buttonId', 'outsideMenu', 'code', 'permissionCode'], `${moduleId}-menu-${index + 1}`)
      const label = pickString(source, ['label', 'name', 'menuName', 'buttonName', 'title'], '未命名按钮')

      return {
        id,
        label,
        appNo: module.config.appNo,
        outsideMenu: pickString(source, ['outsideMenu', 'menuCode', 'menuId', 'code']),
        routePath: pickString(source, ['routePath', 'path']),
        routeName: pickString(source, ['routeName', 'url']),
        params: { formJsc: '1' },
        query: getPayloadObject(source.query || source.params),
        target: pickString(source, ['target', 'openType']) === '_blank' ? '_blank' : '_self',
        permissionCode: pickString(source, ['permissionCode', 'code', 'authCode']),
        disabled: pickBoolean(source, ['disabled'], false),
        sort: pickNumber(source, ['sort', 'order', 'dispOrder'], index)
      }
    })
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
}

const normalizeStatistics = (data: ProjectStatisticsResult): Statistics => {
  return {
    totalCount: toNumber(data.totalCount),
    requirementEntryRate: toNumber(data.requirementEntryRate),
    notInRequirementEntryRate: toNumber(data.notInRequirementEntryRate),
    requirementCount: toNumber(data.requirementCount),
    jointReviewCount: toNumber(data.jointReviewCount),
    reserveCount: toNumber(data.reserveCount),
    budgetingCount: toNumber(data.budgetingCount),
    approvedCount: toNumber(data.approvedCount),
    closedCount: toNumber(data.closedCount),
    jointReviewPassRate: toNumber(data.jointReviewPassRate),
    totalCount2: toNumber(data.totalCount2),
    reviewingCount: toNumber(data.reviewingCount),
    reviewPassedCount: toNumber(data.reviewPassedCount),
    reviewRejectedCount: toNumber(data.reviewRejectedCount),
    reviewOpinionPendingCount: toNumber(data.reviewOpinionPendingCount),
    pendingFeasibilityUploadCount: toNumber(data.pendingFeasibilityUploadCount),
    complianceReviewingCount: toNumber(data.complianceReviewingCount),
    approvalRate: toNumber(data.approvalRate),
    totalCount3: toNumber(data.totalCount3),
    pendingOutboundCount: toNumber(data.pendingOutboundCount),
    pendingOutboundConfirmCount: toNumber(data.pendingOutboundConfirmCount),
    pendingBudgetingCount: toNumber(data.pendingBudgetingCount),
    budgetingReviewingCount: toNumber(data.budgetingReviewingCount),
    pendingApprovalCount: toNumber(data.pendingApprovalCount),
    approvedCount3: toNumber(data.approvedCount3)
  }
}

const normalizeYearList = (data: any[]): YearOption[] => {
  return (data || [])
    .map((item) => ({
      code: pickString(item, ['yearCode', 'code', 'value', 'nd']),
      name: pickString(item, ['yearName', 'name', 'label', 'nd'])
    }))
    .filter((item) => item.code)
}

const normalizeCommonCodeOptions = (data: any): CommonCodeOption[] => {
  return getPayloadList(data)
    .map((item) => {
      const source = getPayloadObject(item)
      const code = pickString(source, ['code', 'value', 'dictValue', 'id'])
      return {
        code,
        name: pickString(source, ['name', 'label', 'dictLabel', 'text'], code)
      }
    })
    .filter((item) => item.code)
}

export const useBusinessWorkbench = () => {
  const router = useRouter()
  const store = useStore()
  const isShowPage = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
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
  const currentLevel = ref<LevelFilter>('all')
  const currentStatus = ref<StatusFilter>('all')
  const searchQuery = ref('')
  const currentModuleId = ref<ModuleId>(defaultModuleId)
  const currentMeetingId = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)
  const currentYear = ref(getCurrentYear())
  const yearOptions = ref<YearOption[]>([])
  const workbenchLoading = ref(false)
  const moduleAccessLoading = ref(false)
  const moduleAccessInitialized = ref(false)
  const listAnimationKey = ref(0)
  const statisticsAnimationKey = ref(0)
  const listAnimationReady = ref(false)
  const statisticsAnimationReady = ref(false)
  const activeMeetings = ref<Meeting[]>([])
  const activeStatistics = ref<Statistics | null>(null)
  const activeListTotal = ref<number | null>(null)
  const moduleMenuMap = ref<Partial<Record<ModuleId, MenuConfig[]>>>({})
  const moduleStatusOptionsMap = ref<Partial<Record<ModuleId, FilterOption<StatusFilter>[]>>>({})
  const moduleLevelOptionsMap = ref<Partial<Record<ModuleId, FilterOption<LevelFilter>[]>>>({})
  const moduleStatusCodeMap = ref<Partial<Record<ModuleId, Record<string, string[]>>>>({})
  const moduleStatusNameMap = ref<Partial<Record<ModuleId, Record<string, string>>>>({})
  // 请求序号：快速切换模块/年度时，只有最新一次请求的结果允许回填，避免慢请求覆盖新请求
  let listRequestSeq = 0
  let statisticsRequestSeq = 0

  provide('currentUserRole', currentUserRole)
  provide(PermissionInjectionKey, {
    get permissions() {
      return unref(userRoleSelectorRef.value?.permissions) || []
    },
    get isLoading() {
      return Boolean(unref((userRoleSelectorRef.value as any)?.loading))
    }
  })

  const currentModuleRequestParams = computed<BusinessWorkbenchModuleParams>(() => {
    return buildBusinessWorkbenchModuleParams(currentUserRole.value, currentModuleId.value, currentYear.value)
  })
  const currentModulePermissionLoading = computed(() => !moduleAccessInitialized.value || moduleAccessLoading.value)
  const currentModulePermission = computed(() => (currentModulePermissionLoading.value ? undefined : true))
  const currentModulePermissionText = computed(() => '')
  const getModuleStatusOptions = (moduleId: ModuleId) => {
    const publicCode = projectStatusPublicCodeMap[moduleId]
    if (!publicCode) return getWorkbenchModule(moduleId).listConfig.statusOptions
    return moduleStatusOptionsMap.value[moduleId] || [allStatusOption]
  }
  const getModuleLevelOptions = (moduleId: ModuleId) => {
    const publicCode = projectLevelPublicCodeMap[moduleId]
    if (!publicCode) return getWorkbenchModule(moduleId).listConfig.levelOptions
    return moduleLevelOptionsMap.value[moduleId] || getFallbackLevelOptions(moduleId)
  }
  const currentModule = computed(() => {
    const module = getWorkbenchModule(currentModuleId.value)
    return {
      ...module,
      listConfig: {
        ...module.listConfig,
        statusOptions: getModuleStatusOptions(module.id),
        levelOptions: getModuleLevelOptions(module.id)
      }
    }
  })
  const moduleConfigs = computed(() =>
    workbenchModules.map((module) => {
      const loading = !moduleAccessInitialized.value || moduleAccessLoading.value
      const hasPermission = loading ? undefined : true
      const menus = moduleMenuMap.value[module.id] || []

      return {
        ...module.config,
        hasPermission,
        permissionText: '',
        loading,
        menus: menus.map((menu) => ({
          ...menu,
          disabled: Boolean(menu.disabled)
        }))
      }
    })
  )

  const buildBasePageParams = () => ({
    nd: currentModuleRequestParams.value.nd,
    bmId: currentModuleRequestParams.value.bmId,
    dwId: currentModuleRequestParams.value.dwId,
    limit: String(pageSize.value),
    page: String(currentPage.value),
    roleId: currentModuleRequestParams.value.roleId,
    roleCode: currentModuleRequestParams.value.roleCode,
    userId: store.getters.getUserMsg?.id || '',
    yjdw: currentModuleRequestParams.value.yjdw,
    createDeptId: currentModuleRequestParams.value.bmId,
    createDeptName: currentModuleRequestParams.value.bmName || '',
    ctbm: currentModuleRequestParams.value.bmId,
    ctbmName: currentModuleRequestParams.value.bmName || '',
    // 统筹级别筛选下推后端：空串表示全部，province→1（省级），city→2（市级）
    ysly: currentLevel.value === 'all' ? '' : currentLevel.value === 'province' ? '1' : '2'
  })

  const getMeetingStatusParam = () => {
    if (currentStatus.value === 'pending') return '00'
    if (currentStatus.value === 'reviewing') return '01'
    if (currentStatus.value === 'completed') return '02'
    return ''
  }

  const getProjectStatusParam = () => {
    if (currentStatus.value === 'all') return ''
    return (moduleStatusCodeMap.value[currentModuleId.value]?.[currentStatus.value] || []).join(',')
  }

  const fetchModulePage = () => {
    const baseParams = buildBasePageParams()
    const keyword = searchQuery.value.trim()

    if (currentModuleId.value === 'review') {
      return meetingInfoPage({
        ...baseParams,
        meetingName: keyword,
        status: getMeetingStatusParam()
      })
    }

    // 需求库 / 储备库：使用 xmmc 字段进行模糊搜索（后端需支持）
    const projectParams = {
      ...baseParams,
      xmmc: keyword,
      status: getProjectStatusParam()
    }

    if (currentModuleId.value === 'opinion') return reserveLibraryProjectPage(projectParams)

    return requirementLibraryProjectPage(projectParams)
  }

  const fetchCommonCodeOptions = async (code: string, errorMessage: string) => {
    const res = await getPublicCodeList({ codes: [code] })
    if (!res.success) throw new Error(res.msg || errorMessage)
    return normalizeCommonCodeOptions(res.data?.[code])
  }

  const loadModuleStatusOptions = async (moduleId: ModuleId) => {
    const publicCode = projectStatusPublicCodeMap[moduleId]
    if (!publicCode || moduleStatusOptionsMap.value[moduleId]) return

    try {
      const firstLevelOptions = await fetchCommonCodeOptions(publicCode, '状态公共代码查询失败')
      if (!firstLevelOptions.length) throw new Error(`${publicCode}公共代码为空`)

      const childCodes = firstLevelOptions.map((option) => option.code)
      const secondLevelRes = await getPublicCodeList({ codes: childCodes })
      if (!secondLevelRes.success) throw new Error(secondLevelRes.msg || '二级状态公共代码查询失败')
      const secondLevelMap = secondLevelRes.data || {}
      const secondLevelResults = firstLevelOptions.map((option) => ({
        option,
        children: normalizeCommonCodeOptions(secondLevelMap[option.code])
      }))
      const validResults = secondLevelResults.filter((item) => item.children.length > 0)
      const codeMap = validResults.reduce<Record<string, string[]>>((map, item) => {
        map[item.option.code] = item.children.map((child) => child.code)
        return map
      }, {})
      const nameMap = validResults.reduce<Record<string, string>>((map, item) => {
        item.children.forEach((child) => {
          map[child.code] = item.option.name
        })
        return map
      }, {})

      moduleStatusOptionsMap.value = {
        ...moduleStatusOptionsMap.value,
        [moduleId]: [allStatusOption, ...validResults.map((item) => ({ value: item.option.code, label: item.option.name }))]
      }
      moduleStatusCodeMap.value = {
        ...moduleStatusCodeMap.value,
        [moduleId]: codeMap
      }
      moduleStatusNameMap.value = {
        ...moduleStatusNameMap.value,
        [moduleId]: nameMap
      }
    } catch (error) {
      moduleStatusOptionsMap.value = {
        ...moduleStatusOptionsMap.value,
        [moduleId]: [allStatusOption]
      }
      moduleStatusCodeMap.value = {
        ...moduleStatusCodeMap.value,
        [moduleId]: {}
      }
      moduleStatusNameMap.value = {
        ...moduleStatusNameMap.value,
        [moduleId]: {}
      }
      ElMessage.error((error as Error).message || '状态公共代码查询失败')
    }
  }

  const getFallbackLevelOptions = (moduleId: ModuleId): FilterOption<LevelFilter>[] => {
    const suffix = moduleId === 'review' ? '联合会审' : '统筹'
    return [allLevelOption, { value: 'province' as LevelFilter, label: `省级${suffix}` }, { value: 'city' as LevelFilter, label: `市级${suffix}` }]
  }

  const loadModuleLevelOptions = async (moduleId: ModuleId) => {
    const publicCode = projectLevelPublicCodeMap[moduleId]
    if (!publicCode || moduleLevelOptionsMap.value[moduleId]) return

    try {
      const options = await fetchCommonCodeOptions(publicCode, '级别公共代码查询失败')
      const mapped = options.map((option) => ({ value: option.code as LevelFilter, label: option.name }))
      moduleLevelOptionsMap.value = {
        ...moduleLevelOptionsMap.value,
        [moduleId]: mapped.length ? [allLevelOption, ...mapped] : getFallbackLevelOptions(moduleId)
      }
    } catch (error) {
      moduleLevelOptionsMap.value = {
        ...moduleLevelOptionsMap.value,
        [moduleId]: getFallbackLevelOptions(moduleId)
      }
      ElMessage.error((error as Error).message || '级别公共代码查询失败')
    }
  }

  const initYearOptions = async () => {
    try {
      const res = await getYearData()
      const options = res.success ? normalizeYearList(res.data || []) : []
      yearOptions.value = options
    } catch (e) {
      yearOptions.value = []
    }
  }

  const fetchModuleAccess = async () => {
    if (!currentUserRole.value.dwId || !currentYear.value) return

    moduleAccessLoading.value = true
    moduleAccessInitialized.value = false
    moduleMenuMap.value = {}

    try {
      const menuRes = await getAppMenuData()
      const results = workbenchModules.map((module) => ({
        moduleId: module.id,
        menus: menuRes.success ? normalizeModuleMenus(menuRes.data, module.id) : []
      }))

      if (!menuRes.success) ElMessage.error(menuRes.msg || '工作台按钮查询失败')

      moduleMenuMap.value = results.reduce<Partial<Record<ModuleId, MenuConfig[]>>>((map, item) => {
        map[item.moduleId] = item.menus
        return map
      }, {})
    } finally {
      moduleAccessInitialized.value = true
      moduleAccessLoading.value = false
    }
  }

  const fetchProjectStatistics = async () => {
    if (!currentUserRole.value.dwId || !currentYear.value) return
    if (currentModulePermissionLoading.value) return
    if (currentModulePermission.value !== true) {
      statisticsAnimationReady.value = false
      activeStatistics.value = emptyStatistics
      return
    }

    statisticsAnimationReady.value = false
    const requestSeq = ++statisticsRequestSeq
    try {
      const statisticsRes = await getBusinessWorkbenchProjectStatistics({
        yjdw: currentModuleRequestParams.value.yjdw,
        step: currentModuleRequestParams.value.step,
        nd: currentModuleRequestParams.value.nd
      })

      // 已有更新的请求发出，丢弃本次过期结果
      if (requestSeq !== statisticsRequestSeq) return

      if (!statisticsRes?.success) {
        activeStatistics.value = emptyStatistics
        ElMessage.error(statisticsRes?.msg || '项目统计查询失败')
        return
      }

      activeStatistics.value = normalizeStatistics(statisticsRes.data)
    } catch (e: any) {
      if (requestSeq !== statisticsRequestSeq) return
      activeStatistics.value = emptyStatistics
      ElMessage.error(e?.message || '项目统计查询失败')
    } finally {
      if (requestSeq === statisticsRequestSeq) {
        statisticsAnimationKey.value += 1
        statisticsAnimationReady.value = true
      }
    }
  }

  const refreshProjectStatistics = async () => {
    statisticsAnimationReady.value = false
    await fetchProjectStatistics()
  }

  const fetchProjectList = async () => {
    if (!currentUserRole.value.dwId || !currentYear.value) return
    if (currentModulePermissionLoading.value) return
    if (currentModulePermission.value !== true) {
      listAnimationReady.value = false
      activeMeetings.value = []
      activeListTotal.value = 0
      return
    }

    const moduleId = currentModuleId.value
    await Promise.all([loadModuleStatusOptions(moduleId), loadModuleLevelOptions(moduleId)])
    if (moduleId !== currentModuleId.value) return

    const requestSeq = ++listRequestSeq
    listAnimationReady.value = false
    workbenchLoading.value = true
    try {
      const listRes = await fetchModulePage()
      // 已有更新的请求发出，丢弃本次结果，避免慢请求覆盖新请求
      if (requestSeq !== listRequestSeq) return

      if (listRes?.success) {
        const meetings = normalizeMeetings(listRes.data, currentModuleId.value, moduleStatusNameMap.value[currentModuleId.value])
        activeMeetings.value = meetings
        activeListTotal.value = getPayloadTotal(listRes.data, meetings.length)
        return
      }

      activeMeetings.value = []
      activeListTotal.value = 0
      ElMessage.error(listRes?.msg || '工作台列表查询失败')
    } catch (e: any) {
      if (requestSeq !== listRequestSeq) return
      activeMeetings.value = []
      activeListTotal.value = 0
      ElMessage.error(e?.message || '工作台列表查询失败')
    } finally {
      if (requestSeq === listRequestSeq) {
        workbenchLoading.value = false
        listAnimationKey.value += 1
        listAnimationReady.value = true
      }
    }
  }

  const refreshProjectList = async () => {
    listAnimationReady.value = false
    activeMeetings.value = []
    activeListTotal.value = null
    await fetchProjectList()
  }

  const refreshWorkbenchData = async () => {
    activeStatistics.value = null
    const moduleId = currentModuleId.value
    await Promise.all([loadModuleStatusOptions(moduleId), loadModuleLevelOptions(moduleId)])
    if (moduleId !== currentModuleId.value) return
    await Promise.all([refreshProjectStatistics(), refreshProjectList()])
  }

  const resetFilters = () => {
    currentLevel.value = 'all'
    currentStatus.value = 'all'
    searchQuery.value = ''
    currentMeetingId.value = ''
  }

  const setLevelFilter = async (level: LevelFilter) => {
    currentLevel.value = level
    currentPage.value = 1
    await refreshProjectList()
  }

  const setStatusFilter = async (status: StatusFilter) => {
    currentStatus.value = status
    currentPage.value = 1
    await refreshProjectList()
  }

  const handleSearch = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    await refreshProjectList()
  }

  const selectModule = async (moduleId: ModuleId) => {
    if (moduleId === currentModuleId.value) return

    currentModuleId.value = moduleId
    currentPage.value = 1
    resetFilters()
    await refreshWorkbenchData()
  }

  const handleYearChange = async (year: string) => {
    if (year === currentYear.value) return
    currentYear.value = year
    currentPage.value = 1
    currentMeetingId.value = ''
    await refreshWorkbenchData()
  }

  const selectMeeting = (meetingId: string) => {
    currentMeetingId.value = meetingId
  }

  const handleMenuClick = async (menu: MenuConfig) => {
    if (menu.disabled) return
    if (menu.outsideMenu && currentUserRole.value.spRoleId) {
      try {
        const permissionRes = await getButtonList(menu.outsideMenu, currentUserRole.value.spRoleId)
        if (permissionRes.success) {
          store.commit('setPermissions', permissionRes.data)
        }
      } catch (e) {
        // 权限拉取失败不阻断跳转，仅提示
        ElMessage.warning('按钮权限获取失败，功能可能受限')
      }
    }

    const route = menu.routeName
      ? { name: menu.routeName, params: menu.params, query: menu.query }
      : menu.routePath
      ? { path: menu.routePath, query: menu.query }
      : null
    if (!route) {
      ElMessage.warning('后端未配置跳转地址')
      return
    }

    if (menu.target === '_blank') {
      const routeUrl = router.resolve(route)
      window.open(routeUrl.href, '_blank')
      return
    }

    router.push(route)
  }

  const openRequirementProject = (meeting: Meeting) => {
    if (meeting.status === 'pending') {
      router.push({ path: '/service/xq/CentralizedModification' })
      return
    }

    router.push({
      path: '/service/xq/RequireDetailSearch',
      query: {
        nd: currentYear.value,
        xmbm: meeting.projectCode,
        specialorgid: JSON.stringify(currentUserRole.value.bmId || ''),
        roleCode: currentUserRole.value.roleCode || '',
        roleId: currentUserRole.value.roleId || '',
        spRoleId: currentUserRole.value.spRoleId || ''
      }
    })
  }

  const getRoleHandle = async () => {
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) return

    await nextTick()
    await initYearOptions()
    await fetchModuleAccess()
    await refreshWorkbenchData()
  }

  // 筛选与分页均由后端完成，前端直接展示返回结果，避免总数与可见行错位
  const filteredMeetings = computed(() => activeMeetings.value)
  const meetingTotal = computed(() => activeListTotal.value ?? activeMeetings.value.length)
  const pagedMeetings = computed(() => activeMeetings.value)

  const handlePageChange = async (page: number) => {
    currentPage.value = page
    await fetchProjectList()
  }

  const handlePageSizeChange = async (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    await fetchProjectList()
  }

  const statistics = computed(() => {
    return activeStatistics.value || emptyStatistics
  })

  return {
    isShowPage,
    userRoleSelectorRef,
    currentLevel,
    currentStatus,
    searchQuery,
    currentModuleId,
    currentYear,
    yearOptions,
    currentModule,
    currentModuleRequestParams,
    moduleConfigs,
    filteredMeetings,
    pagedMeetings,
    meetingTotal,
    currentModulePermission,
    currentModulePermissionText,
    statistics,
    currentMeetingId,
    currentPage,
    pageSize,
    workbenchLoading,
    moduleAccessLoading,
    currentModulePermissionLoading,
    listAnimationKey,
    statisticsAnimationKey,
    listAnimationReady,
    statisticsAnimationReady,
    setLevelFilter,
    setStatusFilter,
    handleSearch,
    handleYearChange,
    selectModule,
    selectMeeting,
    handleMenuClick,
    openRequirementProject,
    getRoleHandle,
    handlePageChange,
    handlePageSizeChange
  }
}
