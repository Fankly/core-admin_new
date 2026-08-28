import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import baseService from '@/service/baseService'
import { MessageItem, GlobalInfo } from '@/views/service/jointReview/expertReview/interface'
import { useRouter, useRoute } from 'vue-router'
import { useUser } from '@/hooks/useUser'
import { encrypt } from '@/utils/crypto'
import { getListPageDataByAccount, getHandlePsgl, getMeetingPage } from '@/api/service/IhhsMeeting/expertReview'
import { getPublicData } from '@/api/common' //公共代码
import { downloadAttach } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { queryWorkItemsByEmployee, getWfTracking } from '@/api/workflow'

export const meetingReview = () => {
  const userDialogRef = ref()
  const store = useStore()
  const isShowPage = ref(false)
  const loading = ref(false)
  const flag = ref('')
  const router = useRouter()
  const route = useRoute()
  const userInfo = ref<any>()

  // 用户信息
  const expertInfo = reactive({
    expertName: '张明远',
    majorName: '财务',
    resume: '',
    sex: '男',
    expertId: '',
    majorCode: '' // 专家原始专业代码（用于线上会审判定是否财务专业）
  })
  // 评审概览数据
  const overviewData = ref({
    cypshysl: '0',
    xmsl: '0',
    yqcs: '0',
    ljcyhypm: '0',
    ljpsxmpm: '0'
  })

  // 消息列表
  const messageList = ref<any[]>([])

  // 搜索关键词
  const searchKeyword = ref('')

  // 筛选标签
  const filterTabs = ref<any[]>([
    { label: '全部', value: 'all' },
    { label: '即将开始', value: '00' },
    { label: '评审中', value: '01' },
    { label: '已结束', value: '02' }
  ])
  const activeFilterTab = ref('all')

  // 项目列表数据
  const projects = ref<any[]>([])

  // 待办
  const todoTasksFrame = reactive({
    title: '',
    isShowDialog: false,
    src: ''
  })
  const iframeRef = ref()

  // 筛选后的项目列表
  const filteredProjects = computed(() => {
    let result = projects.value

    // 按状态筛选
    if (activeFilterTab.value !== 'all') {
      result = result.filter((p) => p.meetingStatus === activeFilterTab.value)
    }
    // 按关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value
      result = result.filter((p) => p.meetingName.includes(keyword) || p.meetingCode.includes(keyword))
      // p.pspcId.tostring().includes(keyword) ||  || p.meetingCode.includes(keyword)
    }

    return result
  })

  // 获取状态文本
  const getStatusText = (meetingStatus: string) => {
    const statusMap: Record<string, string> = {
      '00': '即将开始',
      '01': '评审中',
      '02': '已结束'
    }
    return statusMap[meetingStatus] || meetingStatus
  }

  // 处理搜索
  const handleSearch = () => {
    // 搜索逻辑已在computed中处理
  }

  const getMeetingParams = (project: any, tag: 'review' | 'view') => {
    return encrypt(
      JSON.stringify({
        meetingId: project.meetingId,
        expertName: encodeURIComponent(expertInfo.expertName),
        expertId: expertInfo.expertId,
        majorCode: expertInfo.majorCode,
        tag,
        deptId: userInfo.value.specialorgid ? userInfo.value.specialorgid : userInfo.value.deptId,
        dwId: userInfo.value.org_id ? userInfo.value.org_id : userInfo.value.dwId,
        spRoleId: userInfo.value.id ? userInfo.value.id : userInfo.value.spRoleId,
        specialorgcode: userInfo.value.specialorgcode,
        canRerun: route.query.source === 'reviewWorkBench' ? route.query.canRerun === '1' : undefined
      })
    )
  }

  // 进入评审
  const enterReview = (project: any) => {
    router.push({
      name:
        project.meetingType == '1'
          ? '/service/jointReview/expertReview/projectManifest'
          : project.meetingType == '2'
          ? '/reviewDeatil/index'
          : '/service/ywpt/projectManifest',
      query: {
        params: getMeetingParams(project, 'review'),
        meetingParams: getMeetingParams(project, 'review')
      }
    })
  }

  // 查看
  const viewReview = (project: any) => {
    router.push({
      name:
        project.meetingType == '1'
          ? '/service/jointReview/expertReview/projectManifest'
          : project.meetingType == '2'
          ? '/reviewDeatil/index'
          : '/service/ywpt/projectManifest',
      query: {
        params: getMeetingParams(project, 'view'),
        meetingParams: getMeetingParams(project, 'view')
      }
    })
  }

  const initParamLists = async (val: string) => {
    let majorName: any = ''
    const majorType = await getPublicData('MAJOR_COM')
    if (majorType.success) {
      const major = majorType.data.filter((item: any) => item.code == val)
      majorName = major[0].name
    }
    return majorName
  }

  // 获取专家信息
  const getExperytInfo = async () => {
    try {
      isShowPage.value = false
      loading.value = true
      const count: any = store.getters.getUserMsg
      const res: any = await getListPageDataByAccount({ account: count.namecode })
      if (res.success && res.data?.records.length != 1) {
        ElMessage.warning('当前账号对应多个专家，请检查')
        loading.value = false
        return
      }
      if (res.success) {
        const expert = res.data.records[0]
        expertInfo.expertName = expert.expertName
        expertInfo.majorName = await initParamLists(expert.major)
        expertInfo.majorCode = expert.major
        expertInfo.resume = expert.resume
        expertInfo.sex = expert.sex
        expertInfo.expertId = expert.id
        isShowPage.value = true
        loading.value = false
        await reviewSummary(count.namecode)
        await pageForMeeting()
      }
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  // 获取会议信息
  const pageForMeeting = async () => {
    try {
      const count: any = store.getters.getUserMsg
      const res: any = await getMeetingPage({
        account: count.namecode,
        page: '1',
        limit: '10000'
      })
      if (res.success) {
        projects.value = res.data.records
        const wfb: any[] = projects.value.filter((item: any) => item.meetingStatus == '00')
        const jxz: any[] = projects.value.filter((item: any) => item.meetingStatus == '01')
        const yjs: any[] = projects.value.filter((item: any) => item.meetingStatus == '02')
        filterTabs.value[0].label = `全部（${res.data.total}）`
        filterTabs.value[1].label = `即将开始（${wfb.length}）`
        filterTabs.value[2].label = `评审中（${jxz.length}）`
        filterTabs.value[3].label = `已结束（${yjs.length}）`
      }
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  // 获取评审概览信息
  const reviewSummary = async (account: string) => {
    const res: any = await getHandlePsgl({ account: account })
    if (res.success) {
      overviewData.value = { ...res.data }
    }
  }

  // 下载附件
  const downLoadFile = async (val: any) => {
    const res = await downloadAttach({
      uuid: val.uuid
    })
    if (!res.success) {
      ElMessage.error(res.msg || '附件下载失败!')
      return
    }
    const link = document.createElement('a')
    link.href = res.data
    link.download = `${val.name}` // 获取文件名
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const getRoleHandle = async () => {
    try {
      const isQuery = userDialogRef.value.isQuery
      userInfo.value = { ...userDialogRef.value.userMsg }
      if (isQuery) {
        const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
        if (flagData.success && flagData.data) {
          flag.value = flagData.data
          const globalInfo: GlobalInfo = {
            userId: store.getters.getUserMsg.id,
            deptId: userInfo.value.specialorgid,
            deptName: userInfo.value.specialorgname,
            dwId: userInfo.value.org_id,
            dwName: userInfo.value.org_name,
            roleId: userInfo.value.role_id,
            roleCode: userInfo.value.code,
            spRoleId: userInfo.value.id,
            specialorgcode: userInfo.value.specialorgcode,
            fqzzFlag: flag.value
          }
          store.commit('setJRGlobalInfo', globalInfo)
          await getExperytInfo()
          await workflowMsg()
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 刷新
  const refresh = async () => {
    searchKeyword.value = ''
    activeFilterTab.value = 'all'
    await pageForMeeting()
  }

  // 获取待办消息
  const workflowMsg = async () => {
    try {
      const params = {
        type: 2,
        workFlowCode: 'LHHS_TODO_REMIND',
        state: '1',
        page: 1,
        limit: 100
      }
      const res: any = await queryWorkItemsByEmployee(params)
      if (res.success) {
        messageList.value = res.data.records
      } else {
        ElMessage.error(res.msg)
      }
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  // 关闭待办
  const closeTodoTaskDeal = async () => {
    loading.value = false
    await getExperytInfo()
    await workflowMsg()
  }

  // 处理待办
  const checkAccess = () => {
    try {
      const iframe = iframeRef.value
      if (!iframe.contentWindow) {
        loading.value = false
        throw new Error('无法访问')
      }
      const href = iframe.contentWindow.loaction.href
    } catch (e: any) {
      if (e.name === 'SecurityError' || e.name === 'DOMException') {
        loading.value = false
      }
    } finally {
      loading.value = false
    }
  }

  // 查看待办
  const handleTask = (item: any) => {
    if (item.state != '1') return ElMessage.warning('请选择未读消息查看！')
    loading.value = true
    todoTasksFrame.isShowDialog = true
    todoTasksFrame.title = '业务处理'
    todoTasksFrame.src = item.url
  }

  return {
    userDialogRef,
    isShowPage,
    loading,
    expertInfo,
    overviewData,
    searchKeyword,
    filterTabs,
    activeFilterTab,
    filteredProjects,
    getStatusText,
    handleSearch,
    enterReview,
    viewReview,
    getRoleHandle,
    store,
    useUser,
    route,
    userInfo,
    getExperytInfo,
    downLoadFile,
    refresh,
    messageList,
    workflowMsg,
    todoTasksFrame,
    closeTodoTaskDeal,
    checkAccess,
    iframeRef,
    handleTask
  }
}
