import { ref, reactive, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  pageExpertReviewInfo,
  getReasonByOpinion,
  pageXmInfo,
  pageXmHistoryReviewRecord,
  saveExpertReviewRecordForSjtc,
  exportXmInfo,
  exportXmAttach,
  getLastXmInfoForCmp,
  getReviewStage
} from '@/api/service/jointReview'
import { getButtonList, getPublicData } from '@/api/common'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'
import { apiExportHandle, apiExporFile } from '@/utils/export'
import { getYjdwData } from '@/api/service/expertinformation'

// 财务专业代码（getListPageDataByAccount 返回的 major 字段，'1' 表示财务）
const FINANCE_MAJOR_CODE = '1'

export const expertReview = () => {
  const isShowPage = ref(false)
  const loading = ref(false)
  const route = useRoute()
  const store = useStore()
  const userInfo = ref<any>() // 用户角色
  const activeTab = ref('0') // 标签页
  const projects = ref<any[]>([]) // 项目列表数据
  const selectData = ref<any>({}) //弹窗参数
  const selectedProject = ref<any>({}) // 选中的项目
  const lastXmInfo = ref<any>(null)
  const editPageRef = ref() //弹窗元素
  const histortRef = ref() //历史记录
  const xmHistortList = ref<any[]>([]) //项目历史记录
  const expertReviews = ref<any>([]) //专家评审意见数据
  const ysOpinton = ref<any[]>([])
  const levelOne = ref<any[]>([])
  const changXmInfoRef = ref()
  const isAllCheck = ref<boolean>(false)
  const isIndeterminate = ref<boolean>(false)
  const reviewStage = ref<string>('') //会审阶段
  const xxOpinton = ref<any[]>([])
  const showXxLhhsYj = ref<boolean>(false) //是否展示线下联合会审意见
  const searchTj = ref<any>({})
  const searchParam = ref<string>('')
  const zzfileRef = ref() //佐证材料
  // 当前登录专家是否财务专业（major === '1' 表示财务，来自 getListPageDataByAccount）
  const isFinanceMajor = computed(() => String(userInfo.value?.majorCode ?? '').trim() === FINANCE_MAJOR_CODE)

  // 筛选标签
  const filterTabs = ref<any[]>([
    { label: '待预审项目', value: '0' },
    { label: '已预审项目', value: '1' }
  ])
  const projectPage = reactive({
    page: 1,
    limit: 100,
    total: 0
  })
  // 我的评审意见
  const myReview = reactive({
    opinion: '',
    reason: ''
  })

  // 展示的项目信息
  const xmInfoContern = reactive([
    {
      label: '项目编码',
      props: 'xmbm',
      type: 'text'
    },
    {
      label: '计划实施年度',
      props: 'jhssnd',
      type: 'text'
    },
    {
      label: '申报金额(含税)',
      props: 'all_invest_tax',
      type: 'text'
    },
    {
      label: '申报金额(不含税)',
      props: 'amount',
      type: 'text'
    },
    {
      label: '预算事项名称',
      props: 'yssxmc',
      type: 'text'
    },
    {
      label: '项目实施内容',
      props: 'ssnr',
      type: 'textarea'
    },
    {
      label: '项目必要性',
      props: 'byx',
      type: 'textarea'
    }
  ])

  // 获取评审次数标签类型
  const getReviewTagType = (count: number) => {
    if (count === 1) return 'primary'
    if (count === 2 || count === 3) return 'warning'
    return 'danger'
  }

  // 选择项目
  const selectProject = async (project: any) => {
    loading.value = true
    selectedProject.value = project
    showXxLhhsYj.value = selectedProject.value.fzbReason || selectedProject.value.cwbReason
    lastXmInfo.value = null
    clickRow()
    await showChange()
    await getExpertReview()
    await nextTick()
    await zzfileRef.value?.getXmFileList(selectedProject.value.xmId, selectedProject.value.pro_type_id, selectedProject.value.xmmc, selectedProject.value.yssxId)
    await getMeetingStage()
    myReview.opinion = activeTab.value == '1' ? selectedProject.value.review_opinion_code : ''
    myReview.reason = activeTab.value == '1' ? selectedProject.value.review_reason : ''
  }

  // 提交评审意见
  const submitReview = () => {
    if (!myReview.opinion) {
      ElMessage.warning('请选择评审意见')
      return
    }
    if (!myReview.reason) {
      ElMessage.warning('请输入评审意见说明')
      return
    }
    ElMessageBox.confirm(`请确认提交内容。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const params: any = {
          reviewOpinion: myReview.opinion,
          reason: myReview.reason,
          expertId: userInfo.value.expertId,
          meetingId: userInfo.value.meetingId,
          xmInfoList: [{ ...selectedProject.value }]
        }
        let res: any = await saveExpertReviewRecordForSjtc(params)
        if (res.success) {
          ElMessage.success('评审意见提交成功')
          if (activeTab.value == '0') {
            await getPageList()
          }
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

  // 获取其他专家评审意见
  const handleView = async () => {
    const parmas: any = {
      xmId: selectedProject.value.xmId,
      originXmId: selectedProject.value.originXmId,
      expertId: userInfo.value.expertId,
      meetingId: userInfo.value.meetingId,
      opinion: myReview.opinion
    }
    let res: any = await getReasonByOpinion(parmas)
    if (res.success) {
      myReview.reason = res.data.join('\n')
    }
  }

  // 查看项目信息
  const showProjectInfo = async () => {
    if (JSON.stringify(selectedProject.value) == '{}') {
      ElMessage.warning('请选择一条数据')
      return
    }
    selectData.value.id = selectedProject.value.xmId
    selectData.value.xmlx = selectedProject.value.pro_type_id
    editPageRef.value.isShowModal = true
  }

  //历史记录
  const showHistory = async () => {
    if (JSON.stringify(selectedProject.value) == '{}') {
      ElMessage.warning('请选择一条数据')
      return
    }
    let res: any = await pageXmHistoryReviewRecord({
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
    let params: any = {
      xmId: selectedProject.value.xmId,
      limit: 100,
      page: 1,
      meetingId: userInfo.value.meetingId,
      isPack: selectedProject.value.isPack
    }
    let res: any = await pageExpertReviewInfo(params)
    if (res.success) {
      expertReviews.value = res.data.records.filter((item: any) => item.reviewOpinion)
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 获取左侧项目信息
  const getPageList = async () => {
    const params: any = {
      reviewStatus: activeTab.value,
      expertId: userInfo.value.expertId,
      meetingId: userInfo.value.meetingId,
      page: projectPage.page,
      limit: projectPage.limit,
      searchParam: searchParam.value,
      ...searchTj.value
    }
    selectedProject.value = null
    let res: any = await pageXmInfo(params)
    if (res.success) {
      projects.value = res.data.records
      projectPage.total = res.data.total
      if (activeTab.value == '0') {
        filterTabs.value[0].label = `待预审项目（${res.data.total}）`
      } else {
        filterTabs.value[1].label = `已预审项目（${res.data.total}）`
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
      await xmNumber()
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

  // 获取待预审项目和已预审项目数量
  const xmNumber = async () => {
    try {
      const params: any = {
        expertId: userInfo.value.expertId,
        meetingId: userInfo.value.meetingId,
        page: projectPage.page,
        limit: projectPage.limit,
        searchParam: searchParam.value,
        ...searchTj.value
      }
      // 已预审项目数量
      let item: any = await pageXmInfo({ ...params, reviewStatus: activeTab.value == '0' ? '1' : '0' })
      if (item.success) {
        if (activeTab.value == '0') {
          filterTabs.value[1].label = `已预审项目（${item.data.total}）`
        } else {
          filterTabs.value[0].label = `待预审项目（${item.data.total}）`
        }
      } else {
        ElMessage.error(item.msg)
      }
    } catch (error) {}
  }

  // 清空数据
  const clearReview = () => {
    selectedProject.value = {}
    myReview.opinion = ''
    myReview.reason = ''
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
      // 按钮权限
      const btn = await getButtonList('XQC-LHHSXSSJCT', userInfo.value.spRoleId)
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
      ysOpinton.value = res.data
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
    let res = await getReviewStage({ meetingId: userInfo.value.meetingId })
    if (res.success) {
      reviewStage.value = res.data.code
      await getReviewOpinion()
    } else {
      ElMessage.error(res.msg)
    }
  }

  // 获取一级单位
  const getYjdwList = async () => {
    let res = await getYjdwData()
    if (res.success && res.data.length != 0) {
      levelOne.value = res.data
    }
  }

  // 项目信息导出
  const exportHandle = () => {
    try {
      if (projects.value.length == 0) return ElMessage.warning('暂无数据，请勿重复点击!')
      loading.value = true
      const params = { ...userInfo.value, reviewStatus: activeTab.value }
      const fileName = '评审项目清单表'
      apiExportHandle(params, fileName, exportXmInfo)
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
  // 项目比对
  const showChange = async () => {
    if (JSON.stringify(selectedProject.value) == '{}') return ElMessage.warning('请选择一条数据')
    const params = {
      xmId: selectedProject.value.xmId,
      originXmId: selectedProject.value.originXmId,
      meetingId: userInfo.value.meetingId
    }
    let res: any = await getLastXmInfoForCmp(params)
    if (res.success) {
      lastXmInfo.value = res.data ? { ...res.data } : null
      // if (res.data == null) return ElMessage.warning('项目暂无变更，请重新选择')
      // changXmInfoRef.value.newProject = {...selectedProject.value}
      // changXmInfoRef.value.oldProject = {...res.data}
      // changXmInfoRef.value.isShowTable = true
    } else {
      ElMessage.error(res.msg)
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
    myReview,
    getReviewTagType,
    selectProject,
    submitReview,
    handleView,
    showProjectInfo,
    showHistory,
    pageChangeHandle,
    limitChangeHandle,
    handleTabChange,
    initParamLists,
    ysOpinton,
    exportHandle,
    fileExport,
    isShowPage,
    showChange,
    lastXmInfo,
    changXmInfoRef,
    xmInfoContern,
    isAllCheck,
    handleCheckAll,
    handleCheck,
    isIndeterminate,
    getPageList,
    xxOpinton,
    showXxLhhsYj,
    searchTj,
    searchParam,
    zzfileRef,
    levelOne,
    isFinanceMajor
  }
}
