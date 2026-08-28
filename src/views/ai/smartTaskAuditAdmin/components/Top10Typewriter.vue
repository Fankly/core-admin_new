<template>
  <div class="top10-typewriter">
    <div v-if="items.length === 0" class="top10-typewriter__empty">暂无相似项目数据</div>
    <template v-for="(xmInfo, index) in items" :key="index">
      <div v-show="index < revealedCount" class="top10-typewriter__item top10-typewriter__item--enter">
        <div class="xsx_data">
          <div
            class="xsx_data_index"
            :class="
              index == 0 ? 'xsx_data_index_one' : index == 1 ? 'xsx_data_index_two' : index == 2 ? 'xsx_data_index_three' : 'xsx_data_index_other'
            "
            >{{ index + 1 }}</div
          >
          <div class="xsx_data_item">
            <div class="xsx_data_item_title">{{ typedNames[index] }}</div>
            <div class="xsx_data_cont_item">
              <template v-if="displayMode === 'similarity-analysis'">
                <div v-for="detail in xmInfo.dimensionMatches || []" :key="detail.dimensionName" class="xsx_data_item_other">
                  <div>{{ `${detail.dimensionName || '匹配维度'}：` }}</div>
                  <div>{{ formatTotalScore(detail.combinedScore ?? detail.score) }}</div>
                </div>
              </template>
              <template v-else>
                <template v-for="(value, key) in xmInfo.dimensionScores" :key="key">
                  <div class="xsx_data_item_other">
                    <div>{{ `${key}：` }}</div>
                    <div>{{ formatTotalScore(value) }}</div>
                  </div>
                </template>
              </template>
            </div>
          </div>
          <div class="xsx_data_left">
            <div class="xsx_data_prc" :class="xmInfo.totalScore >= 0.7 ? 'score-high' : xmInfo.totalScore >= 0.4 ? 'score-mid' : 'score-low'">{{
              formatTotalScore(xmInfo.totalScore)
            }}</div>
            <i
              class="xsx_data_icon"
              :class="expandedSet.has(index) ? 'el-icon-caret-bottom' : 'el-icon-caret-right'"
              @click="toggleDetail(index)"
            ></i>
          </div>
        </div>
        <template v-if="expandedSet.has(index)">
          <div v-if="!(xmInfo.dimensionMatches && xmInfo.dimensionMatches.length)" class="top10-typewriter__empty">暂无维度明细</div>
          <template v-for="(detail, num) in xmInfo.dimensionMatches" :key="num">
            <div class="xsx_detail top10-typewriter__item--enter">
              <div class="xsx_detail_top">
                <div class="xsx_detail_top_title">{{ detailTyped[index]?.[num]?.dimensionName }}</div>
                <div class="xsx_detail_top_prc">{{ formatTotalScore(detail.score) }}</div>
              </div>
              <div class="xsx_deatil_center">
                <div class="xsx_deatil_center_left">
                  <div class="xsx_deatil_center_left_title">当前项目</div>
                  <div class="xsx_deatil_center_left_content">
                    <span v-if="detail.currentHighlightedText" v-html="detail.currentHighlightedText"></span>
                    <span v-else class="top10-typewriter__empty-inline">暂无当前项目文本</span>
                  </div>
                </div>
                <div class="xsx_deatil_center_right">
                  <div class="xsx_deatil_center_right_title">历史项目</div>
                  <div class="xsx_deatil_center_left_content">
                    <span v-if="detail.historyHighlightedText" v-html="detail.historyHighlightedText"></span>
                    <span v-else class="top10-typewriter__empty-inline">暂无历史项目文本</span>
                  </div>
                </div>
              </div>
              <div class="xsx_deatil_bottom">
                <template v-if="displayMode === 'similarity-analysis'">
                  <div class="xsx_deatil_bottom_title">相似性分析</div>
                  <div class="xsx_deatil_bottom_contert xsx_deatil_bottom_contert--analysis">
                    <span v-if="detail.similarityAnalysis" class="xsx_deatil_bottom_analysis">{{ detail.similarityAnalysis }}</span>
                    <span v-else class="top10-typewriter__empty-inline">暂无相似性分析</span>
                  </div>
                </template>
                <template v-else>
                  <div class="xsx_deatil_bottom_title">证据关键词({{ `${(detail.evidences || []).length}` }})</div>
                  <div class="xsx_deatil_bottom_contert">
                    <template v-for="(gjcVal, gjcIndex) in detail.evidences || []" :key="gjcIndex">
                      <div v-show="gjcIndex < (detailEvidencesCount[index]?.[num] || 0)" class="xsx_deatil_bottom_contert_item">
                        {{ gjcVal.phrase }}
                      </div>
                    </template>
                    <span v-if="!(detail.evidences && detail.evidences.length)" class="top10-typewriter__empty-inline">暂无证据关键词</span>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

interface Top10Progress {
  itemIndex: number
  completed: boolean
  updatedAt: number
}

const top10ProgressCache = new Map<string, Top10Progress>()
const TOP10_CACHE_MAX_ENTRIES = 200
const TOP10_CACHE_TTL_MS = 30 * 60 * 1000

const aaa = ref([{ aaaaa: '111', phrase: '111', fromChunkId: '111' }])

const pruneTop10ProgressCache = (now = Date.now()) => {
  top10ProgressCache.forEach((progress, key) => {
    if (now - progress.updatedAt > TOP10_CACHE_TTL_MS) {
      top10ProgressCache.delete(key)
    }
  })
  while (top10ProgressCache.size > TOP10_CACHE_MAX_ENTRIES) {
    const oldestKey = top10ProgressCache.keys().next().value
    if (oldestKey === undefined) break
    top10ProgressCache.delete(oldestKey)
  }
}

const props = withDefaults(
  defineProps<{
    items: any[]
    animate?: boolean
    persistKey?: string | number
    itemDelay?: number
    displayMode?: 'evidence-keywords' | 'similarity-analysis'
  }>(),
  {
    animate: false,
    persistKey: '',
    itemDelay: 400,
    displayMode: 'evidence-keywords'
  }
)

const emit = defineEmits<{
  (event: 'typing-progress'): void
  (event: 'typing-complete'): void
}>()

interface DetailTyped {
  dimensionName: string
  currentHighlightedText: string
  historyHighlightedText: string
}

const revealedCount = ref(0)
const typedNames = ref<string[]>([])
const expandedSet = ref<Set<number>>(new Set())
const detailRevealedCount = ref<Record<number, number>>({})
const detailEvidencesCount = ref<Record<number, Record<number, number>>>({})
const detailTyped = ref<Record<number, Record<number, DetailTyped>>>({})
let advanceTimer: ReturnType<typeof setTimeout> | null = null
let nameTimer: ReturnType<typeof setTimeout> | null = null
let cacheKey = ''
const TYPE_SPEED = 100

const formatTotalScore = (score: unknown) => {
  const num = Number(score)
  if (!Number.isFinite(num)) return '-'
  return `${(num * 100).toFixed(2)}%`
}

const getProjectName = (item: any) => {
  const directName = String(item?.projectName ?? item?.xmmc ?? item?.name ?? '').trim()
  if (directName) return directName
  const projectNameMatch = Array.isArray(item?.dimensionMatches)
    ? item.dimensionMatches.find((detail: any) => detail?.dimensionName === '项目名称')
    : undefined
  return String(projectNameMatch?.historyHighlightedText || item?.projectId || '未命名项目')
}

const ensureTypedNames = () => {
  const next = typedNames.value.slice()
  while (next.length < props.items.length) next.push('')
  typedNames.value = next
}

const charsPerTick = (text: string) => {
  const len = text.length
  if (len > 500) return 15
  if (len > 200) return 8
  return 3
}

const typeNameFor = (index: number) => {
  if (nameTimer) {
    clearTimeout(nameTimer)
    nameTimer = null
  }
  const full = getProjectName(props.items[index])
  if (!full) {
    advanceTimer = setTimeout(revealNext, props.itemDelay)
    return
  }

  ensureTypedNames()
  const tick = () => {
    const current = typedNames.value[index] || ''
    if (current.length >= full.length) {
      nameTimer = null
      advanceTimer = setTimeout(revealNext, props.itemDelay)
      return
    }
    const next = full.slice(0, current.length + charsPerTick(full))
    const arr = typedNames.value.slice()
    arr[index] = next
    typedNames.value = arr
    emit('typing-progress')
    nameTimer = setTimeout(tick, TYPE_SPEED)
  }
  tick()
}

const fillNamesUpTo = (count: number) => {
  ensureTypedNames()
  const arr = typedNames.value.slice()
  for (let i = 0; i < count && i < props.items.length; i += 1) {
    arr[i] = getProjectName(props.items[i])
  }
  typedNames.value = arr
}

const toggleDetail = (index: number) => {
  const next = new Set(expandedSet.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
    const totalDetails = props.items[index]?.dimensionMatches?.length || 0
    const rcMap = { ...detailRevealedCount.value }
    rcMap[index] = totalDetails
    detailRevealedCount.value = rcMap
    const map = { ...detailTyped.value }
    const itemMap: Record<number, DetailTyped> = {}
    const evMap = { ...detailEvidencesCount.value }
    const evItemMap: Record<number, number> = {}
    for (let d = 0; d < totalDetails; d += 1) {
      const detail = props.items[index]?.dimensionMatches?.[d]
      itemMap[d] = {
        dimensionName: String(detail?.dimensionName ?? ''),
        currentHighlightedText: String(detail?.currentHighlightedText ?? ''),
        historyHighlightedText: String(detail?.historyHighlightedText ?? '')
      }
      evItemMap[d] = Array.isArray(detail?.evidences) ? detail.evidences.length : 0
    }
    map[index] = itemMap
    detailTyped.value = map
    evMap[index] = evItemMap
    detailEvidencesCount.value = evMap
  }
  expandedSet.value = next
}

const hashItems = (items: any[]) => {
  let hash = 2166136261
  const str = JSON.stringify(items)
  for (let index = 0; index < str.length; index += 1) {
    hash ^= str.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const getCacheKey = () => {
  if (props.persistKey !== undefined && props.persistKey !== null && String(props.persistKey) !== '') {
    return String(props.persistKey)
  }
  return `top10:${hashItems(props.items)}`
}

const saveProgress = () => {
  if (!cacheKey) return
  const now = Date.now()
  top10ProgressCache.delete(cacheKey)
  top10ProgressCache.set(cacheKey, {
    itemIndex: revealedCount.value,
    completed: revealedCount.value >= props.items.length,
    updatedAt: now
  })
  pruneTop10ProgressCache(now)
}

const emitComplete = () => {
  emit('typing-complete')
}

const revealNext = () => {
  advanceTimer = null
  if (revealedCount.value >= props.items.length) {
    saveProgress()
    emitComplete()
    return
  }

  revealedCount.value += 1
  emit('typing-progress')
  saveProgress()

  const currentIndex = revealedCount.value - 1
  typeNameFor(currentIndex)
}

const start = () => {
  if (advanceTimer) {
    clearTimeout(advanceTimer)
    advanceTimer = null
  }
  if (nameTimer) {
    clearTimeout(nameTimer)
    nameTimer = null
  }
  expandedSet.value = new Set()
  detailRevealedCount.value = {}
  detailEvidencesCount.value = {}
  detailTyped.value = {}
  cacheKey = getCacheKey()
  ensureTypedNames()

  if (!props.animate || props.items.length === 0) {
    revealedCount.value = props.items.length
    fillNamesUpTo(props.items.length)
    emitComplete()
    return
  }

  pruneTop10ProgressCache()
  const cached = top10ProgressCache.get(cacheKey)
  if (cached && !cached.completed && cached.itemIndex < props.items.length) {
    revealedCount.value = cached.itemIndex
    fillNamesUpTo(revealedCount.value)
  } else {
    revealedCount.value = 0
  }

  if (revealedCount.value >= props.items.length) {
    fillNamesUpTo(props.items.length)
    emitComplete()
    return
  }

  advanceTimer = setTimeout(revealNext, props.itemDelay)
}

watch(
  () => [props.items, props.animate, props.persistKey] as const,
  () => start(),
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  saveProgress()
  if (advanceTimer) clearTimeout(advanceTimer)
  if (nameTimer) clearTimeout(nameTimer)
})

defineExpose({ toggleDetail })
</script>

<style scoped lang="less">
.top10-typewriter__item--enter {
  animation: top10-item-enter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes top10-item-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .top10-typewriter__item--enter {
    animation: none !important;
  }
}

.top10-typewriter__empty {
  padding: 24px 12px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}

.top10-typewriter__empty-inline {
  color: #9ca3af;
  font-size: 12px;
}
</style>

<style lang="less">
.top10-typewriter .xsx_data {
  padding: 10px 10px 10px 20px;
  border: 1px solid #f6f6f6;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  box-sizing: border-box;
  .xsx_data_index {
    width: 28px;
    height: 28px;
    text-align: center;
    line-height: 28px;
    border-radius: 14px;
    color: #fff;
    font-size: 13px;
    font-weight: bold;
    background-color: #9ca3af;
  }
  .xsx_data_index_one {
    background-color: #c62828;
  }
  .xsx_data_index_two {
    background-color: #e65100;
  }
  .xsx_data_index_three {
    background-color: #ffa500;
  }
  .xsx_data_index_other {
    background-color: #bbb;
  }
  .xsx_data_item {
    font-size: 16px;
    color: #293d40;
    display: flex;
    flex-direction: column;
    gap: 8px;
    .xsx_data_cont_item {
      display: flex;
      align-items: center;
      gap: 10px;
      .xsx_data_item_other {
        padding: 5px;
        font-size: 12px;
        display: flex;
        gap: 5px;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
    }
  }
  .xsx_data_left {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 5px;
    .xsx_data_prc {
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .score-high {
      background: #ffebee;
      color: #c62828;
    }
    .score-mid {
      background: #fff3e0;
      color: #e65100;
    }
    .score-low {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .xsx_data_icon {
      font-size: 24px;
      cursor: pointer;
    }
  }
}
.top10-typewriter .xsx_detail {
  width: 100%;
  border: 1px solid #e9e9e9;
  border-radius: 5px;
  margin-bottom: 10px;
  box-sizing: border-box;
  .xsx_detail_top {
    padding: 10px;
    width: 100%;
    height: 50px;
    box-sizing: border-box;
    background-color: #f6f6f6;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
    .xsx_detail_top_title {
      font-size: 16px;
    }
    .xsx_detail_top_prc {
      font-size: 12px;
      color: #6b7280;
    }
  }
  .xsx_deatil_center {
    width: 100%;
    border-bottom: 1px solid #e9e9e9;
    display: flex;
    .xsx_deatil_center_left {
      width: 50%;
      padding: 10px;
      box-sizing: border-box;
      border-right: 1px solid #e9e9e9;
      .xsx_deatil_center_left_title {
        color: var(--color-primary);
      }
    }
    .xsx_deatil_center_right {
      width: 50%;
      padding: 10px;
      box-sizing: border-box;
      .xsx_deatil_center_right_title {
        color: #ffa500;
      }
    }
  }
  .xsx_deatil_bottom {
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .xsx_deatil_bottom_contert {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      .xsx_deatil_bottom_contert_item {
        padding: 5px;
        font-size: 12px;
        display: flex;
        gap: 5px;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
      .xsx_deatil_bottom_analysis {
        width: 100%;
        color: #475569;
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
      }
    }
  }
}
.top10-typewriter .xsx_deatil_center_left_content {
  width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  word-break: break-all;
  font-size: 12px;
}
</style>
