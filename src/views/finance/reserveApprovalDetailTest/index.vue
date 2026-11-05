<template>
  <singleContainer readOnly class="reserveApprovalDetail pageStyle detailStyle" :onSubmit="handleSubmit" :onCancel="handleCancel">
    <div class="reserveApprovalDetail__main">
      <!-- 顶部概览容器 -->
      <DashboardContainer
        class="container-item grassEffect"
        style="margin-top: 19px; margin-bottom: 16px"
        :title="dataValue?.cwProjectVo?.name || '未知'"
        subTitle=""
      >
        <template #nameExtra>
          <base-tag
            class="status--tag"
            style="margin-left: 10px"
            :type="AIRiskLevelDict.getValue(+projectViewData?.cwProjectVo?.aiRiskLevel, 'type')"
            :size="defaultFormItemSize"
          >
            {{ AIRiskLevelDict.getList().filter((item) => item.id == projectViewData?.cwProjectVo?.aiRiskLevel)?.[0]?.name }}
          </base-tag>
        </template>
        <!-- <configText :options="InfoKeyValues" :dataValue="dataValue" /> -->
      </DashboardContainer>

      <div class="detailBody__view detailBody__view--layout" style="padding: 0 0 14px 0">
        <!-- 左侧：项目基本信息页签 -->
        <DashboardContainer :bodyStyle="{ padding: '0 ' }" class="container-item detailBody__view-item detailBody__view-item--grow">
          <el-tabs class="detailBody__tab" v-model="TAB_KEYS.PROJECT_INFO">
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.PROJECT_INFO">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.PROJECT_INFO].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.PROJECT_INFO].tooltip"
                >
                  <span class="tab-title tag">
                    {{ tabInfo[TAB_KEYS.PROJECT_INFO].label }}
                    <!-- <base-tag
                      v-if="projectViewData?.cwProjectVo?.reserveStatus"
                      class="status--tag"
                      :type="getType(projectViewData.cwProjectVo.reserveStatus)"
                      :size="defaultFormItemSize"
                    >
                      {{ reserveStatus.find((item) => item.key == projectViewData.cwProjectVo.reserveStatus)?.value }}
                    </base-tag> -->
                  </span>
                </el-tooltip>
              </template>
              <projectView
                style="padding: 0px 10px 25px 22px"
                v-model:data="projectViewData"
                v-if="dataValue.projectId"
                ref="projectView"
                :projectId="dataValue.projectId"
                :diffData="diffData?.status == 1 ? diffData : undefined"
                diffKey="text"
              />
            </el-tab-pane>
          </el-tabs>
        </DashboardContainer>

        <!-- 右侧：AI分析与比对页签组 -->
        <DashboardContainer
          v-show="sameItemData == null && detailData == null"
          :bodyStyle="{ padding: 0 }"
          class="container-item detailBody__view-item detailBody__view-item--grow"
        >
          <el-tabs class="detailBody__tab" v-model="activeName">
            <!-- 1. 项目名称分析 -->
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.NAME_ANALYZE" v-if="false">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.NAME_ANALYZE].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.NAME_ANALYZE].tooltip"
                >
                  <span class="tab-title">{{ tabInfo[TAB_KEYS.NAME_ANALYZE].label }}</span>
                </el-tooltip>
              </template>
              <div class="detailBody__tab--view">
                <table-box class="full-table" stripe :hasExtend="false" :data="nameAnalyzeList">
                  <vxe-column title="序号" type="seq" width="80px" />
                  <vxe-column title="项目名称" width="40%" field="name">
                    <template #default="{ row }">
                      <span>{{ row.name || '/' }}</span>
                    </template>
                  </vxe-column>
                  <vxe-column title="预算事项" field="itemName">
                    <template #default="{ row }">
                      <span>{{ row.itemName || '/' }}</span>
                    </template>
                  </vxe-column>
                  <vxe-column title="归口部门名称" field="attrDeptName">
                    <template #default="{ row }">
                      <span>{{ row.attrDeptName || '/' }}</span>
                    </template>
                  </vxe-column>
                  <vxe-column title="申请金额(万元)" field="amount">
                    <template #default="{ row }">
                      <span>{{ row.amount || '/' }}</span>
                    </template>
                  </vxe-column>
                  <vxe-column title="储备年份" field="year">
                    <template #default="{ row }">
                      <span>{{ row.year || '/' }}</span>
                    </template>
                  </vxe-column>
                </table-box>
              </div>
            </el-tab-pane>

            <!-- 2. 必要性分析 (AI渲染) -->
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.NECESSITY">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.NECESSITY].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.NECESSITY].tooltip"
                >
                  <span class="tab-title">
                    {{ tabInfo[TAB_KEYS.NECESSITY].label }}
                    <span v-if="projectRiskData?.necessityDiff == 1" class="ai-dot ai-dot-yellow"></span>
                  </span>
                </el-tooltip>
              </template>
              <div class="detailBody__tab--view detailBody__tab--view--scroll ai-analysis-view">
                <!-- <AILoading /> -->
                <div v-if="aiLoadingState.nameAnalyze" class="ai-loading-panel">
                  <AILoading title="AI 正在分析实施内容" subtitle="请稍后查看" />
                </div>
                <!-- 仅在计算完成且不在加载时显示 -->
                <template v-else-if="!aiLoadingState.nameAnalyze && hasAITabResult(nameAnalyzeObj, ['coreResult', 'analysisInfo'])">
                  <div class="review-card conclusion-card" :class="nameAnalyzeObj?.aiRiskLevel == 1 ? 'yellow' : ''">
                    <div class="review-card__header">
                      <span class="title">AI审核结果</span>
                    </div>
                    <div class="review-card__content">
                      <p v-html="streamedData.nameAnalyze_coreResult || ''"></p>
                    </div>
                  </div>
                  <div class="review-card analysis-card">
                    <div class="review-card__header"><span class="title">AI推理过程</span></div>
                    <div class="review-card__content">
                      <p v-html="streamedData.nameAnalyze_analysisInfo || ''"></p>
                    </div>
                  </div>
                </template>
                <div v-else class="ai-empty-boundary">
                  <el-empty description="暂无分析结果" />
                </div>
              </div>
            </el-tab-pane>

            <!-- 3. 相似分析 -->
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.SIMILAR">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.SIMILAR].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.SIMILAR].tooltip"
                >
                  <span class="tab-title">
                    {{ tabInfo[TAB_KEYS.SIMILAR].label }}
                    <!-- <span v-if="data.length > 0" class="badge">{{ data.length }}</span> -->
                    <span v-if="projectRiskData?.categoryDiff == 1" class="ai-dot ai-dot-yellow"></span>
                  </span>
                </el-tooltip>
              </template>
              <div class="detailBody__tab--view">
                <el-empty v-show="data.length == 0" style="width: 100%; height: 100%" class="small-empty empty"></el-empty>
                <similarAnalysis
                  ref="similarAnalysis"
                  v-if="dataValue.projectId"
                  @on-select="
                    (item) => {
                      detailData = item
                      currentSimilarType = 'similar'
                      handleSelect()
                    }
                  "
                  v-show="detailData == null"
                  v-model:data="data"
                  :projectId="dataValue.projectId"
                />
              </div>
            </el-tab-pane>

            <!-- 3.1. 相似分析2（按事项）—— 已注释隐藏 -->
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.SIMILAR_2" v-if="false">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.SIMILAR_2].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.SIMILAR_2].tooltip"
                >
                  <span class="tab-title">
                    {{ tabInfo[TAB_KEYS.SIMILAR_2].label }}
                    <!-- <span v-if="data2.length > 0" class="badge">{{ data2.length }}</span> -->
                    <span v-if="projectRiskData?.itemDiff == 1" class="ai-dot ai-dot-yellow"></span>
                  </span>
                </el-tooltip>
              </template>
              <div class="detailBody__tab--view">
                <el-empty v-show="data2.length == 0" style="width: 100%; height: 100%" class="small-empty empty"></el-empty>
                <similarAnalysis
                  ref="similarAnalysis2"
                  v-if="dataValue.projectId"
                  @on-select="
                    (item) => {
                      detailData = item
                      currentSimilarType = 'similar2'
                      handleSelect()
                    }
                  "
                  v-show="detailData == null"
                  v-model:data="data2"
                  :projectId="dataValue.projectId"
                  :useItemDiff="true"
                />
              </div>
            </el-tab-pane>

            <!-- 4. 三比一挂钩分析 (AI渲染) -->
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.THREE_ONE">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.THREE_ONE].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.THREE_ONE].tooltip"
                >
                  <span class="tab-title">
                    {{ tabInfo[TAB_KEYS.THREE_ONE].label }}
                    <span v-if="projectRiskData?.threeOneDiff == 1" class="ai-dot ai-dot-yellow"></span>
                  </span>
                </el-tooltip>
              </template>
              <div class="detailBody__tab--view detailBody__tab--view--scroll ai-analysis-view">
                <div v-if="aiLoadingState.threeOne" class="ai-loading-panel">
                  <AILoading title="AI 正在分析资产及费用" subtitle="请稍后查看" />
                </div>
                <template
                  v-else-if="!aiLoadingState.threeOne && hasAITabResult(threeOneDiffData, ['analyseAsset', 'coreResult', 'analysisInfo', 'calcData'])"
                >
                  <div
                    v-if="threeOneDiffData.analyseAsset"
                    class="review-card result-card"
                    :class="threeOneDiffData?.assetAiRiskLevel != 1 ? 'green' : ''"
                  >
                    <div class="review-card__header"><span class="title">关联资产分析</span></div>
                    <div class="review-card__content"><p v-html="streamedData.threeOne_analyseAsset || ''"></p></div>
                  </div>
                  <div class="review-card conclusion-card" :class="threeOneDiffData?.aiRiskLevel == 1 ? 'yellow' : ''">
                    <div class="review-card__header">
                      <span class="title">AI审核结果</span>
                    </div>
                    <div class="review-card__content"><p v-html="streamedData.threeOne_coreResult || ''"></p></div>
                  </div>
                  <div class="review-card analysis-card">
                    <div class="review-card__header"><span class="title">AI推理过程</span></div>
                    <div class="review-card__content">
                      <div v-if="threeOneDiffData?.calcData" class="ai-fade-in-up">
                        <table-box
                          class="detail-table"
                          :hasExtend="false"
                          :data="threeOneDiffData?.calcData ? JSON.parse(threeOneDiffData?.calcData) : []"
                          :size="defaultFormItemSize"
                        >
                          <vxe-column title="序号" type="seq" width="80px" />
                          <vxe-column title="费用名称" field="calcName" :min-width="160">
                            <template #default="{ row }"
                              ><span>{{ row.calcName || '/' }}</span></template
                            >
                          </vxe-column>
                          <vxe-column title="动因" field="motivation" :min-width="220">
                            <template #default="{ row }"
                              ><span>{{ row.motivation || '/' }}</span></template
                            >
                          </vxe-column>
                          <vxe-column title="单位" field="unit" :min-width="100">
                            <template #default="{ row }"
                              ><span>{{ row.unit || '/' }}</span></template
                            >
                          </vxe-column>
                          <vxe-column title="标准成本(元)" field="standardCost" :min-width="140">
                            <template #default="{ row }"
                              ><span>{{ row.standardCost || '/' }}</span></template
                            >
                          </vxe-column>
                          <vxe-column title="历史成本(元)" field="historicalInput" :min-width="140">
                            <template #default="{ row }"
                              ><span>{{ row.historicalInput || '/' }}</span></template
                            >
                          </vxe-column>
                          <vxe-column title="行业参考(元)" field="peerLevelComparison" :min-width="140">
                            <template #default="{ row }"
                              ><span>{{ row.peerLevelComparison || '/' }}</span></template
                            >
                          </vxe-column>
                        </table-box>
                      </div>
                      <p v-html="streamedData.threeOne_analysisInfo || ''"></p>
                    </div>
                  </div>
                </template>
                <div v-else class="ai-empty-boundary">
                  <el-empty description="暂无分析结果" />
                </div>
              </div>
            </el-tab-pane>

            <!-- 5. 同源资产比对 (AI渲染) -->
            <el-tab-pane class="full-tabpane" :name="TAB_KEYS.ASSET_COMP">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.ASSET_COMP].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.ASSET_COMP].tooltip"
                >
                  <span class="tab-title">
                    {{ tabInfo[TAB_KEYS.ASSET_COMP].label }}
                    <span v-if="projectRiskData?.assetDiff == 1" class="ai-dot ai-dot-yellow"></span>
                  </span>
                </el-tooltip>
              </template>
              <div class="detailBody__tab--view detailBody__tab--view--scroll ai-analysis-view">
                <div v-if="aiLoadingState.assetComparison" class="ai-loading-panel">
                  <AILoading title="AI 正在判别资产级设备" subtitle="请稍后查看" />
                </div>
                <template
                  v-else-if="!aiLoadingState.assetComparison && hasAITabResult(assetComparisonObj, ['coreResult', 'analysisInfo', 'sameData'])"
                >
                  <div class="review-card conclusion-card" :class="assetComparisonObj?.aiRiskLevel == 1 ? 'orange' : ''">
                    <div class="review-card__header">
                      <span class="title">AI审核结果</span>
                    </div>
                    <div class="review-card__content"><p v-html="streamedData.assetComp_coreResult || ''"></p></div>
                  </div>
                  <div class="review-card analysis-card">
                    <div class="review-card__header"><span class="title">AI推理过程</span></div>
                    <div class="review-card__content">
                      <div v-if="assetComparisonObj?.analysisInfo" class="ai-fade-in-up">
                        <table-box
                          class="detail-table"
                          :hasExtend="false"
                          :data="assetComparisonObj?.sameData ? JSON.parse(assetComparisonObj?.sameData) : []"
                          :size="defaultFormItemSize"
                          :row-class-name="getRowClassName"
                        >
                          <vxe-column title="序号" type="seq" width="80px" />
                          <vxe-column title="费用名称" field="materialInfo" :min-width="220" />
                          <vxe-column title="匹配结果" field="matchStatus" :min-width="140">
                            <template #default="{ row }">
                              <span class="vxe-cell--label">
                                <span v-if="row.matchStatus == 3">完全匹配</span>
                                <span v-else-if="row.matchStatus == 2">模糊匹配</span>
                                <span v-else-if="row.matchStatus == 1">未匹配</span>
                              </span>
                            </template>
                          </vxe-column>
                          <vxe-column title="固定资产同源目录A类设备" field="deviceA" :min-width="260" />
                        </table-box>
                      </div>
                      <p v-html="streamedData.assetComp_analysisInfo || ''"></p>
                    </div>
                  </div>
                </template>
                <div v-else class="ai-empty-boundary">
                  <el-empty description="暂无分析结果" />
                </div>
              </div>
            </el-tab-pane>

            <!-- 6. 三区三县比对 -->
            <!-- <el-tab-pane  class="full-tabpane" :name="TAB_KEYS.THREE_AREA">
    <template #label>
      <el-tooltip
        popper-class="ai-tooltip-green"
        effect="dark"
        :content="tabInfo[TAB_KEYS.THREE_AREA].tooltip"
        placement="top"
        :disabled="!tabInfo[TAB_KEYS.THREE_AREA].tooltip"
      >
        <span class="tab-title">
          {{ tabInfo[TAB_KEYS.THREE_AREA].label }}
          <span v-if="sameItemList.length > 0" class="badge">{{ sameItemList.length }}</span>
        </span>
      </el-tooltip>
    </template>
    <div class="detailBody__tab--view">
      <el-empty v-show="sameItemList.length == 0" style="width: 30%; height: 30%" class="small-empty empty"></el-empty>
      <sameItemAnalysis
        ref="sameItemAnalysis"
        v-if="dataValue.projectId"
        @on-select="(item) => { sameItemData = item; handleSelect(); }"
        v-show="sameItemData == null"
        v-model:data="sameItemList"
        :projectId="dataValue.projectId"
      />
    </div>
  </el-tab-pane> -->
          </el-tabs>
        </DashboardContainer>

        <!-- 相似分析 详情对比 视图层 -->
        <!-- ' | ' + (detailData?.diffName || '')" -->
        <DashboardContainer
          v-if="detailData"
          :bodyStyle="{ padding: '0 10px 25px 22px' }"
          :empty="(currentSimilarType === 'similar' ? data.length : data2.length) == 0"
          class="container-item detailBody__view-item detailBody__view-item--grow"
          rectangularIcon
          :title="currentSimilarType === 'similar' ? '相似分析' : '相似分析'"
        >
          <projectView
            v-if="diffData && diffData.status == 1"
            @item-change="() => syncHeights()"
            diffKey="diffText"
            :diffData="diffData"
            :id="detailData.id"
            :projectId="detailData.diffProjectId"
          />
          <projectSSE
            :id="detailData.id"
            :useItemDiff="currentSimilarType === 'similar2'"
            v-if="diffData && diffData.status == 0"
            @onCountdownEnd="onCountdownEnd"
          />
        </DashboardContainer>

        <!-- 三区三县 详情对比 视图层 -->
        <DashboardContainer
          v-if="sameItemData"
          :bodyStyle="{ padding: '0 10px 25px 22px' }"
          :empty="sameItemList.length == 0"
          class="container-item detailBody__view-item detailBody__view-item--grow"
          rectangularIcon
          title="三区三县比对"
        >
          <projectView v-if="sameItemData?.cwProjectVo?.projectId" ref="projectView" :projectId="sameItemData?.cwProjectVo?.projectId" />
        </DashboardContainer>
      </div>
    </div>
  </singleContainer>
</template>

<script>
import { projectConfigMixin, uploadMixin, statsDateRangeMixin, cachedSinglePageMixin } from '@/core/mixins'
import configText from './components/configText.vue'

import {
  CwProjectAssetDiff,
  CwProjectDiff,
  CwProject,
  CwProjectApply,
  CwProjectClosure,
  CwProjectApprove,
  CwProjectItemDiff
} from '@/api/mainController'

import rejectReason from './components/RejectReason/index.vue'
import similarAnalysis from './components/similarAnalysis_new.vue'
import sameItemAnalysis from './components/sameItemAnalysis.vue'
import projectView from './components/projectView.vue'
import similarSetting from './components/similarSetting.vue'
import projectViewItem from './components/projectViewItem.vue'
import ApprovalConfirmDialog from './ApprovalConfirmDialog.vue'

import projectSSE from './components/projectSSE/index.vue'

import { mapGetters, mapMutations } from 'vuex'
import _ from 'lodash'

// 抽取所有Tab关联项避免硬编码
const TAB_KEYS = {
  PROJECT_INFO: '1',
  NECESSITY: '2',
  SIMILAR: '3',
  APPROVAL_RECORD: '4',
  NAME_ANALYZE: '5',
  THREE_AREA: '6',
  THREE_ONE: '7',
  ASSET_COMP: '8',
  SIMILAR_2: '9'
}

export default {
  components: {
    // configText,
    projectView,
    similarAnalysis,
    // sameItemAnalysis,
    // projectViewItem,
    projectSSE
  },
  props: {
    id: { type: String },
    listKey: { type: String },
    // 指定审批角色（抽屉/嵌入场景使用，路由场景仍优先读取 query.approvalRole）
    approvalRole: { type: String },
    // 嵌入模式（如在抽屉中打开），隐藏页面内的返回按钮，交由外层容器关闭
    embedded: { type: Boolean, default: false }
  },
  name: '/finance/reserveApprovalDetailTest',
  mixins: [projectConfigMixin, uploadMixin, statsDateRangeMixin, cachedSinglePageMixin],
  data() {
    return {
      projectRiskData: {},
      TAB_KEYS,
      tabInfo: {
        [TAB_KEYS.PROJECT_INFO]: { label: '项目信息', tooltip: '' },
        // [TAB_KEYS.NAME_ANALYZE]: { label: '项目名称分析', tooltip: '基于向量化相似对比分析，对项目名称进行重名及语义比对，识别重复或变相重复申报项目。' },
        [TAB_KEYS.NECESSITY]: {
          label: '实施内容合理性分析',
          tooltip: '基于AI推理能力对申报内容进行结构化理解，评估完整性、合理性与逻辑一致性，判断项目实施必要性。'
        },
        [TAB_KEYS.SIMILAR]: {
          label: '相似分析',
          tooltip: '利用AI语义建模与相似度推理，对实施内容进行深度比对分析，识别重复或高度相似项目。'
        },
        [TAB_KEYS.THREE_ONE]: {
          label: '关联资产及费用合理性分析',
          tooltip: '比对定额、历史与行业价，识别单价异常风险；挂钩固定资产卡片，识别资本性支出费用化风险。'
        },
        [TAB_KEYS.ASSET_COMP]: {
          label: '资产级设备判别',
          tooltip: '基于AI语义识别与知识匹配能力，解析物资清单并对标固定资产同源目录，甄别资产级设备。'
        },
        [TAB_KEYS.THREE_AREA]: { label: '三区三县比对', tooltip: '' },
        [TAB_KEYS.APPROVAL_RECORD]: { label: '审批记录', tooltip: '' },
        [TAB_KEYS.SIMILAR_2]: {
          label: '相似分析（按事项）',
          tooltip: '利用AI语义建模与相似度推理，对实施内容进行深度比对分析，识别重复或高度相似项目。'
        }
      },

      // 用于存放打字机逐步输出的数据对象
      streamedData: {
        nameAnalyze_coreResult: '',
        nameAnalyze_analysisInfo: '',
        threeOne_analyseAsset: '',
        threeOne_coreResult: '',
        threeOne_analysisInfo: '',
        assetComp_coreResult: '',
        assetComp_analysisInfo: ''
      },
      typewriterTimers: {},

      // 用于控制动画时机的状态 (懒加载核心)
      rawAiData: {
        necessity: null,
        threeOne: null,
        assetComp: null
      },
      hasAnimated: {
        [TAB_KEYS.NECESSITY]: false,
        [TAB_KEYS.THREE_ONE]: false,
        [TAB_KEYS.ASSET_COMP]: false
      },
      typewriterDone: {
        [TAB_KEYS.THREE_ONE]: false,
        [TAB_KEYS.ASSET_COMP]: false
      },

      data: [],
      data2: [],
      reserveStatus: [],
      sameItemList: [],
      detailData: undefined,
      sameItemData: undefined,
      diffData: undefined,
      currentSimilarType: null,
      indexStatus: undefined,
      activeName: TAB_KEYS.NECESSITY,
      dataValue: {},
      projectViewData: {},
      approvalList: [],
      nameAnalyzeList: [],
      assetComparisonObj: {},
      assistCheckList: undefined,
      unmountScrollSync: undefined,
      analysisTableData: [],
      threeOneDiffData: {},
      nameAnalyzeObj: {},
      nameAnalyzeLoading: {
        ratioAnalysis: true,
        assetComparison: true,
        necessityAnalysis: true
      },

      // AI Loading 状态
      aiLoadingState: {
        nameAnalyze: false,
        threeOne: false,
        assetComparison: false
      },
      aiLoadingTimers: {
        nameAnalyze: false,
        threeOne: false,
        assetComparison: false
      },
      // 用于轮询查询的定时器
      aiPollingTimers: {
        nameAnalyze: null,
        threeOne: null,
        assetComparison: null
      },
      preNextIds: { nextId: false, preId: false },
      pageRoleMap: {
        deptApprovalDetail: {
          apiSuffix: 'dept',
          preNextApi: 'deptPreNext',
          needConfirmDialog: false,
          isNeedFinishOperate: false,
          showSettingBtn: false,
          routeName: 'deptApprovalDetail'
        },
        financeApprovalDetail: {
          apiSuffix: 'finance',
          preNextApi: 'financePreNext',
          needConfirmDialog: true,
          isNeedFinishOperate: true,
          showSettingBtn: true,
          routeName: 'financeApprovalDetail'
        },
        jysApprovalDetail: {
          apiSuffix: 'jys',
          preNextApi: 'jysPreNext',
          needConfirmDialog: true,
          isNeedFinishOperate: false,
          showSettingBtn: false,
          routeName: 'jysApprovalDetail'
        },
        fzbApprovalDetail: {
          apiSuffix: 'fzb',
          preNextApi: 'fzbPreNext',
          needConfirmDialog: true,
          isNeedFinishOperate: false,
          showSettingBtn: false,
          routeName: 'fzbApprovalDetail'
        }
      }
    }
  },
  created() {},
  mounted() {
    this.getReserveStatus()
    this.refreshTable(true)
    this.getPreNextStatus()
  },
  activated() {
    // 因为你在上面修改了 loadTabIfNeeded，它已经具备了识别 status === 0 并重发请求的能力
    // 所以切回页面时，只需要无脑调用一次，它就会自动接力之前的轮询
    if (this.activeName) {
      this.loadTabIfNeeded(this.activeName)
    }
  },
  deactivated() {
    // 👇 优化：一行搞定休眠
    this.clearAllAITimers()
  },
  beforeUnmount() {
    if (this.unmountScrollSync) this.unmountScrollSync()
    // 👇 优化：一行搞定销毁
    this.clearAllAITimers()
  },
  methods: {
    async projectRiskInfo() {
      const res = await CwProjectDiff.projectRiskInfo(this, { projectId: this.dataValue.projectId })
      this.projectRiskData = res.data || {}
    },
    clearAllAITimers() {
      const timerGroups = ['typewriterTimers', 'aiLoadingTimers', 'aiPollingTimers']
      timerGroups.forEach((groupName) => {
        if (this[groupName]) {
          Object.values(this[groupName]).forEach((timer) => {
            if (timer) clearTimeout(timer)
          })
        }
      })
    },
    // ✨ 核心机制 1：懒加载调度方法
    loadTabIfNeeded(tabName) {
      if (tabName === this.TAB_KEYS.NECESSITY) {
        // 👇 修改：增加 status === 0 的判断，切回 tab 时如果是 0 重新触发查询
        if (!this.rawAiData.necessity || this.rawAiData.necessity.status === 0) this.getCwProjectNecessity()
        else this.checkAndTriggerAnimation(tabName)
      } else if (tabName === this.TAB_KEYS.THREE_ONE) {
        // 👇 修改同上
        if (!this.rawAiData.threeOne || this.rawAiData.threeOne.status === 0) this.getThreeOneDiffView()
        else this.checkAndTriggerAnimation(tabName)
      } else if (tabName === this.TAB_KEYS.ASSET_COMP) {
        // 👇 修改同上
        if (!this.rawAiData.assetComp || this.rawAiData.assetComp.status === 0) this.getAssetComparisonData()
        else this.checkAndTriggerAnimation(tabName)
      }
    },

    hasAITabResult(dataObj, contentKeys = []) {
      if (!dataObj || dataObj.status !== 1) return false

      if (dataObj.viewTotal && Number(dataObj.viewTotal) > 0) return true

      return contentKeys.some((key) => this.hasMeaningfulAIValue(dataObj[key]))
    },

    hasMeaningfulAIValue(value) {
      if (Array.isArray(value)) return value.length > 0
      if (value == null) return false

      const text = String(value)
        .replace(/<[^>]*>/g, '')
        .trim()
      return text !== '' && text !== '[]' && text !== '{}'
    },

    // ✨ 核心机制 2：响应深层监听，控制 Loading 并触发打字机
    handleAILoading(loadingKey, dataObj, tabKey) {
      // 1. 如果后端返回空，或者数据还没回来，或者被重置了
      // 此时既不显示 Loading 也不显示 Else 内容，直接返回
      if (!dataObj || Object.keys(dataObj).length === 0) {
        this.aiLoadingState[loadingKey] = false
        return
      }

      const status = dataObj.status
      const viewTotal = dataObj.viewTotal

      if (this.aiLoadingTimers[loadingKey]) {
        clearTimeout(this.aiLoadingTimers[loadingKey])
        this.aiLoadingTimers[loadingKey] = null
      }

      // 2. 明确正在计算
      if (status === 0) {
        this.aiLoadingState[loadingKey] = true
      } else if (status === 1) {
        if (viewTotal === 0) {
          // 只有在确定没结果时，才启用那个 3 秒的 Loading 缓冲提示
          this.aiLoadingState[loadingKey] = true
          this.aiLoadingTimers[loadingKey] = setTimeout(() => {
            this.aiLoadingState[loadingKey] = false
            this.loadTabIfNeeded(tabKey)
          }, 3000)
        } else {
          // 有结果了，关闭 Loading。
          // 此时 Template 中的 v-else-if 判定会变为 true，内容才会显示出来。
          this.aiLoadingState[loadingKey] = false
          if (tabKey && this.activeName === tabKey) {
            this.checkAndTriggerAnimation(tabKey)
          }
        }
      } else {
        this.aiLoadingState[loadingKey] = false
      }
    },

    // 触发打字机动画
    checkAndTriggerAnimation(tabName) {
      if (this.activeName !== tabName || this.hasAnimated[tabName]) return

      // 统一处理后端返回的富文本字符串：
      // 1. 去除 HTML 标签之间的多余换行和空格，防止被 CSS 的 pre-wrap 渲染出巨大空行
      // 2. 将非标签间的普通文本真实换行替换为 <br/> 保留排版
      const formatHtmlText = (text) => {
        if (!text) return ''
        return String(text).replace(/>\s+</g, '><').replace(/\n/g, '<br/>')
      }

      if (tabName === TAB_KEYS.NECESSITY && this.rawAiData.necessity && this.rawAiData.necessity.status == 1) {
        this.hasAnimated[TAB_KEYS.NECESSITY] = true
        this.startTypewriter(formatHtmlText(this.rawAiData.necessity.coreResult), 'nameAnalyze_coreResult')
        this.startTypewriter(formatHtmlText(this.rawAiData.necessity.analysisInfo), 'nameAnalyze_analysisInfo')
      }

      if (tabName === TAB_KEYS.THREE_ONE && this.rawAiData.threeOne && this.rawAiData.threeOne.status == 1) {
        this.hasAnimated[TAB_KEYS.THREE_ONE] = true

        let safeAnalyseAsset = formatHtmlText(this.rawAiData.threeOne.analyseAsset)
        this.startTypewriter(this.highlightText(safeAnalyseAsset, []), 'threeOne_analyseAsset')

        let safeCoreResult = formatHtmlText(this.rawAiData.threeOne.coreResult)
        this.startTypewriter(this.highlightText(safeCoreResult, []), 'threeOne_coreResult')

        let safeAnalysisInfo = formatHtmlText(this.rawAiData.threeOne.analysisInfo)
        this.startTypewriter(safeAnalysisInfo, 'threeOne_analysisInfo', () => {
          this.typewriterDone[TAB_KEYS.THREE_ONE] = true
        })
      }

      if (tabName === TAB_KEYS.ASSET_COMP && this.rawAiData.assetComp && this.rawAiData.assetComp.status == 1) {
        this.hasAnimated[TAB_KEYS.ASSET_COMP] = true

        let safeCoreResult = formatHtmlText(this.rawAiData.assetComp.coreResult)
        this.startTypewriter(this.highlightText(safeCoreResult, []), 'assetComp_coreResult')

        let safeAnalysisInfo = formatHtmlText(this.rawAiData.assetComp.analysisInfo)
        this.startTypewriter(safeAnalysisInfo, 'assetComp_analysisInfo', () => {
          this.typewriterDone[TAB_KEYS.ASSET_COMP] = true
        })
      }
    },

    // 清空状态
    resetAiAnimations() {
      // 1. 先停掉所有正在跑的定时器
      this.clearAllAITimers()

      // 2. 还原标志位
      this.hasAnimated = {
        [TAB_KEYS.NECESSITY]: false,
        [TAB_KEYS.THREE_ONE]: false,
        [TAB_KEYS.ASSET_COMP]: false
      }
      this.typewriterDone = {
        [TAB_KEYS.THREE_ONE]: false,
        [TAB_KEYS.ASSET_COMP]: false
      }

      // 3. 还原 AI 原始数据与 Loading 状态
      this.rawAiData = { necessity: null, threeOne: null, assetComp: null }
      this.aiLoadingState = {
        nameAnalyze: false,
        threeOne: false,
        assetComparison: false
      }

      // 4. 重置定时器容器
      this.typewriterTimers = {}
      this.aiLoadingTimers = { nameAnalyze: null, threeOne: null, assetComparison: null }
      this.aiPollingTimers = { nameAnalyze: null, threeOne: null, assetComparison: null }

      // 5. 清空打字机内容和其他业务状态
      this.streamedData = {
        nameAnalyze_coreResult: '',
        nameAnalyze_analysisInfo: '',
        threeOne_analyseAsset: '',
        threeOne_coreResult: '',
        threeOne_analysisInfo: '',
        assetComp_coreResult: '',
        assetComp_analysisInfo: ''
      }
      this.threeOneDiffData = {}
      this.assetComparisonObj = {}
      this.nameAnalyzeObj = {}
      this.data2 = []
      this.detailData = undefined
      this.diffData = undefined
      this.currentSimilarType = null
    },

    escapeHtml(text) {
      if (!text) return ''
      return text.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    },

    startTypewriter(sourceText, targetKey, onFinish) {
      if (this.typewriterTimers[targetKey]) {
        clearTimeout(this.typewriterTimers[targetKey])
      }

      if (!sourceText) {
        this.streamedData[targetKey] = ''
        if (typeof onFinish === 'function') onFinish()
        return
      }

      this.streamedData[targetKey] = ''

      let i = 0
      let currentHTML = ''
      let charsPerTick = sourceText.length > 500 ? 15 : sourceText.length > 200 ? 8 : 3

      const type = () => {
        let charsAdded = 0
        while (i < sourceText.length && charsAdded < charsPerTick) {
          if (sourceText[i] === '<') {
            let tagEnd = sourceText.indexOf('>', i)
            if (tagEnd !== -1) {
              currentHTML += sourceText.substring(i, tagEnd + 1)
              i = tagEnd + 1
              continue
            }
          }
          if (sourceText[i] === '&') {
            let entityEnd = sourceText.indexOf(';', i)
            if (entityEnd !== -1 && entityEnd - i < 10) {
              currentHTML += sourceText.substring(i, entityEnd + 1)
              i = entityEnd + 1
              charsAdded++
              continue
            }
          }

          currentHTML += sourceText[i]
          i++
          charsAdded++
        }

        if (i < sourceText.length) {
          this.streamedData[targetKey] = currentHTML + '<span class="ai-cursor-disabled"></span>'
          this.typewriterTimers[targetKey] = setTimeout(type, 100)
        } else {
          this.streamedData[targetKey] = currentHTML
          if (typeof onFinish === 'function') onFinish()
        }
      }

      this.typewriterTimers[targetKey] = setTimeout(type, 0)
    },

    highlightText(html, keywords) {
      if (!html || !keywords?.length) return html
      const container = document.createElement('div')
      container.innerHTML = html
      const walk = (node) => {
        if (node.nodeType === 3) {
          let text = node.nodeValue
          keywords.forEach((keyword) => {
            if (!keyword) return
            const regex = new RegExp(keyword, 'g')
            text = text.replace(regex, `<span class="highlight-text">${keyword}</span>`)
          })
          const span = document.createElement('span')
          span.innerHTML = text
          node.replaceWith(...span.childNodes)
        } else if (node.nodeType === 1) {
          node.childNodes.forEach(walk)
        }
      }
      container.childNodes.forEach(walk)
      return container.innerHTML
    },

    getReserveStatus() {
      CwProject.reserveStatus(this, {}).then((res) => {
        this.reserveStatus = res.data
      })
    },
    handleBack() {
      this.$router.back()
    },
    onCountdownEnd() {
      this.getDiffView()
    },

    // ============================================
    // 👇👇 原版业务方法恢复区域，不再有省略号 👇👇
    // ============================================
    onDetail(approveId) {
      this.detailData = undefined
      this.diffData = undefined
      this.$router.push({
        name: '/finance/reserveApprovalDetailTest',
        query: {
          id: approveId,
          listKey: this.approvalListKey,
          approvalRole: this.currentApprovalRoleName
        }
      })
      const tagList = this.$utils.getObjectFromSessionStorage('tagList')
      if (tagList) {
        const route = tagList.find((item) => item.formRouterName == this.$route.name)
        if (route) route.fullPath = this.$route.fullPath
      }
      this.$utils.setObjectToSessionStorage('tagList', tagList)
      this.refreshUrlParams()
      this.$message.success('操作成功')
    },
    async prevNextStep(number) {
      await this.getPreNextStatus()
      const { preId, nextId } = this.preNextIds
      if (number == 1) {
        if (preId == null) {
          this.$message.warning('没有上一条数据')
          return
        }
        this.onDetail(preId)
      }
      if (number == 2) {
        if (nextId == null) {
          this.$message.warning('没有下一条数据')
          return
        }
        this.onDetail(nextId)
      }
    },
    async getPreNextStatus() {
      const preId = await this.getPreNext(1)
      const nextId = await this.getPreNext(2)
      this.preNextIds = { preId, nextId }
    },
    getPreNext(preNext = 1) {
      const jsonStr = decodeURIComponent(this.approvalListKey)
      const listKey = JSON.parse(jsonStr)
      const cwPreNextDto = { id: this.approvalId, preNext, listKey }
      return CwProjectApprove[this.currentPageRole.preNextApi](this, { cwPreNextDto }).then((res) => res.data)
    },

    // ✨ 核心机制 3：发请求时，显式开启本页签的 Loading
    getCwProjectNecessity() {
      if (!this.dataValue.projectId) {
        this.aiLoadingState.nameAnalyze = false
        this.nameAnalyzeObj = { status: 1, viewTotal: 0 }
        return
      }

      this.aiLoadingState.nameAnalyze = true
      CwProject.cwProjectNecessityView(this, {
        projectId: this.dataValue.projectId
      })
        .then((res) => {
          const data = res.data || { status: 1, viewTotal: 0 }
          this.rawAiData.necessity = data
          this.nameAnalyzeObj = data

          // 👇 新增轮询逻辑
          if (data.status === 0 && this.activeName === this.TAB_KEYS.NECESSITY) {
            if (this.aiPollingTimers.nameAnalyze) clearTimeout(this.aiPollingTimers.nameAnalyze)
            this.aiPollingTimers.nameAnalyze = setTimeout(() => {
              // 定时器到期时再次确认是否还在当前 Tab
              if (this.activeName === this.TAB_KEYS.NECESSITY) {
                this.getCwProjectNecessity()
              }
            }, 5000)
          }
        })
        .catch((e) => {
          this.aiLoadingState.nameAnalyze = false
          this.rawAiData.necessity = { status: -1, viewTotal: 0 }
          this.nameAnalyzeObj = { status: -1, viewTotal: 0 }
          this.$message.error('实施内容合理性分析加载失败')
          throw e
        })
    },
    getThreeOneDiffView() {
      if (!this.dataValue.projectId) {
        this.aiLoadingState.threeOne = false
        this.threeOneDiffData = { status: 1, viewTotal: 0 }
        return
      }

      this.aiLoadingState.threeOne = true
      CwProject.cwProjectThreeOneDiffView(this, {
        projectId: this.dataValue.projectId
      })
        .then((res) => {
          const data = res.data || { status: 1, viewTotal: 0 }
          this.rawAiData.threeOne = data
          this.threeOneDiffData = data

          // 👇 新增轮询逻辑
          if (data.status === 0 && this.activeName === this.TAB_KEYS.THREE_ONE) {
            if (this.aiPollingTimers.threeOne) clearTimeout(this.aiPollingTimers.threeOne)
            this.aiPollingTimers.threeOne = setTimeout(() => {
              if (this.activeName === this.TAB_KEYS.THREE_ONE) {
                this.getThreeOneDiffView()
              }
            }, 5000)
          }
        })
        .catch((e) => {
          this.aiLoadingState.threeOne = false
          this.rawAiData.threeOne = { status: -1, viewTotal: 0 }
          this.threeOneDiffData = { status: -1, viewTotal: 0 }
          this.$message.error('关联资产及费用合理性分析加载失败')
          throw e
        })
    },
    getAssetComparisonData() {
      if (!this.dataValue.projectId) {
        this.aiLoadingState.assetComparison = false
        this.assetComparisonObj = { status: 1, viewTotal: 0 }
        return
      }

      this.aiLoadingState.assetComparison = true
      CwProjectAssetDiff.view(this, {
        projectId: this.dataValue.projectId
      })
        .then((res) => {
          const data = res.data || { status: 1, viewTotal: 0 }
          this.rawAiData.assetComp = data
          this.assetComparisonObj = data

          // 👇 新增轮询逻辑
          if (data.status === 0 && this.activeName === this.TAB_KEYS.ASSET_COMP) {
            if (this.aiPollingTimers.assetComparison) clearTimeout(this.aiPollingTimers.assetComparison)
            this.aiPollingTimers.assetComparison = setTimeout(() => {
              if (this.activeName === this.TAB_KEYS.ASSET_COMP) {
                this.getAssetComparisonData()
              }
            }, 5000)
          }
        })
        .catch((e) => {
          this.aiLoadingState.assetComparison = false
          this.rawAiData.assetComp = { status: -1, viewTotal: 0 }
          this.assetComparisonObj = { status: -1, viewTotal: 0 }
          this.$message.error('资产级设备判别加载失败')
          throw e
        })
    },

    getNameAnalyzeList() {
      CwProject.cwProjectNameList(this, {
        cwProjectNamesDiffDataDtoFilter: {
          projectId: this.dataValue.projectId
        }
      }).then((res) => {
        this.nameAnalyzeList = res.data?.dataList
      })
    },

    handleExport(type) {
      if (type == 1) {
        CwProjectApply.exportReviewOpinion(this, { projectId: this.dataValue?.projectId })
      }
      if (type == 2) {
        CwProjectApply.exportProposalDoc(this, { projectId: this.dataValue?.projectId })
      }
    },
    handleConfirm() {
      this.handleApprove(true, 1)
    },
    handleSetting() {
      this.$dialog
        .show('配置', similarSetting, { area: ['500px'] }, {})
        .then(() => {
          this.refreshTable(true)
        })
        .catch(() => {})
    },
    getDiffView() {
      const ApiClass = this.currentSimilarType === 'similar2' ? CwProjectItemDiff : CwProjectDiff
      ApiClass.view(this, {
        id: this.detailData.id,
        projectId: this.detailData.projectId
      }).then((res) => {
        this.diffData = res.data
        this.vectorScore = this.diffData?.vectorScore
      })
    },
    getAssistCheck() {
      CwProjectDiff.assistCheckList(this, {
        projectId: this.dataValue?.projectId
      }).then((res) => {
        this.assistCheckList = res.data
      })
    },
    clearSyncHieght() {
      this.$nextTick(() => {
        const elements = document.querySelectorAll('.projectView')
        elements.forEach((v) => {
          this.ProjectKeyValues.forEach((item) => {
            const element = v.querySelector('#' + item.value)
            if (element) {
              element.style.height = ''
            }
          })
        })
      })
    },
    syncHeights() {
      this.$nextTick(() => {
        setTimeout(() => {
          const [elementA, elementB] = document.querySelectorAll('.projectView')
          this.ProjectKeyValues.forEach((item) => {
            const _elementA = elementA.querySelector('#' + item.value)
            const _elementB = elementB.querySelector('#' + item.value)
            if (_elementA && _elementB) {
              const maxHeight = Math.max(_elementA.offsetHeight, _elementB.offsetHeight)
              _elementA.style.height = `${maxHeight}px`
              _elementB.style.height = `${maxHeight}px`
            }
          })
          this.unmountScrollSync = this.syncScroll(elementA, elementB)
        }, 800)
      })
    },
    handleScroll(elementToSync, event) {
      elementToSync.scrollTop = event.target.scrollTop
    },
    syncScroll(element1, element2) {
      const handleScroll1 = (event) => this.handleScroll(element2, event)
      const handleScroll2 = (event) => this.handleScroll(element1, event)
      element1.addEventListener('scroll', handleScroll1)
      element2.addEventListener('scroll', handleScroll2)
      return function unmount() {
        element1.removeEventListener('scroll', handleScroll1)
        element2.removeEventListener('scroll', handleScroll2)
      }
    },
    handleSelect(item) {
      this.$nextTick(() => {
        setTimeout(() => {
          const [elementA] = document.querySelectorAll('.projectView')
          elementA.scrollTop = elementA.scrollTop + 1
          elementA.scrollTop = elementA.scrollTop - 1
        }, 100)
      })
    },
    async handleApprove(confirm, status, params) {
      const rejectReasonPromise = () => {
        return new Promise((resolve, reject) => {
          this.$dialog
            .show('驳回理由', rejectReason, { area: ['600px'] })
            .then(async ({ reason }) => {
              resolve(reason)
            })
            .catch((e) => {
              reject(e)
            })
        })
      }
      let remark
      if (status == 0) {
        remark = await rejectReasonPromise()
      } else if (confirm) {
        await this.$confirm('确认审核通过?')
      }
      CwProjectApprove[`${this.currentPageRole.apiSuffix}Approve`](this, {
        cwApproveDto: {
          remark,
          status,
          projectId: this.dataValue?.projectId,
          id: this.approvalId,
          ...params
        }
      }).then(() => {
        this.$message.success('操作成功')
        setTimeout(() => {
          this.refreshTable(true)
          this.getFollowupInfo(this)
        }, 4000)
      })
    },
    handleAIRejudge() {
      this.$confirm('确认AI重审？')
        .then(() => {
          CwProjectDiff.retryDiffProject(this, {
            projectId: this.dataValue.projectId
          }).then(() => {
            this.$message.success('AI重审已触发')

            // 重置数据并重新获取
            this.rawAiData.necessity = null
            this.rawAiData.threeOne = null
            this.rawAiData.assetComp = null

            // 重置动画状态
            this.hasAnimated[this.TAB_KEYS.NECESSITY] = false
            this.hasAnimated[this.TAB_KEYS.THREE_ONE] = false
            this.hasAnimated[this.TAB_KEYS.ASSET_COMP] = false

            this.typewriterDone[this.TAB_KEYS.THREE_ONE] = false
            this.typewriterDone[this.TAB_KEYS.ASSET_COMP] = false

            // 重新获取数据
            this.getCwProjectNecessity()
            this.getThreeOneDiffView()
            this.getAssetComparisonData()

            // 刷新两个相似分析
            this.$refs.similarAnalysis?.getList()
            this.$refs.similarAnalysis2?.getList()
          })
        })
        .catch(() => {})
    },
    getRowClassName({ row }) {
      if (row.matchStatus == 3) {
        return 'red-row'
      } else if (row.matchStatus == 2) {
        return 'orange-row'
      }
      return ''
    },
    getApprovalList() {
      CwProject.approvalLog(this, {
        cwProjectApproveDtoFilter: {
          projectId: this.dataValue.projectId
        }
      }).then((res) => {
        this.approvalList = res.data?.dataList
      })
    },
    getType(type) {
      let _type = 'primary'
      switch (+type) {
        case this.StatusReserveDict.PENDING_SUBMIT:
          _type = 'info'
          break
        case this.StatusReserveDict.REJECTED || this.StatusReserveDict.DELAYED:
          _type = 'warning'
          break
        case this.StatusReserveDict.PRE_REVIEW_COMPLETED:
          _type = 'success'
          break
      }
      return _type
    },
    ifConfirm(msg, callback = () => {}) {
      return this.$confirm(msg).then(() => {
        callback()
      })
    },
    async tabClick(event) {},
    getInfo() {
      this.refreshTable(true)
    },

    // ✨ 核心机制 4：将需要懒加载的接口从初始化方法中移除
    async refreshTable() {
      this.resetAiAnimations()

      await this.loadData()
      this.getApprovalList()
      this.projectRiskInfo()
      this.getAssistCheck()
      this.getNameAnalyzeList() // 项目名称分析保持初加载

      // 初始化检查当前激活的是哪个 Tab，按需触发懒加载
      this.loadTabIfNeeded(this.activeName)

      this.$refs.projectView?.initFormData()
    },

    loadData() {
      return new Promise((resolve, reject) => {
        CwProjectApprove[`${this.currentPageRole.apiSuffix}View`](this, {
          id: this.approvalId
        })
          .then((res) => {
            if (res) {
              this.dataValue = res.data
            }
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    loadTableVerify() {
      return true
    },
    handleSubmit() {},
    handleCancel() {},
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    onSubmit() {
      this.onCancel(true)
    },
    ...mapMutations(['removeTag'])
  },
  computed: {
    necessaryKeyValues() {
      return [{ name: '分析结论', value: 'resultContent' }]
    },
    approvalId() {
      return this.id || this.$route.query.id
    },
    approvalListKey() {
      return this.listKey || this.$route.query.listKey
    },
    currentApprovalRoleName() {
      return this.$route.query.approvalRole || this.approvalRole || this.$route.name
    },
    currentPageRole() {
      return this.pageRoleMap[this.currentApprovalRoleName] || this.pageRoleMap.deptApprovalDetail
    },
    isFinance() {
      return this.currentApprovalRoleName === 'financeApprovalDetail'
    },
    InfoKeyValues() {
      return [
        // { label: '申请人', prop: 'createUserName' },
        { label: '申请时间', prop: 'createTime', formatter: (value) => value },
        { label: '申请部门', prop: 'workDeptName' },
        // { label: '审批时间', prop: 'approveTime', formatter: (value) => value },
        { label: '审批意见', prop: 'approveDesc' }
      ]
    },
    ProjectKeyValues() {
      return this.$refs.projectView?.KeyValues.filter((item) => item) || []
    },
    ...mapGetters(['getCurrentMenuId', 'getUserInfo'])
  },
  watch: {
    // 🌟 监听 Tab 切换，按需触发懒加载
    activeName(val) {
      this.loadTabIfNeeded(val)
    },

    // 🌟 深层监听并传入当前对应的 Tab Key
    nameAnalyzeObj: {
      handler(val) {
        this.handleAILoading('nameAnalyze', val, this.TAB_KEYS.NECESSITY)
      },
      deep: true
    },
    threeOneDiffData: {
      handler(val) {
        this.handleAILoading('threeOne', val, this.TAB_KEYS.THREE_ONE)
      },
      deep: true
    },
    assetComparisonObj: {
      handler(val) {
        this.handleAILoading('assetComparison', val, this.TAB_KEYS.ASSET_COMP)
      },
      deep: true
    },

    approvalId: {
      handler(val, oldVal) {
        if (val && val != oldVal) {
          this.refreshTable(true)
          this.getPreNextStatus()
        }
      }
    },
    detailData: {
      handler(val, oldVal) {
        if (val && !oldVal) {
          this.getDiffView()
        } else {
          this.$refs.similarAnalysis?.getList()
          this.$refs.similarAnalysis2?.getList()
          this.clearSyncHieght()
        }
      },
      deep: true
    },
    id: {
      handler(val, oldVal) {
        if (val !== oldVal) {
          this.refreshTable(true)
        }
      }
    }
  }
}
</script>

<style lang="scss">
.rr-view-ctx-card:has(.reserveApprovalDetail) {
  background: transparent;
}
</style>

<style lang="scss" scoped>
.reserveApprovalDetail {
  &__main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .container-item {
    margin-left: 16px;
    margin-right: 16px;
    display: flex;
    flex-direction: column;
    :deep(.dashboardContainer__header) {
      padding-left: 26px;
    }
  }

  // configText 注释后顶部概览只剩标题栏：隐藏空出的内容区（含 el-empty 占位），并固定高度不被压缩，让下方内容撑满剩余空间
  .container-item.grassEffect {
    flex-shrink: 0;
    :deep(.dashboardContainer__body) {
      display: none;
    }
  }
}

:deep(.el-button--primary-blue) {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;

  &:hover,
  &:focus {
    color: #409eff;
    background: #d9ecff;
    border-color: #409eff;
  }

  &:active {
    color: #337ecc;
    background: #d9ecff;
    border-color: #337ecc;
  }
}

.detailBody__view {
  &--layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  &-item {
    &:not(:first-child) {
      margin-left: 0;
    }
    margin-bottom: 0 !important;
    box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.16);
    min-height: 100%;
  }
  &-item--grow {
    flex: 1;
    min-width: 0;
  }
}

.detailBody__tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  .full-tabpane {
    height: 100%;
  }
  &--view {
    height: 100%;
    padding: 0 10px 10px;
    position: relative;
    box-sizing: border-box;
    &.detailBody__tab--view--scroll {
      overflow: auto;
    }
  }
  :deep(.el-tabs__nav) {
    padding-left: 25px;
  }
  :deep(.el-tabs__active-bar) {
    left: 25px;
  }
  :deep(.el-tabs__item) {
    font-size: 15px !important;
    height: 48px;
    line-height: 48px;
    font-weight: bold !important;
  }
  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
}

.ai-analysis-view {
  padding: 10px;
  border-top: 1px solid #ebeef5;
  background: #ffffff;
}

.ai-loading-panel,
.ai-empty-boundary {
  width: 100%;
  height: 100%;
  min-height: 260px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
}

.ai-loading-panel {
  display: flex;
  align-items: stretch;
  justify-content: stretch;

  :deep(.diffuse-card-wrapper) {
    min-height: 100%;
    border-radius: 4px;
    box-shadow: none;
  }

  :deep(.diffuse-card-inner) {
    border-radius: 3px;
  }
}

.ai-empty-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-nav-icon--left {
  margin-right: 4px;
}

.detail-nav-icon--right {
  margin-left: 4px;
}

.tab-title {
  position: relative;
  &.tag {
    display: flex;
    align-items: center;
    gap: 5px;
    .base-tag {
      position: absolute;
      left: calc(100% + 6px);
    }
  }
}

.ai-dot {
  position: absolute;
  right: -12px;
  top: -4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;

  &.ai-dot-success {
    background-color: #67c23a;
  }

  &.ai-dot-danger {
    background-color: #f56c6c;
  }

  &.ai-dot-warning {
    background-color: #e6a23c;
  }

  &.ai-dot-yellow {
    background-color: #e6a23c;
  }
}

.badge {
  position: absolute;
  right: -20px;
  top: 0;
  background: #f56c6c;
  color: white;
  border-radius: 10px;
  padding: 3px 5px;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}

.full-table {
  height: 100%;
  :deep(.vxe-table-box) {
    height: 100% !important;
  }
}

.outAnalysis {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  line-height: 48px;
  height: 48px;
  margin-right: 10px;
  &__tip {
    font-size: 14px;
    color: $--color-primary;
    font-weight: 600;
    margin-right: 10px;
  }
  &__icon {
    cursor: pointer;
    font-size: 22px;
    transition: color 0.15s linear;
    &:hover {
      color: $--color-primary;
    }
  }
}

.review-card {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  + .review-card {
    margin-top: 16px;
  }
  &__header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between; /* 新增: 两端对齐 */
    align-items: center; /* 新增: 垂直居中 */

    .title {
      font-weight: 600;
      font-size: 14px;
    }
  }

  &__content {
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.review-card.result-card {
  border: 1px solid #ffd591;
  background: #fff7e6;

  .review-card__header {
    background: #fff1e6;

    .title {
      color: #d46b08;
    }
  }

  .review-card__content {
    color: #d46b08;
  }
}

.review-card.result-card.green {
  border: 1px solid #b7eb8f;
  background: #f6ffed;

  .review-card__header {
    background: #f0f9eb;

    .title {
      color: #2f7a2f;
    }
  }

  .review-card__content {
    color: #2f7a2f;
  }
}

.review-card.conclusion-card {
  border: 1px solid #b7eb8f;
  background: #f6ffed;

  .review-card__header {
    background: #f0f9eb;

    .title {
      color: #2f7a2f;
    }
  }

  .review-card__content {
    color: #2f7a2f;
  }
}

.review-card.conclusion-card.yellow {
  border: 1px solid #f5d999;
  background: #fff8e1;

  .review-card__header {
    background: #ffefc6;

    .title {
      color: #e1a400;
    }
  }

  .review-card__content {
    color: #e1a400;
  }
}

.review-card.conclusion-card.orange {
  border: 1px solid #ffc9a3;
  background: #fff1e6;

  .review-card__header {
    background: #ffe6d3;

    .title {
      color: #ff7700;
    }
  }

  .review-card__content {
    color: #ff7700;
  }
}

.review-card.analysis-card {
  border: 1px solid #d9d9d9;
  background: #fafafa;

  .review-card__header {
    background: #f5f5f5;

    .title {
      color: #595959;
    }
  }

  .review-card__content {
    color: #595959;
  }
}

.review-card.note-card {
  border: 1px solid #ffccc7;
  background: #fff2f0;

  .review-card__header {
    background: #fff1f0;

    .title {
      color: #ff4d4f;
    }
  }

  .review-card__content {
    color: #ff4d4f;
  }
}

.detail-table {
  min-height: 350px;
  border-radius: 4px;
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 0;
}

.detail-table :deep(.vxe-body--row.red-row) {
  background-color: #fef0f0;
}

.detail-table :deep(.vxe-body--row.orange-row) {
  background-color: #fff7e6;
}

.detail-table :deep(.vxe-body--row.red-row .vxe-cell--label),
.detail-table :deep(.vxe-body--row.red-row .vxe-cell--content) {
  color: #f56c6c;
}

.detail-table :deep(.vxe-body--row.orange-row .vxe-cell--label),
.detail-table :deep(.vxe-body--row.orange-row .vxe-cell--content) {
  color: #e6a23c;
}

.ai-loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  min-height: 100px;
  flex-direction: column;
  gap: 16px;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #008566;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
  }
}

.loading-text {
  color: #6c757d;
  font-size: 0.95rem;
  margin: 0;
  letter-spacing: 0.3px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.review-card__content {
  position: relative;
}

.relative {
  position: relative;
}

.ai-unified-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 245, 0.95) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  .ai-loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    position: relative;
  }

  .ai-brain-icon {
    position: relative;
    width: 80px;
    height: 80px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 20px rgba(0, 133, 102, 0.15);

    i {
      font-size: 40px;
      color: #008566;
      z-index: 2;
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid #008566;
      border-radius: 50%;
      animation: ai-pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    }
  }

  .ai-loading-text {
    text-align: center;

    .shiny-text {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(90deg, #008566, #36ad6a, #008566);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: text-shine 2s linear infinite;
    }

    p {
      margin-top: 8px;
      color: #909399;
      font-size: 14px;
      letter-spacing: 1px;
    }
  }
}

@keyframes ai-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

@keyframes text-shine {
  to {
    background-position: 200% center;
  }
}

@keyframes ai-scan {
  0% {
    top: -100%;
  }
  100% {
    top: 150%;
  }
}

:deep(.ai-thinking-text) {
  color: currentColor;
  font-size: 14px;
  letter-spacing: 1px;
  animation: ai-thinking-pulse 0.8s ease-in-out infinite;
}

@keyframes ai-thinking-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

:deep(.ai-cursor) {
  display: inline-block;
  width: 1px;
  height: 1.1em;
  background-color: currentColor;
  vertical-align: -0.15em;
  margin-left: 4px;
  border-radius: 2px;
  animation: ai-cursor-breathe 1.5s ease-in-out infinite;
}

@keyframes ai-cursor-breathe {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

.ai-fade-in-up {
  animation: ai-fade-in-up-anim 0.6s ease-out forwards;
}

@keyframes ai-fade-in-up-anim {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
