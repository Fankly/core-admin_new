<template>
  <div :class="['audit-list', { 'audit-list--compact': compact }]">
    <template v-if="auditRuleGroups.length">
      <div class="audit-collapse">
        <div class="audit-rule-group audit-rule-group--header">
          <span class="audit-rule-group__col audit-rule-group__col--level">风险等级</span>
          <div class="audit-rule-group__main">
            <span class="audit-rule-group__col audit-rule-group__col--name">审核项</span>
            <span class="audit-rule-group__col audit-rule-group__col--summary" aria-hidden="true"></span>
            <span class="audit-rule-group__col audit-rule-group__col--conclude">审核结果</span>
          </div>
        </div>
        <template v-for="group in auditRuleGroups" :key="group.key">
          <div :class="['audit-rule-section', `audit-rule-section--${group.tone}`]">
            <div class="audit-rule-section__body">
              <div class="audit-rule-section__side">
                <div class="audit-rule-section__meta">
                  <component :is="group.icon" v-if="group.icon" class="audit-rule-section__icon" :stroke-width="2" aria-hidden="true" />
                  <span class="audit-rule-section__label">{{ group.label }}</span>
                </div>
                <span class="audit-rule-section__count">共 {{ group.items.length }} 项</span>
                <div class="audit-rule-section__status-summary">
                  <span class="audit-rule-section__action" :title="`${group.failedCount + group.pendingCount}项存在风险`">
                    {{ group.failedCount + group.pendingCount }}项风险
                  </span>
                </div>
              </div>
              <div class="audit-rule-section__main">
                <template v-for="{ item, index } in group.items" :key="item.detailId || item.ruleId || index">
                  <div class="audit-collapse-title">
                    <div class="audit-collapse-title__name">
                      <component :is="getRuleItemIcon()" class="audit-collapse-title__name-icon" :stroke-width="1.8" aria-hidden="true" />
                      <ReText>{{ item.ruleName }}</ReText>
                    </div>
                    <div class="audit-collapse-title__text">
                      <ReText class="audit-collapse-title__summary" :line-clamp="2">
                        <TypewriterText :text="item.reviewConclude" :animate="false" />
                      </ReText>
                    </div>
                    <div class="audit-collapse-title__actions">
                      <button
                        type="button"
                        class="audit-collapse-title__detail"
                        :aria-label="`查看${item.ruleName || '当前规则'}的评审详情`"
                        @click="emit('detail', item, index)"
                      >
                        <span>详情</span>
                      </button>
                      <div v-if="getAuditStatus(item) || item.reviewOpinionName" :class="['audit-status', getAuditStatusToneClass(item)]">
                        <component :is="getAuditStatusIcon(item)" class="status-icon" :stroke-width="2.4" aria-hidden="true" />
                        {{ getAuditStatusText(item) }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
    <div v-else class="audit-empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue'
import type { Component, PropType } from 'vue'
import { BadgeCheck, CircleAlert, CircleCheck, CircleHelp, CircleX, Siren, SquareCheckBig } from 'lucide-vue-next'
import ReText from '@/components/ReText/src/index.vue'
import TypewriterText from './TypewriterText.vue'
import type { RuleReviewDetailItem } from './auditDetailHelpers'

type AuditStatus = 'passed' | 'pending' | 'failed' | ''
type AuditRuleGroupTone = 'danger' | 'warning' | 'primary' | 'default'

interface AuditRuleGroup {
  key: string
  label: string
  tone: AuditRuleGroupTone
  icon?: Component
  items: Array<{ item: RuleReviewDetailItem; index: number }>
  failedCount: number
  pendingCount: number
}

const props = defineProps({
  items: {
    type: Array as PropType<RuleReviewDetailItem[]>,
    default: () => []
  },
  emptyText: {
    type: String,
    default: '暂无评审信息'
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: 'detail', item: RuleReviewDetailItem, index: number): void
}>()

const UNKNOWN_RULE_LEVEL = '__unknown__'
const levelConfigs = [
  { ruleLevel: '1', label: '问题', tone: 'danger' as const, icon: markRaw(Siren) },
  { ruleLevel: '2', label: '隐患', tone: 'warning' as const, icon: markRaw(CircleAlert) },
  { ruleLevel: '3', label: '异常', tone: 'primary' as const, icon: markRaw(BadgeCheck) }
]
const levelAliasMap: Record<string, string> = { problem: '1', risk: '2', abnormal: '3', low: '3' }
const statusTextMap: Record<string, string> = { '1': '通过', '2': '待复核', '0': '不通过' }
const statusIconMap: Record<Exclude<AuditStatus, ''>, Component> = {
  passed: markRaw(CircleCheck),
  pending: markRaw(CircleHelp),
  failed: markRaw(CircleX)
}

const normalizeRuleLevel = (value: any) => {
  const ruleLevel = String(value ?? '')
  return levelAliasMap[ruleLevel] || ruleLevel
}

const getAuditStatus = (item: RuleReviewDetailItem): AuditStatus => {
  const opinion = String(item.reviewOpinion ?? '')
  if (opinion === '1') return 'passed'
  if (opinion === '2') return 'pending'
  if (opinion === '0') return 'failed'
  return ''
}

const getAuditStatusText = (item: RuleReviewDetailItem) => statusTextMap[String(item.reviewOpinion ?? '')] || item.reviewOpinionName || ''

const getAuditStatusToneClass = (item: RuleReviewDetailItem) => {
  const status = getAuditStatus(item)
  return status === 'passed'
    ? 'audit-status--success'
    : status === 'failed'
    ? 'audit-status--danger'
    : status === 'pending'
    ? 'audit-status--warning'
    : ''
}

const getAuditStatusIcon = (item: RuleReviewDetailItem) => statusIconMap[getAuditStatus(item) as Exclude<AuditStatus, ''>] || markRaw(CircleAlert)

const getRuleItemIcon = () => markRaw(SquareCheckBig)

const createGroup = (ruleLevel: string): AuditRuleGroup => {
  const config = levelConfigs.find((item) => item.ruleLevel === ruleLevel)
  return {
    key: ruleLevel || UNKNOWN_RULE_LEVEL,
    label: config?.label || '其他',
    tone: config?.tone || 'default',
    icon: config?.icon,
    items: [],
    failedCount: 0,
    pendingCount: 0
  }
}

const auditRuleGroups = computed(() => {
  const groups = new Map<string, AuditRuleGroup>()
  levelConfigs.forEach((config) => groups.set(config.ruleLevel, createGroup(config.ruleLevel)))
  props.items.forEach((item, index) => {
    const ruleLevel = normalizeRuleLevel(item.ruleLevel) || UNKNOWN_RULE_LEVEL
    if (!groups.has(ruleLevel)) groups.set(ruleLevel, createGroup(ruleLevel))
    const group = groups.get(ruleLevel)
    if (!group) return
    group.items.push({ item, index })
    if (getAuditStatus(item) === 'failed') group.failedCount += 1
    if (getAuditStatus(item) === 'pending') group.pendingCount += 1
  })
  return Array.from(groups.values()).filter((group) => group.items.length)
})
</script>

<style scoped lang="less">
.audit-list {
  --section-x: 8px;
  /* 左列固定收窄，避免「风险文案」把列线顶歪 */
  --level-column: 104px;
  --name-column: 29.3%;
  --result-column: clamp(170px, 23.2%, 300px);
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow-x: auto;
  overflow-y: auto;
  box-sizing: border-box;
  color: #253b3e;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  container-type: inline-size;
  scrollbar-gutter: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(41, 171, 166, 0.38) transparent;
}

.audit-list::-webkit-scrollbar {
  width: 7px;
}

.audit-list::-webkit-scrollbar-track {
  background: transparent;
}

.audit-list::-webkit-scrollbar-thumb {
  background: rgba(41, 171, 166, 0.38);
  border-radius: 7px;
}

.audit-collapse {
  min-width: 760px;
  overflow: hidden;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(252, 255, 255, 0.98) 0%, rgba(244, 251, 250, 0.96) 100%);
  border: 1px solid #9fded9;
  border-radius: 9px;
  box-shadow: 0 8px 20px rgba(31, 151, 145, 0.12), inset 0 0 18px rgba(69, 192, 185, 0.08), inset 0 1px 0 #fff;
}

.audit-rule-group {
  display: grid;
  /*
   * 表头只右缩 section-x；首列用 section-x + level-column 补偿内容行左侧缩进，
   * 保证表头/内容主区域同宽，列线对齐。
   */
  grid-template-columns: calc(var(--section-x) + var(--level-column)) minmax(0, 1fr);
  min-height: 40px;
  color: #173c40;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  background: linear-gradient(100deg, #fbfefe 0%, #e8f6f5 48%, #f1faf9 100%);
  border-bottom: 1px solid #c5e5e2;
  box-shadow: inset 0 1px 0 #fff, 0 2px 5px rgba(40, 158, 151, 0.08);
}

.audit-rule-group--header {
  margin-right: var(--section-x);
}

.audit-rule-group__col {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 40px;
  padding: 0 18px;
  box-sizing: border-box;
}

.audit-rule-group__main {
  display: grid;
  grid-template-columns: minmax(208px, var(--name-column)) minmax(280px, 1fr) var(--result-column);
  min-width: 0;
  border-left: 1px solid #c5e5e2;
}

.audit-rule-group__col--level,
.audit-rule-group__col--conclude {
  justify-content: center;
  padding: 0 8px;
  text-align: center;
  white-space: nowrap;
}

.audit-rule-group__col--name {
  grid-column: 1;
  justify-content: center;
  padding-right: 18px;
  padding-left: 18px;
  text-align: center;
}

.audit-rule-group__col--summary {
  display: none;
}

.audit-rule-group__col--conclude {
  grid-column: 2 / 4;
  justify-content: center;
  border-left: 1px solid #c5e5e2;
}

.audit-rule-section {
  margin: 3px var(--section-x) 0;
  border-top: 0;
}

.audit-rule-group--header + .audit-rule-section {
  margin-top: 4px;
}

.audit-rule-section:last-child {
  margin-bottom: 4px;
}

.audit-rule-section__body {
  display: grid;
  grid-template-columns: var(--level-column) minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  min-width: 0;
}

.audit-rule-section__side {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  min-height: 56px;
  /* 上/下/左一致，右侧贴邻内容列故为 0 */
  padding: 12px 0 12px 12px;
  overflow: hidden;
  box-sizing: border-box;
  color: #344b4e;
  text-align: center;
  border: 1px solid #d6e9e7;
  border-right: 0;
  border-radius: 6px 0 0 6px;
  box-shadow: inset 0 1px 0 #fff, 0 2px 6px rgba(35, 139, 134, 0.06);
}

.audit-rule-section__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  white-space: nowrap;
}

.audit-rule-section__label {
  color: currentColor;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.audit-rule-section__count,
.audit-rule-section__action {
  max-width: 100%;
  overflow: hidden;
  color: currentColor;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-rule-section__status-summary {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 1px;
}

.audit-rule-section__icon {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 3px rgba(45, 106, 103, 0.12));
}

.audit-rule-section--danger .audit-rule-section__side {
  color: #ff2a31;
  background: linear-gradient(145deg, #fff 0%, #fff8f7 55%, #ffefed 100%);
}

.audit-rule-section--warning .audit-rule-section__side {
  color: #ff8500;
  background: linear-gradient(145deg, #fff 0%, #fffaf3 55%, #fff0dd 100%);
}

.audit-rule-section--primary .audit-rule-section__side {
  color: #e1a400;
  background: #fff8e1;
}

.audit-rule-section--default .audit-rule-section__side {
  background: #f7fbfb;
  border-color: #d7e7e7;
}

.audit-rule-section__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.audit-collapse-title {
  display: grid;
  /*
   * 内容行两侧都有 section-x 外边距，结果列减 section-x，
   * 与表头（仅右缩）下的 result-column 右边缘对齐。
   */
  grid-template-columns: minmax(208px, var(--name-column)) minmax(280px, 1fr) calc(var(--result-column) - var(--section-x));
  flex: 1 1 56px;
  min-height: 56px;
  overflow: hidden;
  box-sizing: border-box;
  color: #293d40;
  background: linear-gradient(100deg, #fff 0%, #f8fcfb 43%, #e7f5f2 100%);
  border: 1px solid #cfe6e3;
  border-radius: 0 6px 6px 0;
  box-shadow: 0 3px 8px rgba(31, 139, 133, 0.09), inset 0 1px 0 #fff, inset 0 -1px 0 rgba(92, 179, 174, 0.05);
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.audit-rule-section--danger .audit-collapse-title__name {
  background: linear-gradient(90deg, #fffdfd 0%, rgba(255, 255, 255, 0.6) 100%);
}

.audit-rule-section--warning .audit-collapse-title__name {
  background: linear-gradient(90deg, #fffefa 0%, rgba(255, 255, 255, 0.58) 100%);
}

.audit-collapse-title:hover {
  background: linear-gradient(100deg, #fff 0%, #f2faf9 45%, #def1ee 100%);
  border-color: #b9dedb;
  box-shadow: 0 4px 10px rgba(36, 143, 138, 0.13), inset 0 1px 0 #fff;
}

.audit-collapse-title:last-child {
  border-bottom: 1px solid #d5e9e7;
}

.audit-collapse-title__name,
.audit-collapse-title__text,
.audit-collapse-title__actions {
  display: flex;
  align-items: center;
  min-width: 0;
  box-sizing: border-box;
}

.audit-collapse-title__name {
  gap: 8px;
  padding: 8px 16px;
  overflow: hidden;
  color: #26393c;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  text-align: left;
  border-right: 1px solid #d3e8e6;
}

.audit-collapse-title__name-icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  color: #00a6a0;
  filter: drop-shadow(0 2px 2px rgba(0, 145, 138, 0.12));
}

.audit-collapse-title__text {
  padding: 8px 16px;
  overflow: hidden;
  color: #445b60;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  text-align: left;
  border-right: 1px solid #d3e8e6;
}

.audit-collapse-title__summary {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-height: calc(1.6em * 2);
  overflow: hidden;
  line-height: 1.6;
  text-align: left;
  text-overflow: ellipsis;
  word-break: break-word;
  /* 与 ReText line-clamp=2 一致，避免内部 HTML 把省略撑破 */
  display: -webkit-box !important;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.audit-collapse-title__summary :deep(.typewriter),
.audit-collapse-title__summary :deep(p),
.audit-collapse-title__summary :deep(span),
.audit-collapse-title__summary :deep(div) {
  display: inline;
  margin: 0;
  padding: 0;
  line-height: inherit;
}

.audit-collapse-title__name :deep(.re-text) {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.audit-collapse-title__actions {
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
}

.audit-collapse-title__detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 34px;
  padding: 0;
  color: #008d8b;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 3px;
  cursor: pointer;
}

.audit-collapse-title__detail:hover {
  color: #006f6d;
}

.audit-collapse-title__detail:focus-visible {
  outline: 2px solid rgba(0, 141, 139, 0.35);
  outline-offset: 2px;
}

.audit-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 112px;
  width: 112px;
  height: 32px;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #b9c9cc;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(42, 122, 118, 0.07), inset 0 1px 0 #fff;
}

.audit-status--success {
  color: #28a74d;
  border-color: #8dd7a1;
}

.audit-status--danger {
  color: #ff3d45;
  border-color: #ff969b;
}

.audit-status--warning {
  color: #ff8a00;
  border-color: #ffb65e;
}

.status-icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  fill: currentColor;
  stroke: #fff;
}

.audit-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: #6f8588;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

.audit-list--compact {
  --level-column: 96px;
  --section-x: 6px;
  --name-column: 30%;
  --result-column: 154px;
}

.audit-list--compact .audit-collapse {
  min-width: 660px;
  border-radius: 8px;
}

.audit-list--compact .audit-rule-group {
  min-height: 44px;
  font-size: 14px;
}

.audit-list--compact .audit-rule-group__col {
  min-height: 44px;
}

.audit-list--compact .audit-rule-group__main {
  grid-template-columns: minmax(150px, var(--name-column)) minmax(190px, 1fr) var(--result-column);
}

.audit-list--compact .audit-collapse-title {
  grid-template-columns: minmax(150px, var(--name-column)) minmax(190px, 1fr) calc(var(--result-column) - var(--section-x));
}

.audit-list--compact .audit-rule-group__col--name {
  padding-right: 18px;
  padding-left: 18px;
}

.audit-list--compact .audit-rule-section {
  margin-top: 3px;
}

.audit-list--compact .audit-rule-section__main {
  gap: 3px;
}

.audit-list--compact .audit-rule-section__side,
.audit-list--compact .audit-collapse-title {
  min-height: 56px;
}

.audit-list--compact .audit-rule-section__side {
  padding: 12px 0 12px 12px;
}

.audit-list--compact .audit-rule-section__label {
  font-size: 14px;
  line-height: 1.2;
}

.audit-list--compact .audit-rule-section__count {
  font-size: 12px;
  line-height: 1.6;
}

.audit-list--compact .audit-rule-section__icon {
  width: 28px;
  height: 28px;
}

.audit-list--compact .audit-collapse-title__name,
.audit-list--compact .audit-collapse-title__text {
  padding: 8px 12px;
  font-size: 14px;
}

.audit-list--compact .audit-collapse-title__actions {
  gap: 8px;
  padding: 8px 10px;
}

.audit-list--compact .audit-collapse-title__detail {
  min-width: 28px;
  font-size: 14px;
}

.audit-list--compact .audit-status {
  flex-basis: 80px;
  width: 80px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 1.2;
}

@container (max-width: 980px) {
  .audit-collapse {
    min-width: 740px;
  }

  .audit-rule-group__main {
    grid-template-columns: minmax(190px, 28.5%) minmax(240px, 1fr) var(--result-column);
  }

  .audit-collapse-title {
    grid-template-columns: minmax(190px, 28.5%) minmax(240px, 1fr) calc(var(--result-column) - var(--section-x));
  }

  .audit-rule-group__col--name {
    padding-right: 16px;
    padding-left: 16px;
  }

  .audit-collapse-title__name,
  .audit-collapse-title__text {
    padding-right: 16px;
    padding-left: 16px;
    font-size: 14px;
  }

  .audit-collapse-title__actions {
    gap: 9px;
    padding-right: 14px;
    padding-left: 14px;
  }

  .audit-status {
    flex-basis: 92px;
    width: 92px;
    padding: 0 8px;
    font-size: 12px;
  }
}

@container (max-width: 820px) {
  .audit-collapse {
    min-width: 660px;
  }

  .audit-rule-group,
  .audit-rule-group__col {
    min-height: 40px;
  }

  .audit-rule-group {
    grid-template-columns: calc(var(--section-x) + var(--level-column)) minmax(0, 1fr);
    font-size: 14px;
    font-weight: 600;
  }

  .audit-rule-group__main {
    grid-template-columns: minmax(140px, 30%) minmax(170px, 1fr) var(--result-column);
  }

  .audit-collapse-title {
    grid-template-columns: minmax(140px, 30%) minmax(170px, 1fr) calc(var(--result-column) - var(--section-x));
  }

  .audit-rule-group__col--name {
    padding-right: 14px;
    padding-left: 14px;
  }

  .audit-rule-section__body {
    grid-template-columns: var(--level-column) minmax(0, 1fr);
  }

  .audit-rule-section__side,
  .audit-collapse-title {
    min-height: 56px;
  }

  .audit-rule-section__side {
    padding: 12px 0 12px 12px;
  }

  .audit-rule-section__label {
    font-size: 14px;
    line-height: 1.2;
  }

  .audit-rule-section__count,
  .audit-rule-section__action {
    font-size: 12px;
    line-height: 1.6;
  }

  .audit-rule-section__icon {
    width: 28px;
    height: 28px;
  }

  .audit-collapse-title__name,
  .audit-collapse-title__text {
    padding: 8px 12px;
    font-size: 14px;
  }

  .audit-collapse-title__name {
    gap: 8px;
  }

  .audit-collapse-title__name-icon {
    width: 18px;
    height: 18px;
  }

  .audit-collapse-title__actions {
    gap: 8px;
    padding: 8px 10px;
  }

  .audit-collapse-title__detail {
    min-width: 28px;
    font-size: 14px;
  }

  .audit-status {
    flex-basis: 80px;
    width: 80px;
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.2;
  }

  .status-icon {
    width: 16px;
    height: 16px;
  }
}
</style>
