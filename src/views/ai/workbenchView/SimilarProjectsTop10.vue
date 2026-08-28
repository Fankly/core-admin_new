<template>
  <section class="similar-projects" aria-label="相似项目列表">
    <div v-if="items.length" class="similar-project-list">
      <article v-for="(project, index) in items" :key="`${projectName(project)}-${index}`" class="similar-project-item">
        <button type="button" class="similar-project-item__head" :aria-expanded="expandedIndexes.has(index)" @click="toggle(index)">
          <span :class="['similar-project-rank', { 'is-top': index < 3 }]">{{ index + 1 }}</span>
          <span class="similar-project-item__main">
            <strong class="similar-project-item__name" :title="projectName(project)">{{ projectName(project) }}</strong>
            <span v-if="summaryDimensionEntries(project).length" class="similar-project-item__dimensions">
              <span v-for="dimension in summaryDimensionEntries(project).slice(0, 3)" :key="dimension[0]">
                {{ dimension[0] }} {{ formatScore(dimension[1]) }}
              </span>
            </span>
          </span>
          <span :class="['similar-project-score', scoreTone(project.totalScore)]">{{ formatScore(project.totalScore) }}</span>
          <el-icon class="similar-project-item__chevron" :class="{ 'is-expanded': expandedIndexes.has(index) }" aria-hidden="true">
            <ChevronDown />
          </el-icon>
        </button>

        <div
          class="similar-project-detail-collapse"
          :class="{ 'is-expanded': expandedIndexes.has(index) }"
          :aria-hidden="!expandedIndexes.has(index)"
          :inert="expandedIndexes.has(index) ? undefined : ''"
        >
          <div class="similar-project-detail-collapse__content">
            <div class="similar-project-item__detail">
              <template v-if="dimensionMatches(project).length">
                <article
                  v-for="(detail, detailIndex) in dimensionMatches(project)"
                  :key="`${detail.dimensionName || 'dimension'}-${detailIndex}`"
                  class="similar-project-match"
                >
                  <div class="similar-project-match__head">
                    <strong>{{ detail.dimensionName || '匹配维度' }}</strong>
                    <span>{{ formatScore(detail.score) }}</span>
                  </div>
                  <div class="similar-project-match__comparison">
                    <div class="similar-project-match__side">
                      <span class="similar-project-match__label">当前项目</span>
                      <span v-if="detail.currentHighlightedText" class="similar-project-match__text" v-html="detail.currentHighlightedText"></span>
                      <span v-else class="similar-project-match__empty">暂无当前项目文本</span>
                    </div>
                    <div class="similar-project-match__side">
                      <span class="similar-project-match__label">历史项目</span>
                      <span v-if="detail.historyHighlightedText" class="similar-project-match__text" v-html="detail.historyHighlightedText"></span>
                      <span v-else class="similar-project-match__empty">暂无历史项目文本</span>
                    </div>
                  </div>
                  <div v-if="isSimilarityAnalysisMode" class="similar-project-match__analysis">
                    <span class="similar-project-match__label">相似性分析</span>
                    <span v-if="similarityAnalysisText(detail)" class="similar-project-match__analysis-text">
                      {{ similarityAnalysisText(detail) }}
                    </span>
                    <span v-else class="similar-project-match__empty">暂无相似性分析</span>
                  </div>
                  <div v-else class="similar-project-match__evidence">
                    <span class="similar-project-match__label">证据关键词（{{ (detail.evidences || []).length }}）</span>
                    <div v-if="detail.evidences?.length" class="similar-project-match__evidence-list">
                      <span
                        v-for="(evidence, evidenceIndex) in detail.evidences"
                        :key="`${evidence.phrase || 'evidence'}-${evidenceIndex}`"
                        class="similar-project-match__evidence-chip"
                      >
                        {{ evidence.phrase || evidence }}
                      </span>
                    </div>
                    <span v-else class="similar-project-match__empty">暂无证据关键词</span>
                  </div>
                </article>
              </template>
              <div v-else-if="dimensionEntries(project).length" class="similar-project-dimension-list">
                <div v-for="dimension in dimensionEntries(project)" :key="dimension[0]" class="similar-project-dimension">
                  <span>{{ dimension[0] }}</span>
                  <strong>{{ formatScore(dimension[1]) }}</strong>
                </div>
              </div>
              <span v-else class="similar-project-empty-inline">暂无维度匹配明细</span>
            </div>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="similar-projects__empty">暂无相似项目数据</div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from './icons'

type SimilarProject = Record<string, any>

const props = withDefaults(
  defineProps<{
    reviewMessage?: unknown
    displayMode?: 'evidence-keywords' | 'similarity-analysis'
  }>(),
  {
    reviewMessage: '',
    displayMode: 'evidence-keywords'
  }
)

const expandedIndexes = ref<Set<number>>(new Set())
const isSimilarityAnalysisMode = computed(() => props.displayMode === 'similarity-analysis')

const parseMessage = (value: unknown): unknown => {
  let current = value
  for (let depth = 0; depth < 4 && typeof current === 'string'; depth += 1) {
    const text = current.trim()
    if (!text) return undefined
    try {
      current = JSON.parse(text)
    } catch {
      return undefined
    }
  }
  return current
}

const items = ref<SimilarProject[]>([])

const syncItems = () => {
  const parsed = parseMessage(props.reviewMessage)
  const list = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as any).top10 : parsed
  items.value = Array.isArray(list) ? list.slice(0, 10).filter((item) => item && typeof item === 'object') : []
  expandedIndexes.value = new Set()
}

watch(() => props.reviewMessage, syncItems, { immediate: true })

const projectName = (project: SimilarProject) => {
  const directName = String(project.projectName ?? project.xmmc ?? project.name ?? '').trim()
  if (directName) return directName

  const projectNameMatch = Array.isArray(project.dimensionMatches)
    ? project.dimensionMatches.find((item: any) => item?.dimensionName === '项目名称')
    : undefined
  return String(projectNameMatch?.historyHighlightedText || project.projectId || '未命名项目')
}

const dimensionEntries = (project: SimilarProject): [string, unknown][] => {
  if (!project.dimensionScores || typeof project.dimensionScores !== 'object' || Array.isArray(project.dimensionScores)) return []
  return Object.entries(project.dimensionScores)
}

const dimensionMatches = (project: SimilarProject): SimilarProject[] => {
  if (!Array.isArray(project.dimensionMatches)) return []
  return project.dimensionMatches.filter((item: unknown) => item && typeof item === 'object')
}

const summaryDimensionEntries = (project: SimilarProject): [string, unknown][] => {
  if (!isSimilarityAnalysisMode.value) return dimensionEntries(project)
  return dimensionMatches(project).map((detail) => [String(detail.dimensionName || '匹配维度'), detail.combinedScore])
}

const similarityAnalysisText = (detail: SimilarProject) => String(detail.similarityAnalysis || '').trim()

const formatScore = (value: unknown) => {
  const score = Number(value)
  if (!Number.isFinite(score)) return '-'
  return `${(score <= 1 ? score * 100 : score).toFixed(2)}%`
}

const scoreTone = (value: unknown) => {
  const score = Number(value)
  if (!Number.isFinite(score)) return 'score-low'
  const normalized = score <= 1 ? score : score / 100
  return normalized >= 0.7 ? 'score-high' : normalized >= 0.4 ? 'score-mid' : 'score-low'
}

const toggle = (index: number) => {
  const next = new Set(expandedIndexes.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  expandedIndexes.value = next
}
</script>

<style scoped lang="less">
.similar-projects {
  min-height: 0;
}

.similar-project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.similar-project-item {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
}

.similar-project-item__head {
  width: 100%;
  min-height: 52px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  color: #1e293b;
  text-align: left;
  background: #fff;
  cursor: pointer;
}

.similar-project-item__head:hover {
  background: #f2f9f8;
}

.similar-project-item__head:focus-visible {
  outline: 2px solid #00706b;
  outline-offset: -2px;
}

.similar-project-rank {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #64748b;
  background: #eef2f6;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.similar-project-rank.is-top {
  color: #00706b;
  background: #dff3f0;
}

.similar-project-item__main {
  min-width: 0;
  flex: 1 1 auto;
}

.similar-project-item__name {
  display: block;
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-project-item__dimensions {
  margin-top: 3px;
  display: flex;
  gap: 8px;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.similar-project-item__dimensions span {
  flex: 0 0 auto;
}

.similar-project-score {
  flex: 0 0 auto;
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.similar-project-score.score-high {
  color: #005f5a;
  background: #d8efec;
}

.similar-project-score.score-mid {
  color: #00706b;
  background: #f2f9f8;
}

.similar-project-score.score-low {
  color: #64748b;
  background: #eef2f6;
}

.similar-project-item__chevron {
  flex: 0 0 16px;
  color: #64748b;
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.similar-project-item__chevron.is-expanded {
  transform: rotate(180deg);
}

.similar-project-detail-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  visibility: hidden;
  transition: grid-template-rows 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.12s ease, visibility 0s linear 0.24s;
}

.similar-project-detail-collapse.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  visibility: visible;
  transition-delay: 0s, 0.06s, 0s;
}

.similar-project-detail-collapse__content {
  min-height: 0;
  overflow: hidden;
}

.similar-project-item__detail {
  padding: 10px 12px 12px;
  border-top: 1px solid #eef2f6;
  background: #f8fcfb;
}

.similar-project-match {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
}

.similar-project-match + .similar-project-match {
  margin-top: 8px;
}

.similar-project-match__head {
  min-height: 38px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #eef2f6;
  color: #1e293b;
  background: #f2f9f8;
  font-size: 12px;
}

.similar-project-match__head strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-project-match__head > span {
  flex: 0 0 auto;
  margin-left: auto;
  color: #00706b;
  font-variant-numeric: tabular-nums;
}

.similar-project-match__comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-bottom: 1px solid #eef2f6;
}

.similar-project-match__side {
  min-width: 0;
  padding: 10px;
}

.similar-project-match__label {
  display: block;
  margin-bottom: 6px;
  color: #00706b;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.similar-project-match__text,
.similar-project-match__empty {
  display: block;
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.similar-project-match__text :deep(em),
.similar-project-match__text :deep(mark) {
  padding: 0 2px;
  color: #005f5a;
  background: #d8efec;
  font-style: normal;
}

.similar-project-match__empty,
.similar-project-empty-inline {
  color: #94a3b8;
}

.similar-project-match__evidence {
  padding: 10px;
}

.similar-project-match__analysis {
  padding: 10px;
}

.similar-project-match__evidence .similar-project-match__label,
.similar-project-match__analysis .similar-project-match__label {
  margin-bottom: 8px;
}

.similar-project-match__analysis-text {
  display: block;
  color: #475569;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.similar-project-match__evidence-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.similar-project-match__evidence-chip {
  max-width: 100%;
  padding: 4px 7px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  background: #f8fcfb;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-project-dimension-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
}

.similar-project-dimension {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
}

.similar-project-dimension strong {
  color: #00706b;
  font-variant-numeric: tabular-nums;
}

.similar-project-empty-inline,
.similar-projects__empty {
  color: #94a3b8;
  font-size: 12px;
}

.similar-projects__empty {
  padding: 28px 12px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .similar-project-item__chevron,
  .similar-project-detail-collapse {
    transition-duration: 0.01ms !important;
  }
}
</style>
