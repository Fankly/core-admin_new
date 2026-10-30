<template>
  <div class="summary-grid">
    <article v-if="showProjectInfo" class="info-card glass-card content-enter" :class="{ 'is-expanded': expanded }">
      <div
        class="card-title project-info-heading"
        role="button"
        tabindex="0"
        :aria-expanded="expanded"
        aria-controls="project-basic-info-details"
        @click="$emit('toggle')"
        @keydown.enter="$emit('toggle')"
        @keydown.space.prevent="$emit('toggle')"
      >
        <div class="section-title">
          <span class="title-icon" aria-hidden="true"
            ><el-icon><Document /></el-icon
          ></span>
          <h2>项目基本信息</h2>
          <span class="project-summary-name"
            ><ReText>{{ project.xmmc }}</ReText></span
          >
        </div>
        <div class="project-info-actions">
          <button
            v-if="showProjectMore"
            class="compact-action-button project-info-more"
            type="button"
            title="查看项目更多详情"
            @click.stop="$emit('show-more')"
            @keydown.stop
          >
            <el-icon aria-hidden="true"><MoreFilled /></el-icon>
            <span>更多详情</span>
          </button>
          <span class="project-info-toggle-hint">{{ expanded ? '收起' : '展开' }}</span>
          <el-icon class="project-info-chevron" :class="{ 'is-expanded': expanded }" aria-hidden="true">
            <ChevronDown />
          </el-icon>
        </div>
      </div>
      <div class="project-info-collapse" :class="{ 'is-expanded': expanded }" :aria-hidden="!expanded" :inert="expanded ? undefined : ''">
        <div class="project-info-collapse__content">
          <dl id="project-basic-info-details" class="info-grid">
            <div class="info-grid-cols">
              <div v-for="field in projectInfoFields" :key="field.label">
                <dt>{{ field.label }}</dt>
                <dd :class="{ money: field.money }"
                  ><ReText>{{ field.value }}</ReText></dd
                >
              </div>
            </div>
          </dl>
        </div>
      </div>
    </article>

    <article class="overview-card glass-card content-enter delay-one" v-loading="summaryLoading" element-loading-text="正在加载审核结论">
      <div class="overview-summary">
        <div class="overview-heading">
          <span class="title-icon" aria-hidden="true">
            <el-icon><ShieldCheck /></el-icon>
          </span>
          <h2 class="overall-review-title">总体评审情况</h2>
        </div>
        <!-- 右侧内容区：风险分级统计（+详情版的导出/分级标准/问题项目都排在这一行） -->
        <div class="overview-main">

        <!-- 结论获取失败时给出原因与重试，而不是把报错当结论文本展示 -->
        <div v-if="auditSummary.errorText" class="overall-review-error" role="alert">
          <el-icon class="overall-review-error__icon" aria-hidden="true"><WarningFilled /></el-icon>
          <span class="overall-review-error__text">{{ auditSummary.errorText }}</span>
          <button type="button" class="overall-review-error__action" @click="$emit('retry')">
            <el-icon aria-hidden="true"><Refresh /></el-icon>
            <span>重试</span>
          </button>
        </div>
        <div v-else class="overall-review-result">
           <!-- <div class="overall-review-text">
            <el-icon class="overall-review-quote" aria-hidden="true"><Quote /></el-icon>
            <ReText :line-clamp="2" class="overall-review-text__conclusion">
              <TypewriterText
                v-if="auditSummary.conclusion"
                class="overall-review-text__conclusion-text"
                :text="auditSummary.conclusion"
                tag="span"
                :animate="false"
                @price-view-navigate="(payload) => $emit('navigate-price-view', payload)"
              />
              <template v-else>暂无总体评审结论</template>
            </ReText>
          </div> -->
       <!-- 风险分级统计（照 2026-10-14 效果图）：带底色的胶囊标签，问题 / 预警 / 异常；
          标签前一条竖线把标题与统计隔开。数字口径见 AuditDetailWorkbench 的 riskLevelStats。 -->
          <div class="overview-risk-row"> 
           <div class="overview-risk-stats" role="group" aria-label="风险分级统计">
              <span
                v-for="level in riskLevels"
                :key="level.code"
                :class="['overview-risk-stat overview-risk-stat--clickable', level.tone ? `overview-risk-stat--${level.tone}` : 'overview-risk-stat--muted']"
                role="button"
                tabindex="0"
                :aria-label="`按「${level.name}」筛选评审规则，${level.count} 项`"
                @click="$emit('select-risk-level', level.name)"
                @keydown.enter="$emit('select-risk-level', level.name)"
                @keydown.space.prevent="$emit('select-risk-level', level.name)"
              >
                <span class="overview-risk-stat__cap">{{ level.name }}</span>
                <span class="overview-risk-stat__num">{{ level.count }}</span>
              </span>
          </div> 
          </div>
            <!-- 「分级标准怎么定？」：点击展开分级判定口径，内容取字典 AI_AUDIT_TASK_RESULT_DECOMPOSE_COM --> 
            <div class="overall-review-actions">
              <el-popover
                  v-if="riskStandardItems.length"
                  placement="bottom-end"
                  trigger="click"
                  width="430"
                  popper-class="workbench-risk-def-popover"
                >
                  <template #reference>
                    <button type="button" class="overview-risk-tip">分级标准怎么定？</button>
                  </template>
                  <div class="risk-def-panel">
                    <h3 class="risk-def-panel__title"><span class="risk-def-panel__bar"></span>分级判定口径</h3>
                    <div v-for="level in riskStandardItems" :key="level.code || level.name" class="risk-def-panel__row">
                      <span :class="['risk-def-panel__tag', level.tone ? `risk-def-panel__tag--${level.tone}` : 'risk-def-panel__tag--muted']">{{
                        level.name
                      }}</span>
                      <!-- 字典的 note 是富文本（形如 <b>规则失守…</b>，后果不可逆、…），交给项目统一的富文本组件渲染 -->
                      <TypewriterText v-if="level.note" class="risk-def-panel__text" :text="level.note" tag="span" :animate="false" />
                    </div>
                  </div>
                </el-popover>
              <button
                type="button"
                class="compact-action-button overall-review-export"
                :disabled="exporting"
                :aria-busy="exporting"
                title="导出审核意见"
                @click="$emit('export')"
              >
                <el-icon aria-hidden="true"><Download /></el-icon>
                <span>{{ exporting ? '导出中' : '导出审核意见' }}</span>
              </button>
              <span v-if="auditSummary.statusText" :class="['conclusion-badge', conclusionClass(auditSummary.statusTone)]">
                <el-icon><component :is="statusIcon" /></el-icon><ReText>{{ auditSummary.statusText }}</ReText>
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReText from '@/components/ReText/src/index.vue'
import TypewriterText from '../../smartTaskAudit/components/TypewriterText.vue'
import { auditRiskLevelConfigs, auditRiskLevelToneByCode } from '../../smartTaskAudit/components/auditDetailHelpers'
import { ChevronDown, Clock, CircleCheckFilled, Document, Download, MoreFilled, Refresh, ShieldCheck, Quote, WarningFilled } from '../icons'
import type { WorkbenchAuditSummary, WorkbenchProject } from '../types'

/** 分级标准字典项（字典 AI_AUDIT_TASK_RESULT_DECOMPOSE_COM：档位名 + 判定口径富文本 note） */
export interface RiskStandardItem {
  code?: string
  name?: string
  /** 判定口径，富文本（形如 `<b>规则失守直接触及资金真实性、合规红线或廉洁风险</b>，后果不可逆、…`） */
  note?: string
}

const props = withDefaults(
  defineProps<{
    project: WorkbenchProject
    expanded: boolean
    auditSummary: WorkbenchAuditSummary
    conclusionClass: (tone?: string) => string
    showProjectMore?: boolean
    /** 为 false 时隐藏「项目基本信息」卡片，只保留总体评审情况 */
    showProjectInfo?: boolean
    /** 审核结论加载中 */
    summaryLoading?: boolean
    /** 审核要点结论导出中 */
    exporting?: boolean
    /**
     * 详情版「总体评审情况」（智能审核详情用）：导出与分级标准、问题项目徽标都在分级统计同一行，
     * 且不显示总体结论与状态徽标；评审工作台页不开这个开关，保持原有的结论 + 徽标展示。
     */
    detailSummary?: boolean
    /** 风险分级标准（字典 AI_AUDIT_TASK_RESULT_DECOMPOSE_COM）；为空则不渲染「分级标准怎么定？」 */
    riskStandards?: RiskStandardItem[]
    /**
     * 动态分级档位（智能审核详情页按规则列表实时算出来的）：`name` 等级名 / `tone` 配色位 / `count` 条数。
     * 传了就按它渲染右侧统计，不传仍用审核结论接口的三档汇总数（评审工作台（一）走这条路）。
     */
    riskLevels?: RiskLevelStatItem[]
  }>(),
  {
    showProjectMore: true,
    showProjectInfo: true,
    summaryLoading: false,
    exporting: false,
    detailSummary: false,
    riskStandards: () => [],
    riskLevels: () => []
  }
)

defineEmits(['toggle', 'show-more', 'retry', 'export', 'navigate-price-view', 'select-risk-level'])

/** 动态分级档位（宿主按当前规则列表算好传进来） */
export interface RiskLevelStatItem {
  /** 等级名（按码值归一：问题 / 预警 / 异常；见 auditDetailHelpers 的 AUDIT_RISK_LEVEL_NAME_BY_CODE） */
  name: string
  /** 配色位（danger / warning / yellow，见 auditRiskLevelToneByName）；未知等级为空串走中性色 */
  tone: string
  count: number
}

/**
 * 右侧分级统计：
 * - 有 riskLevels（智能审核详情页）→ 档位**由数据动态生成**，数字是宿主按 reviewOpinion 0/2 统计的条数；
 * - 否则退回审核结论接口按等级汇总的发现数（评审工作台（一）的口径）。
 *
 * 显示名优先用接口实际下发的 ruleLevelName（counts[code].name），为空时回落到码值映射名（问题/预警/异常）；
 * 配色始终按 ruleLevel 码值取（1→danger红 / 2→warning橙 / 3→yellow黄），不受名称变化影响。
 */
const riskLevels = computed(() => {
  if (props.riskLevels.length) {
    return props.riskLevels.map((level) => ({ code: level.name, name: level.name, tone: level.tone, count: Number(level.count) || 0 }))
  }
  return auditRiskLevelConfigs
    .map((level) => {
      const entry = props.auditSummary.counts?.[level.code]
      return {
        ...level,
        name: entry?.name || level.name,
        count: Number(entry?.count ?? 0)
      }
    })
    .filter((level) => level.count > 0)
})

/**
 * 「分级标准怎么定？」弹层内容：字典 AI_AUDIT_TASK_RESULT_DECOMPOSE_COM 的条目
 * （`name` 档位名 / `note` 判定口径富文本）。
 * **档位名一律用字典自己下发的 name** —— 这个弹层的权威来源就是那份字典，页面不替它改名
 * （需求 2026-10-14 澄清：别把「按码值归一等级名」那套套到字典内容上）。
 * 只借分级配置做两件事：**排序**（1 问题 → 2 预警 → 3 异常，让弹层顺序与顶部统计一致）
 * 与**配色**（按 code 取色位）；字典里没列的码值排到最后、走中性样式。
 */
const riskStandardItems = computed(() => {
  const orderOf = new Map(auditRiskLevelConfigs.map((level, index) => [String(level.code), index]))
  return props.riskStandards
    .map((item) => ({
      code: String(item?.code ?? ''),
      name: String(item?.name ?? '').trim(),
      note: String(item?.note ?? '').trim(),
      tone: auditRiskLevelToneByCode(String(item?.code ?? ''))
    }))
    .filter((item) => item.name || item.note)
    .sort((a, b) => (orderOf.get(a.code) ?? Number.MAX_SAFE_INTEGER) - (orderOf.get(b.code) ?? Number.MAX_SAFE_INTEGER))
})

const statusIcon = computed(() => {
  const tone = props.conclusionClass(props.auditSummary.statusTone)
  if (tone === 'passed') return CircleCheckFilled
  // 风险项目（问题/隐患/异常）统一用警告图标，只有待定态才用时钟
  if (tone === 'danger' || tone === 'warning' || tone === 'yellow') return WarningFilled
  return Clock
})

const projectInfoFields = computed(() =>
  [
    { label: '项目编码', value: props.project.xmbm },
    { label: '项目类型', value: props.project.proTypeName },
    { label: '实施年度', value: props.project.jhssnd },
    { label: '一级单位', value: props.project.yjdw },
    { label: '二级单位', value: props.project.ejdw },
    { label: '任务状态', value: props.project.statusName },
    { label: '当前执行规则', value: props.project.ruleName },
    { label: '优先级', value: props.project.priorityName },
    { label: '材料预处理', value: props.project.docPreStatusName },
    { label: '创建时间', value: props.project.createTime },
    { label: '开始时间', value: props.project.startTime },
    { label: '完成时间', value: props.project.finishTime },
    { label: '预算事项名称', value: props.project.yssxName },
    { label: '申报金额(含税)（万元）', value: props.project.allInvestTax, money: true },
    { label: '申报金额(不含税)（万元）', value: props.project.amount, money: true }
  ].filter((field) => field.value !== undefined && field.value !== null && String(field.value).trim() !== '')
)
</script>
