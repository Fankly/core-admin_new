import { computed, ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  pageExpertReviewInfo,
  leaderReviewPageXmInfo,
  pageXmHistoryReviewRecord,
  canLeaderReviewThForSjtc,
  leaderReviewThForSjtc,
  getReviewStage,
  leaderReviewExportXmInfo,
  exportXmAttach
} from '@/api/service/jointReview'
import { getYjdwData } from '@/api/service/expertinformation'
import { automatedFinalAssessment } from '@/api/service/IhhsMeeting/offlineReview'
import { saveOrUpdateTXmThxxb } from '@/api/workflow/xm'
import { getButtonList, getDwAndBmInfo, getPublicData } from '@/api/common'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'
import { apiExportHandle, apiExporFile } from '@/utils/export'
import { updateFinancialDevelopmentReviewResult } from '@/api/service/IhhsMeeting/xmOpinionSummary'

const REVIEW_OPINION_PASS = '1'
const REVIEW_OPINION_REJECT = '0'
const REVIEW_OPINION_RETURN = '2'
const LOCKED_OFFLINE_OPINIONS = [REVIEW_OPINION_REJECT, REVIEW_OPINION_RETURN]
const PROVINCE_ORG_FLAG = 'PROVINCE'
const PROVINCE_PROFESSIONAL_DEPT_CODE = 'BM_FZCH'
const DEVELOPMENT_ROLE_CODE = 'SZYGK'
const FINANCE_BUDGET_ROLE_CODE = 'SCWYSZZ'
const OFFLINE_PASS_REASON_CODE = 'LHHS_XXHS_PASS_REASON_COM'
const OFFLINE_PASS_REASON_ITEM_CODE = {
  development: 'DEVELOPMENT',
  finance: 'FINANCE'
}

export const offlineReview = () => {
  const isShowPage = ref(false)
  const loading = ref(false)
  const route = useRoute()
  const store = useStore()
  const userInfo = ref<any>() // 用户角色
  const activeTab = ref('0') // 标签页
  const projects = ref<any[]>([]) // 项目列表数据
  const selectData = ref<any>({}) //弹窗参数
  const selectedProject = ref<any>(null) // 选中的项目
  const editPageRef = ref() //弹窗元素
  const histortRef = ref() //历史记录
  const xmHistortList = ref<any[]>([]) //项目历史记录
  const expertReviews = ref<any>([]) //专家评审意见数据
  const levelOne = ref<any>([]) // 一级单位
  const returnModal = ref()
  const xmInfoList = ref<any[]>([]) //选中的项目
  const thMsg = ref('')
  const isAllCheck = ref(false)
  const isIndeterminate = ref(false)
  const hsOpinton = ref<any[]>([])
  const reviewStage = ref<string>('') //会审阶段
  const showXxLhhsYj = ref<boolean>(false)
  const xxOpinton = ref<any[]>([])
  const savingOfflineOpinion = ref(false)
  const dwAndBmInfo = ref<any>({})
  const originalOfflineOpinion = reactive({
    development: '',
    finance: ''
  })
  // 会审意见
  const myReview = reactive({
    opinion: '',
    reason: ''
  })

  // 筛选标签
  const filterTabs = ref<any[]>([
    { label: '待会审项目', value: '0' },
    { label: '已会审项目', value: '1' }
  ])
  const projectPage = reactive({
    page: 1,
    limit: 100,
    total: 0
  })

  const searchTj = ref<any>({})
  const searchParam = ref<string>('')

  const zzfileRef = ref() //佐证材料

  const isReviewingMeeting = computed(() => userInfo.value?.status === '01')

  const isInMeetingDateRange = computed(() => {
    const startDate = getDateText(userInfo.value?.startTime)
    const endDate = getDateText(userInfo.value?.endTime)
    if (!startDate || !endDate) return false

    const today = getDateText(new Date())
    return startDate <= today && today <= endDate
  })

  const isDevelopmentUser = computed(() => {
    const orgInfo = dwAndBmInfo.value || {}
    return orgInfo.orgFlag === PROVINCE_ORG_FLAG && orgInfo.bmxz === PROVINCE_PROFESSIONAL_DEPT_CODE && orgInfo.roleCode === DEVELOPMENT_ROLE_CODE
  })

  const isFinanceBudgetUser = computed(() => {
    const orgInfo = dwAndBmInfo.value || {}
    return orgInfo.orgFlag === PROVINCE_ORG_FLAG && orgInfo.roleCode === FINANCE_BUDGET_ROLE_CODE
  })

  const canSaveOfflineOpinion = computed(() => {
    return isReviewingMeeting.value && isInMeetingDateRange.value && (isDevelopmentUser.value || isFinanceBudgetUser.value)
  })

  const canEditDevelopmentOpinion = computed(() => canSaveOfflineOpinion.value && (isDevelopmentUser.value || isFinanceBudgetUser.value))
  const canEditFinanceOpinion = computed(() => canSaveOfflineOpinion.value && isFinanceBudgetUser.value)

  function getDateText(value: any) {
    if (!value) return ''
    if (value instanceof Date) {
      const year = value.getFullYear()
      const month = `${value.getMonth() + 1}`.padStart(2, '0')
      const day = `${value.getDate()}`.padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return String(value).slice(0, 10)
  }

  const normalizeOpinionCode = (value: any) => {
    return value === null || value === undefined ? '' : String(value)
  }

  const isLockedOfflineOpinion = (opinion: any) => {
    return LOCKED_OFFLINE_OPINIONS.includes(String(opinion ?? ''))
  }

  const isDevelopmentOpinionDisabled = computed(() => {
    return !canEditDevelopmentOpinion.value || isLockedOfflineOpinion(originalOfflineOpinion.development)
  })

  const isFinanceOpinionDisabled = computed(() => {
    return !canEditFinanceOpinion.value || isLockedOfflineOpinion(originalOfflineOpinion.finance)
  })

  const isDevelopmentReasonDisabled = computed(() => {
    return isDevelopmentOpinionDisabled.value || selectedProject.value?.xxhsJlFz === REVIEW_OPINION_PASS
  })

  const isFinanceReasonDisabled = computed(() => {
    return isFinanceOpinionDisabled.value || selectedProject.value?.xxhsJlCw === REVIEW_OPINION_PASS
  })

  const hasEditableOfflineOpinion = computed(() => {
    return !isDevelopmentOpinionDisabled.value || !isFinanceOpinionDisabled.value
  })

  const fillPassOpinionReason = async (target: 'development' | 'finance') => {
    if (!selectedProject.value) return
    const res: any = await getPublicData(OFFLINE_PASS_REASON_CODE)
    if (res.success) {
      const reason = Array.isArray(res.data) ? res.data.find((item: any) => item.code === OFFLINE_PASS_REASON_ITEM_CODE[target])?.note || '' : ''
      if (target === 'development') {
        selectedProject.value.fzbReason = reason
      } else {
        selectedProject.value.cwbReason = reason
      }
    } else {
      ElMessage.error(res.msg)
    }
  }

  const handleOpinionChange = async (target: 'development' | 'finance', opinion: string) => {
    if (!selectedProject.value) return
    if (target === 'development') {
      selectedProject.value.xxhsJlFz = opinion
      if (opinion === REVIEW_OPINION_PASS) {
        await fillPassOpinionReason('development')
      } else if (!isLockedOfflineOpinion(opinion)) {
        selectedProject.value.fzbReason = ''
      }
      return
    }

    selectedProject.value.xxhsJlCw = opinion
    if (opinion === REVIEW_OPINION_PASS) {
      await fillPassOpinionReason('finance')
    } else if (!isLockedOfflineOpinion(opinion)) {
      selectedProject.value.cwbReason = ''
    }
  }

  const saveOfflineOpinion = async () => {
    if (!selectedProject.value) {
      ElMessage.warning('请选择一条数据')
      return
    }
    if (!canSaveOfflineOpinion.value) {
      ElMessage.warning('当前不在可编辑范围内')
      return
    }
    const params = {
      bmId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      spRoleId: userInfo.value.spRoleId,
      xmbm: selectedProject.value.xmbm,
      meetingId: userInfo.value.meetingId,
      xxhsJlFz: selectedProject.value.xxhsJlFz,
      fzbReason: selectedProject.value.fzbReason,
      xxhsJlCw: selectedProject.value.xxhsJlCw,
      cwbReason: selectedProject.value.cwbReason
    }

    const hasReject = [params.xxhsJlFz, params.xxhsJlCw].some((item) => String(item) === REVIEW_OPINION_REJECT)
    const confirmSave = async () => {
      savingOfflineOpinion.value = true
      try {
        const res: any = await updateFinancialDevelopmentReviewResult(params)
        if (res.success) {
          ElMessage.success('保存成功')
          await getPageList()
        } else {
          ElMessage.error(res.msg)
        }
      } finally {
        savingOfflineOpinion.value = false
      }
    }

    if (hasReject) {
      ElMessageBox.confirm('评审不通过的项目将退回需求单位，是否保存？', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      })
        .then(confirmSave)
        .catch((error: any) => {
          if (error !== 'cancel') console.log(error)
        })
      return
    }

    await confirmSave()
  }

  // 获取评审次数标签类型
  const getReviewTagType = (count: number) => {
    if (count === 1) return 'primary'
    if (count === 2 || count === 3) return 'warning'
    return 'danger'
  }

  // 选择项目
  const selectProject = async (project: any) => {
    selectedProject.value = project
    showXxLhhsYj.value = true
    clickRow()
    await getExpertReview()
    zzfileRef.value.getXmFileList(selectedProject.value.xmId, selectedProject.value.pro_type_id, selectedProject.value.xmmc, selectedProject.value.yssxId)
    await getMeetingStage()
    selectedProject.value.fzbReason = selectedProject.value.fzbReason ?? ''
    selectedProject.value.cwbReason = selectedProject.value.cwbReason ?? ''
    originalOfflineOpinion.development = normalizeOpinionCode(selectedProject.value.xxhsJlFz)
    originalOfflineOpinion.finance = normalizeOpinionCode(selectedProject.value.xxhsJlCw)
    myReview.opinion = selectedProject.value.review_opinion_code
    myReview.reason = selectedProject.value.review_reason
  }
  // 查看项目信息
  const showProjectInfo = async () => {
    if (selectedProject.value == null) {
      ElMessage.warning('请选择一条数据')
      return
    }
    selectData.value.id = selectedProject.value.xmId
    selectData.value.xmlx = selectedProject.value.pro_type_id
    editPageRef.value.isShowModal = true
  }

  //历史记录
  const showHistory = async () => {
    if (selectedProject.value == null) {
      ElMessage.warning('请选择一条数据')
      return
    }
    const res: any = await pageXmHistoryReviewRecord({
      originXmId: selectedProject.value.originXmId,
      meetingId: userInfo.value.meetingId,
      isPack: selectedProject.value.isPack
    })
    if (res.success) {
      xmHistortList.value = res.data.records
      if (xmHistortList.value.length != 0) {
        histortRef.value.isShowModal = true
        histortRef.value.chooseDataPrj = selectedProject.value
      } else {
        ElMessage.warning('暂无历史记录')
      }
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 翻页
  const pageChangeHandle = (currentPageNum: number) => {
    projectPage.page = currentPageNum
    getPageList()
  }
  // 切换条数
  const limitChangeHandle = (currentLimitNum: number) => {
    projectPage.page = 1
    projectPage.limit = currentLimitNum
    getPageList()
  }

  // 获取评审意见
  const getExpertReview = async () => {
    const params: any = {
      xmId: selectedProject.value.xmId,
      limit: 100,
      page: 1,
      meetingId: userInfo.value.meetingId,
      isPack: selectedProject.value.isPack
    }
    const res: any = await pageExpertReviewInfo(params)
    if (res.success) {
      expertReviews.value = res.data.records.filter((item: any) => item.reviewOpinion)
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 获取左侧项目信息
  const getPageList = async () => {
    loading.value = true
    const params: any = {
      leaderReviewStatus: activeTab.value,
      meetingId: userInfo.value.meetingId,
      page: projectPage.page,
      limit: projectPage.limit,
      searchParam: searchParam.value,
      ...searchTj.value
    }
    const res: any = await leaderReviewPageXmInfo(params)
    if (res.success) {
      projects.value = res.data.records
      projectPage.total = res.data.total
      if (activeTab.value == '0') {
        filterTabs.value[0].label = `待会审项目（${res.data.total}）`
      } else {
        filterTabs.value[1].label = `已会审项目（${res.data.total}）`
      }
      // 默认选中第一个项目
      if (projects.value.length > 0) {
        projects.value.forEach((item: any) => {
          item.isCheck = false
          item.note = yjdwJc(item.yjdw)
        })
        selectProject(projects.value[0])
      } else {
        clearReview()
      }
      loading.value = false
      await xmNumber()
    } else {
      ElMessage.error(res.msg)
    }
  }

  const getReviewOpinion = async () => {
    const stage = selectedProject.value.review_stage ?? reviewStage.value
    const fscs = selectedProject.value.fscs
    let code
    if (stage == '1') {
      code = 'LHHS_XSYSJD_REVIEW_OPINION_COM'
    } else if (stage == '2') {
      code = fscs > 0 ? 'LHHS_XXHSJD_FS_REVIEW_OPINION_COM' : 'LHHS_XXHSJD_REVIEW_OPINION_COM'
    } else {
      code = 'LHHS_REVIEW_OPINION_COM'
    }
    const res: any = await getPublicData(code)
    if (res.success) {
      hsOpinton.value = res.data
    } else {
      ElMessage.error(res.msg)
    }

    const item: any = await getPublicData('LHHS_XXHS_JL_COM')
    if (item.success) {
      xxOpinton.value = item.data
    } else {
      ElMessage.error(item.msg)
    }
  }

  // 获取会审阶段
  const getMeetingStage = async () => {
    const res = await getReviewStage({ meetingId: userInfo.value.meetingId })
    if (res.success) {
      reviewStage.value = res.data.code
      await getReviewOpinion()
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 获取一级单位简称
  const yjdwJc = (val: any) => {
    const yjdwNote: any[] = levelOne.value.filter((item: any) => item.name == val)
    const note = yjdwNote.length > 0 ? yjdwNote[0].note : val
    return note
  }

  // 获取待会审项目和已会审项目数量
  const xmNumber = async () => {
    try {
      const params: any = {
        meetingId: userInfo.value.meetingId,
        page: projectPage.page,
        limit: projectPage.limit,
        searchParam: searchParam.value,
        ...searchTj.value
      }
      // 已会审项目数量
      const item: any = await leaderReviewPageXmInfo({ ...params, leaderReviewStatus: activeTab.value == '0' ? '1' : '0' })
      if (item.success) {
        if (activeTab.value == '0') {
          filterTabs.value[1].label = `已会审项目（${item.data.total}）`
        } else {
          filterTabs.value[0].label = `待会审项目（${item.data.total}）`
        }
      } else {
        ElMessage.error(item.msg)
      }
    } catch (error) {}
  }

  // 清空数据
  const clearReview = () => {
    selectedProject.value = {}
    expertReviews.value.length = 0
  }

  // 处理标签页切换
  const handleTabChange = async (tab: string) => {
    await getPageList()
  }

  // 获取参数和公共代码
  const initParamLists = async () => {
    try {
      isShowPage.value = false
      userInfo.value = JSON.parse(decrypt(route.query.meetingParams as string))
      userInfo.value.expertName = decodeURIComponent(userInfo.value.expertName as string)
      const orgInfo = await getDwAndBmInfo(userInfo.value.dwId, userInfo.value.deptId, userInfo.value.roleId)
      if (orgInfo.success) {
        dwAndBmInfo.value = orgInfo.data
      }
      // 按钮权限
      const btn = await getButtonList('XQC-LHHSSJTCZJPS', userInfo.value.spRoleId)
      if (btn.success) {
        isShowPage.value = true
        store.commit('setPermissions', btn.data)
        await getYjdwList()
        await getPageList()
      } else {
        ElMessage.error(btn.msg)
      }
    } catch (error) {
      const e = error as Error
      ElMessage.error(e.message)
    }
  }

  // 获取一级单位
  const getYjdwList = async () => {
    const res = await getYjdwData()
    if (res.success && res.data.length != 0) {
      levelOne.value = res.data
    }
  }

  // 自动终评
  const autoReview = () => {
    if (!isReviewingMeeting.value) return ElMessage.warning('会议状态不为【评审中】，不可操作')
    // if (activeTab.value == '1' && selectedProject.value.review_stage == '2') return ElMessage.warning('已评审项目，请勿重复点击')
    const text = '自动终评会将存在预审退回专家评审意见以及未完成所有专家评审的项目退回，是否确认？'
    ElMessageBox.confirm(`${text}`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const isCheckList = projects.value.filter((item: any) => item.isCheck)
        if (isCheckList.length != 0) {
          xmInfoList.value = isCheckList.map(({ xmId, xmbm, xmmc, originXmId, amount }: any) => ({
            xmId,
            xmbm,
            xmmc,
            originXmId,
            amount
          }))
        } else {
          xmInfoList.value.length = 0
        }
        const xmIdList = xmInfoList.value.map((item: any) => item.xmId)
        const params: any = {
          meetingId: userInfo.value.meetingId,
          xmInfoList: xmIdList,
          reviewXmidList: xmIdList
        }
        const res: any = await automatedFinalAssessment(params)
        const thList: any[] = xmInfoList.value.map((element: any) => ({
          id: element.originXmId,
          thyj: '项目退回',
          thsbys: element.amount
        }))
        await saveOrUpdateTXmThxxb({ list: thList })
        if (res.success) {
          await getPageList()
          ElMessage.success('已自动终评')
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        if (error == 'cancel') {
          ElMessage.info('已取消')
        } else {
          console.log(error)
        }
      })
  }
  // 退回
  const thBtn = async () => {
    if (!isReviewingMeeting.value) return ElMessage.warning('会议状态不为【评审中】，不可操作')
    if (activeTab.value == '1' && selectedProject.value.review_stage == '2') return ElMessage.warning('已评审项目，请勿重复点击')
    // 获取选中的数据
    const isCheckList = projects.value.filter((item: any) => item.isCheck)
    if (isCheckList.length == 0) return ElMessage.warning('请至少选择一条数据')
    xmInfoList.value = isCheckList.map(({ xmId, xmbm, xmmc, originXmId, amount }: any) => ({
      xmId,
      xmbm,
      xmmc,
      originXmId,
      amount
    }))
    const res: any = await canLeaderReviewThForSjtc({
      meetingId: userInfo.value.meetingId,
      xmInfoList: xmInfoList.value
    })
    if (res.data.success) {
      if (res.data.msg != '') {
        msgWarning(res.data.msg)
      }
      const isTh = await getReviewStage({ meetingId: userInfo.value.meetingId })
      if (isTh.success) {
        thMsg.value = `${isTh.data.name}，会议中每个项目仅能退回${isTh.data.maxThcs}次，是否确认退回？`
        returnModal.value.isShowModel = true
      } else {
        ElMessage.error(isTh.msg)
      }
    } else {
      returnMsg(res.data.msg)
    }
  }

  //处理返回MSG
  const returnMsg = (msgApi: any) => {
    const msg = msgApi.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }

  //处理返回MSG
  const msgWarning = (msgApi: any) => {
    const msg = msgApi.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'warning',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }

  // 退回意见
  const returnMag = async (val: any) => {
    const params = {
      ...val,
      meetingId: userInfo.value.meetingId,
      xmInfoList: xmInfoList.value,
      spRoleId: userInfo.value.spRoleId,
      userId: store.getters.getUserMsg.id,
      spOrgId: userInfo.value.deptId
    }
    const thList: any[] = xmInfoList.value.map((element: any) => ({
      id: element.originXmId,
      thyj: val?.reason,
      thsbys: element.amount
    }))
    const res: any = await leaderReviewThForSjtc(params)
    await saveOrUpdateTXmThxxb({ list: thList })
    if (res.success) {
      ElMessage.success('退回成功！')
      returnModal.value?.closeHandle()
      await getPageList()
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 项目信息导出
  const exportHandle = () => {
    try {
      if (projects.value.length == 0) return ElMessage.warning('暂无数据，请勿重复点击!')
      loading.value = true
      const params = { ...userInfo.value, leaderReviewStatus: activeTab.value }
      const fileName = '评审项目清单表'
      apiExportHandle(params, fileName, leaderReviewExportXmInfo)
      loading.value = false
    } catch (e) {
      loading.value = false
      const error = e as Error
      ElMessage.error(error.message)
    }
  }
  //项目附件导出
  const fileExport = () => {
    try {
      if (projects.value.length == 0) return ElMessage.warning('暂无数据，请勿重复点击!')
      const isCheckList = projects.value.filter((item: any) => item.isCheck)
      if (isCheckList.length == 0) return ElMessage.warning('请至少选择一条数据')
      loading.value = true
      const params = isCheckList.map((item: any) => ({
        proTypeId: item.pro_type_id,
        xmId: item.xmId,
        xmbm: item.xmbm,
        xmmc: item.xmmc
      }))
      const fileName = '项目附件.zip'
      apiExporFile({ xmInfoList: params }, fileName, exportXmAttach)
      loading.value = false
    } catch (e) {
      loading.value = false
      const error = e as Error
      ElMessage.error(error.message)
    }
  }

  // 全选/全不选
  const handleCheckAll = (val: any) => {
    isIndeterminate.value = false
    projects.value.forEach((item: any) => {
      item.isCheck = isAllCheck.value
    })
  }
  // 判断是否全选
  const handleCheck = () => {
    const isCheckList: any[] = projects.value.filter((item: any) => item.isCheck)
    isIndeterminate.value = isCheckList.length > 0 && isCheckList.length < projects.value.length
    isAllCheck.value = isCheckList.length == projects.value.length
  }

  // 点击行选中
  const clickRow = () => {
    projects.value.forEach((item: any) => {
      item.isCheck = selectedProject.value.xmId == item.xmId
    })
    handleCheck()
  }

  return {
    loading,
    userInfo,
    activeTab,
    projects,
    selectData,
    selectedProject,
    editPageRef,
    histortRef,
    xmHistortList,
    expertReviews,
    filterTabs,
    projectPage,
    getReviewTagType,
    selectProject,
    showProjectInfo,
    showHistory,
    pageChangeHandle,
    limitChangeHandle,
    handleTabChange,
    initParamLists,
    levelOne,
    autoReview,
    returnModal,
    returnMag,
    thBtn,
    thMsg,
    exportHandle,
    fileExport,
    isAllCheck,
    handleCheckAll,
    handleCheck,
    isIndeterminate,
    isShowPage,
    myReview,
    hsOpinton,
    getPageList,
    showXxLhhsYj,
    xxOpinton,
    searchTj,
    searchParam,
    zzfileRef,
    canSaveOfflineOpinion,
    canEditDevelopmentOpinion,
    canEditFinanceOpinion,
    isDevelopmentOpinionDisabled,
    isFinanceOpinionDisabled,
    isDevelopmentReasonDisabled,
    isFinanceReasonDisabled,
    hasEditableOfflineOpinion,
    savingOfflineOpinion,
    handleOpinionChange,
    saveOfflineOpinion,
    isInMeetingDateRange,
    isReviewingMeeting
  }
}
