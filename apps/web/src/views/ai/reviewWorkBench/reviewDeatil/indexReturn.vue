<!-- 评审明细 -->
<template>
  <div class="container">
    <el-row :gutter="10" class="card_column">
      <el-col :span="5" class="left-column">
        <el-card shadow="never" class="project-list-card">
          <!-- 按 钮 -->
          <div class="left-btn">
            <el-button :disabled="projects.length == 0" size="small" v-debounce="[thBtn, `click`, 300]" type="primary" plain> 退 回 </el-button>
            <el-dropdown style="margin: 0 10px" placement="bottom" trigger="click">
              <el-button size="small" type="primary" plain> 下 载 </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="fileExport">附件批量下载</el-dropdown-item>
                  <el-dropdown-item @click="exportHandle">项目信息下载</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" v-debounce="[showHistory, `click`, 300]" type="primary" plain>历史记录</el-button>
          </div>
          <!-- 搜索框 -->
          <div class="search_panel">
            <el-input clearable placeholder="输入项目编码或者名称进行过滤" @clear="handleSearch" v-model="searchParam">
              <template #append>
                <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary, #00857c); cursor: pointer"></i>
              </template>
            </el-input>
            <el-button size="small" v-debounce="[searchHandle, `click`, 300]" type="primary"> 高级查询 </el-button>
          </div>
          <!-- 标签页 -->
          <div class="project-filter-bar">
            <el-tabs v-model="activeTab" @tab-click="handleTabChange">
              <el-tab-pane :key="item.label" v-for="item in filterTabs" :label="item.label" :name="item.value" />
            </el-tabs>
            <el-checkbox :indeterminate="isIndeterminate" v-if="projects.length != 0" v-model="isAllCheck" @change="handleCheckAll">全选</el-checkbox>
          </div>
          <div class="project-list" v-if="projects.length != 0">
            <div
              v-for="project in projects"
              :key="project.xmbm"
              :class="['project-item', { active: selectedProject && selectedProject.xmbm == project.xmbm }]"
              @click="selectProject(project)"
            >
              <el-checkbox @click.stop @change="handleCheck" v-model="project.isCheck"></el-checkbox>
              <div class="project-content">
                <div class="project-header">
                  <span class="project-id">{{ project.xmbm }}</span>
                  <el-tag type="success" effect="dark" size="small" class="location-tag">{{ project.note }}</el-tag>
                  <!-- <el-tag type="danger" effect="plain" size="small" class="review-tag" v-if="project?.fscs > 0"> 复审 </el-tag>
                  <el-tag :type="getReviewTagType(project.fscs + 1)" effect="plain" size="small" class="review-tag">
                    第{{
                      (activeTab == '1' && project.flowStatus == 'A02') || activeTab == '0'
                        ? project.xsysThcs + project.xxhsThcs + 1
                        : project.xsysThcs + project.xxhsThcs
                    }}次
                  </el-tag> -->
                  <base-tag
                    v-if="getAiRiskLevel(project.aishResult)"
                    :type="getAiRiskLevel(project.aishResult)?.type"
                    size="small"
                    class="review-tag"
                  >
                    {{ project.aishResultName || getAiRiskLevel(project.aishResult)?.name }}
                  </base-tag>
                  <div v-if="project.aishMessage" class="ai-review-tags">
                    <base-tag
                      v-if="project.aishMessage"
                      :type="getAiRiskLevel(project.aishResult)?.type"
                      :show-icon="false"
                      size="small"
                      class="review-tag ai-message-tag"
                    >
                      {{ project.aishMessage }}
                    </base-tag>
                  </div>
                </div>
                <div class="project-name">{{ project.xmmc }}</div>
              </div>
            </div>
          </div>
          <el-pagination
            v-if="projects.length != 0"
            :current-page="projectPage.page"
            background
            style="margin-left: -10px"
            align="center"
            :page-sizes="[50, 100, 500]"
            :page-size="projectPage.limit"
            :total="parseInt(projectPage.total + '')"
            layout="total, pager"
            @size-change="limitChangeHandle"
            @current-change="pageChangeHandle"
          ></el-pagination>
          <el-empty v-else :description="activeTab == '0' ? '暂无待会审项目' : '暂无已会审项目'"></el-empty>
        </el-card>
      </el-col>
      <el-col :span="12" class="card_left">
        <el-card shadow="never" class="project-detail-card">
          <projectOverview :xm-info-contern="xmInfoContern" :selected-project="selectedProject" />
          <projectDetail ref="projectDetailRef" :detail-row="detailRow" :modal="detailModal" />
        </el-card>
      </el-col>
      <el-col :span="7" class="card_right">
        <el-card shadow="never" class="project-detail-card">
          <div class="right-panel">
            <div class="right-panel__tools">
              <div class="section-title">评审工具</div>
              <div class="tools_modules_url">
                <el-tooltip
                  v-for="tool in displayTools"
                  :key="tool.id"
                  effect="dark"
                  placement="top"
                  :content="tool.disabledTip"
                  :disabled="!tool.disabled"
                  :tabindex="tool.disabled ? -1 : 0"
                >
                  <div
                    class="tools_modules"
                    :class="{ 'is-disabled': tool.disabled }"
                    role="button"
                    :aria-disabled="tool.disabled ? 'true' : 'false'"
                    :aria-label="tool.disabled ? `${tool.name}（${tool.disabledTip}）` : tool.name"
                    @click="handleToolClick(tool)"
                    @keydown.enter.prevent="handleToolClick(tool)"
                    @keydown.space.prevent="handleToolClick(tool)"
                  >
                    <div
                      class="tools_modules_car"
                      :class="[
                        'tw-w-[40px] tw-h-[40px] tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-transition-all',
                        tool.disabled ? 'tw-bg-slate-100' : tool.bgColor
                      ]"
                    >
                      <component :is="tool.icon" :class="['tw-w-5 tw-h-5', tool.disabled ? 'tw-text-slate-400' : tool.color]" />
                    </div>
                    <span class="tools_modules_label">{{ tool.name }}</span>
                  </div>
                </el-tooltip>
              </div>
            </div>
            <!-- 仅承载弹窗逻辑，入口按钮与 AI智能评审同级渲染在工具栏 -->
            <AiAuditOpinion
              v-if="showAiAuditOpinion"
              ref="aiAuditOpinionRef"
              :project="selectedProject"
              :user-info="userInfo"
              trigger-only
              :can-rerun="canRerunAiAudit"
            />
            <div class="right-panel__analysis ai-analysis-section">
              <div class="section-title">AI分析结果</div>
              <div class="ai_summary_result">
                <div>分析结论</div>
                <div>暂无分析结论</div>
              </div>
              <div class="issueList">问题清单</div>
              <div class="issueSummaryList">
                <span class="ai-analysis-empty">暂无问题清单</span>
              </div>
            </div>
            <div class="right-panel__expert">
              <div class="right-panel__expert-header">
                <div class="section-title">专家评审意见</div>
                <div class="header-actions">
                  <span @click="showMoreOpinion">更多意见</span>
                  <i class="el-icon-more el-icon--right"></i>
                </div>
              </div>
              <div class="expert-reviews-container">
                <el-empty class="expert-reviews-empty" :image-size="56" v-if="expertReviews.length === 0" description="暂无评审意见" />
                <template v-else>
                  <div v-for="review in expertReviews" :key="review.reviewExpertName" class="expert-review-item">
                    <div class="expert-review-header">
                      <span class="expert-name">{{ review.reviewExpertName }}</span>
                      <span class="expert-major">{{ review.major }}</span>
                      <el-tag :type="review.reviewOpinionCode == '1' ? 'success' : 'danger'" effect="plain" size="small" class="review-status-tag">
                        {{ review.reviewOpinion }}
                      </el-tag>
                      <span class="review-date">{{ review.reviewTime }}</span>
                    </div>
                    <div class="expert-review-content">{{ review.reviewReason }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <!-- 历史记录 -->
  <history-modal ref="histortRef" :data-list="xmHistortList" />
  <!--查看意见 -->
  <otherOpinion ref="otherOpinionRef" />
  <!-- 高级查询 -->
  <searchParams ref="searchParamsRef" @search-handle="getSearch" />
  <!-- 评审意见导入 -->
  <ImportExcel ref="importRef" />
  <!-- 退回意见 -->
  <review-modal ref="returnModal" :text="`是否确认退回？`" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag" />
</template>
<script lang="ts" setup>
defineOptions({ name: "/ai/reviewWorkBench/reviewDeatil/indexReturn" })
import { ref, reactive, nextTick, onMounted, computed } from 'vue'
import otherOpinion from './components/otherOpinion.vue'
import { reviewHandle } from './hooks/showReview'
import projectOverview from './components/projectOverview.vue'
import projectDetail from './components/projectDetail.vue'
import { reviewDetailVo } from './hooks/index'
import { useAiAudit } from '@/views/ai/reviewWorkBench/hooks/useAiAudit'
import { meetingParam } from '@/views/ai/reviewWorkBench/hooks/index'
import { decrypt } from '@/utils/crypto'
import {
  leaderReviewPageXmInfo,
  pageExpertReviewInfo,
  getReasonByOpinion,
  saveExpertReviewRecordForCityLhhs,
  canLeaderReviewThForCityLhhs,
  leaderReviewThForCityLhhs,
  getReviewStage,
  leaderReviewExportXmInfo,
  exportXmAttach,
  getExpertReviewRecordImportTemplate,
  importExpertReviewRecordForCityLhhs
} from '@/api/service/jointReview'
import { getMeetingTh } from '@/api/service/IhhsMeeting/approval/cityLhhsMeeting'
import { saveOrUpdateTXmThxxb } from '@/api/workflow/xm'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { searchFun } from '@/views/service/jointReview/hooks/search'
import { exportFun } from '@/views/ai/reviewWorkBench/reviewDeatil/hooks/imporExcel'
import { expertReview } from '@/views/service/jointReview/expertReview/hooks/psy'
import searchParams from '@/views/service/jointReview/components/searchParams.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import AiAuditOpinion from '@/views/service/jointReview/components/AiAuditOpinion.vue'
import { getYjdwData } from '@/api/service/expertinformation'
import { apiExportHandle, apiExporFile } from '@/utils/export'
import { checkPermission } from '@/utils/utils'
import reviewModal from '@/components/yssxTable/reviewModalNew.vue'

// 筛选标签
const filterTabs = ref<any[]>([
  { label: '待会审项目', value: '0' },
  { label: '已会审项目', value: '1' }
])
const handleSave = () => {}
const { store, route } = meetingParam()
const { tools } = reviewDetailVo()
const unProject = ref<number>(0)
const projectTableRef = ref()
const projectList = ref<any[]>([])
const isViewMode = computed(() => userInfo.value?.tag === 'view')
const detailRow = ref<any>({})
const detailModal = reactive({ visible: true })
const {
  userInfo,
  activeTab,
  projects,
  selectedProject,
  expertReviews,
  projectPage,
  getReviewTagType,
  showHistory,
  histortRef,
  xmHistortList,
  pageChangeHandle,
  limitChangeHandle,
  xmInfoContern,
  isIndeterminate,
  isAllCheck,
  searchParam,
  searchTj,
  levelOne
} = expertReview()
const { showAiAuditOpinion, getAiRiskLevel, initAiAuditParams } = useAiAudit({ selectedProject, userInfo })
const canRerunAiAudit = ref(true)
const aiAuditOpinionRef = ref<InstanceType<typeof AiAuditOpinion> | null>(null)
const returnModal = ref()
const xmInfoList = ref<any[]>([])

/** 与 AI智能评审同结构；无权限时隐藏 AI审核意见 */
const displayTools = computed(() => tools.filter((tool) => tool.id !== 'ai-audit-opinion' || showAiAuditOpinion.value))

// 我的评审意见
const myReview = reactive({
  opinion: '',
  reason: ''
})

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
  const res: any = await getMeetingTh(params)
  const thRes = await saveOrUpdateTXmThxxb({ list: thList })
  console.log(thRes)
  if (res.success) {
    ElMessage.success('退回成功！')
    returnModal.value?.closeHandle()
    await getPageList()
  } else {
    ElMessage.error(res.msg)
  }
}

// 退回
const thBtn = async () => {
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
  returnModal.value.isShowModel = true
}

const handleToolClick = (tool: any) => {
  // 未实现的工具整体禁用：不响应点击/回车/空格，也不给出多余提示（hover 已有 tooltip 说明）
  if (tool?.disabled) return
  if (tool?.id === 'ai-audit-opinion') {
    aiAuditOpinionRef.value?.openDetailModal?.()
    return
  }
}

// 展示的项目信息
const getProjectTotal = async () => {
  getPageList()
}

// 获取一级单位
const getYjdwList = async () => {
  let res = await getYjdwData()
  if (res.success && res.data.length != 0) {
    levelOne.value = res.data
  }
}

// 获取一级单位简称
const yjdwJc = (val: any) => {
  const yjdwNote: any[] = levelOne.value.filter((item: any) => item.name == val)
  const note = yjdwNote.length > 0 ? yjdwNote[0].note : val
  return note
}

// 处理标签页切换
const handleTabChange = async (tab: string) => {
  await getPageList()
}

// 获取待会审项目和已会审项目数量
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
    // 已会审项目数量
    let item: any = await leaderReviewPageXmInfo({ ...params, leaderReviewStatus: activeTab.value == '0' ? '1' : '0' })
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
  myReview.opinion = ''
  myReview.reason = ''
  expertReviews.value.length = 0
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

// 选择项目
const selectProject = async (project: any) => {
  selectedProject.value = project || {}
  clickRow()
  myReview.reason = activeTab.value == '1' ? selectedProject.value.review_reason : ''
  myReview.opinion = selectedProject.value.review_opinion_code
  myReview.reason = selectedProject.value.review_reason
  detailRow.value.proId = selectedProject.value.xmId
  detailRow.value.proType = selectedProject.value.pro_type_id
  detailRow.value.yssxId = selectedProject.value.yssxId
  await getExpertReview()
}

// 获取左侧项目信息
const getPageList = async () => {
  const params: any = {
    leaderReviewStatus: activeTab.value,
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    page: projectPage.page,
    limit: projectPage.limit,
    searchParam: searchParam.value,
    ...searchTj.value
  }
  selectedProject.value = null
  let res: any = await leaderReviewPageXmInfo(params)
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
    await xmNumber()
  } else {
    ElMessage.error(res.msg)
  }
}
const { otherOpinionRef, showMoreOpinion } = reviewHandle(userInfo, selectedProject) //更多意见
const { getSearch, searchParamsRef, searchHandle, handleSearch } = searchFun(searchParam, searchTj, levelOne, getPageList) //高级查询
const { importRef, unitDescImportHandle } = exportFun(userInfo, getExpertReviewRecordImportTemplate, importExpertReviewRecordForCityLhhs, getPageList) //批量维护

// 项目信息导出
const exportHandle = () => {
  try {
    if (projects.value.length == 0) return ElMessage.warning('暂无数据，请勿重复点击!')
    const params = { ...userInfo.value, leaderReviewStatus: activeTab.value }
    const fileName = '评审项目清单表'
    apiExportHandle(params, fileName, leaderReviewExportXmInfo)
  } catch (e) {
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
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  }
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

// 选择意见时自动带出意见说明
const handleView = async () => {
  const parmas: any = {
    xmId: selectedProject.value.xmId,
    originXmId: selectedProject.value.originXmId,
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    opinion: myReview.opinion
  }
  const res: any = await getReasonByOpinion(parmas)
  if (res.success) {
    myReview.reason = res.data.join('\n')
  }
}

// 提交评审意见
const submitReview = async () => {
  if (!myReview.opinion) return ElMessage.warning('请选择评审意见')
  if (!myReview.reason) return ElMessage.warning('请输入评审意见说明')
  const type = await VXETable.modal.confirm(`请确认提交内容。`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const params: any = {
    reviewOpinion: myReview.opinion,
    reason: myReview.reason,
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    xmInfoList: [{ ...selectedProject.value }],
    spRoleId: userInfo.value.spRoleId,
    spOrgId: userInfo.value.deptId
  }
  let res: any = await saveExpertReviewRecordForCityLhhs(params)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('评审意见提交成功')
  getProjectTotal()
}

onMounted(async () => {
  userInfo.value = JSON.parse(decrypt(route.query.params as string))
  userInfo.value.expertName = decodeURIComponent(userInfo.value.expertName as string)
  const aiAuditParams = await initAiAuditParams()
  canRerunAiAudit.value = aiAuditParams.canRerun
  await getProjectTotal()
  await getYjdwList()
})
</script>
<style scoped lang="less">
@import 'css/reviewStyle';
</style>
