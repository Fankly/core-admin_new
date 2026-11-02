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

        <template v-slot:extra>
          <!-- <el-button plain type="primary-blue" @click="handleAIRejudge">
            <span style="display: inline-flex; align-items: center; vertical-align: middle">
              <svg
                style="width: 14px; height: 14px; margin-right: 8px; display: block"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 40.8331C26.123 42.7333 28.9266 43.8887 32 43.8887C38.6274 43.8887 44 38.5161 44 31.8887C44 26.5878 40.5629 22.0897 35.7957 20.5015"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M27.1711 27.4992C27.7058 28.8588 27.9995 30.3397 27.9995 31.8891C27.9995 38.5165 22.6269 43.8891 15.9995 43.8891C9.37209 43.8891 3.99951 38.5165 3.99951 31.8891C3.99951 26.5741 7.45492 22.0662 12.2418 20.4893"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M24 27.8892C30.6274 27.8892 36 22.5166 36 15.8892C36 9.26174 30.6274 3.88916 24 3.88916C17.3726 3.88916 12 9.26174 12 15.8892C12 22.5166 17.3726 27.8892 24 27.8892Z"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>AI重审</span>
            </span>
          </el-button> -->
          <!-- <span style="border-left: 1px solid #dcdfe6; height: 28px; margin: 0 12px; display: inline-block"></span> -->
          <!-- <el-button plain @click="() => handleApprove(false, 0)" type="danger" icon="el-icon-refresh-left"> 驳回 </el-button> -->

          <!-- <el-button
            plain
            @click="() => (currentPageRole.needConfirmDialog ? handleConfirm() : handleApprove(true, 1))"
            type="primary"
            icon="el-icon-check"
          >
            通过
          </el-button> -->
          <!-- <el-button plain @click="prevNextStep(1)"> <i class="el-icon-arrow-left detail-nav-icon--left"></i>上一个 </el-button> -->
          <!-- <el-button plain @click="prevNextStep(2)"> 下一个<i class="el-icon-arrow-right detail-nav-icon--right"></i> </el-button> -->
          <el-button v-if="!embedded" plain circle :icon="EpBack" style="margin-left: 20px" @click="handleBack"></el-button>
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
              <div class="detailBody__tab--view detailBody__tab--view--scroll">
                <!-- <AILoading /> -->
                <div v-if="aiLoadingState.nameAnalyze" class="AILoading">
                  <AILoading />
                </div>
                <!-- 仅在计算完成且不在加载时显示 -->
                <template v-else-if="!aiLoadingState.nameAnalyze && nameAnalyzeObj && nameAnalyzeObj.status === 1">
                  <div class="review-card conclusion-card" :class="nameAnalyzeObj?.aiRiskLevel == 1 ? 'yellow' : ''">
                    <div class="review-card__header">
                      <span class="title">AI审核结果</span>
                      <span v-if="showRerunBtn" class="rerun-btn" @click="handleRerun(RERUN_TYPE.NECESSITY)"
                        ><el-icon class="ep-icon-refresh-right"><EpRefreshRight /></el-icon> 重新分析</span
                      >
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
              <div class="detailBody__tab--view detailBody__tab--view--scroll">
                <div v-if="aiLoadingState.threeOne" class="AILoading">
                  <AILoading />
                </div>
                <template v-else-if="!aiLoadingState.threeOne && threeOneDiffData && threeOneDiffData.status === 1">
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
                      <span v-if="showRerunBtn" class="rerun-btn" @click="handleRerun(RERUN_TYPE.THREE_ONE)"
                        ><el-icon class="ep-icon-refresh-right"><EpRefreshRight /></el-icon> 重新分析</span
                      >
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
              <div class="detailBody__tab--view detailBody__tab--view--scroll">
                <div v-if="aiLoadingState.assetComparison" class="AILoading">
                  <AILoading />
                </div>
                <template v-else-if="!aiLoadingState.assetComparison && assetComparisonObj && assetComparisonObj.status === 1">
                  <div class="review-card conclusion-card" :class="assetComparisonObj?.aiRiskLevel == 1 ? 'orange' : ''">
                    <div class="review-card__header">
                      <span class="title">AI审核结果</span>
                      <span v-if="showRerunBtn" class="rerun-btn" @click="handleRerun(RERUN_TYPE.ASSET_COMP)"
                        ><el-icon class="ep-icon-refresh-right"><EpRefreshRight /></el-icon> 重新分析</span
                      >
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

            <!-- 7. 审批记录 -->
            <!-- <el-tab-pane :name="TAB_KEYS.APPROVAL_RECORD">
              <template #label>
                <el-tooltip
                  popper-class="ai-tooltip-green"
                  effect="dark"
                  :content="tabInfo[TAB_KEYS.APPROVAL_RECORD].tooltip"
                  placement="top"
                  :disabled="!tabInfo[TAB_KEYS.APPROVAL_RECORD].tooltip"
                >
                  <span class="tab-title">{{ tabInfo[TAB_KEYS.APPROVAL_RECORD].label }}</span>
                </el-tooltip>
              </template>
              <projectViewItem
                class="approval--view control--buttons"
                style="padding: 0px 25px"
                :dataValue="{ ...dataValue }"
                :keyValues="[{ value: 'record', name: '审批记录', slot: true }]"
              >
                <template #recordLabelSlot>
                  <div class="labelTips">
                    <el-button @click="handleExport(2)" size="small" icon="el-icon-download">项目建议书</el-button>
                  </div>
                </template>
                <template #record>
                  <table-box ref="approvalBox" stripe :hasExtend="false" :data="approvalList">
                    <vxe-column title="审核结果" field="approveStatus">
                      <template #default="{ row }"
                        ><span>{{ row.approveStatus == '2' ? '通过' : '驳回' }}</span></template
                      >
                    </vxe-column>
                    <vxe-column title="审批意见" field="approveDesc" />
                    <vxe-column title="审批人" field="approveUserName" />
                    <vxe-column title="审批部门" field="approveDeptName" />
                    <vxe-column title="审核时间" field="approveTime">
                      <template #default="scope">
                        <span>{{ formatDateByStatsType(scope.row.approveTime, 'datetime') }}</span>
                      </template>
                    </vxe-column>
                  </table-box>
                </template>
              </projectViewItem>
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
          <template v-slot:extra>
            <div class="extra--button" v-if="detailData">
              <el-button
                :icon="EpBack"
                @click="
                  () => {
                    $refs.projectView?.clearDiff()
                    detailData = null
                    diffData = null
                    currentSimilarType = null
                  }
                "
                >返回</el-button
              >
            </div>
          </template>
          <projectView
            v-if="diffData && diffData.status == 1"
            @item-change="() => syncHeights()"
            diffKey="diffText"
            :diffData="diffData"
            :id="detailData.id"
            :projectId="detailData.diffProjectId"
            @onRerun="() => handleRerun(currentSimilarType == 'similar' ? RERUN_TYPE.SIMILAR : RERUN_TYPE.SIMILAR_2, detailData)"
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
          <template v-slot:extra>
            <div class="extra--button" v-if="sameItemData">
              <el-button
                :icon="EpBack"
                @click="
                  () => {
                    sameItemData = undefined
                  }
                "
                >返回</el-button
              >
            </div>
          </template>
          <projectView v-if="sameItemData?.cwProjectVo?.projectId" ref="projectView" :projectId="sameItemData?.cwProjectVo?.projectId" />
        </DashboardContainer>
      </div>
    </div>
  </singleContainer>
</template>

<script setup>
import { TAB_KEYS, RERUN_TYPE } from './index.module'
import { Back as EpBack, RefreshRight as EpRefreshRight } from '@element-plus/icons-vue'
import configText from '@/views/finance/components/configText.vue'
import {
  CwProjectAssetDiff,
  CwProjectDiff,
  CwProject,
  CwProjectApply,
  CwProjectClosure,
  CwProjectApprove,
  CwProjectItemDiff
} from '@/api/mainController'
import rejectReason from '@/components/RejectReason/index.vue'
import similarAnalysis from '../components/similarAnalysis_new.vue'
import sameItemAnalysis from '../components/sameItemAnalysis.vue'
import projectView from '../components/projectView.vue'
import similarSetting from '../components/similarSetting.vue'
import projectViewItem from '../components/projectViewItem.vue'
import ApprovalConfirmDialog from './ApprovalConfirmDialog.vue'
import projectSSE from '../components/projectSSE/index.vue'
import _ from 'lodash'

// 抽取所有Tab关联项避免硬编码
import componentStore from '@/store/business'
import { useProjectConfig, useUpload, useStatsDateRange, useCachedSinglePage } from '@/core/composables/useWorkspace'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  proxyRefs,
  computed,
  toRef,
  nextTick,
  reactive,
  toRefs,
  watch,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  getCurrentInstance,
  useTemplateRef
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
defineOptions({
  name: '/finance/approvalDetail/index'
})
const componentProps = defineProps({
  // originCallback: {
  //   type: [Function]
  // }
  _key: {
    type: [Number, String],
    default: undefined
  },
  _origin: {
    type: String
  },
  id: {
    type: String
  },
  listKey: {
    type: String
  },
  // 指定审批角色（抽屉/嵌入场景使用，路由场景仍优先读取 query.approvalRole）
  approvalRole: {
    type: String
  },
  // 嵌入模式（如在抽屉中打开），隐藏页面内的返回按钮，交由外层容器关闭
  embedded: {
    type: Boolean,
    default: false
  }
})
const componentInstance = getCurrentInstance().proxy
const route = useRoute()
const router = useRouter()
const projectViewRef = useTemplateRef('projectView')
const similarAnalysisRef = useTemplateRef('similarAnalysis')
const similarAnalysis2Ref = useTemplateRef('similarAnalysis2')
const ProjectConfigState = proxyRefs(useProjectConfig())
const openAdmin = toRef(ProjectConfigState, 'openAdmin')
const UploadState = proxyRefs(useUpload())
const parseUploadData = toRef(UploadState, 'parseUploadData')
const getPictureList = toRef(UploadState, 'getPictureList')
const fileListToJson = toRef(UploadState, 'fileListToJson')
const getUploadFileUrl = toRef(UploadState, 'getUploadFileUrl')
const filterEmptyValues = toRef(UploadState, 'filterEmptyValues')
const getUploadFileUrlByFetch = toRef(UploadState, 'getUploadFileUrlByFetch')
const getUploadActionUrl = toRef(UploadState, 'getUploadActionUrl')
const pictureFile = toRef(UploadState, 'pictureFile')
const getUploadHeaders = toRef(UploadState, 'getUploadHeaders')
const StatsDateRangeState = proxyRefs(useStatsDateRange())
const getDateRangeFilter = toRef(StatsDateRangeState, 'getDateRangeFilter')
const formatDateByStatsType = toRef(StatsDateRangeState, 'formatDateByStatsType')
const formatDateTime = toRef(StatsDateRangeState, 'formatDateTime')
const getStatsTypeShowName = toRef(StatsDateRangeState, 'getStatsTypeShowName')
const getAllowStatsTypeList = toRef(StatsDateRangeState, 'getAllowStatsTypeList')
const CachedSinglePageState = proxyRefs(useCachedSinglePage(componentProps))
const routerPush = toRef(CachedSinglePageState, 'routerPush')
const singlePageReload = toRef(CachedSinglePageState, 'singlePageReload')
const oncancel = toRef(CachedSinglePageState, 'oncancel')
const refreshUrlParams = toRef(CachedSinglePageState, 'refreshUrlParams')
const savedKey = toRef(CachedSinglePageState, 'savedKey')
const componentData = reactive({
  projectRiskData: {},
  TAB_KEYS,
  RERUN_TYPE,
  // 测试用：控制重跑按钮显示
  showRerunBtnTest: false,
  // process.env.NODE_ENV === 'development',
  tabInfo: {
    [TAB_KEYS.PROJECT_INFO]: {
      label: '项目信息',
      tooltip: ''
    },
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
    [TAB_KEYS.THREE_AREA]: {
      label: '三区三县比对',
      tooltip: ''
    },
    [TAB_KEYS.APPROVAL_RECORD]: {
      label: '审批记录',
      tooltip: ''
    },
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
  preNextIds: {
    nextId: false,
    preId: false
  },
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
})
const projectRiskData = toRef(componentData, 'projectRiskData')
const showRerunBtnTest = toRef(componentData, 'showRerunBtnTest')
const tabInfo = toRef(componentData, 'tabInfo')
const streamedData = toRef(componentData, 'streamedData')
const typewriterTimers = toRef(componentData, 'typewriterTimers')
const rawAiData = toRef(componentData, 'rawAiData')
const hasAnimated = toRef(componentData, 'hasAnimated')
const typewriterDone = toRef(componentData, 'typewriterDone')
const data = toRef(componentData, 'data')
const data2 = toRef(componentData, 'data2')
const reserveStatus = toRef(componentData, 'reserveStatus')
const sameItemList = toRef(componentData, 'sameItemList')
const detailData = toRef(componentData, 'detailData')
const sameItemData = toRef(componentData, 'sameItemData')
const diffData = toRef(componentData, 'diffData')
const currentSimilarType = toRef(componentData, 'currentSimilarType')
const indexStatus = toRef(componentData, 'indexStatus')
const activeName = toRef(componentData, 'activeName')
const dataValue = toRef(componentData, 'dataValue')
const projectViewData = toRef(componentData, 'projectViewData')
const approvalList = toRef(componentData, 'approvalList')
const nameAnalyzeList = toRef(componentData, 'nameAnalyzeList')
const assetComparisonObj = toRef(componentData, 'assetComparisonObj')
const assistCheckList = toRef(componentData, 'assistCheckList')
const unmountScrollSync = toRef(componentData, 'unmountScrollSync')
const analysisTableData = toRef(componentData, 'analysisTableData')
const threeOneDiffData = toRef(componentData, 'threeOneDiffData')
const nameAnalyzeObj = toRef(componentData, 'nameAnalyzeObj')
const nameAnalyzeLoading = toRef(componentData, 'nameAnalyzeLoading')
const aiLoadingState = toRef(componentData, 'aiLoadingState')
const aiLoadingTimers = toRef(componentData, 'aiLoadingTimers')
const aiPollingTimers = toRef(componentData, 'aiPollingTimers')
const preNextIds = toRef(componentData, 'preNextIds')
const pageRoleMap = toRef(componentData, 'pageRoleMap')
componentData.vectorScore = undefined
const vectorScore = toRef(componentData, 'vectorScore')
function removeTag(payload) {
  return componentStore.commit('removeTag', payload)
}
async function projectRiskInfo() {
  const res = await CwProjectDiff.projectRiskInfo(componentInstance, {
    projectId: componentData.dataValue.projectId
  })
  componentData.projectRiskData = res.data || {}
}
function clearAllAITimers() {
  const timerGroups = ['typewriterTimers', 'aiLoadingTimers', 'aiPollingTimers']
  timerGroups.forEach((groupName) => {
    if (componentData[groupName]) {
      Object.values(componentData[groupName]).forEach((timer) => {
        if (timer) clearTimeout(timer)
      })
    }
  })
}
// === 新增：重跑占位方法 ===
function handleRerun(type, item = {}) {
  const { id, diffProjectId } = item
  CwProjectDiff.retryDiff(componentInstance, {
    diffId: id,
    type: type,
    projectId: diffProjectId || componentData.dataValue.projectId
  }).then(() => {
    // 如果是相似分析，需要进入 projectSSE
    if (type === componentData.RERUN_TYPE.SIMILAR || type === componentData.RERUN_TYPE.SIMILAR_2) {
      componentData.currentSimilarType = type === componentData.RERUN_TYPE.SIMILAR ? 'similar' : 'similar2'
      componentData.detailData = item
      componentData.diffData = undefined // 清空 diffData，让 projectSSE 显示
      projectViewRef.value?.clearDiff()
      getDiffView()
    } else {
      // 非相似分析，重新执行懒加载，相当于第一次进入
      if (type === componentData.RERUN_TYPE.NECESSITY) {
        // 必要性分析
        componentData.rawAiData.necessity = null
        componentData.hasAnimated[componentData.TAB_KEYS.NECESSITY] = false
        getCwProjectNecessity()
      } else if (type === componentData.RERUN_TYPE.THREE_ONE) {
        // 三比一挂钩分析
        componentData.rawAiData.threeOne = null
        componentData.hasAnimated[componentData.TAB_KEYS.THREE_ONE] = false
        componentData.typewriterDone[componentData.TAB_KEYS.THREE_ONE] = false
        getThreeOneDiffView()
      } else if (type === componentData.RERUN_TYPE.ASSET_COMP) {
        // 同源资产比对
        componentData.rawAiData.assetComp = null
        componentData.hasAnimated[componentData.TAB_KEYS.ASSET_COMP] = false
        componentData.typewriterDone[componentData.TAB_KEYS.ASSET_COMP] = false
        getAssetComparisonData()
      }
    }
  })
}
// ✨ 核心机制 1：懒加载调度方法
function loadTabIfNeeded(tabName) {
  if (tabName === componentData.TAB_KEYS.NECESSITY) {
    // 👇 修改：增加 status === 0 的判断，切回 tab 时如果是 0 重新触发查询
    if (!componentData.rawAiData.necessity || componentData.rawAiData.necessity.status === 0) getCwProjectNecessity()
    else checkAndTriggerAnimation(tabName)
  } else if (tabName === componentData.TAB_KEYS.THREE_ONE) {
    // 👇 修改同上
    if (!componentData.rawAiData.threeOne || componentData.rawAiData.threeOne.status === 0) getThreeOneDiffView()
    else checkAndTriggerAnimation(tabName)
  } else if (tabName === componentData.TAB_KEYS.ASSET_COMP) {
    // 👇 修改同上
    if (!componentData.rawAiData.assetComp || componentData.rawAiData.assetComp.status === 0) getAssetComparisonData()
    else checkAndTriggerAnimation(tabName)
  }
}
// ✨ 核心机制 2：响应深层监听，控制 Loading 并触发打字机
function handleAILoading(loadingKey, dataObj, tabKey) {
  // 1. 如果后端返回空，或者数据还没回来，或者被重置了
  // 此时既不显示 Loading 也不显示 Else 内容，直接返回
  if (!dataObj || Object.keys(dataObj).length === 0) {
    componentData.aiLoadingState[loadingKey] = false
    return
  }
  const status = dataObj.status
  const viewTotal = dataObj.viewTotal
  if (componentData.aiLoadingTimers[loadingKey]) {
    clearTimeout(componentData.aiLoadingTimers[loadingKey])
    componentData.aiLoadingTimers[loadingKey] = null
  }

  // 2. 明确正在计算
  if (status === 0) {
    componentData.aiLoadingState[loadingKey] = true
  } else if (status === 1) {
    if (viewTotal === 0) {
      // 只有在确定没结果时，才启用那个 3 秒的 Loading 缓冲提示
      componentData.aiLoadingState[loadingKey] = true
      componentData.aiLoadingTimers[loadingKey] = setTimeout(() => {
        componentData.aiLoadingState[loadingKey] = false
        loadTabIfNeeded(tabKey)
      }, 3000)
    } else {
      // 有结果了，关闭 Loading。
      // 此时 Template 中的 v-else-if 判定会变为 true，内容才会显示出来。
      componentData.aiLoadingState[loadingKey] = false
      if (tabKey && componentData.activeName === tabKey) {
        checkAndTriggerAnimation(tabKey)
      }
    }
  } else {
    componentData.aiLoadingState[loadingKey] = false
  }
}
// 触发打字机动画
function checkAndTriggerAnimation(tabName) {
  if (componentData.activeName !== tabName || componentData.hasAnimated[tabName]) return

  // 统一处理后端返回的富文本字符串：
  // 1. 去除 HTML 标签之间的多余换行和空格，防止被 CSS 的 pre-wrap 渲染出巨大空行
  // 2. 将非标签间的普通文本真实换行替换为 <br/> 保留排版
  const formatHtmlText = (text) => {
    if (!text) return ''
    return String(text).replace(/>\s+</g, '><').replace(/\n/g, '<br/>')
  }
  if (tabName === TAB_KEYS.NECESSITY && componentData.rawAiData.necessity && componentData.rawAiData.necessity.status == 1) {
    componentData.hasAnimated[TAB_KEYS.NECESSITY] = true
    startTypewriter(formatHtmlText(componentData.rawAiData.necessity.coreResult), 'nameAnalyze_coreResult')
    startTypewriter(formatHtmlText(componentData.rawAiData.necessity.analysisInfo), 'nameAnalyze_analysisInfo')
  }
  if (tabName === TAB_KEYS.THREE_ONE && componentData.rawAiData.threeOne && componentData.rawAiData.threeOne.status == 1) {
    componentData.hasAnimated[TAB_KEYS.THREE_ONE] = true
    let safeAnalyseAsset = formatHtmlText(componentData.rawAiData.threeOne.analyseAsset)
    startTypewriter(highlightText(safeAnalyseAsset, []), 'threeOne_analyseAsset')
    let safeCoreResult = formatHtmlText(componentData.rawAiData.threeOne.coreResult)
    startTypewriter(highlightText(safeCoreResult, []), 'threeOne_coreResult')
    let safeAnalysisInfo = formatHtmlText(componentData.rawAiData.threeOne.analysisInfo)
    startTypewriter(safeAnalysisInfo, 'threeOne_analysisInfo', () => {
      componentData.typewriterDone[TAB_KEYS.THREE_ONE] = true
    })
  }
  if (tabName === TAB_KEYS.ASSET_COMP && componentData.rawAiData.assetComp && componentData.rawAiData.assetComp.status == 1) {
    componentData.hasAnimated[TAB_KEYS.ASSET_COMP] = true
    let safeCoreResult = formatHtmlText(componentData.rawAiData.assetComp.coreResult)
    startTypewriter(highlightText(safeCoreResult, []), 'assetComp_coreResult')
    let safeAnalysisInfo = formatHtmlText(componentData.rawAiData.assetComp.analysisInfo)
    startTypewriter(safeAnalysisInfo, 'assetComp_analysisInfo', () => {
      componentData.typewriterDone[TAB_KEYS.ASSET_COMP] = true
    })
  }
}
// 清空状态
function resetAiAnimations() {
  // 1. 先停掉所有正在跑的定时器
  clearAllAITimers()

  // 2. 还原标志位
  componentData.hasAnimated = {
    [TAB_KEYS.NECESSITY]: false,
    [TAB_KEYS.THREE_ONE]: false,
    [TAB_KEYS.ASSET_COMP]: false
  }
  componentData.typewriterDone = {
    [TAB_KEYS.THREE_ONE]: false,
    [TAB_KEYS.ASSET_COMP]: false
  }

  // 3. 还原 AI 原始数据与 Loading 状态
  componentData.rawAiData = {
    necessity: null,
    threeOne: null,
    assetComp: null
  }
  componentData.aiLoadingState = {
    nameAnalyze: false,
    threeOne: false,
    assetComparison: false
  }

  // 4. 重置定时器容器
  componentData.typewriterTimers = {}
  componentData.aiLoadingTimers = {
    nameAnalyze: null,
    threeOne: null,
    assetComparison: null
  }
  componentData.aiPollingTimers = {
    nameAnalyze: null,
    threeOne: null,
    assetComparison: null
  }

  // 5. 清空打字机内容和其他业务状态
  componentData.streamedData = {
    nameAnalyze_coreResult: '',
    nameAnalyze_analysisInfo: '',
    threeOne_analyseAsset: '',
    threeOne_coreResult: '',
    threeOne_analysisInfo: '',
    assetComp_coreResult: '',
    assetComp_analysisInfo: ''
  }
  componentData.threeOneDiffData = {}
  componentData.assetComparisonObj = {}
  componentData.nameAnalyzeObj = {}
  componentData.data2 = []
  componentData.detailData = undefined
  componentData.diffData = undefined
  componentData.currentSimilarType = null
}
function escapeHtml(text) {
  if (!text) return ''
  return text.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
function startTypewriter(sourceText, targetKey, onFinish) {
  if (componentData.typewriterTimers[targetKey]) {
    clearTimeout(componentData.typewriterTimers[targetKey])
  }
  if (!sourceText) {
    componentData.streamedData[targetKey] = ''
    if (typeof onFinish === 'function') onFinish()
    return
  }
  componentData.streamedData[targetKey] = ''
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
      componentData.streamedData[targetKey] = currentHTML + '<span class="ai-cursor-disabled"></span>'
      componentData.typewriterTimers[targetKey] = setTimeout(type, 100)
    } else {
      componentData.streamedData[targetKey] = currentHTML
      if (typeof onFinish === 'function') onFinish()
    }
  }
  componentData.typewriterTimers[targetKey] = setTimeout(type, 0)
}
function highlightText(html, keywords) {
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
}
function getReserveStatus() {
  CwProject.reserveStatus(componentInstance, {}).then((res) => {
    componentData.reserveStatus = res.data
  })
}
function handleBack() {
  router.back()
}
function onCountdownEnd() {
  getDiffView()
}
// ============================================
// 👇👇 原版业务方法恢复区域，不再有省略号 👇👇
// ============================================
function onDetail(approveId) {
  componentData.detailData = undefined
  componentData.diffData = undefined
  router.push({
    name: '/finance/reserveApprovalDetail',
    query: {
      id: approveId,
      listKey: approvalListKey.value,
      approvalRole: currentApprovalRoleName.value
    }
  })
  const tagList = componentInstance.$utils.getObjectFromSessionStorage('tagList')
  if (tagList) {
    const route = tagList.find((item) => item.formRouterName == route.name)
    if (route) route.fullPath = route.fullPath
  }
  componentInstance.$utils.setObjectToSessionStorage('tagList', tagList)
  CachedSinglePageState.refreshUrlParams()
  ElMessage.success('操作成功')
}
async function prevNextStep(number) {
  await getPreNextStatus()
  const { preId, nextId } = componentData.preNextIds
  if (number == 1) {
    if (preId == null) {
      ElMessage.warning('没有上一条数据')
      return
    }
    onDetail(preId)
  }
  if (number == 2) {
    if (nextId == null) {
      ElMessage.warning('没有下一条数据')
      return
    }
    onDetail(nextId)
  }
}
async function getPreNextStatus() {
  const preId = await getPreNext(1)
  const nextId = await getPreNext(2)
  componentData.preNextIds = {
    preId,
    nextId
  }
}
function getPreNext(preNext = 1) {
  const jsonStr = decodeURIComponent(approvalListKey.value)
  const listKey = JSON.parse(jsonStr)
  const cwPreNextDto = {
    id: approvalId.value,
    preNext,
    listKey
  }
  return CwProjectApprove[currentPageRole.value.preNextApi](componentInstance, {
    cwPreNextDto
  }).then((res) => res.data)
}
// ✨ 核心机制 3：发请求时，显式开启本页签的 Loading
function getCwProjectNecessity() {
  // this.aiLoadingState.nameAnalyze = true;
  CwProject.cwProjectNecessityView(componentInstance, {
    projectId: componentData.dataValue.projectId
  }).then((res) => {
    const data = res.data || {
      status: 1,
      viewTotal: 0
    }
    componentData.rawAiData.necessity = data
    componentData.nameAnalyzeObj = data

    // 👇 新增轮询逻辑
    if (data.status === 0 && componentData.activeName === componentData.TAB_KEYS.NECESSITY) {
      if (componentData.aiPollingTimers.nameAnalyze) clearTimeout(componentData.aiPollingTimers.nameAnalyze)
      componentData.aiPollingTimers.nameAnalyze = setTimeout(() => {
        // 定时器到期时再次确认是否还在当前 Tab
        if (componentData.activeName === componentData.TAB_KEYS.NECESSITY) {
          getCwProjectNecessity()
        }
      }, 5000)
    }
  })
}
function getThreeOneDiffView() {
  CwProject.cwProjectThreeOneDiffView(componentInstance, {
    projectId: componentData.dataValue.projectId
  }).then((res) => {
    const data = res.data || {
      status: 1,
      viewTotal: 0
    }
    componentData.rawAiData.threeOne = data
    componentData.threeOneDiffData = data

    // 👇 新增轮询逻辑
    if (data.status === 0 && componentData.activeName === componentData.TAB_KEYS.THREE_ONE) {
      if (componentData.aiPollingTimers.threeOne) clearTimeout(componentData.aiPollingTimers.threeOne)
      componentData.aiPollingTimers.threeOne = setTimeout(() => {
        if (componentData.activeName === componentData.TAB_KEYS.THREE_ONE) {
          getThreeOneDiffView()
        }
      }, 5000)
    }
  })
}
function getAssetComparisonData() {
  CwProjectAssetDiff.view(componentInstance, {
    projectId: componentData.dataValue.projectId
  }).then((res) => {
    const data = res.data || {
      status: 1,
      viewTotal: 0
    }
    componentData.rawAiData.assetComp = data
    componentData.assetComparisonObj = data

    // 👇 新增轮询逻辑
    if (data.status === 0 && componentData.activeName === componentData.TAB_KEYS.ASSET_COMP) {
      if (componentData.aiPollingTimers.assetComparison) clearTimeout(componentData.aiPollingTimers.assetComparison)
      componentData.aiPollingTimers.assetComparison = setTimeout(() => {
        if (componentData.activeName === componentData.TAB_KEYS.ASSET_COMP) {
          getAssetComparisonData()
        }
      }, 5000)
    }
  })
}
function getNameAnalyzeList() {
  CwProject.cwProjectNameList(componentInstance, {
    cwProjectNamesDiffDataDtoFilter: {
      projectId: componentData.dataValue.projectId
    }
  }).then((res) => {
    componentData.nameAnalyzeList = res.data?.dataList
  })
}
function handleExport(type) {
  if (type == 1) {
    CwProjectApply.exportReviewOpinion(componentInstance, {
      projectId: componentData.dataValue?.projectId
    })
  }
  if (type == 2) {
    CwProjectApply.exportProposalDoc(componentInstance, {
      projectId: componentData.dataValue?.projectId
    })
  }
}
function handleConfirm() {
  handleApprove(true, 1)
}
function handleSetting() {
  componentInstance.$dialog
    .show(
      '配置',
      similarSetting,
      {
        area: ['500px']
      },
      {}
    )
    .then(() => {
      refreshTable(true)
    })
    .catch(() => {})
}
function getDiffView() {
  const ApiClass = componentData.currentSimilarType === 'similar2' ? CwProjectItemDiff : CwProjectDiff
  ApiClass.view(componentInstance, {
    id: componentData.detailData.id,
    projectId: componentData.detailData.projectId
  }).then((res) => {
    componentData.diffData = res.data
    componentData.vectorScore = componentData.diffData?.vectorScore
  })
}
function getAssistCheck() {
  CwProjectDiff.assistCheckList(componentInstance, {
    projectId: componentData.dataValue?.projectId
  }).then((res) => {
    componentData.assistCheckList = res.data
  })
}
function clearSyncHieght() {
  nextTick(() => {
    const elements = document.querySelectorAll('.projectView')
    elements.forEach((v) => {
      ProjectKeyValues.value.forEach((item) => {
        const element = v.querySelector('#' + item.value)
        if (element) {
          element.style.height = ''
        }
      })
    })
  })
}
function syncHeights() {
  nextTick(() => {
    setTimeout(() => {
      const [elementA, elementB] = document.querySelectorAll('.projectView')
      ProjectKeyValues.value.forEach((item) => {
        const _elementA = elementA.querySelector('#' + item.value)
        const _elementB = elementB.querySelector('#' + item.value)
        if (_elementA && _elementB) {
          const maxHeight = Math.max(_elementA.offsetHeight, _elementB.offsetHeight)
          _elementA.style.height = `${maxHeight}px`
          _elementB.style.height = `${maxHeight}px`
        }
      })
      componentData.unmountScrollSync = syncScroll(elementA, elementB)
    }, 800)
  })
}
function handleScroll(elementToSync, event) {
  elementToSync.scrollTop = event.target.scrollTop
}
function syncScroll(element1, element2) {
  const handleScroll1 = (event) => handleScroll(element2, event)
  const handleScroll2 = (event) => handleScroll(element1, event)
  element1.addEventListener('scroll', handleScroll1)
  element2.addEventListener('scroll', handleScroll2)
  return function unmount() {
    element1.removeEventListener('scroll', handleScroll1)
    element2.removeEventListener('scroll', handleScroll2)
  }
}
function handleSelect(item) {
  nextTick(() => {
    setTimeout(() => {
      const [elementA] = document.querySelectorAll('.projectView')
      elementA.scrollTop = elementA.scrollTop + 1
      elementA.scrollTop = elementA.scrollTop - 1
    }, 100)
  })
}
async function handleApprove(confirm, status, params) {
  const rejectReasonPromise = () => {
    return new Promise((resolve, reject) => {
      componentInstance.$dialog
        .show('驳回理由', rejectReason, {
          area: ['600px']
        })
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
    await ElMessageBox.confirm('确认审核通过?')
  }
  CwProjectApprove[`${currentPageRole.value.apiSuffix}Approve`](componentInstance, {
    cwApproveDto: {
      remark,
      status,
      projectId: componentData.dataValue?.projectId,
      id: approvalId.value,
      ...params
    }
  }).then(() => {
    ElMessage.success('操作成功')
    setTimeout(() => {
      refreshTable(true)
      componentInstance.getFollowupInfo(componentInstance)
    }, 4000)
  })
}
function handleAIRejudge() {
  ElMessageBox.confirm('确认AI重审？')
    .then(() => {
      CwProjectDiff.retryDiffProject(componentInstance, {
        projectId: componentData.dataValue.projectId
      }).then(() => {
        ElMessage.success('AI重审已触发')

        // 重置数据并重新获取
        componentData.rawAiData.necessity = null
        componentData.rawAiData.threeOne = null
        componentData.rawAiData.assetComp = null

        // 重置动画状态
        componentData.hasAnimated[componentData.TAB_KEYS.NECESSITY] = false
        componentData.hasAnimated[componentData.TAB_KEYS.THREE_ONE] = false
        componentData.hasAnimated[componentData.TAB_KEYS.ASSET_COMP] = false
        componentData.typewriterDone[componentData.TAB_KEYS.THREE_ONE] = false
        componentData.typewriterDone[componentData.TAB_KEYS.ASSET_COMP] = false

        // 重新获取数据
        getCwProjectNecessity()
        getThreeOneDiffView()
        getAssetComparisonData()

        // 刷新两个相似分析
        similarAnalysisRef.value?.getList()
        similarAnalysis2Ref.value?.getList()
      })
    })
    .catch(() => {})
}
function getRowClassName({ row }) {
  if (row.matchStatus == 3) {
    return 'red-row'
  } else if (row.matchStatus == 2) {
    return 'orange-row'
  }
  return ''
}
function getApprovalList() {
  CwProject.approvalLog(componentInstance, {
    cwProjectApproveDtoFilter: {
      projectId: componentData.dataValue.projectId
    }
  }).then((res) => {
    componentData.approvalList = res.data?.dataList
  })
}
function getType(type) {
  let _type = 'primary'
  switch (+type) {
    case componentInstance.StatusReserveDict.PENDING_SUBMIT:
      _type = 'info'
      break
    case componentInstance.StatusReserveDict.REJECTED || componentInstance.StatusReserveDict.DELAYED:
      _type = 'warning'
      break
    case componentInstance.StatusReserveDict.PRE_REVIEW_COMPLETED:
      _type = 'success'
      break
  }
  return _type
}
function ifConfirm(msg, callback = () => {}) {
  return ElMessageBox.confirm(msg).then(() => {
    callback()
  })
}
async function tabClick(event) {}
function getInfo() {
  refreshTable(true)
}
// ✨ 核心机制 4：将需要懒加载的接口从初始化方法中移除
async function refreshTable() {
  resetAiAnimations()
  await loadData()
  getApprovalList()
  projectRiskInfo()
  getAssistCheck()
  getNameAnalyzeList() // 项目名称分析保持初加载

  // 初始化检查当前激活的是哪个 Tab，按需触发懒加载
  loadTabIfNeeded(componentData.activeName)
  projectViewRef.value?.initFormData()
}
function loadData() {
  return new Promise((resolve, reject) => {
    CwProjectApprove[`${currentPageRole.value.apiSuffix}View`](componentInstance, {
      id: approvalId.value
    })
      .then((res) => {
        if (res) {
          componentData.dataValue = res.data
        }
        resolve()
      })
      .catch((e) => {
        reject(e)
      })
  })
}
function loadTableVerify() {
  return true
}
function handleSubmit() {}
function handleCancel() {}
function onCancel(isSuccess = false, data) {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(isSuccess, data)
  }
}
function onSubmit() {
  onCancel(true)
}
const getCurrentMenuId = computed(() => componentStore.getters.getCurrentMenuId)
const getUserInfo = computed(() => componentStore.getters.getUserInfo)
const necessaryKeyValues = computed(() => {
  return [
    {
      name: '分析结论',
      value: 'resultContent'
    }
  ]
})
const approvalId = computed(() => {
  return componentProps.id || route.query.id
})
const approvalListKey = computed(() => {
  return componentProps.listKey || route.query.listKey
})
const currentApprovalRoleName = computed(() => {
  return route.query.approvalRole || componentProps.approvalRole || route.name
})
const currentPageRole = computed(() => {
  return componentData.pageRoleMap[currentApprovalRoleName.value] || componentData.pageRoleMap.deptApprovalDetail
})
const isFinance = computed(() => {
  return currentApprovalRoleName.value === 'financeApprovalDetail'
})
const InfoKeyValues = computed(() => {
  return [
    // { label: '申请人', prop: 'createUserName' },
    {
      label: '申请时间',
      prop: 'createTime',
      formatter: (value) => value
    },
    {
      label: '申请部门',
      prop: 'workDeptName'
    },
    // { label: '审批时间', prop: 'approveTime', formatter: (value) => value },
    {
      label: '审批意见',
      prop: 'approveDesc'
    }
  ]
})
const ProjectKeyValues = computed(() => {
  return projectViewRef.value?.KeyValues.filter((item) => item) || []
})
const showRerunBtn = computed(() => {
  return true
  // this.getUserInfo?.loginName === 'yunwei' || this.getUserInfo?.isAdmin || this.showRerunBtnTest
})
watch(
  () => componentData.activeName,
  function (val) {
    loadTabIfNeeded(val)
  }
)
watch(
  () => componentData.nameAnalyzeObj,
  function (val) {
    handleAILoading('nameAnalyze', val, componentData.TAB_KEYS.NECESSITY)
  },
  {
    deep: true
  }
)
watch(
  () => componentData.threeOneDiffData,
  function (val) {
    handleAILoading('threeOne', val, componentData.TAB_KEYS.THREE_ONE)
  },
  {
    deep: true
  }
)
watch(
  () => componentData.assetComparisonObj,
  function (val) {
    handleAILoading('assetComparison', val, componentData.TAB_KEYS.ASSET_COMP)
  },
  {
    deep: true
  }
)
watch(
  () => approvalId.value,
  function (val, oldVal) {
    if (val && val != oldVal) {
      refreshTable(true)
      getPreNextStatus()
    }
  },
  {}
)
watch(
  () => componentData.detailData,
  function (val, oldVal) {
    if (val && !oldVal) {
      getDiffView()
    } else {
      similarAnalysisRef.value?.getList()
      similarAnalysis2Ref.value?.getList()
      clearSyncHieght()
    }
  },
  {
    deep: true
  }
)
watch(
  () => componentProps.id,
  function (val, oldVal) {
    if (val !== oldVal) {
      refreshTable(true)
    }
  },
  {}
)
onMounted(() => {
  getReserveStatus()
  refreshTable(true)
  getPreNextStatus()
})
onBeforeUnmount(() => {
  if (componentData.unmountScrollSync) componentData.unmountScrollSync()
  // 👇 优化：一行搞定销毁
  clearAllAITimers()
})
onActivated(() => {
  // 因为你在上面修改了 loadTabIfNeeded，它已经具备了识别 status === 0 并重发请求的能力
  // 所以切回页面时，只需要无脑调用一次，它就会自动接力之前的轮询
  if (componentData.activeName) {
    loadTabIfNeeded(componentData.activeName)
  }
})
onDeactivated(() => {
  // 👇 优化：一行搞定休眠
  clearAllAITimers()
})
defineExpose({
  EpBack,
  EpRefreshRight,
  removeTag,
  getCurrentMenuId,
  getUserInfo,
  openAdmin,
  parseUploadData,
  getPictureList,
  fileListToJson,
  getUploadFileUrl,
  filterEmptyValues,
  getUploadFileUrlByFetch,
  getUploadActionUrl,
  pictureFile,
  getUploadHeaders,
  getDateRangeFilter,
  formatDateByStatsType,
  formatDateTime,
  getStatsTypeShowName,
  getAllowStatsTypeList,
  routerPush,
  singlePageReload,
  oncancel,
  refreshUrlParams,
  savedKey,
  projectRiskInfo,
  clearAllAITimers,
  handleRerun,
  loadTabIfNeeded,
  handleAILoading,
  checkAndTriggerAnimation,
  resetAiAnimations,
  escapeHtml,
  startTypewriter,
  highlightText,
  getReserveStatus,
  handleBack,
  onCountdownEnd,
  onDetail,
  prevNextStep,
  getPreNextStatus,
  getPreNext,
  getCwProjectNecessity,
  getThreeOneDiffView,
  getAssetComparisonData,
  getNameAnalyzeList,
  handleExport,
  handleConfirm,
  handleSetting,
  getDiffView,
  getAssistCheck,
  clearSyncHieght,
  syncHeights,
  handleScroll,
  syncScroll,
  handleSelect,
  handleApprove,
  handleAIRejudge,
  getRowClassName,
  getApprovalList,
  getType,
  ifConfirm,
  tabClick,
  getInfo,
  refreshTable,
  loadData,
  loadTableVerify,
  handleSubmit,
  handleCancel,
  onCancel,
  onSubmit,
  ...toRefs(componentData),
  necessaryKeyValues,
  approvalId,
  approvalListKey,
  currentApprovalRoleName,
  currentPageRole,
  isFinance,
  InfoKeyValues,
  ProjectKeyValues,
  showRerunBtn
})
</script>

<style lang="less">
.rr-view-ctx-card:has(.reserveApprovalDetail) {
  background: transparent;
}
</style>

<style lang="less" scoped>
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

.extra--button {
  position: absolute;
  right: 30px;
  top: 0;
  bottom: 0;
  margin: auto;
  height: 32px;
  line-height: 32px;
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
    color: @--color-primary;
    font-weight: 600;
    margin-right: 10px;
  }
  &__icon {
    cursor: pointer;
    font-size: 22px;
    transition: color 0.15s linear;
    &:hover {
      color: @--color-primary;
    }
  }
}

.approval--view {
  :deep(.vxe-table-box) {
    height: 450px !important;
  }
  &.control--buttons {
    :deep(.main-title) {
      height: 30px;
      line-height: 30px;
    }
  }
}

.labelTips {
  position: absolute;
  top: 0px;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  line-height: 30px;
  height: 30px;
  font-size: 14px;
  color: @--color-primary;
  font-weight: 600;
  margin-right: 10px;
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

    /* === 新增: 重新分析按钮样式 === */
    .rerun-btn {
      font-size: 12px;
      padding: 3px 12px;
      border-radius: 4px;
      border: 1px solid currentColor;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      opacity: 0.85;
      transition: opacity 0.2s, background-color 0.2s;

      &:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.05); /* 轻微黑色透明遮罩实现按下效果 */
      }
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

    .title,
    .rerun-btn {
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

    .title,
    .rerun-btn {
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

    .title,
    .rerun-btn {
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

    .title,
    .rerun-btn {
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

    .title,
    .rerun-btn {
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

.AILoading {
  width: calc(100%);
  height: calc(100%);
}
</style>
