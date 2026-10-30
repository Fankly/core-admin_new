<template>
  <div
    class="rule-workspace"
    :class="{
      'rule-workspace--list-collapsed': isRuleListCollapsed,
      'rule-workspace--preview-open': previewOpen
    }"
  >
    <article
      v-loading="rulesLoading"
      element-loading-text="正在加载评审规则"
      :class="['rule-list-card', 'glass-card', 'content-enter', 'delay-two', { 'is-collapsed': isRuleListCollapsed }]"
      :role="isRuleListCollapsed ? 'button' : undefined"
      :tabindex="isRuleListCollapsed ? 0 : undefined"
      :aria-label="isRuleListCollapsed ? '展开评审规则' : undefined"
      :aria-expanded="isRuleListCollapsed ? false : undefined"
      @click="expandRuleListPanel"
      @keydown.enter="expandRuleListPanel"
      @keydown.space.prevent="expandRuleListPanel"
    >
      <div class="card-title compact">
        <div class="section-title">
          <span class="title-icon" aria-hidden="true"
            ><el-icon><List /></el-icon
          ></span>
          <h2>评审规则</h2>
          <span class="rule-title-count" :aria-label="`当前显示 ${filteredRules.length} 条评审规则`">{{ filteredRules.length }}</span>
        </div>
        <!-- 「不看通过规则」开关（照 docs/1009/智能审核-风险分级原型.html）：
             开启后仅保留「不通过 / 待复核 / 不执行」的规则，页签计数跟着联动 -->
        <button
          v-if="showHidePass"
          type="button"
          class="rule-hide-pass"
          :class="{ on: hidePass }"
          role="switch"
          :aria-checked="hidePass"
          title="启用后仅显示「不通过 / 待复核」的规则"
          @click.stop="$emit('toggle-hide-pass')"
        >
          <span class="rule-hide-pass__track" aria-hidden="true"><i></i></span>
          <span class="rule-hide-pass__label">不看通过规则</span>
        </button>
        <button
          v-if="!isRuleListCollapsed"
          type="button"
          class="panel-collapse-button"
          title="收起评审规则"
          aria-label="收起评审规则"
          aria-controls="workbench-rule-list-content"
          :aria-expanded="true"
          @click.stop="toggleRuleListPanel"
        >
          <el-icon aria-hidden="true"><ArrowLeft /></el-icon>
        </button>
        <span v-else class="panel-collapsed-indicator" aria-hidden="true">
          <el-icon><ArrowRight /></el-icon>
        </span>
      </div>

      <div id="workbench-rule-list-content" class="rule-list-content" :inert="isRuleListCollapsed ? '' : undefined">
        <!-- 只剩「全部」一项时筛选条不再是筛选（如单规则详情入口），直接隐藏，避免占位又点不出结果 -->
        <div v-if="hasRuleFilterOptions" class="rule-filter">
          <button
            v-for="filter in ruleFilters"
            :key="filter.value"
            type="button"
            :class="{ active: activeRuleFilter === filter.value }"
            :aria-label="`${filter.label}，共 ${getRuleFilterCount(filter.value)} 条评审规则`"
            :aria-pressed="activeRuleFilter === filter.value"
            @click="$emit('filter-change', filter.value)"
          >
            <span class="rule-filter-label">
              <ReText>{{ filter.label }}</ReText>
            </span>
            <span class="rule-filter-count" aria-hidden="true">{{ getRuleFilterCount(filter.value) }}</span>
          </button>
        </div>
        <div v-if="rulesLoading" class="rule-list rule-list-loading-placeholder" aria-hidden="true"></div>
        <div v-else-if="ruleErrorText" class="rule-list">
          <!-- 加载失败与「暂无规则」是两回事：给出原因和重试，而不是让用户以为没有规则 -->
          <div class="rule-error" role="alert">
            <el-icon class="rule-error__icon" aria-hidden="true"><WarningFilled /></el-icon>
            <strong class="rule-error__title">评审规则加载失败</strong>
            <span class="rule-error__text">{{ ruleErrorText }}</span>
            <button type="button" class="rule-error__action" @click.stop="$emit('reload-rules')">
              <el-icon aria-hidden="true"><Refresh /></el-icon>
              <span>重新加载</span>
            </button>
          </div>
        </div>
        <div v-else :class="['rule-list', { 'rule-list--classified': isRuleGrouped }]">
          <div v-if="isRuleGrouped" class="rule-classify-group-list" aria-label="规则分类">
            <section v-for="group in ruleGroups" :key="group.key" :class="['rule-classify-group', { 'is-expanded': isRuleGroupExpanded(group) }]">
              <button
                :id="`rule-classify-trigger-${group.key}`"
                type="button"
                class="rule-classify-group__trigger"
                :aria-expanded="isRuleGroupExpanded(group)"
                :aria-controls="`rule-classify-panel-${group.key}`"
                :title="group.name"
                @click.stop="toggleRuleGroup(group)"
              >
                <div class="rule-classify-group__title-wrap">
                  <component :is="getClassifyIcon(group.name)" class="rule-classify-group__icon" aria-hidden="true" />
                  <span class="rule-classify-group__label">{{ group.name }}</span>
                </div>
                <el-icon class="rule-classify-group__arrow" aria-hidden="true"><ArrowRight /></el-icon>
              </button>
              <div
                :id="`rule-classify-panel-${group.key}`"
                class="rule-classify-collapse"
                role="region"
                :aria-labelledby="`rule-classify-trigger-${group.key}`"
                :aria-hidden="!isRuleGroupExpanded(group)"
                :inert="isRuleGroupExpanded(group) ? undefined : ''"
              >
                <div class="rule-classify-collapse__content">
                  <div class="rule-classify-panel">
                    <button
                      v-for="rule in group.rules"
                      :key="rule.id"
                      type="button"
                      :class="['rule-item', `rule-item--${rule.result}`, { active: selectedRule.id === rule.id }]"
                      @click="$emit('select-rule', rule)"
                    >
                      <span class="rule-item-top">
                        <strong class="rule-item-title">
                          <ReText>{{ getAuditPlainText(rule.name) }}</ReText>
                        </strong>
                        <span
                          v-if="getRuleStatus(rule)"
                          :class="['rule-review-state', `rule-review-state--${getRuleStatus(rule)?.tone}`]"
                          :aria-label="`审核状态：${getRuleStatus(rule)?.label}`"
                        >
                          <component :is="getRuleStatus(rule)?.icon" class="rule-review-state-icon" aria-hidden="true" />
                          <span class="rule-review-state-text">
                            <ReText>{{ getRuleStatus(rule)?.label }}</ReText>
                          </span>
                        </span>
                      </span>
                      <!-- 人工复核状态暂时隐藏（需求 2026-10-20）：恢复时把下面整段解注释即可
                      <span
                        v-if="getManualReviewStatus(rule)"
                        :class="['rule-item-manual', `rule-item-manual--${getManualReviewStatus(rule)?.tone}`]"
                        :aria-label="`人工复核状态：${getManualReviewStatus(rule)?.label}`"
                      >
                        人工复核：{{ getManualReviewStatus(rule)?.label }}
                      </span>
                      -->
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div v-else class="rule-classify-panel rule-classify-panel--plain">
            <button
              v-for="rule in filteredRules"
              :key="rule.id"
              type="button"
              :class="['rule-item', `rule-item--${rule.result}`, { active: selectedRule.id === rule.id }]"
              @click="$emit('select-rule', rule)"
            >
              <span class="rule-item-top">
                <strong class="rule-item-title">
                  <ReText>{{ getAuditPlainText(rule.name) }}</ReText>
                </strong>
                <span
                  v-if="getRuleStatus(rule)"
                  :class="['rule-review-state', `rule-review-state--${getRuleStatus(rule)?.tone}`]"
                  :aria-label="`审核状态：${getRuleStatus(rule)?.label}`"
                >
                  <component :is="getRuleStatus(rule)?.icon" class="rule-review-state-icon" aria-hidden="true" />
                  <span class="rule-review-state-text"
                    ><ReText>{{ getRuleStatus(rule)?.label }}</ReText></span
                  >
                </span>
              </span>
              <!-- 人工复核状态暂时隐藏（需求 2026-10-20）：恢复时把下面整段解注释即可
              <span
                v-if="getManualReviewStatus(rule)"
                :class="['rule-item-manual', `rule-item-manual--${getManualReviewStatus(rule)?.tone}`]"
                :aria-label="`人工复核状态：${getManualReviewStatus(rule)?.label}`"
              >
                人工复核：{{ getManualReviewStatus(rule)?.label }}
              </span>
              -->
            </button>
            <div v-if="filteredRules.length === 0" class="rule-empty">{{ ruleEmptyText }}</div>
          </div>
        </div>
      </div>
    </article>

    <article v-loading="ruleDetailLoading" element-loading-text="正在加载规则详情" class="rule-detail-card glass-card content-enter delay-three">
      <div class="rule-detail-head">
        <div class="rule-detail-title">
          <span v-if="selectedRule.id" class="rule-detail-meta" aria-label="审核结论">
            <span class="rule-detail-meta__label">审核结论</span>
            <ReText :line-clamp="2" tooltip-placement="auto" class="rule-detail-meta__conclusion">
              <TypewriterText
                v-if="selectedRule.ruleviewConclude"
                class="rule-detail-meta__conclusion-text"
                :text="selectedRule.ruleviewConclude"
                tag="span"
                :animate="false"
                @attach-preview="handleInlineAttachPreview"
                @review-table-open="handleReviewTableOpen"
                @price-view-navigate="handlePriceViewNavigate"
                @image-compare="handleImageCompare"
              />
              <template v-else>暂无审核结论</template>
            </ReText>
          </span>
        </div>
      </div>

      <div
        class="rule-detail-body"
        :class="{
          'rule-detail-body--reasoning-collapsed': isReviewProcessCollapsed
        }"
        :key="selectedRule.id"
      >
        <section
          :class="[
            'decision-panel',
            'review-process-column',
            'review-process-column--reasoning',
            'detail-fade',
            { 'is-collapsed': isReviewProcessCollapsed }
          ]"
          :role="isReviewProcessCollapsed ? 'button' : undefined"
          :tabindex="isReviewProcessCollapsed ? 0 : undefined"
          :aria-label="isReviewProcessCollapsed ? '展开审核要点' : '审核要点'"
          :aria-expanded="isReviewProcessCollapsed ? false : undefined"
          @click="expandReviewProcessPanel"
          @keydown.enter="expandReviewProcessPanel"
          @keydown.space.prevent="expandReviewProcessPanel"
        >
          <div class="review-process-column__header">
            <div class="review-process-column__header-copy">
              <span class="title-icon title-icon--small" aria-hidden="true"
                ><el-icon><DataAnalysis /></el-icon
              ></span>
              <h3 class="review-process-column__title">审核要点</h3>
              <span class="review-process-column__hint">选择要点查看审核依据</span>
            </div>
            <button
              v-if="!isReviewProcessCollapsed"
              type="button"
              class="panel-collapse-button"
              title="收起审核要点"
              aria-label="收起审核要点"
              aria-controls="workbench-review-process-content"
              :aria-expanded="true"
              @click.stop="isReviewProcessCollapsed = true"
            >
              <el-icon aria-hidden="true"><ArrowLeft /></el-icon>
            </button>
            <span v-else class="panel-collapsed-indicator" aria-hidden="true"
              ><el-icon><ArrowRight /></el-icon
            ></span>
          </div>
          <div
            v-if="reviewPoints.length"
            id="workbench-review-process-content"
            class="review-process-column__content review-point-list"
            role="list"
            aria-label="审核要点列表"
            :aria-hidden="isReviewProcessCollapsed"
            :inert="isReviewProcessCollapsed ? '' : undefined"
          >
            <!-- 结论支持 HTML / Markdown，内部可能带链接等可点击节点，故用 div + role=button 承载，避免嵌套交互元素。
                 「人工复核」按钮放在 item 之外（同一行右侧），不作为它的子节点。
                 宿主拿不到 taskId 时（如协同评审里 item 没有 taskId）不渲染该按钮——复审接口的 init
                 必须带 taskId 或 detailId，留一个点了必报错的按钮不如不渲染。 -->
            <div
              v-for="(point, index) in reviewPoints"
              :key="getReviewPointKey(point, index)"
              class="review-point-row"
              :class="{ 'review-point-row--stamped': Boolean(getReviewPointManualVerdict(point)) }"
            >
              <div
                role="button"
                tabindex="0"
                :class="['review-point-item', { active: selectedReviewPoint === point }]"
                :aria-pressed="selectedReviewPoint === point"
                @click="activateReviewPoint($event, point, index)"
                @keydown.enter="activateReviewPoint($event, point, index)"
                @keydown.space.prevent="activateReviewPoint($event, point, index)"
              >
                <ReText class="review-point-item__heading" :line-clamp="2">
                  <span class="review-point-item__prefix">审核要点{{ index + 1 }}:</span>
                  <span class="review-point-item__prefix">{{ getAuditPlainText(point.auditPointName) || '未命名审核要点' }}</span>
                </ReText>
                <!-- 规则等级（问题 / 预警 / 异常）：与「AI审核结论：」同属要点的一行元信息，配色跟分级配置走 -->
                <span v-if="getReviewPointLevelName(point)" class="review-point-item__level">
                  <span class="review-point-item__prefix">规则等级：</span>
                  <span class="review-point-item__prefix">
                    {{ getReviewPointLevelName(point) }}
                  </span>
                </span>
                <span class="review-point-item__conclusion">
                  <!-- 通过/不通过等结论词与「AI审核结论：」同行，结论描述另起一行（标签按需求 2026-10-13 由「结论」改为「AI审核结论」） -->
                  <span class="review-point-item__conclusion-head">
                    <span class="review-point-item__prefix">AI审核结论：</span>
                    <span class="review-point-item__conclusion-verdict" :class="getReviewPointVerdict(point).colorClass">
                      {{ point.reviewOpinionName }}
                    </span>
                  </span>
                  <TypewriterText
                    v-if="getReviewPointConclusionDescription(point)"
                    class="review-point-item__conclusion-text"
                    :text="getReviewPointConclusionDescription(point)"
                    tag="span"
                    :animate="false"
                    @attach-preview="handleInlineAttachPreview"
                    @review-table-open="handleReviewTableOpen"
                    @price-view-navigate="handlePriceViewNavigate"
                    @image-compare="handleImageCompare"
                  />
                </span>
                <!--
                  人工审核结论签章（需求 2026-10-13）：只要 listRuleReview 回了人工复核意见就盖一枚章，
                  绿 = 通过、红 = 不通过；没做过人工复核的要点不盖章。
                -->
                <span
                  v-if="getReviewPointManualVerdict(point)"
                  class="review-point-item__stamp"
                  :class="`review-point-item__stamp--${getReviewPointManualVerdict(point)?.tone}`"
                  role="img"
                  :aria-label="`人工审核结论：${getReviewPointManualVerdict(point)?.label}`"
                >
                  <span class="review-point-item__stamp-text">
                    <span>复核</span>
                    <span>{{ getReviewPointManualVerdict(point)?.label }}</span>
                  </span>
                </span>
              </div>
              <button
                v-if="projectTaskId && canManualReview(point)"
                class="review-point-item__manual"
                type="button"
                :aria-label="`人工复核：${getAuditPlainText(point.auditPointName) || '未命名审核要点'}`"
                @click.stop="openManualReview(point)"
              >
                人工复核
              </button>
            </div>
          </div>
          <div
            v-else
            id="workbench-review-process-content"
            class="review-process-column__content review-process-column__empty"
            :aria-hidden="isReviewProcessCollapsed"
            :inert="isReviewProcessCollapsed ? '' : undefined"
          >
            暂无审核要点
          </div>
        </section>

        <section :class="['source-preview', 'review-process-column', 'review-process-column--source', 'detail-fade']" aria-label="审核依据">
          <div class="review-process-column__header">
            <div class="review-process-column__header-copy">
              <span class="title-icon title-icon--small" aria-hidden="true"
                ><el-icon><Reading /></el-icon
              ></span>
              <h3 class="review-process-column__title">审核依据</h3>
              <span class="review-process-column__hint">规则说明与原文出处</span>
            </div>
            <div class="review-process-column__actions">
              <button
                v-if="canRerun && selectedReviewPoint"
                type="button"
                class="preview-btn"
                :disabled="!selectedReviewPoint.detailId || isSelectedPointRerunning || isSelectedPointRerunConfirming"
                title="重新分析当前审核要点"
                @click.prevent.stop="rerunSelectedPoint"
                style="margin-right: 10px"
              >
                <el-icon class="preview-btn__icon" aria-hidden="true"><Refresh /></el-icon>
                <span>重新分析</span>
              </button>
              <el-popover
                v-if="attachList.length"
                v-model:visible="previewPopoverVisible"
                placement="bottom-end"
                :width="480"
                trigger="click"
                popper-class="smart-task-audit-preview-attach-popover"
                @show="loadAttachList"
              >
                <template #reference>
                  <button
                    ref="previewButtonRef"
                    type="button"
                    class="preview-btn"
                    :disabled="previewing"
                    :aria-expanded="previewPopoverVisible"
                    aria-haspopup="dialog"
                  >
                    <el-icon class="preview-btn__icon" aria-hidden="true"><View /></el-icon>
                    <span>预览</span>
                  </button>
                </template>
                <div v-loading="attachListLoading" class="preview-attach-panel">
                  <div class="preview-attach-panel__header">
                    <div class="preview-attach-panel__title-wrap">
                      <span class="preview-attach-panel__title">附件列表</span>
                    </div>
                    <span v-if="attachList.length" class="preview-attach-panel__count">共 {{ attachList.length }} 个</span>
                  </div>
                  <div v-if="attachList.length" class="preview-attach-panel__table-wrap">
                    <table class="preview-attach-table">
                      <thead>
                        <tr>
                          <th class="preview-attach-table__col-name">附件名称</th>
                          <th class="preview-attach-table__col-type">附件类型</th>
                          <th class="preview-attach-table__col-action">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in attachList" :key="getAttachKey(row)">
                          <td class="preview-attach-table__col-name" :title="getAttachDisplayName(row)">
                            <span class="preview-attach-table__name">{{ getAttachDisplayName(row) }}</span>
                          </td>
                          <td class="preview-attach-table__col-type" :title="getAttachTypeName(row)">
                            <span class="preview-attach-table__type">{{ getAttachTypeName(row) }}</span>
                          </td>
                          <td class="preview-attach-table__col-action">
                            <button
                              type="button"
                              class="preview-attach-table__action"
                              :disabled="previewing || isAttachOpening(row) || !isAttachPreviewable(row)"
                              :title="isAttachPreviewable(row) ? '预览' : '暂不支持预览'"
                              @click.prevent.stop="openAttachPreview(row)"
                            >
                              预览
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else-if="!attachListLoading" class="preview-attach-panel__empty">
                    <span>{{ attachListEmptyText }}</span>
                  </div>
                </div>
              </el-popover>
            </div>
          </div>
          <div id="workbench-evidence-content" class="review-process-column__content review-point-detail" aria-live="polite">
            <div v-if="selectedReviewPoint" class="review-point-detail__content">
              <div class="review-point-detail__selected">
                <ReText class="review-point-detail__selected-main" :line-clamp="2">
                  <span class="review-point-detail__selected-prefix">
                    <el-icon class="prefix-icon"><Sparkles /></el-icon>
                    审核要点:
                  </span>
                  <strong class="review-point-detail__selected-name">{{
                    getAuditPlainText(selectedReviewPoint.auditPointName) || '未命名审核要点'
                  }}</strong>
                </ReText>
              </div>
              <div class="review-point-detail__split-cards">
                <!-- 规则说明卡片 -->
                <section class="review-point-detail__card review-point-detail__card--rule">
                  <div class="review-point-detail__card-header">
                    <div class="review-point-detail__card-title">
                      <span class="card-icon card-icon--blue">
                        <el-icon><FileCode /></el-icon>
                      </span>
                      <h4 class="review-point-detail__label">规则说明</h4>
                    </div>
                  </div>
                  <div v-loading="reviewPointDetailLoading" class="review-point-detail__card-body">
                    <div class="review-point-detail__field">
                      <strong class="review-point-detail__field-label">数据来源：</strong>
                      <span class="review-point-detail__field-value">{{ reviewPointDataSource || '暂无' }}</span>
                    </div>
                    <div class="review-point-detail__field">
                      <strong class="review-point-detail__field-label">判断规则：</strong>
                      <span class="review-point-detail__field-value">{{ reviewPointRuleDesc || '暂无' }}</span>
                    </div>
                  </div>
                </section>

                <!-- 原文出处卡片 -->
                <section class="review-point-detail__card review-point-detail__card--source">
                  <div class="review-point-detail__card-header">
                    <div class="review-point-detail__card-title">
                      <span class="card-icon card-icon--emerald">
                        <el-icon><Quote /></el-icon>
                      </span>
                      <h4 class="review-point-detail__label">原文出处</h4>
                    </div>
                  </div>
                  <div v-loading="reviewPointDetailLoading" class="review-point-detail__card-body review-point-detail__card-body--quote">
                    <TypewriterText
                      v-if="hasSelectedReviewPointEvidence"
                      class="review-point-detail__text review-point-detail__rich-text"
                      :text="selectedReviewPointEvidence"
                      tag="div"
                      :animate="false"
                      @attach-preview="handleInlineAttachPreview"
                      @review-table-open="handleReviewTableOpen"
                      @price-view-navigate="handlePriceViewNavigate"
                      @image-compare="handleImageCompare"
                    />
                    <p v-else class="review-point-detail__text">暂无原文出处</p>
                  </div>
                </section>
              </div>
            </div>
            <div v-else class="review-point-detail__empty">
              <span class="empty-icon"
                ><el-icon><FileSearch /></el-icon
              ></span>
              <span>暂无审核依据</span>
            </div>
          </div>
        </section>
      </div>

      <div v-if="isSelectedRuleRerunning || isSelectedPointRerunning" class="rule-detail-rerun-loading">
        <RerunLoading :title="selectedReviewPoint?.auditPointName || selectedRule.name || 'AI 模型推理中'" subtitle="正在重新分析" />
      </div>
    </article>
  </div>

  <ReviewTableModal
    :visible="reviewTableModalVisible"
    :tables="reviewTables"
    :detail-id="String(selectedRule.detailId || '')"
    :rule-name="selectedRule.name || ''"
    :initial-index="reviewTableInitialIndex"
    @close="handleReviewTableModalClose"
  />

  <!-- 疑似重复图片对比：点原文出处表格里的「本图文件名 / 命中目标文件名」打开，左右两列预览。
       关闭即销毁（v-if）：vxe-modal 关闭后复用同一个实例再打开时，内部显隐状态可能不同步。 -->
  <ImageCompareModal v-if="imageCompareVisible" :visible="imageCompareVisible" :payload="imageComparePayload" @close="handleImageCompareClose" />

  <!-- 人工复核弹窗：由审核要点上的「人工复核」按钮打开（接口见 docs/人工复核接口文档.md，代码在 views/ai/manualReview）。
       提交成功后往外抛一层：宿主据此重新拉一遍审核要点，签章才能立刻出现（不用手动刷新） -->
  <SinglePointReviewModal ref="manualReviewRef" @submit="(payload) => $emit('manual-review-submitted', payload)" />
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getRuleReview, listRuleReviewNew } from '@/api/ai/smartTaskAudit'
import type { RuleReviewPoint, TXmAttach } from '@/api/ai/smartTaskAudit'
import ReText from '@/components/ReText/src/index.vue'
import RerunLoading from '../../smartTaskAudit/components/RerunLoading.vue'
import ReviewTableModal from '../../smartTaskAudit/components/ReviewTableModal.vue'
import ImageCompareModal from '../../smartTaskAudit/components/ImageCompareModal.vue'
import SinglePointReviewModal from '../../manualReview/components/SinglePointReviewModal.vue'
import { aiToneOf } from '../../manualReview/data'
import type { ReviewPointAiInfo } from '../../manualReview/data'
import TypewriterText from '../../smartTaskAudit/components/TypewriterText.vue'
import {
  auditRiskLevelToneByName,
  getAuditPlainText,
  getAuditRiskLevelName,
  isRichAuditText
} from '../../smartTaskAudit/components/auditDetailHelpers'
import type { AuditImageComparePayload, AuditPriceViewPayload, AuditReviewTablePayload } from '../../smartTaskAudit/components/auditDetailHelpers'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCloseFilled,
  Clock,
  Coins,
  DataAnalysis,
  FileCode,
  FileSearch,
  List,
  Quote,
  Reading,
  Refresh,
  ShieldCheck,
  Sparkles,
  View,
  WarningFilled
} from '../icons'
import { getRuleRerunKey } from '../composables/useRuleRerun'
import { useRuleClassifyGroups } from '../composables/useRuleClassifyGroups'
import { useWorkbenchAttachments } from '../composables/useWorkbenchAttachments'
import type { ReviewRule, WorkbenchClassifyOption, WorkbenchFilterOption } from '../types'

const props = defineProps<{
  projectTaskId: string
  selectedRules: ReviewRule[]
  filteredRules: ReviewRule[]
  selectedRule: ReviewRule
  ruleFilters: WorkbenchFilterOption[]
  activeRuleFilter: string
  rulesLoading: boolean
  ruleDetailLoading: boolean
  ruleEmptyText: string
  /** 规则列表加载失败的原因；非空时列表区渲染错误态并提供重新加载，与「暂无规则」区分 */
  ruleErrorText?: string
  /** 规则分类字典；为空时规则列表保持平铺，不分组 */
  ruleClassifies?: WorkbenchClassifyOption[]
  previewOpen?: boolean
  /** 预览抽屉正在下载的附件 id；该行预览入口禁用，避免重复请求同一份材料 */
  loadingAttachId?: string
  canRerun?: boolean
  rerunningRuleIds?: ReadonlySet<string>
  rerunConfirmingRuleId?: string
  /** 「不看通过规则」开关的当前值（状态由宿主维护，组件只渲染与上抛事件） */
  hidePass?: boolean
  /** 是否渲染「不看通过规则」开关；宿主管不到这个状态时（如协同评审的只读工作台）不渲染，避免出现点了没反应的开关 */
  showHidePass?: boolean
}>()

const emit = defineEmits<{
  (event: 'filter-change', value: string): void
  (event: 'select-rule', rule: ReviewRule): void
  (event: 'toggle-hide-pass'): void
  (event: 'rerun-rule', rule: ReviewRule): void
  (event: 'rerun-ruleNew', rule: ReviewRule): void
  (event: 'rerun-point', detailId: string): void
  (event: 'preview-attach', file: TXmAttach, trigger?: HTMLElement | null): void
  (event: 'reload-rules'): void
  (event: 'navigate-price-view', payload: AuditPriceViewPayload): void
  /** 人工复核提交成功：宿主重新拉该规则的审核要点（签章要新数据才画得出来） */
  (event: 'manual-review-submitted', payload: { detailId: string; ruleName: string; pointName: string; conclusion: string; comment: string }): void
}>()

const showHidePass = computed(() => props.showHidePass === true)
const hidePass = computed(() => props.hidePass === true)

const canRerun = computed(() => props.canRerun === true)
const previewOpen = computed(() => props.previewOpen === true)
const isSelectedRuleRerunning = computed(() => props.rerunningRuleIds?.has(getRuleRerunKey(props.selectedRule)) === true)
const isSelectedRuleRerunConfirming = computed(() => props.rerunConfirmingRuleId === getRuleRerunKey(props.selectedRule))
const selectedPointDetailId = computed(() => String(selectedReviewPoint.value?.detailId || '').trim())
const isSelectedPointRerunning = computed(() => props.rerunningRuleIds?.has(selectedPointDetailId.value) === true)
const isSelectedPointRerunConfirming = computed(() => props.rerunConfirmingRuleId === selectedPointDetailId.value)
const rerunSelectedPoint = () => {
  const detailId = selectedPointDetailId.value
  if (!detailId) return
  emit('rerun-point', detailId)
}
const previewPopoverVisible = ref(false)
const previewButtonRef = ref<HTMLButtonElement | null>(null)
const reviewPoints = computed(() => (Array.isArray(props.selectedRule.points) ? props.selectedRule.points : []))
const selectedReviewPointKey = ref('')
const getReviewPointKey = (point: RuleReviewPoint, index: number) => String(point.id || point.detailId || index)
const selectedReviewPoint = computed(
  () => reviewPoints.value.find((point, index) => getReviewPointKey(point, index) === selectedReviewPointKey.value) || reviewPoints.value[0]
)
/** 审核依据（规则说明、原文出处）来自 getRuleReview 详情接口，按选中要点的 detailId 拉取 */
const reviewPointDetailLoading = ref(false)
const reviewPointRuleDesc = ref('')
const reviewPointDataSource = ref('')
const reviewPointProcess = ref('')
let reviewPointDetailSeq = 0

const selectedReviewPointEvidence = computed(() => reviewPointProcess.value)
const hasSelectedReviewPointEvidence = computed(() => Boolean(selectedReviewPointEvidence.value.trim()))

/** 按当前选中要点的 detailId 拉取审核依据（规则说明、原文出处）；选中要点不变时也可由父级调用来强制刷新 */
const loadSelectedPointDetail = () => {
  const id = String(selectedReviewPoint.value?.detailId || '').trim()
  reviewPointRuleDesc.value = ''
  reviewPointDataSource.value = ''
  reviewPointProcess.value = ''
  if (!id) return
  const seq = ++reviewPointDetailSeq
  reviewPointDetailLoading.value = true
  getRuleReview({ detailId: id })
    .then((res) => {
      if (seq !== reviewPointDetailSeq) return
      if (!res.success) return
      const data = res.data || {}
      reviewPointRuleDesc.value = String(data.judgementRuleDesc || '')
      reviewPointDataSource.value = String(data.dataSource || '')
      reviewPointProcess.value = String(data.reviewProcess || '')
    })
    .catch(() => {})
    .finally(() => {
      if (seq === reviewPointDetailSeq) reviewPointDetailLoading.value = false
    })
}

watch(
  () => selectedReviewPoint.value?.detailId,
  () => {
    loadSelectedPointDetail()
  },
  { immediate: true }
)

defineExpose({ refreshSelectedPointDetail: loadSelectedPointDetail })
const {
  attachListLoading,
  attachList,
  attachListEmptyText,
  previewing,
  isAttachOpening,
  getAttachKey,
  getAttachDisplayName,
  getAttachTypeName,
  isAttachPreviewable,
  loadAttachList,
  handlePreviewAttach,
  handleInlineAttachPreview
} = useWorkbenchAttachments(
  toRef(props, 'selectedRule'),
  toRef(props, 'projectTaskId'),
  (file, trigger) => emit('preview-attach', file, trigger),
  toRef(props, 'loadingAttachId'),
  toRef(props, 'rulesLoading'),
  selectedReviewPoint
)

const openAttachPreview = (file: TXmAttach) => {
  previewPopoverVisible.value = false
  handlePreviewAttach(file, previewButtonRef.value)
}

/** 点击 .gwPriceView / .materialNewestPriceView：上抛父级执行跳转 */
const handlePriceViewNavigate = (payload: AuditPriceViewPayload) => {
  emit('navigate-price-view', payload)
}

const isRuleListCollapsed = ref(false)

const toggleRuleListPanel = () => {
  isRuleListCollapsed.value = !isRuleListCollapsed.value
}
const expandRuleListPanel = () => {
  if (isRuleListCollapsed.value) isRuleListCollapsed.value = false
}

const isReviewProcessCollapsed = ref(false)
const expandReviewProcessPanel = () => {
  if (isReviewProcessCollapsed.value) isReviewProcessCollapsed.value = false
}
const reviewTableModalVisible = ref(false)
const reviewTableInitialIndex = ref(0)
const reviewTables = computed(() => (Array.isArray(props.selectedRule.reviewTable) ? props.selectedRule.reviewTable : []))

/* ---------------- 疑似重复图片对比（原文出处表格里的 data-image 节点） ---------------- */

const imageCompareVisible = ref(false)
const imageComparePayload = ref<AuditImageComparePayload | null>(null)
const handleImageCompare = (payload: AuditImageComparePayload) => {
  imageComparePayload.value = payload
  imageCompareVisible.value = true
}
const handleImageCompareClose = () => {
  imageCompareVisible.value = false
}

/* ---------------- 人工复核（复审信息接口，见 docs/人工复核接口文档.md） ---------------- */

const manualReviewRef = ref<InstanceType<typeof SinglePointReviewModal>>()

/** 要点 → AI 结论摘要。复审接口不提供 AI 结论，这里从审核任务侧已加载的要点数据里取 */
const toAiInfo = (point: RuleReviewPoint): ReviewPointAiInfo => ({
  name: String(point.reviewOpinionName || '待复核'),
  tone: aiToneOf(String(point.reviewOpinionName || '')),
  comment: String(point.reviewConclude || point.ruleviewConclude || '')
})

/** 已加载规则下的要点 AI 信息，按 detailId 索引；作为弹窗的预置数据，省掉一次请求 */
const loadedAiInfo = computed<Record<string, ReviewPointAiInfo>>(() => {
  const map: Record<string, ReviewPointAiInfo> = {}
  props.selectedRules.forEach((rule) => {
    const points = Array.isArray(rule.points) ? rule.points : []
    points.forEach((point) => {
      const id = String(point.detailId || '').trim()
      if (id) map[id] = toAiInfo(point)
    })
  })
  return map
})

/** 弹窗里切到尚未加载的规则时，宿主按 categoryRuleId 补拉该规则的要点 */
const loadAiInfo = async (categoryRuleId: string): Promise<Record<string, ReviewPointAiInfo>> => {
  const map: Record<string, ReviewPointAiInfo> = {}
  if (!props.projectTaskId || !categoryRuleId) return map
  const res = await listRuleReviewNew({ taskId: props.projectTaskId, categoryRuleId })
  if (!res.success || !Array.isArray(res.data)) return map
  res.data.forEach((item) => {
    const id = String(item.detailId || '').trim()
    if (id) map[id] = toAiInfo(item as unknown as RuleReviewPoint)
  })
  return map
}

/**
 * 「人工复核」按钮的显示条件：只有 AI 结论是**不通过(0)** 或 **待复核(2)** 的要点才需要人工介入。
 * 通过(1) 不必复核，不执行(3) 是规则压根没跑、复核无从谈起。
 *
 * 以 reviewOpinion 码值为准；码值缺失时退回按 reviewOpinionName 判断 ——
 * 与结论色标 getReviewPointVerdict 同一口径（接口实测会少给码值），
 * 否则那种情况下按钮会整片消失。
 */
const MANUAL_REVIEW_OPINION_CODES = ['0', '2']
const MANUAL_REVIEW_OPINION_NAMES = ['不通过', '待复核']
const canManualReview = (point: RuleReviewPoint) => {
  const code = String(point.reviewOpinion ?? '').trim()
  if (code) return MANUAL_REVIEW_OPINION_CODES.includes(code)
  return MANUAL_REVIEW_OPINION_NAMES.includes(getAuditPlainText(point.reviewOpinionName))
}

const openManualReview = (point: RuleReviewPoint) => {
  const detailId = String(point.detailId || '').trim()
  if (!detailId) return ElMessage.warning('当前审核要点缺少任务明细ID，无法发起人工复核')
  manualReviewRef.value?.acceptParams({
    taskId: props.projectTaskId,
    detailId,
    categoryRuleId: String(props.selectedRule.categoryRuleId || ''),
    ruleId: String(point.ruleId || ''),
    aiInfo: loadedAiInfo.value,
    loadAiInfo
  })
}

const selectReviewPoint = (point: RuleReviewPoint, index: number) => {
  reviewTableModalVisible.value = false
  reviewTableInitialIndex.value = 0
  selectedReviewPointKey.value = getReviewPointKey(point, index)
}

/** 结论富文本里的链接、附件、评审明细自行响应点击，不再冒泡成「选中要点」 */
const isRichTextActionTarget = (event: Event) => {
  const target = event.target
  if (!(target instanceof Element)) return false
  const actionEl = target.closest('a[href], button, [role="button"]')
  return Boolean(actionEl) && actionEl !== event.currentTarget
}

const activateReviewPoint = (event: Event, point: RuleReviewPoint, index: number) => {
  if (isRichTextActionTarget(event)) return
  selectReviewPoint(point, index)
}
const handleReviewTableOpen = ({ index }: AuditReviewTablePayload) => {
  if (!reviewTables.value[index]) {
    ElMessage.warning('评审明细尚未生成，请稍后重试')
    return
  }

  reviewTableInitialIndex.value = index
  reviewTableModalVisible.value = true
}
const handleReviewTableModalClose = () => {
  reviewTableModalVisible.value = false
  reviewTableInitialIndex.value = 0
}
/** 与「结论：」同行的结论词（通过/待复核/不通过）；结论与描述都为空时兜底 */
const getReviewPointVerdict = (point: RuleReviewPoint) => {
  const verdict = getAuditPlainText(point.reviewOpinionName)
  const verdictArray = [
    { verdict: '通过', colorClass: 'rule-review-state--success' },
    { verdict: '不通过', colorClass: 'rule-review-state--danger' },
    { verdict: '待复核', colorClass: 'rule-review-state--warning' }
  ]
  if (verdict) {
    let obj = verdictArray.find((item) => item.verdict === verdict)
    return Object.assign({ verdict, colorClass: '' }, obj)
  }
  return getReviewPointConclusionDescription(point)
    ? {
        verdict: '',
        colorClass: ''
      }
    : {
        verdict: '暂无结论',
        colorClass: ''
      }
}

/** 结论描述另起一行展示，可能是 HTML / Markdown */
const getReviewPointConclusionDescription = (point: RuleReviewPoint) => String(point.reviewConclude || '').trim()

/**
 * 要点卡片上的「规则等级」（问题 / 预警 / 异常，按 ruleLevel 码值归一）：
 * 以要点自己的 `ruleLevelName` 为准，缺了回落到所属规则的等级名
 * （等级描述的是规则，接口只在规则行上给时也要能显示），两处都空就不渲染这一行。
 */
const getReviewPointLevelName = (point: RuleReviewPoint) => getAuditRiskLevelName(point) || getAuditRiskLevelName(props.selectedRule)
const getReviewPointLevelTone = (point: RuleReviewPoint) => auditRiskLevelToneByName(getReviewPointLevelName(point))

/**
 * 人工审核结论签章（需求 2026-10-13）：`listRuleReview` 回的人工复核意见
 * —— `rgReviewOpinion` 码值（0 不通过 / 1 通过）或对应的 `rgReviewOpinionName`。
 *
 * 优先按码值判，名称只在码值缺失时兜底（接口实测会少给码值）；
 * 名称要**精确比对**，不能用 includes('通过') —— 那会把「不通过」判成通过。
 * 两者都没有 = 还没做过人工复核，返回 null（不盖章）。
 */
const MANUAL_VERDICT_BY_CODE: Record<string, 'passed' | 'failed'> = { '1': 'passed', '0': 'failed' }
const getReviewPointManualVerdict = (point: RuleReviewPoint): { tone: 'passed' | 'failed'; label: string } | null => {
  const code = String(point.rgReviewOpinion ?? '').trim()
  let tone = MANUAL_VERDICT_BY_CODE[code] || ''
  if (!tone) {
    const name = getAuditPlainText(point.rgReviewOpinionName)
    if (name === '通过') tone = 'passed'
    else if (name === '不通过') tone = 'failed'
  }
  if (!tone) return null
  return { tone, label: tone === 'passed' ? '通过' : '不通过' }
}

watch(
  () => [props.selectedRule.id, props.selectedRule.code, props.selectedRule.points],
  () => {
    previewPopoverVisible.value = false
    reviewTableModalVisible.value = false
    reviewTableInitialIndex.value = 0
    selectedReviewPointKey.value = reviewPoints.value[0] ? getReviewPointKey(reviewPoints.value[0], 0) : ''
    isReviewProcessCollapsed.value = false
  },
  { immediate: true }
)

const ruleStatusCodeMap = {
  failed: '0',
  warning: '2',
  passed: '1',
  reject: '3'
} as const
/** 兜底计数（按规则状态）：宿主没在 ruleFilters 里给 count 时用 —— 页签与状态一一对应才准 */
const ruleFilterCounts = computed(() =>
  props.selectedRules.reduce<Record<string, number>>(
    (counts, rule) => {
      const statusCode = ruleStatusCodeMap[rule.result]
      if (statusCode) counts[statusCode] = (counts[statusCode] || 0) + 1
      return counts
    },
    { '': props.selectedRules.length, '0': 0, '1': 0, '2': 0, '3': 0 }
  )
)
/** 页签计数：宿主给了 count 就用（风险分级页签的计数要跟随「不看通过规则」开关，只有宿主机算得到） */
const getRuleFilterCount = (filterValue: string) => {
  const option = props.ruleFilters.find((item) => item.value === filterValue)
  return option?.count ?? ruleFilterCounts.value[filterValue] ?? 0
}
/** 除「全部」外还有可切换状态时才渲染筛选条 */
const hasRuleFilterOptions = computed(() => props.ruleFilters.filter((item) => item.value !== '').length > 0)
const ruleStatusAppearanceMap = {
  failed: { tone: 'danger', icon: CircleCloseFilled },
  warning: { tone: 'warning', icon: Clock },
  passed: { tone: 'success', icon: Check },
  reject: { tone: 'info', icon: Clock }
} as const

/** 人工审核意见配色（mixReviewStatus 码值）：1 通过 / 2 待复核 / 4 复核不通过 / 5 复核通过 */
const MIX_REVIEW_APPEARANCE_BY_CODE: Record<string, { tone: string; icon: any }> = {
  '1': ruleStatusAppearanceMap.passed,
  '2': ruleStatusAppearanceMap.warning,
  '4': ruleStatusAppearanceMap.failed,
  '5': ruleStatusAppearanceMap.passed
}
/**
 * 右侧状态徽标：文案严格取 listCategoryRuleReview 的 mixReviewStatusName，
 * 不再按 mixReviewStatus 码值兜底；名称为空时不展示徽标。
 * 配色/图标仍按码值取，码值缺失时走中性灰。
 */
const getRuleStatus = (rule: ReviewRule) => {
  const label = String(rule.mixReviewStatusName || '').trim()
  if (!label) return undefined
  const code = String(rule.mixReviewStatus || '').trim()
  return { ...(MIX_REVIEW_APPEARANCE_BY_CODE[code] || ruleStatusAppearanceMap.reject), label }
}

const { isRuleGrouped, ruleGroups, isRuleGroupExpanded, toggleRuleGroup } = useRuleClassifyGroups({
  projectTaskId: () => props.projectTaskId,
  filteredRules: () => props.filteredRules,
  ruleClassifies: () => props.ruleClassifies
})

const getClassifyIcon = (name?: string) => {
  const text = String(name || '')
  if (text.includes('必要')) return Sparkles
  if (text.includes('合规')) return ShieldCheck
  if (text.includes('经济')) return Coins
  return List
}
</script>
