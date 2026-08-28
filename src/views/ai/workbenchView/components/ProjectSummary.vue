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

    <article class="overview-card glass-card content-enter delay-one">
      <div class="overview-summary">
        <div class="overview-heading">
          <span class="title-icon" aria-hidden="true">
            <el-icon><ShieldCheck /></el-icon>
          </span>
          <h2 class="overall-review-title">总体评审情况</h2>
        </div>
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
          <div class="overall-review-text">
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
          </div>
          <span v-if="auditSummary.statusText" :class="['conclusion-badge', conclusionClass(auditSummary.statusTone)]">
            <el-icon><CircleCheckFilled /></el-icon><ReText>{{ auditSummary.statusText }}</ReText>
          </span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReText from '@/components/ReText/src/index.vue'
import TypewriterText from '../../smartTaskAudit/components/TypewriterText.vue'
import { ChevronDown, CircleCheckFilled, Document, MoreFilled, Refresh, ShieldCheck, Quote, WarningFilled } from '../icons'
import type { WorkbenchAuditSummary, WorkbenchProject } from '../types'

const props = withDefaults(
  defineProps<{
    project: WorkbenchProject
    expanded: boolean
    auditSummary: WorkbenchAuditSummary
    conclusionClass: (tone?: string) => string
    showProjectMore?: boolean
    /** 为 false 时隐藏「项目基本信息」卡片，只保留总体评审情况 */
    showProjectInfo?: boolean
  }>(),
  {
    showProjectMore: true,
    showProjectInfo: true
  }
)

defineEmits(['toggle', 'show-more', 'retry', 'navigate-price-view'])

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
