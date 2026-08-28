<template>
  <div class="container" v-if="isShowPage">
    <div class="left-btn">
      <el-button
        v-if="isReviewingMeeting"
        v-permission="'TH'"
        :disabled="projects.length == 0"
        size="mini"
        v-debounce="[thBtn, `click`, 300]"
        type="primary"
        plain
      >
        退 回
      </el-button>
      <el-tooltip v-if="isReviewingMeeting" class="box-item" effect="dark" :content="topText" placement="top">
        <el-button
          v-permission="'AUTOMATE'"
          :disabled="projects.length == 0"
          size="mini"
          v-debounce="[autoReview, `click`, 300]"
          type="primary"
          plain
        >
          自动终评
        </el-button>
      </el-tooltip>
      <el-button v-if="isReviewingMeeting" v-permission="'REVIEWSTAGE'" size="mini" type="primary" plain @click="unitDescImportHandle">
        预审意见下载及评审意见上传
      </el-button>
      <el-dropdown style="margin: 0 10px" placement="bottom" trigger="click">
        <el-button v-permission="'EXPORT'" size="mini" type="primary" plain> 下 载 </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'FJEXPORT'" @click="fileExport">附件批量下载</el-dropdown-item>
            <el-dropdown-item v-permission="'XXEXPORT'" @click="exportHandle">项目信息下载</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button size="mini" v-permission="'HISTORY'" v-debounce="[showHistory, `click`, 300]" type="primary" plain>历史记录</el-button>
    </div>
    <el-row :gutter="10" class="main-layout" :class="{ 'main-layout--left-collapsed': isLeftCollapsed }">
      <!-- 左侧：项目列表 -->
      <el-col id="offline-review-project-list" :span="6" class="left-column">
        <el-card shadow="never" class="project-list-card">
          <!-- 搜索框 -->
          <div class="search_panel">
            <el-input clearable placeholder="输入项目编码或者名称进行过滤" @clear="handleSearch" v-model="searchParam">
              <template #append>
                <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary); cursor: pointer"></i>
              </template>
            </el-input>
            <el-button size="mini" v-debounce="[searchHandle, `click`, 300]" type="primary"> 高级查询 </el-button>
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
              @click="selectProject(project)"
              :key="project.xmbm"
              :class="['project-item', { active: selectedProject && selectedProject?.xmbm === project.xmbm }]"
            >
              <el-checkbox @click.stop @change="handleCheck" v-model="project.isCheck"></el-checkbox>
              <div class="project-content">
                <div class="project-header">
                  <span class="project-id">{{ project.xmbm }}</span>
                  <!-- <el-tag type="success" effect="dark" size="small" class="location-tag">{{ project.note }}</el-tag> -->
                  <el-tag type="success" effect="dark" size="small" class="location-tag">{{ project.note }}</el-tag>
                  <el-tag type="danger" effect="plain" size="small" class="review-tag" v-if="project?.fscs > 0"> 复审 </el-tag>
                  <el-tag :type="getReviewTagType(project.fscs + 1)" effect="plain" size="small" class="review-tag">
                    第{{
                      (activeTab == '1' && project.flowStatus == 'A02') || activeTab == '0'
                        ? project.xsysThcs + project.xxhsThcs + 1
                        : project.xsysThcs + project.xxhsThcs
                    }}次
                  </el-tag>
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
                    <base-tag
                      v-if="project.csbj === '1'"
                      type="primary-blue"
                      size="small"
                      class="review-tag"
                    >
                      抽审
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
          <el-empty v-else :description="activeTab == '0' ? '暂无待评审项目' : '暂无已评审项目'"></el-empty>
        </el-card>
      </el-col>

      <el-tooltip :content="isLeftCollapsed ? '展开项目列表' : '收起项目列表'" placement="right" effect="light">
        <button
          type="button"
          class="left-collapse-toggle"
          :aria-label="isLeftCollapsed ? '展开项目列表' : '收起项目列表'"
          :aria-expanded="!isLeftCollapsed"
          aria-controls="offline-review-project-list"
          @click="toggleLeftPanel"
        >
          <i class="el-icon-arrow-left left-collapse-toggle__icon" :class="{ 'is-collapsed': isLeftCollapsed }" aria-hidden="true"></i>
        </button>
      </el-tooltip>

      <!-- 中间：项目详情和评审 -->
      <el-col :span="18" class="center-column" v-loading="loading">
        <el-card
          v-if="projects.length != 0 && selectedProject"
          shadow="hover"
          class="project-detail-card"
          :class="{ 'project-detail-card--with-ai': showAiAuditOpinion }"
        >
          <el-row :gutter="0" class="info-center">
            <el-col :span="14" class="project-info-col">
              <el-button
                v-if="showLegacyAiAuditEntry"
                class="ai-audit-entry-button"
                size="mini"
                type="primary"
                plain
                aria-label="AI智能审核"
                @click="openLegacyAiAudit"
              >
                <span class="ai-audit-entry-button__en">AI</span>智能审核
              </el-button>
              <div class="column-header">
                <div class="section-title-group">
                  <div class="section-title"><i class="el-icon-document section-title__icon" aria-hidden="true"></i>项目信息</div>
                </div>
                <div class="project-header-actions">
                  <zzfile ref="zzfileRef" />
                  <button type="button" class="header-actions header-link-action" aria-label="查看更多项目详情" @click="showProjectInfo">
                    <span>更多详情</span>
                    <i class="el-icon-more el-icon--right" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div class="project-info-content">
                <el-form class="project-info-form" label-suffix="：" label-width="134px" label-position="right">
                  <el-form-item label="项目编码" class="info-form-item">
                    <span class="info-text">{{ selectedProject.xmbm }}</span>
                  </el-form-item>
                  <el-form-item label="计划实施年度" class="info-form-item">
                    <span class="info-text">{{ selectedProject.jhssnd }}</span>
                  </el-form-item>
                  <el-form-item label="申报金额(含税)" class="info-form-item">
                    <div v-if="selectedProject.allInvestTaxAdjust === true" class="info-text" style="color: #eb6709">
                      <el-tooltip effect="light" placement="top">
                        <span style="cursor: pointer">
                          {{ selectedProject.all_invest_tax != null ? `${selectedProject.all_invest_tax}(万元)` : '' }}
                        </span>
                        <template #content>
                          <div style="display: flex; gap: 10px">
                            <div>
                              <div class="column-header-bottom">
                                <div class="section-title" style="font-size: 12px">本会议当前提交记录</div>
                              </div>
                              <div class="submit_con">
                                {{ selectedProject.all_invest_tax != null ? selectedProject.all_invest_tax : '空' }}
                              </div>
                            </div>
                            <div>
                              <div class="column-header-bottom">
                                <div class="section-title" style="font-size: 12px">本会议调整记录</div>
                              </div>
                              <div class="submit_con">
                                {{ selectedProject.allInvestTaxTzjl || '空' }}
                              </div>
                            </div>
                          </div>
                        </template>
                      </el-tooltip>
                    </div>
                    <span v-else class="info-text">
                      {{ selectedProject.all_invest_tax != null ? `${selectedProject.all_invest_tax}(万元)` : '' }}
                    </span>
                  </el-form-item>
                  <el-form-item label="申报金额(不含税)" class="info-form-item">
                    <div v-if="selectedProject.amountAdjust === true" class="info-text" style="color: #eb6709">
                      <el-tooltip effect="light" placement="top">
                        <span style="cursor: pointer">
                          {{ selectedProject.amount ? `${selectedProject.amount}(万元)` : '' }}
                        </span>
                        <template #content>
                          <div style="display: flex; gap: 10px">
                            <div>
                              <div class="column-header-bottom">
                                <div class="section-title" style="font-size: 12px">本会议当前提交记录</div>
                              </div>
                              <div class="submit_con">
                                {{ selectedProject.amount || '空' }}
                              </div>
                            </div>
                            <div>
                              <div class="column-header-bottom">
                                <div class="section-title" style="font-size: 12px">本会议调整记录</div>
                              </div>
                              <div class="submit_con">
                                {{ selectedProject.amountTzjl || '空' }}
                              </div>
                            </div>
                          </div>
                        </template>
                      </el-tooltip>
                    </div>
                    <span v-else class="info-text">{{ selectedProject.amount ? `${selectedProject.amount}(万元)` : '' }} </span>
                  </el-form-item>
                  <el-form-item label="预算事项名称" class="info-form-item info-form-item--full">
                    <span class="info-text">{{ selectedProject.yssxmc }}</span>
                  </el-form-item>
                  <el-form-item label="项目实施内容" class="info-form-item info-form-item--full block-item">
                    <OverflowDetector v-slot="{ setOverflowTarget, isOverflowing }" :content="selectedProject.ssnr">
                      <el-tooltip
                        class="project-info-tooltip-trigger"
                        effect="light"
                        placement="top"
                        popper-class="project-info-full-tooltip"
                        :enterable="true"
                        :disabled="!isOverflowing"
                      >
                        <div :ref="setOverflowTarget" :class="['info-block-content', { 'is-over-limit': isOverflowing }]">
                          {{ selectedProject.ssnr }}
                        </div>
                        <template #content>
                          <div class="project-info-full-tooltip__content">{{ selectedProject.ssnr }}</div>
                        </template>
                      </el-tooltip>
                    </OverflowDetector>
                  </el-form-item>
                  <el-form-item label="项目必要性" class="info-form-item info-form-item--full block-item">
                    <OverflowDetector v-slot="{ setOverflowTarget, isOverflowing }" :content="selectedProject.byx">
                      <el-tooltip
                        class="project-info-tooltip-trigger"
                        effect="light"
                        placement="top"
                        popper-class="project-info-full-tooltip"
                        :enterable="true"
                        :disabled="!isOverflowing"
                      >
                        <div :ref="setOverflowTarget" :class="['info-block-content', { 'is-over-limit': isOverflowing }]">
                          {{ selectedProject.byx }}
                        </div>
                        <template #content>
                          <div class="project-info-full-tooltip__content">{{ selectedProject.byx }}</div>
                        </template>
                      </el-tooltip>
                    </OverflowDetector>
                  </el-form-item>
                </el-form>
              </div>
            </el-col>
            <el-col :span="10" class="expert-review-col">
              <div class="column-header">
                <div class="section-title">
                  <template v-if="showXxLhhsYj && selectedProject">
                    <i class="el-icon-s-custom section-title__icon" aria-hidden="true"></i>人工审核意见
                  </template>
                  <template v-else> <i class="el-icon-user section-title__icon" aria-hidden="true"></i>专家评审意见 </template>
                </div>
                <button
                  v-if="!showXxLhhsYj || !selectedProject || reviewOpinionTab === 'expert'"
                  type="button"
                  class="header-actions header-link-action"
                  aria-label="查看更多专家评审意见"
                  @click="showMoreOpinion"
                >
                  <span>更多意见</span>
                  <i class="el-icon-more el-icon--right" aria-hidden="true"></i>
                </button>
                <div v-else-if="isReviewingMeeting" class="header-actions">
                  <el-button
                    size="mini"
                    type="primary"
                    plain
                    :loading="savingOfflineOpinion"
                    :disabled="!canSaveOfflineOpinion || !hasEditableOfflineOpinion"
                    @click="saveOfflineOpinion"
                  >
                    保 存
                  </el-button>
                </div>
              </div>
              <div class="review-opinion-content" :class="{ 'review-opinion-content--with-tabs': showXxLhhsYj && selectedProject }">
                <el-tabs v-if="showXxLhhsYj && selectedProject" v-model="reviewOpinionTab" tab-position="left" class="review-opinion-tabs">
                  <el-tab-pane name="expert">
                    <template #label>
                      <i class="el-icon-user review-opinion-tabs__icon" aria-hidden="true"></i>
                      <span class="review-opinion-tabs__label">专家</span>
                    </template>
                  </el-tab-pane>
                  <el-tab-pane name="offline">
                    <template #label>
                      <i class="el-icon-s-cooperation review-opinion-tabs__icon" aria-hidden="true"></i>
                      <span class="review-opinion-tabs__label">线下</span>
                    </template>
                  </el-tab-pane>
                </el-tabs>
                <div
                  v-show="!showXxLhhsYj || !selectedProject || reviewOpinionTab === 'expert'"
                  class="expert-reviews-container expert-reviews-panel"
                >
                  <el-empty class="emptyStyle" v-if="expertReviews.length === 0" description="暂无评审意见"></el-empty>
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
                <div v-show="showXxLhhsYj && selectedProject && reviewOpinionTab === 'offline'" class="info-section offline-review-tab-content">
                  <el-form :model="selectedProject" class="review-form offline-review-form">
                    <el-collapse v-model="offlineReviewActiveNames" class="offline-review-collapse">
                      <el-collapse-item title="发展部" name="development">
                        <el-form-item label="线下会审意见：">
                          <el-radio-group
                            v-model="selectedProject['xxhsJlFz']"
                            :disabled="isDevelopmentOpinionDisabled"
                            @change="(val:string) => handleOpinionChange('development', val)"
                          >
                            <template v-for="(item, index) in xxOpinton" :key="index">
                              <el-radio class="radio-style" :label="item.code">{{ item.name }}</el-radio>
                            </template>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label="意见说明：">
                          <el-input
                            v-model="selectedProject['fzbReason']"
                            :disabled="isDevelopmentReasonDisabled"
                            resize="none"
                            type="textarea"
                            :rows="4"
                            class="review-textarea"
                          />
                        </el-form-item>
                        <el-form-item label="线下会审时间：" v-if="selectedProject['xxhsFzTime']">
                          <span>{{ selectedProject['xxhsFzTime'] }}</span>
                        </el-form-item>
                      </el-collapse-item>
                      <el-collapse-item title="财务部" name="finance">
                        <el-form-item label="线下会审意见：">
                          <el-radio-group
                            v-model="selectedProject['xxhsJlCw']"
                            :disabled="isFinanceOpinionDisabled"
                            @change="(val:string) => handleOpinionChange('finance', val)"
                          >
                            <template v-for="(item, index) in xxOpinton" :key="index">
                              <el-radio class="radio-style" :label="item.code">{{ item.name }}</el-radio>
                            </template>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label="意见说明：">
                          <el-input
                            v-model="selectedProject['cwbReason']"
                            :disabled="isFinanceReasonDisabled"
                            resize="none"
                            type="textarea"
                            :rows="4"
                            class="review-textarea"
                          />
                        </el-form-item>
                        <el-form-item label="线下会审时间：" v-if="selectedProject['xxhsCwTime']">
                          <span>{{ selectedProject['xxhsCwTime'] }}</span>
                        </el-form-item>
                      </el-collapse-item>
                    </el-collapse>
                  </el-form>
                </div>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="0" class="info-row">
            <el-col v-if="showAiAuditOpinion" :span="14" class="ai-audit-col">
              <AiAuditOpinion :project="selectedProject" :user-info="userInfo" :can-rerun="canRerunAiAudit" />
            </el-col>
            <el-col class="final-review-col" :span="10">
              <div class="info-section final-review-section">
                <div class="review-opinion-content" :class="{ 'review-opinion-content--with-tabs': showXxLhhsYj && selectedProject }">
                  <div v-if="showXxLhhsYj && selectedProject" class="review-opinion-tabs final-review-tabs" aria-label="终评">
                    <div class="final-review-tabs__item is-active">
                      <i class="el-icon-s-check review-opinion-tabs__icon" aria-hidden="true"></i>
                      <span class="review-opinion-tabs__label">终评</span>
                    </div>
                  </div>
                  <div class="final-review-panel">
                    <el-form :model="myReview" label-width="100px" class="review-form" disabled>
                      <el-form-item class="review-opinion-item" label="评审意见：">
                        <el-radio-group v-model="myReview.opinion">
                          <template v-for="(item, index) in hsOpinton" :key="index">
                            <el-radio :label="item.code">{{ item.name }}</el-radio>
                          </template>
                        </el-radio-group>
                      </el-form-item>
                      <el-form-item class="review-reason-item" label="意见说明：">
                        <el-input v-model="myReview.reason" resize="none" type="textarea" :rows="4" class="review-textarea" />
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
        <el-empty v-else description="暂无数据"></el-empty>
      </el-col>
    </el-row>
  </div>
  <!-- 历史记录 -->
  <history-modal ref="histortRef" :data-list="xmHistortList" />
  <!-- 项目详情 -->
  <CentralizedModification :get-api="'LHHS'" ref="editPageRef" :userInfo="userInfo" :formData="selectData" :flag="'VIEW'"></CentralizedModification>
  <!-- 退回意见 -->
  <review-modal ref="returnModal" :text="thMsg" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag"></review-modal>
  <!--查看意见 -->
  <otherOpinion ref="otherOpinionRef" />
  <!-- 评审意见导入 -->
  <ImportExcel ref="importRef" />
  <!-- 高级查询 -->
  <searchParams ref="searchParamsRef" :show-offline-fields="true" @search-handle="getSearch" />
</template>

<script lang="tsx" setup>
import { computed, onMounted, ref } from 'vue'
import { offlineReview } from '@/views/service/jointReview/offlineReview/hooks/psy'
import { exportFun } from '@/views/service/jointReview/hooks/imporExcel'
import { searchFun } from '@/views/service/jointReview/hooks/search'
import { reviewHandle } from '@/views/service/jointReview/hooks/showReview'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import historyModal from '@/views/service/ywpt/components/history.vue' //专家评审信息
import reviewModal from '@/components/yssxTable/reviewModalNew.vue'
import otherOpinion from '@/views/service/jointReview/components/otherOpinion.vue'
import BaseTag from '../components/BaseTag.vue'
import ImportExcel from '@/components/ImportExcel/indexName.vue' //导入组件
import { importData, downloadTemplate } from '@/api/service/IhhsMeeting/xmOpinionSummary'
import searchParams from '@/views/service/jointReview/components/searchParams.vue'
import zzfile from '@/views/service/jointReview/components/zzfile.vue' //佐证材料
import AiAuditOpinion from '@/views/service/jointReview/components/AiAuditOpinion.vue'
import OverflowDetector from '@/views/service/jointReview/components/OverflowDetector.vue'
import { canShowAiAuditBySpecialOrg, hasAiAuditEntry, loadAiAuditParams } from '@/views/service/jointReview/utils/aiAudit'
import { AIRiskLevelDict } from '@/staticDict/index.js'

var topText = '可选择一个或者多个项目进行自动终评，不选则针对当前会议所有未终评项目进行自动终评。'
const isLeftCollapsed = ref(false)
const reviewOpinionTab = ref('expert')
const offlineReviewActiveNames = ref(['development', 'finance'])
const toggleLeftPanel = () => {
  isLeftCollapsed.value = !isLeftCollapsed.value
}
const aiRiskLevelMap = new Map(AIRiskLevelDict.getList().map((item) => [String(item.id), item]))
const getAiRiskLevel = (aishResult?: string | number | null) => {
  const riskLevelId = String(aishResult ?? '').trim()
  if (!riskLevelId) return undefined

  return aiRiskLevelMap.get(riskLevelId)
}
const {
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
  isDevelopmentOpinionDisabled,
  isFinanceOpinionDisabled,
  isDevelopmentReasonDisabled,
  isFinanceReasonDisabled,
  hasEditableOfflineOpinion,
  savingOfflineOpinion,
  handleOpinionChange,
  saveOfflineOpinion,
  isReviewingMeeting
} = offlineReview()

const hideAiAuditOpinion = ref(false)
const canRerunAiAudit = ref(true)
const aiAuditVisibleOrgConfig = ref('')
const hasCurrentAiAuditProject = computed(() => hasAiAuditEntry(selectedProject.value?.sfaishxm))
const canShowAiAuditByOrg = computed(() => canShowAiAuditBySpecialOrg(userInfo.value?.specialorgcode, aiAuditVisibleOrgConfig.value))
const showAiAuditOpinion = computed(() => canShowAiAuditByOrg.value && !hideAiAuditOpinion.value && hasCurrentAiAuditProject.value)
const showLegacyAiAuditEntry = computed(() => canShowAiAuditByOrg.value && hideAiAuditOpinion.value && hasCurrentAiAuditProject.value)

const openLegacyAiAudit = () => {
  zzfileRef.value?.openAiAudit?.()
}

const { importRef, unitDescImportHandle } = exportFun(userInfo, downloadTemplate, importData, getPageList) //下载

const { getSearch, searchParamsRef, searchHandle, handleSearch } = searchFun(searchParam, searchTj, levelOne, getPageList) //高级查询

const { otherOpinionRef, showMoreOpinion } = reviewHandle(userInfo, selectedProject) //更多意见

// 初始化
onMounted(async () => {
  const aiAuditParams = await loadAiAuditParams()
  hideAiAuditOpinion.value = aiAuditParams.hideAiAuditOpinion
  canRerunAiAudit.value = typeof userInfo.value?.canRerun === 'boolean' ? userInfo.value.canRerun : aiAuditParams.canRerun
  aiAuditVisibleOrgConfig.value = aiAuditParams.visibleOrgConfig
  await initParamLists()
})
</script>

<style scoped lang="less">
@import 'css/reviewStyle.less';

.ai-message-tag {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-review-tags {
  display: flex;
  flex-basis: 100%;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  flex-wrap: wrap;
}

.project-info-tooltip-trigger {
  width: 90%;

  .info-block-content {
    width: 100%;
  }
}

.info-block-content.is-over-limit {
  display: block;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-line-clamp: unset;
  white-space: pre-wrap;
  cursor: pointer;
}
</style>

<style lang="less">
.project-info-full-tooltip {
  max-width: 520px !important;
}

.project-info-full-tooltip__content {
  width: 500px;
  max-height: 320px;
  overflow-x: hidden;
  overflow-y: scroll;
  padding-right: 4px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}
</style>
