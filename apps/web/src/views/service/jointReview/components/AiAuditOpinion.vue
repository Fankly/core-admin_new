<template>
  <!-- triggerOnly：不渲染入口 UI，由外部工具按钮调用 openDetailModal（与「更多意见」相同） -->
  <section v-if="!triggerOnly" class="joint-review-ai-audit" aria-labelledby="joint-review-ai-audit-title">
    <div class="joint-review-ai-audit__header">
      <div id="joint-review-ai-audit-title" class="joint-review-ai-audit__title section-title">
        <span class="section-title__icon" aria-hidden="true">
          <svg class="joint-review-ai-audit__ai-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- 人头轮廓 -->
            <circle cx="12" cy="9.2" r="7.4" stroke="currentColor" stroke-width="1.5" />
            <!-- 颈部 -->
            <path
              d="M8.6 16.4v1.8c0 1 .8 1.8 1.8 1.8h3.2c1 0 1.8-.8 1.8-1.8v-1.8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <text
              x="12"
              y="9.55"
              text-anchor="middle"
              dominant-baseline="middle"
              fill="currentColor"
              font-size="8.5"
              font-weight="800"
              font-family="Arial, 'Microsoft YaHei', sans-serif"
              letter-spacing="0.2"
            >
              AI
            </text>
          </svg>
        </span>
        <span>AI审核意见</span>
      </div>
      <button
        type="button"
        class="joint-review-ai-audit__more"
        aria-label="查看更多AI审核意见"
        :class="{ 'is-loading': loading }"
        @click="openDetailModal()"
      >
        <span>更多意见</span>
        <i class="el-icon-more el-icon--right" aria-hidden="true"></i>
      </button>
    </div>

    <div v-loading="loading" class="joint-review-ai-audit__content">
      <div class="joint-review-ai-audit__stats">
        <div class="joint-review-ai-audit__filters" role="group" aria-label="按审核意见分类筛选">
          <span class="joint-review-ai-audit__label">分类统计：</span>
          <button
            v-for="category in categories"
            :key="category.level"
            type="button"
            class="joint-review-ai-audit__badge"
            :class="[category.tone, { 'is-active': activeFilter === category.level }]"
            :aria-pressed="activeFilter === category.level"
            @click="toggleFilter(category.level)"
          >
            <span>{{ category.label }}</span
            ><span>{{ category.count }}</span>
          </button>
        </div>
        <!-- <div class="joint-review-ai-audit__result" :class="auditResultTone" aria-live="polite">
          <span>整体审核结果：</span>
          <strong>{{ loading ? '加载中' : auditResultText }}</strong>
        </div> -->
      </div>
      <div class="joint-review-ai-audit__list">
        <div
          v-for="(item, index) in filteredOpinions"
          :key="item.detailId || item.ruleId || index"
          class="joint-review-ai-audit__item"
          :class="{ 'is-stamped': !!getItemManualVerdict(item) }"
        >
          <span class="joint-review-ai-audit__tag" :class="getCategory(item)?.tone || 'total'">
            {{ String(item.ruleLevelName ?? '').trim() || getCategory(item)?.label || '-' }}
          </span>
          <div class="joint-review-ai-audit__item-content">
            <div class="joint-review-ai-audit__item-title">{{ item.auditPointName }}</div>
            <div class="joint-review-ai-audit__description">
              <ReText :line-clamp="2">
                <TypewriterText :text="item.reviewConclude" :animate="false" />
              </ReText>
            </div>
          </div>
          <div class="joint-review-ai-audit__actions">
            <!--
              人工复核签章（需求 2026-10-20）：与评审工作台 RuleWorkspace 的签章同一口径。
              位置在**「人工审核」左侧**。外面套一层零高度 slot，见下方样式注释：
              章只占横向宽度、不贡献高度，行高与无章行完全一致。
              flex: 0 0 auto —— 章不参与压缩：左侧标题/描述再长，也只压缩正文，
              章始终按原尺寸完整显示（章优先于文字）。
              保留指针事件：悬浮可看复核结论（title 里是 rgReviewConclude）。
              一个审核意见只有一条复核记录，所以最多一枚章：有复核结论就盖章
              （绿 = 通过、红 = 不通过），没复核过的不盖。
            -->
            <span v-if="getItemManualVerdict(item)" class="joint-review-ai-audit__stamp-slot">
              <span
                class="joint-review-ai-audit__stamp"
                :class="`joint-review-ai-audit__stamp--${getItemManualVerdict(item)?.tone}`"
                role="img"
                :aria-label="`人工复核${getItemManualVerdict(item)?.label}`"
                :title="getManualVerdictTitle(getItemManualVerdict(item))"
              >
                <span class="joint-review-ai-audit__stamp-text">
                  <span>复核</span>
                  <span>{{ getItemManualVerdict(item)?.label }}</span>
                </span>
              </span>
            </span>
            <button
              v-if="canManualAudit(item)"
              type="button"
              :aria-label="`人工审核：${item.auditPointName || '当前规则'}`"
              @click="openManualAudit(item)"
              >人工审核</button
            >
            <button type="button" :aria-label="getRuleDetailAriaLabel(item)" @click="openRuleDetail(item)">详情</button>
            <button
              v-if="showManualReview && (['0', '2'].includes(String(item.reviewOpinion)) || item.reviewOpinionName)"
              type="button"
              @click="openManualReview(item)"
              >人工复核</button
            >
          </div>
        </div>
        <div v-if="!filteredOpinions.length" class="joint-review-ai-audit__empty">
          {{ loading ? '正在加载审核意见…' : activeFilter === 'all' ? emptyText : '暂无该分类审核意见' }}
        </div>
      </div>
    </div>
  </section>

  <AuditFilePreviewModal :visible="filePreviewVisible" :files="previewFiles" :active-key="activePreviewKey" @close="closeFilePreview" />
  <DetailModal
    :modal="detailModal"
    :detail-row="detailRow"
    :user-info="userInfo"
    project-info-api="LHHS"
    :can-rerun="canRerun"
    :initial-detail-id="detailModal.initialDetailId"
    review-opinions=""
    @close="closeDetailModal"
  />
  <AiManualReviewModal v-if="showManualReview" v-model="manualReviewVisible" :item="manualReviewItem" :project="project" :user-info="userInfo" />
  <!-- 人工审核：与评审工作台 RuleWorkspace 的「人工复核」同一弹窗（复审信息接口） -->
  <SinglePointReviewModal ref="manualAuditRef" @submit="refreshAuditOpinions" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { PropType } from 'vue'
import ReText from '@/components/ReText/src/index.vue'
import { getAuditTaskIdByProId, getRuleReviewInfo, getXmAuditConclude, listRuleReviewNew } from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, TXmAttach } from '@/api/ai/smartTaskAudit'
import AiManualReviewModal from '@/views/service/jointReview/components/AiManualReviewModal.vue'
import SinglePointReviewModal from '@/views/ai/manualReview/components/SinglePointReviewModal.vue'
import { aiToneOf } from '@/views/ai/manualReview/data'
import type { ReviewPointAiInfo } from '@/views/ai/manualReview/data'
import AuditFilePreviewModal from '@/views/ai/smartTaskAudit/components/AuditFilePreviewModal.vue'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import TypewriterText from '@/views/ai/smartTaskAudit/components/TypewriterText.vue'
import {
  getAuditPreviewFileKey,
  resolveAuditPreviewTarget,
  UNSUPPORTED_AUDIT_PREVIEW_TIP
} from '@/views/ai/smartTaskAudit/components/auditFilePreview'
import { getPublicData } from '@/api/common'
import { normalizeOptionList } from '@/views/ai/smartTaskAudit/utils'
import { getManualReviewVerdict } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'
import type { ManualReviewVerdict, RuleReviewDetailItem } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'
import type { SmartTaskAuditRow } from '@/views/ai/smartTaskAudit/types'

type AiAuditOpinionItem = RuleReviewDetailItem

/**
 * 一条 AI审核意见 → 人工复核签章（需求 2026-10-20）。
 * 判定口径与评审工作台一致：**以 rgReviewOpinion 码值为准**（1 通过 / 0 不通过），
 * 码值缺失才按 rgReviewOpinionName 精确比对兜底；都没有返回 null（不盖章）。
 */
const getItemManualVerdict = (item: AiAuditOpinionItem): ManualReviewVerdict | null => getManualReviewVerdict(item)

/** 签章的悬浮说明：结论 + 人工填写的复核结论（没有结论时只留结论词） */
const getManualVerdictTitle = (verdict: ManualReviewVerdict | null) => {
  if (!verdict) return ''
  return verdict.opinion ? `人工复核${verdict.label}\n复核结论：${verdict.opinion}` : `人工复核${verdict.label}`
}

/** 「详情」按钮的无障碍名称；抽成函数避免模板行过长被格式化拆行时把空格带进按钮文本 */
const getRuleDetailAriaLabel = (item: AiAuditOpinionItem) => `查看${item.auditPointName || '当前规则'}的评审详情`

const REVIEW_OPINIONS = '0,2'
/** 需要人工审核的 AI 结论码值：不通过(0) / 待复核(2)，与 RuleWorkspace 同一口径 */
const MANUAL_AUDIT_OPINION_CODES = ['0', '2']
const MANUAL_AUDIT_OPINION_NAMES = ['不通过', '待复核']

const props = defineProps({
  project: {
    type: Object as PropType<Record<string, any> | null>,
    default: null
  },
  userInfo: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  /** 仅专家预审等指定场景展示人工复核入口，默认隐藏 */
  showManualReview: {
    type: Boolean,
    default: false
  },
  /** 仅挂载弹窗能力，不渲染面板入口（由外部按钮触发 openDetailModal） */
  triggerOnly: {
    type: Boolean,
    default: false
  },
  /** 详情弹窗是否展示「重新分析」，由调用页面参数配置控制 */
  canRerun: {
    type: Boolean,
    default: true
  }
})

const loading = ref(false)
const taskId = ref('')
const emptyText = ref('暂无AI审核意见')
const auditResultText = ref('暂无结果')
const auditResultTone = ref('total')
const activeFilter = ref('all')
const ruleLevelLabels = ref<Record<string, string>>({})
const ruleLevelTones: Record<string, string> = { '1': 'problem', '2': 'hazard', '3': 'warning' }
// 名称只取接口与公共代码；保留既有等级的视觉配色。
const categoryDefinitions = computed(() => {
  const labels = { ...ruleLevelLabels.value }
  auditOpinions.value.forEach((item) => {
    const level = getLevel(item)
    const name = String(item.ruleLevelName ?? '').trim()
    if (level && name) labels[level] = name
  })
  return Object.entries(labels).map(([level, label]) => ({ level, label, tone: ruleLevelTones[level] || 'total' }))
})
const getLevel = (item: AiAuditOpinionItem) => String(item.ruleLevel ?? '').trim()
const getCategory = (item: AiAuditOpinionItem) => categoryDefinitions.value.find((category) => category.level === getLevel(item))
const categories = computed(() => [
  ...categoryDefinitions.value.map((category) => ({
    ...category,
    count: auditOpinions.value.filter((item) => getLevel(item) === category.level).length
  })),
  { level: 'all', label: '全部', tone: 'total', count: auditOpinions.value.length }
])
const filteredOpinions = computed(() =>
  activeFilter.value === 'all' ? auditOpinions.value : auditOpinions.value.filter((item) => getLevel(item) === activeFilter.value)
)
const toggleFilter = (level: string) => {
  activeFilter.value = activeFilter.value === level ? 'all' : level
}
const auditOpinions = shallowRef<AiAuditOpinionItem[]>([])
const manualReviewVisible = ref(false)
const manualReviewItem = shallowRef<AiAuditOpinionItem | null>(null)
const manualAuditRef = ref<InstanceType<typeof SinglePointReviewModal>>()
const filePreviewVisible = ref(false)
const previewFiles = shallowRef<TXmAttach[]>([])
const activePreviewKey = ref('')
const detailModal = reactive({
  visible: false,
  loading: false,
  initialDetailId: ''
})
let loadSeq = 0

const projectId = computed(() => String(props.project?.xmId ?? props.project?.proId ?? props.project?.id ?? '').trim())
const projectType = computed(() => String(props.project?.pro_type_id ?? props.project?.proType ?? props.project?.proTypeId ?? '').trim())
const detailRow = computed<SmartTaskAuditRow>(() => ({
  ...(props.project || {}),
  proId: projectId.value,
  proType: projectType.value,
  taskId: taskId.value
}))

/**
 * 传给详情工作台的规则标识。
 * 工作台的规则列表来自 listCategoryRuleReview，该接口 detailId / ruleId 都可能为空，
 * 只有 categoryRuleId 稳定有值，所以优先用它；没有才回落 detailId / ruleId。
 */
const getRuleMatchKey = (item: AiAuditOpinionItem) => {
  return String(item.categoryRuleId || item.detailId || item.ruleId || '').trim()
}

const openRuleDetail = (item: AiAuditOpinionItem) => {
  const matchKey = getRuleMatchKey(item)
  if (!matchKey) {
    ElMessage.info('当前审核意见暂无详情')
    return
  }
  openDetailModal(matchKey)
}

const openManualReview = (item: AiAuditOpinionItem) => {
  if (!props.showManualReview) return
  if (!item.ruleId) {
    ElMessage.info('当前审核意见暂无规则信息，无法人工复核')
    return
  }
  const expertId = String(props.userInfo?.expertId ?? '').trim()
  const meetingId = String(props.userInfo?.meetingId ?? '').trim()
  const reviewXmid = String(props.project?.xmId ?? props.project?.reviewXmid ?? '').trim()
  if (!expertId || !meetingId || !reviewXmid) {
    ElMessage.warning('缺少专家或会议信息，无法人工复核')
    return
  }
  manualReviewItem.value = { ...item }
  manualReviewVisible.value = true
}

/**
 * 「人工审核」按钮的显示条件：与评审工作台 RuleWorkspace 的「人工复核」同一口径——
 * 只有 AI 结论为**不通过(0)** 或 **待复核(2)** 的规则才需要人工介入。
 * 码值缺失时退回按 reviewOpinionName 判断，避免接口少给码值时按钮整片消失。
 */
const canManualAudit = (item: AiAuditOpinionItem) => {
  const code = String(item.reviewOpinion ?? '').trim()
  if (code) return MANUAL_AUDIT_OPINION_CODES.includes(code)
  return MANUAL_AUDIT_OPINION_NAMES.includes(String(item.reviewOpinionName ?? '').trim())
}

/** 已加载规则的 AI 结论摘要，按 detailId 索引；作为弹窗预置数据，省掉一次请求 */
const manualAuditAiInfo = computed<Record<string, ReviewPointAiInfo>>(() => {
  const map: Record<string, ReviewPointAiInfo> = {}
  auditOpinions.value.forEach((item) => {
    const id = String(item.detailId || '').trim()
    if (id) map[id] = toManualAuditAiInfo(item)
  })
  return map
})

const toManualAuditAiInfo = (item: AiAuditOpinionItem): ReviewPointAiInfo => ({
  name: String(item.reviewOpinionName || '待复核'),
  tone: aiToneOf(String(item.reviewOpinionName || '')),
  comment: String(item.reviewConclude || item.ruleviewConclude || '')
})

/** 弹窗里切到尚未加载的规则时，按 categoryRuleId 补拉该规则的要点 */
const loadManualAuditAiInfo = async (categoryRuleId: string): Promise<Record<string, ReviewPointAiInfo>> => {
  const map: Record<string, ReviewPointAiInfo> = {}
  if (!taskId.value || !categoryRuleId) return map
  const res = await listRuleReviewNew({ taskId: taskId.value, categoryRuleId })
  if (!res.success || !Array.isArray(res.data)) return map
  res.data.forEach((item) => {
    const id = String(item.detailId || '').trim()
    if (id) map[id] = toManualAuditAiInfo(item as AiAuditOpinionItem)
  })
  return map
}

/** 人工审核提交成功后重拉审核意见列表：只重调 listRuleReview，不动 taskId 与字典 */
const refreshAuditOpinions = async () => {
  const currentTaskId = taskId.value
  if (!currentTaskId) return
  const seq = ++loadSeq
  loading.value = true
  try {
    const res = await getRuleReviewInfo({
      taskId: currentTaskId,
      ruleClassify: '',
      reviewOpinions: REVIEW_OPINIONS
    })
    if (seq !== loadSeq) return
    if (!res.success) {
      ElMessage.error(res.msg || 'AI审核意见获取失败')
      return
    }
    applyReviewList(res.data)
  } catch (error: any) {
    if (seq !== loadSeq) return
    ElMessage.error(error?.message || 'AI审核意见获取失败')
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

const openManualAudit = (item: AiAuditOpinionItem) => {
  const detailId = String(item.detailId || '').trim()
  if (!detailId) {
    ElMessage.warning('当前审核意见缺少任务明细ID，无法发起人工审核')
    return
  }
  manualAuditRef.value?.acceptParams({
    taskId: taskId.value,
    detailId,
    categoryRuleId: String(item.categoryRuleId || '').trim(),
    ruleId: String(item.ruleId || '').trim(),
    aiInfo: manualAuditAiInfo.value,
    loadAiInfo: loadManualAuditAiInfo
  })
}

const closeFilePreview = () => {
  filePreviewVisible.value = false
  previewFiles.value = []
  activePreviewKey.value = ''
}

/** RuleReviewDetailModal 已过滤出可预览附件，这里只负责解析目标文件并打开预览弹窗 */
const openFilePreview = (file: TXmAttach, files: TXmAttach[]) => {
  const resolved = resolveAuditPreviewTarget(file, Array.isArray(files) ? files : [])
  if (!resolved) {
    ElMessage.warning(UNSUPPORTED_AUDIT_PREVIEW_TIP)
    return
  }

  previewFiles.value = resolved.files
  activePreviewKey.value = getAuditPreviewFileKey(resolved.targetFile)
  filePreviewVisible.value = true
}

const closeRuleDetail = () => {
  closeFilePreview()
}

const normalizeTaskId = (data: any) => {
  if (data && typeof data === 'object') return String(data.taskId ?? '').trim()
  return String(data ?? '').trim()
}

const resetAuditOpinion = () => {
  taskId.value = ''
  auditResultText.value = '暂无结果'
  auditResultTone.value = 'total'
  activeFilter.value = 'all'
  auditOpinions.value = []
  emptyText.value = '暂无AI审核意见'
  closeRuleDetail()
  manualReviewVisible.value = false
  manualReviewItem.value = null
  detailModal.visible = false
  detailModal.initialDetailId = ''
}

/** 落地审核意见列表（按 detailId/ruleId 去重后写入），列表主数据源是 listRuleReview */
const applyReviewList = (list: unknown) => {
  const detailIds = new Set<string>()
  auditOpinions.value = (Array.isArray(list) ? list : []).filter((item) => {
    const key = String(item.detailId || item.ruleId)
    if (detailIds.has(key)) return false
    detailIds.add(key)
    return true
  }) as AiAuditOpinionItem[]
  emptyText.value = auditOpinions.value.length ? '' : '暂无AI审核意见'
}

const loadAuditOpinions = async () => {
  const seq = ++loadSeq
  const proId = String(props.project?.originXmId ?? '').trim()
  resetAuditOpinion()
  if (!proId) return

  loading.value = true
  try {
    const taskRes = await getAuditTaskIdByProId(proId)
    if (seq !== loadSeq) return

    const nextTaskId = normalizeTaskId(taskRes.data)
    if (!nextTaskId) return

    if (!taskRes.success) {
      emptyText.value = 'AI审核意见获取失败'
      ElMessage.error(taskRes.msg || 'AI审核任务获取失败')
      return
    }
    taskId.value = nextTaskId

    const [reviewResult, conclusionResult, optionsResult, ruleLevelResult] = await Promise.allSettled([
      getRuleReviewInfo({
        taskId: nextTaskId,
        ruleClassify: '',
        reviewOpinions: REVIEW_OPINIONS
      }),
      getXmAuditConclude(nextTaskId),
      getPublicData('AI_AUDIT_REVIEW_OPINION_COM'),
      getPublicData('AI_AUDIT_RULE_LEVEL_COM')
    ])
    if (seq !== loadSeq) return

    const levelLabels: Record<string, string> = {}
    if (ruleLevelResult.status === 'fulfilled' && ruleLevelResult.value.success) {
      for (const option of ruleLevelResult.value.data || []) {
        const key = String(option.code ?? option.id ?? '').trim()
        const label = String(option.name ?? '').trim()
        if (key && label) levelLabels[key] = label
      }
    } else {
      ElMessage.warning('规则级别公共代码获取失败')
    }
    ruleLevelLabels.value = levelLabels

    if (conclusionResult.status === 'fulfilled' && conclusionResult.value.success) {
      const key = String(conclusionResult.value.data?.auditOpinion ?? '').trim()
      const options = optionsResult.status === 'fulfilled' && optionsResult.value.success ? normalizeOptionList(optionsResult.value.data || []) : []
      const option = options.find((item: any) => String(item.code ?? item.id) === key || String(item.id ?? item.code) === key)
      auditResultText.value = String(option?.name || (key ? '未配置审核意见' : '暂无结果'))
      auditResultTone.value = String(option?.type || 'total')
      if (optionsResult.status === 'rejected' || !optionsResult.value.success) {
        auditResultText.value = '获取失败'
        ElMessage.warning('审核意见公共代码获取失败')
      }
    } else {
      auditResultText.value = '获取失败'
    }

    if (reviewResult.status === 'rejected') throw reviewResult.reason
    const reviewRes = reviewResult.value
    if (!reviewRes.success) {
      emptyText.value = 'AI审核意见获取失败'
      ElMessage.error(reviewRes.msg || 'AI审核意见获取失败')
      return
    }

    applyReviewList(reviewRes.data)
  } catch (error: any) {
    if (seq !== loadSeq) return
    emptyText.value = 'AI审核意见获取失败'
    ElMessage.error(error?.message || 'AI审核意见获取失败')
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

/**
 * 打开详情工作台。
 * @param initialDetailId 传入规则标识时只展示该规则（列表「详情」入口）；
 *   不传（「更多意见」及外部工具栏入口）则清空过滤，展示全部规则。
 *   这里必须显式赋值：initialDetailId 是组件级状态，不清空会沿用上一次单规则详情的选择。
 */
const openDetailModal = (initialDetailId = '') => {
  if (loading.value) return
  if (!taskId.value) {
    ElMessage.info('暂无AI审核意见')
    return
  }
  detailModal.initialDetailId = String(initialDetailId || '').trim()
  detailModal.visible = true
}

const closeDetailModal = () => {
  detailModal.visible = false
}

defineExpose({
  openDetailModal
})

watch(
  () => [projectId.value, props.project],
  () => loadAuditOpinions(),
  { immediate: true }
)

onBeforeUnmount(() => {
  loadSeq += 1
  closeFilePreview()
  closeDetailModal()
})
</script>

<style scoped lang="less">
@import '../styles/sectionTitle.less';

.joint-review-ai-audit {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;

  .joint-review-ai-audit__content button {
    font-family: inherit;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid #409eff;
      outline-offset: 2px;
    }
  }
}

.joint-review-ai-audit__header {
  flex: 0 0 44px;
  height: 44px;
  min-height: 44px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border-bottom: 1px solid #f1f5f9;
}

.joint-review-ai-audit__ai-icon {
  width: 22px;
  height: 22px;
  display: block;
  color: var(--color-primary, #00857c);
}

.joint-review-ai-audit__title .section-title__icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
}

.joint-review-ai-audit__more {
  width: 68px;
  height: 28px;
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  color: var(--color-primary, #00857c);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  appearance: none;
  transition: color 0.2s;

  .el-icon--right {
    margin-left: 0;
  }

  &:hover {
    color: #006f68;

    i {
      animation: rotate-more 0.6s ease;
    }
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 133, 124, 0.35);
    outline-offset: 2px;
    border-radius: 2px;
  }

  &.is-loading {
    cursor: wait;
    opacity: 0.65;
  }
}

.joint-review-ai-audit__actions button {
  padding: 4px 0;
  color: var(--color-primary, #00857c);
  font-size: 13px;
  white-space: nowrap;
  background: transparent;
  border: 0;

  &:hover {
    color: #006f68;
    text-decoration: underline;
  }

  &:focus-visible {
    outline-color: rgba(0, 133, 124, 0.35);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
}

.joint-review-ai-audit__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.joint-review-ai-audit__stats {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  padding: 8px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.joint-review-ai-audit__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
}

.joint-review-ai-audit__label {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
}

.joint-review-ai-audit__badge,
.joint-review-ai-audit__result {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.joint-review-ai-audit__badge {
  font-variant-numeric: tabular-nums;

  &:hover {
    opacity: 0.85;
  }

  .joint-review-ai-audit &.is-active {
    color: #fff;
    background: var(--audit-tone);
  }
}

.joint-review-ai-audit__result {
  gap: 8px;
  max-width: 100%;
  border-color: currentColor;

  strong {
    font-size: 14px;
    overflow-wrap: anywhere;
  }
}

.joint-review-ai-audit {
  .problem,
  .danger {
    --audit-tone: #f56c6c;
    color: #f56c6c;
    background: #fef0f0;
  }

  .warning,
  .yellow {
    --audit-tone: #e6a23c;
    color: #e6a23c;
    background: #fdf6ec;
  }

  .hazard,
  .warning-orange {
    --audit-tone: #d4a03c;
    color: #d4a03c;
    background: #fdf6ec;
  }

  .total,
  .info {
    --audit-tone: #909399;
    color: #909399;
    background: #f4f4f5;
  }

  .success {
    color: #67c23a;
    background: #f0f9eb;
  }

  .primary,
  .primary-blue {
    color: #409eff;
    background: #ecf5ff;
  }
}

.joint-review-ai-audit__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc transparent;
}

.joint-review-ai-audit__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;

  /*
    盖章行的最小高度（需求 2026-10-20）。
    章 52px、旋转后外接盒 61.7px，居中吊在按钮行上时会上下各溢出约 31px；
    没有下限时短行（无描述）只有 59px，章的下沿会压到分隔线/下一行。
    68px = 章外接盒 61.7 + 少量余量，保证章完整落在条目内；长行本来就更高，不受影响。
  */
  &.is-stamped {
    min-height: 68px;
  }

  &:hover {
    background: #f5f7fa;
  }
}

.joint-review-ai-audit__tag {
  flex-shrink: 0;
  min-width: 48px;
  box-sizing: border-box;
  margin-top: 1px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
}

.joint-review-ai-audit__item-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.joint-review-ai-audit__item-title {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.joint-review-ai-audit__description {
  color: #909399;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;

  :deep(p) {
    margin: 0;
  }
}

.joint-review-ai-audit__actions {
  display: flex;
  /* 操作区整体不压缩：左侧正文是 flex:1 + min-width:0，正文再长也只会挤正文，
     不会把「章 + 按钮」挤变形（章优先于文字的需求落在这里） */
  flex: 0 0 auto;
  flex-direction: row;
  /* 按钮仍与标题行齐平（贴顶）；只有章（slot）另用 align-self: stretch 撑满整行做垂直居中 */
  align-items: flex-start;
  align-self: stretch;
  gap: 12px;
  margin-left: 4px;
}

/*
  人工复核签章的「占位槽」（需求 2026-10-20）：
  章是 52px，比按钮行（约 26px）高，若直接当 flex 项会把整行撑高，
  所以外面套一层槽，由槽负责占位、章在其中绝对定位：
  - width: 52px —— 占住横向位置，章排在「人工审核」左侧；
  - align-self: stretch —— 撑满条目内容区高度，章相对它 50% 居中 = 在整行垂直居中；
  - 槽本身的高度来自 stretch（只填满已有高度），不会反过来撑高条目。
*/
.joint-review-ai-audit__stamp-slot {
  position: relative;
  flex: 0 0 auto;
  /*
    撑满条目内容区高度：章相对 slot 的 50% 居中，就等于在**整行**里垂直居中。
    这样无论行高是 68px（无描述）还是 99px（两行描述），章都落在行的中线上，
    不会像之前那样贴着按钮行偏上。
    stretch 不会反过来撑高条目（只填满已有高度），所以章本身仍不贡献高度。
  */
  align-self: stretch;
  width: 52px;
}

/*
  人工复核签章（需求 2026-10-20）：双圈圆章 + 「复核 / 通过|不通过」两行，
  绿 = 通过、红 = 不通过，与评审工作台 RuleWorkspace 的签章同一套视觉。

  绝对定位挂在占位槽上（相对槽居中），因此不撑行高：
  - flex: 0 0 auto 由槽承担，左侧文字超长时只压缩正文，章不被压缩（章优先于文字）；
  - 尺寸 52px：旋转后外接盒 61.7px，配合 .is-stamped 的 min-height: 68px 可完整落在行内；
    再大（56px）上溢会越过条目顶部的内边距；
  - 字号 11px：52px 圆内「不通过」三字不被内圈切到的上限（12px 会越内圈 1.6px）；
  - 保留指针事件：悬浮可看 title 里的复核结论。
*/
.joint-review-ai-audit__stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: #00706b;
  cursor: default;
  border: 2px solid currentColor;
  border-radius: 50%;
  opacity: 0.9;
  transform: translate(-50%, -50%) rotate(-12deg);

  &::before {
    position: absolute;
    inset: 3px;
    content: '';
    border: 1px solid currentColor;
    border-radius: 50%;
  }
}

.joint-review-ai-audit__stamp-text {
  display: grid;
  gap: 1px;
  /* 11px 是「不通过」三字在 52px 圆内不被内圈切到的上限字号（12px 会越内圈 2.5px） */
  font-size: 11px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: 0.05em;
  text-align: center;
}

.joint-review-ai-audit__stamp--failed {
  color: #e03b3b;
}

.joint-review-ai-audit__empty {
  padding: 32px 20px;
  color: #909399;
  font-size: 13px;
  text-align: center;
}
@keyframes rotate-more {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}
</style>
