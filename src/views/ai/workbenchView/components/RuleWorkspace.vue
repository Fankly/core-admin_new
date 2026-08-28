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
          <span class="rule-title-count" :aria-label="`共 ${selectedRules.length} 条评审规则`">{{ selectedRules.length }}</span>
        </div>
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
        <span v-else class="panel-collapsed-indicator" aria-hidden="true"
          ><el-icon><ArrowRight /></el-icon
        ></span>
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
            <span class="rule-filter-label"
              ><ReText>{{ filter.label }}</ReText></span
            >
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
                        <strong class="rule-item-title"
                          ><ReText>{{ getAuditPlainText(rule.name) }}</ReText></strong
                        >
                        <span
                          v-if="activeRuleFilter === '' && getRuleStatus(rule.result)"
                          :class="['rule-review-state', `rule-review-state--${getRuleStatus(rule.result)?.tone}`]"
                          :aria-label="`审核状态：${getRuleStatus(rule.result)?.label}`"
                        >
                          <component :is="getRuleStatus(rule.result)?.icon" class="rule-review-state-icon" aria-hidden="true" />
                          <span class="rule-review-state-text"
                            ><ReText>{{ getRuleStatus(rule.result)?.label }}</ReText></span
                          >
                        </span>
                      </span>
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
                <strong class="rule-item-title"
                  ><ReText>{{ getAuditPlainText(rule.name) }}</ReText></strong
                >
                <span
                  v-if="activeRuleFilter === '' && getRuleStatus(rule.result)"
                  :class="['rule-review-state', `rule-review-state--${getRuleStatus(rule.result)?.tone}`]"
                  :aria-label="`审核状态：${getRuleStatus(rule.result)?.label}`"
                >
                  <component :is="getRuleStatus(rule.result)?.icon" class="rule-review-state-icon" aria-hidden="true" />
                  <span class="rule-review-state-text"
                    ><ReText>{{ getRuleStatus(rule.result)?.label }}</ReText></span
                  >
                </span>
              </span>
            </button>
            <div v-if="filteredRules.length === 0" class="rule-empty">{{ ruleEmptyText }}</div>
          </div>
        </div>
      </div>
    </article>

    <article v-loading="ruleDetailLoading" element-loading-text="正在加载规则详情" class="rule-detail-card glass-card content-enter delay-three">
      <div class="rule-detail-head">
        <div class="rule-detail-title">
          <div class="rule-detail-title-copy">
            <h2 class="rule-detail-name"
              ><ReText>{{ getAuditPlainText(selectedRule.name) }}</ReText></h2
            >
          </div>
          <span v-if="selectedRule.id" class="rule-detail-meta" aria-label="审核结论">
            <span class="rule-detail-meta__label">审核结论</span>
            <ReText :line-clamp="2" class="rule-detail-meta__conclusion">
              <TypewriterText
                v-if="selectedRule.ruleviewConclude"
                class="rule-detail-meta__conclusion-text"
                :text="selectedRule.ruleviewConclude"
                tag="span"
                :animate="false"
                @attach-preview="handleInlineAttachPreview"
                @review-table-open="handleReviewTableOpen"
                @price-view-navigate="handlePriceViewNavigate"
              />
              <template v-else>暂无审核结论</template>
            </ReText>
            <button
              v-if="canRerun"
              type="button"
              class="rule-rerun-button"
              :disabled="!getRuleRerunKey(selectedRule) || isSelectedRuleRerunning || isSelectedRuleRerunConfirming"
              title="重新分析当前规则"
              @click.prevent.stop="$emit('rerun-rule', selectedRule)"
            >
              <el-icon aria-hidden="true"><Refresh /></el-icon>
              <span>重新分析</span>
            </button>
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
            <!-- 结论支持 HTML / Markdown，内部可能带链接等可点击节点，故用 div + role=button 承载，避免嵌套交互元素 -->
            <div
              v-for="(point, index) in reviewPoints"
              :key="getReviewPointKey(point, index)"
              role="button"
              tabindex="0"
              :class="['review-point-item', { active: selectedReviewPoint === point }]"
              :aria-pressed="selectedReviewPoint === point"
              @click="activateReviewPoint($event, point, index)"
              @keydown.enter="activateReviewPoint($event, point, index)"
              @keydown.space.prevent="activateReviewPoint($event, point, index)"
            >
              <ReText class="review-point-item__heading" :line-clamp="2">
                <span class="review-point-item__prefix">审核要点{{ point.pointId }}:</span>
                <span class="review-point-item__name">{{ getAuditPlainText(point.pointName) || '未命名审核要点' }}</span>
              </ReText>
              <span class="review-point-item__conclusion">
                <!-- 通过/不通过等结论词与「结论：」同行，结论描述另起一行 -->
                <span class="review-point-item__conclusion-head">
                  <span class="review-point-item__conclusion-label">结论：</span>
                  <span class="review-point-item__conclusion-verdict">{{ getReviewPointVerdict(point) }}</span>
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
                />
              </span>
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
              <el-popover
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
                              :disabled="previewing || !isAttachPreviewable(row)"
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
                    审核要点{{ selectedReviewPoint.pointId }}:
                  </span>
                  <strong class="review-point-detail__selected-name">{{
                    getAuditPlainText(selectedReviewPoint.pointName) || '未命名审核要点'
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
                  <div class="review-point-detail__card-body">
                    <TypewriterText
                      v-if="hasSelectedReviewPointRuleDescription"
                      class="review-point-detail__text review-point-detail__rich-text"
                      :text="selectedReviewPointRuleDescription"
                      tag="div"
                      :animate="false"
                      @attach-preview="handleInlineAttachPreview"
                      @review-table-open="handleReviewTableOpen"
                      @price-view-navigate="handlePriceViewNavigate"
                    />
                    <p v-else class="review-point-detail__text">暂无规则说明</p>
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
                  <div class="review-point-detail__card-body review-point-detail__card-body--quote">
                    <TypewriterText
                      v-if="hasSelectedReviewPointEvidence"
                      class="review-point-detail__text review-point-detail__rich-text"
                      :text="selectedReviewPointEvidence"
                      tag="div"
                      :animate="false"
                      @attach-preview="handleInlineAttachPreview"
                      @review-table-open="handleReviewTableOpen"
                      @price-view-navigate="handlePriceViewNavigate"
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

      <div v-if="isSelectedRuleRerunning" class="rule-detail-rerun-loading">
        <RerunLoading :title="selectedRule.name || 'AI 模型推理中'" subtitle="正在重新分析" />
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
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { RuleReviewPoint, TXmAttach } from '@/api/ai/smartTaskAudit'
import ReText from '@/components/ReText/src/index.vue'
import RerunLoading from '../../smartTaskAudit/components/RerunLoading.vue'
import ReviewTableModal from '../../smartTaskAudit/components/ReviewTableModal.vue'
import TypewriterText from '../../smartTaskAudit/components/TypewriterText.vue'
import { getAuditPlainText, isRichAuditText } from '../../smartTaskAudit/components/auditDetailHelpers'
import type { AuditPriceViewPayload, AuditReviewTablePayload } from '../../smartTaskAudit/components/auditDetailHelpers'
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
  canRerun?: boolean
  rerunningRuleIds?: ReadonlySet<string>
  rerunConfirmingRuleId?: string
}>()

const emit = defineEmits<{
  (event: 'filter-change', value: string): void
  (event: 'select-rule', rule: ReviewRule): void
  (event: 'rerun-rule', rule: ReviewRule): void
  (event: 'preview-attach', file: TXmAttach, trigger?: HTMLElement | null): void
  (event: 'reload-rules'): void
  (event: 'navigate-price-view', payload: AuditPriceViewPayload): void
}>()

const canRerun = computed(() => props.canRerun === true)
const previewOpen = computed(() => props.previewOpen === true)
const isSelectedRuleRerunning = computed(() => props.rerunningRuleIds?.has(getRuleRerunKey(props.selectedRule)) === true)
const isSelectedRuleRerunConfirming = computed(() => props.rerunConfirmingRuleId === getRuleRerunKey(props.selectedRule))
const previewPopoverVisible = ref(false)
const previewButtonRef = ref<HTMLButtonElement | null>(null)
const {
  attachListLoading,
  attachList,
  attachListEmptyText,
  previewing,
  getAttachKey,
  getAttachDisplayName,
  getAttachTypeName,
  isAttachPreviewable,
  loadAttachList,
  handlePreviewAttach,
  handleInlineAttachPreview
} = useWorkbenchAttachments(toRef(props, 'selectedRule'), toRef(props, 'projectTaskId'), (file, trigger) => emit('preview-attach', file, trigger))

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
const reviewPoints = computed(() => (Array.isArray(props.selectedRule.points) ? props.selectedRule.points : []))
const selectedReviewPointKey = ref('')
const reviewTableModalVisible = ref(false)
const reviewTableInitialIndex = ref(0)
const reviewTables = computed(() => (Array.isArray(props.selectedRule.reviewTable) ? props.selectedRule.reviewTable : []))
const getReviewPointKey = (point: RuleReviewPoint, index: number) => String(point.id || point.pointId || index)
const selectedReviewPoint = computed(
  () => reviewPoints.value.find((point, index) => getReviewPointKey(point, index) === selectedReviewPointKey.value) || reviewPoints.value[0]
)
const selectedReviewPointEvidence = computed(() => String(selectedReviewPoint.value?.originalEvidence || ''))
const hasSelectedReviewPointEvidence = computed(() => Boolean(selectedReviewPointEvidence.value.trim()))
const selectedReviewPointRuleDescription = computed(() => String(selectedReviewPoint.value?.ruleDescription || ''))
const hasSelectedReviewPointRuleDescription = computed(() => Boolean(selectedReviewPointRuleDescription.value.trim()))
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
  const verdict = getAuditPlainText(point.reviewConclusion)
  if (verdict) return verdict
  return getReviewPointConclusionDescription(point) ? '' : '暂无结论'
}

/** 结论描述另起一行展示，可能是 HTML / Markdown */
const getReviewPointConclusionDescription = (point: RuleReviewPoint) => String(point.conclusionDescription || '').trim()

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
  passed: '1'
} as const
const ruleFilterCounts = computed(() =>
  props.selectedRules.reduce<Record<string, number>>(
    (counts, rule) => {
      const statusCode = ruleStatusCodeMap[rule.result]
      if (statusCode) counts[statusCode] = (counts[statusCode] || 0) + 1
      return counts
    },
    { '': props.selectedRules.length, '0': 0, '1': 0, '2': 0 }
  )
)
const getRuleFilterCount = (filterValue: string) => ruleFilterCounts.value[filterValue] || 0
/** 除「全部」外还有可切换状态时才渲染筛选条 */
const hasRuleFilterOptions = computed(() => props.ruleFilters.filter((item) => item.value !== '').length > 0)
const ruleStatusFallbackMap = {
  failed: { label: '未通过', tone: 'danger', icon: CircleCloseFilled },
  warning: { label: '待复核', tone: 'warning', icon: Clock },
  passed: { label: '通过', tone: 'success', icon: Check }
} as const
const getRuleStatus = (result: ReviewRule['result']) => {
  const status = ruleStatusFallbackMap[result]
  if (!status) return undefined
  const filter = props.ruleFilters.find((item) => item.value === ruleStatusCodeMap[result])
  return { ...status, label: filter?.label || status.label }
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
