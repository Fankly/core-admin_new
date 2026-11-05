<!-- 人工复核 · 单一要点审核弹窗
     移植自原型 docs/单一要点审核.html（原型的页面标题是「人工复核 - 列表形式」）。
     结构与交互照搬原型；配色按项目规范（H2 唯一主色）从原型的 Arco 蓝转成青绿族，
     图标把原型的 emoji 换成手写 SVG（DESIGN.md 禁止用 emoji 当图标），toast 换成 ElMessage。

     数据来源见 docs/人工复核接口文档.md：
     - 打开时 init 一次拿齐（项目编码/名称、规则+要点树、默认选中项、已有复审记录回填）
     - 切换规则/要点纯前端读 init 的树；换要点时按新 detailId 调 getDetail 重取回填
     - 提交时先把本地文件 upload 成 UUID，再带 fileName + fileUuid 调 save
     - AI 结论不是复审接口给的，由宿主（智能审核工作台）通过 aiInfo / loadAiInfo 传入 -->
<template>
  <div v-if="visible" class="sp-review-mask">
    <div class="sp-review-modal" role="dialog" aria-modal="true" aria-labelledby="sp-review-title">
      <!-- 头部 -->
      <div class="sp-head">
        <div class="sp-head__title" id="sp-review-title">
          <span class="sp-head__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11 4H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
          </span>
          人工复核
        </div>
        <button class="sp-head__close" type="button" aria-label="关闭" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <!-- 主体：双列 —— 左列「基本信息」，右列「复核结论 / 复核意见 / 佐证材料」。
           两列由 .sp-grid 的 flex 等宽排布，左列右侧一条 1px 分隔线（随列高撑满）；
           基本信息贴左列顶部，下方留白。 -->
      <div v-loading="initing" class="sp-body">
        <div class="sp-grid">
          <!-- 左列：基本信息（块标题独立，下方留间距再放信息卡） -->
          <div class="sp-col sp-col--left">
            <div class="sp-section__head">
              <span class="sp-section__bar" aria-hidden="true"></span>
              <span class="sp-section__title">基本信息</span>
            </div>

            <section class="sp-section">
              <div class="sp-row">
                <div class="sp-row__label">项目编码</div>
                <div class="sp-row__value sp-row__value--code">{{ form.projectCode || '-' }}</div>
              </div>
              <div class="sp-row">
                <div class="sp-row__label">项目名称</div>
                <div class="sp-row__value">{{ form.projectName || '-' }}</div>
              </div>
              <div class="sp-row">
                <div class="sp-row__label">审核规则</div>
                <div class="sp-row__value">
                  <div class="sp-select-wrap">
                    <select v-model="form.categoryRuleId" class="sp-select" aria-label="审核规则">
                      <option v-for="rule in ruleOptions" :key="rule.categoryRuleId" :value="rule.categoryRuleId">
                        {{ rule.ruleName }}
                      </option>
                    </select>
                    <span class="sp-select-wrap__arrow" aria-hidden="true"></span>
                  </div>
                </div>
              </div>
              <div class="sp-row">
                <div class="sp-row__label">审核要点</div>
                <div class="sp-row__value">
                  <div class="sp-select-wrap">
                    <select v-model="form.detailId" class="sp-select" aria-label="审核要点">
                      <option v-for="point in pointOptions" :key="String(point.detailId)" :value="String(point.detailId)">
                        {{ point.auditPointName }}
                      </option>
                    </select>
                    <span class="sp-select-wrap__arrow" aria-hidden="true"></span>
                  </div>
                </div>
              </div>
              <div class="sp-row">
                <div class="sp-row__label">AI 审核结论</div>
                <div class="sp-row__value">
                  <span class="sp-ai-badge" :class="`sp-ai-badge--${aiResult}`">
                    <span class="sp-ai-badge__dot" aria-hidden="true"></span>{{ aiText }}
                  </span>
                </div>
              </div>
              <div class="sp-row">
                <div class="sp-row__label">AI 审核意见</div>
                <div class="sp-row__value">
                  <!-- 后端这条意见会带 HTML 标签（与工作台的审核结论同一个字段），
                     富文本交给统一的渲染器，纯文本仍按纯文本显示（免得把 `<` 之类原样漏出来） -->
                  <div v-loading="aiLoading" class="sp-ai-comment">
                    <TypewriterText v-if="isRichAiComment" :text="aiComment" tag="span" :animate="false" />
                    <template v-else>{{ aiComment || '暂无' }}</template>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- 右列：复核处理（块标题，与左列基本信息同款）→ 复核结论 / 复核意见 / 佐证材料 -->
          <div class="sp-col sp-col--right">
            <div class="sp-section__head">
              <span class="sp-section__bar" aria-hidden="true"></span>
              <span class="sp-section__title">复核处理</span>
            </div>

            <!-- 复核结论 -->
            <section class="sp-block">
              <div class="sp-block__label">复核结论 <span class="sp-req" aria-hidden="true">*</span></div>
              <div class="sp-opts" role="radiogroup" aria-label="复核结论">
                <button
                  v-for="opt in CONCLUSION_OPTIONS"
                  :key="opt.value"
                  class="sp-opt"
                  :class="{ 'is-on': form.conclusion === opt.value }"
                  type="button"
                  role="radio"
                  :aria-checked="form.conclusion === opt.value"
                  @click="form.conclusion = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </section>

            <!-- 复核意见 -->
            <section class="sp-block">
              <div class="sp-block__label">复核意见 <span class="sp-req" aria-hidden="true">*</span></div>
              <textarea v-model="form.comment" class="sp-textarea" placeholder="请填写复核意见，说明判断依据..."></textarea>
              <!-- 需求：常用意见标签暂时不展示。恢复时把这段解开，并从 data.ts 重新引入
                 QUICK_COMMENT_LABELS / QUICK_COMMENTS（两个常量仍在 data.ts 里保留） -->
              <!--
            <div class="sp-quick">
              <button
                v-for="(label, index) in QUICK_COMMENT_LABELS"
                :key="label"
                class="sp-chip"
                type="button"
                @click="form.comment = QUICK_COMMENTS[index]"
              >
                {{ label }}
              </button>
            </div>
            -->
            </section>

            <!-- 佐证材料 -->
            <section class="sp-block">
              <div class="sp-block__label">佐证材料 <span class="sp-optional">（选填）</span></div>
              <button class="sp-upload" type="button" @click="pickFiles">
                <span class="sp-upload__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                    />
                  </svg>
                </span>
                <span class="sp-upload__main">点击选择文件 <span class="sp-upload__link">上传</span></span>
                <span class="sp-upload__tip">{{ UPLOAD_TIP }}</span>
              </button>
              <!-- 真正的文件选择器（原型这里是 alert 占位，无实际上传） -->
              <input ref="fileInputRef" class="sp-file-input" type="file" multiple :accept="UPLOAD_ACCEPT" @change="onFilesPicked" />
              <div v-if="form.files.length" class="sp-files">
                <div v-for="(file, index) in form.files" :key="`${file.name}-${index}`" class="sp-file">
                  <span class="sp-file__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" />
                    </svg>
                  </span>
                  <span class="sp-file__name" :title="file.name">{{ file.name }}</span>
                  <span v-if="file.size" class="sp-file__size">{{ formatSize(file.size) }}</span>
                  <!-- 已存在服务端的附件可以直接下载（downloadAttach 按复审记录主键取） -->
                  <button
                    v-if="file.existing && recordId"
                    class="sp-file__download"
                    type="button"
                    :aria-label="`下载 ${file.name}`"
                    @click="downloadExisting(file)"
                  >
                    下载
                  </button>
                  <button class="sp-file__remove" type="button" :aria-label="`移除 ${file.name}`" @click="removeFile(index)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <!-- 底部：按钮居中（与原型一致） -->
      <div class="sp-foot">
        <!-- 需求：提交在左、取消在右 -->
        <button class="sp-btn sp-btn--primary" type="button" :disabled="submitting" @click="handleSubmit">提交</button>
        <button class="sp-btn" type="button" @click="handleClose">取消</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SinglePointReviewModal'
}
</script>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { downloadReviewAttach, getReviewDetail, initReviewInfo, saveReviewInfo, uploadReviewAttach } from '@/api/ai/manualReview'
import type { AiAuditReviewCategoryRule, AiAuditReviewPoint, AiAuditReviewRecord } from '@/api/ai/manualReview'
// AI 审核意见与工作台的审核结论是同一个字段，富文本渲染沿用工作台那套（HTML/Markdown + 换行处理）
import TypewriterText from '../../smartTaskAudit/components/TypewriterText.vue'
import { isRichAuditText } from '../../smartTaskAudit/components/auditDetailHelpers'
import { AI_RESULT_TEXT, CODE_TO_CONCLUSION, CONCLUSION_TO_CODE, UPLOAD_ACCEPT, UPLOAD_MAX_SIZE, UPLOAD_TIP, aiToneOf } from '../data'
import type { AiResult, ReviewConclusion, ReviewFile, ReviewPointAiInfo, SinglePointReviewParams } from '../data'

const emit = defineEmits<{
  (
    e: 'submit',
    payload: { detailId: string; ruleName: string; pointName: string; conclusion: ReviewConclusion; comment: string; files: ReviewFile[] }
  ): void
  (e: 'close'): void
}>()

const CONCLUSION_OPTIONS: { value: ReviewConclusion; label: string }[] = [
  { value: 'pass', label: '通过' },
  { value: 'fail', label: '不通过' }
]

const visible = ref(false)
const initing = ref(false)
const submitting = ref(false)
const aiLoading = ref(false)
const fileInputRef = ref<HTMLInputElement>()

/** init 返回的规则树；切规则/切要点都读它，不再请求接口 */
const categoryRuleList = ref<AiAuditReviewCategoryRule[]>([])
/** 复审记录主键：有附件时用它调 downloadAttach */
const recordId = ref<string>('')
/** 宿主给的 AI 信息（按 detailId），以及按规则懒加载回来的缓存 */
const aiInfoMap = ref<Record<string, ReviewPointAiInfo>>({})
/** 已经拉过 AI 信息的规则，避免来回切换重复请求（只用于判断，不需要响应式） */
let loadedAiRules = new Set<string>()
/** 宿主回调：按规则拉要点 AI 信息 */
let loadAiInfoFromHost: ((categoryRuleId: string) => Promise<Record<string, ReviewPointAiInfo>>) | undefined

const form = reactive({
  taskId: '',
  projectCode: '',
  projectName: '',
  /** 当前选中规则（categoryRuleId） */
  categoryRuleId: '',
  /** 当前选中要点（任务明细ID，保存时的主键） */
  detailId: '',
  conclusion: '' as ReviewConclusion | '',
  comment: '',
  files: [] as ReviewFile[]
})

const ruleOptions = computed(() => categoryRuleList.value)

const pointOptions = computed(() => {
  const rule = categoryRuleList.value.find((item) => String(item.categoryRuleId) === String(form.categoryRuleId))
  return rule?.pointList || []
})

const currentPoint = computed<AiAuditReviewPoint | null>(
  () => pointOptions.value.find((point) => String(point.detailId) === String(form.detailId)) || null
)

/** 规则名 / 要点名：提交回执与宿主都按名字用 */
const currentRuleName = computed(() => ruleOptions.value.find((item) => String(item.categoryRuleId) === String(form.categoryRuleId))?.ruleName || '')

/** AI 结论文案与色调：优先用接口文案，拿不到时按色调兜底 */
const aiResult = computed<AiResult>(() => aiInfoMap.value[form.detailId]?.tone || 'pending')
const aiText = computed(() => aiInfoMap.value[form.detailId]?.name || AI_RESULT_TEXT[aiResult.value])
const aiComment = computed(() => aiInfoMap.value[form.detailId]?.comment || '')

/** AI 审核意见是否富文本（后端会带 HTML 标签）：富文本走统一渲染器，纯文本照原样显示 */
const isRichAiComment = computed(() => isRichAuditText(aiComment.value))

const formatSize = (bytes: number): string => {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 把一条复审记录回填进表单 */
const fillFromRecord = (record: AiAuditReviewRecord | null) => {
  form.conclusion = record ? CODE_TO_CONCLUSION[String(record.reviewConclusion)] || '' : ''
  form.comment = record?.reviewOpinion || ''
  recordId.value = record?.id != null ? String(record.id) : ''
  form.files = record?.fileName ? [{ name: record.fileName, size: 0, uuid: record.fileUuid || '', existing: true }] : []
}

/** 按 detailId 拉该要点的已有复审记录（无记录时后端抛错，属正常情况，静默清空） */
const loadRecordForPoint = async (detailId: string) => {
  if (!detailId) {
    fillFromRecord(null)
    return
  }
  try {
    const res = await getReviewDetail(detailId)
    fillFromRecord(res.success ? res.data || null : null)
  } catch {
    fillFromRecord(null)
  }
}

/** 换要点时补一次 AI 信息：宿主没预置的（比如切到了别的规则）才回调拉取 */
const ensureAiInfo = async (categoryRuleId: string) => {
  if (!categoryRuleId || loadedAiRules.has(categoryRuleId)) return
  loadedAiRules.add(categoryRuleId)
  if (!loadAiInfoFromHost) return
  aiLoading.value = true
  try {
    const info = await loadAiInfoFromHost(categoryRuleId)
    aiInfoMap.value = { ...aiInfoMap.value, ...(info || {}) }
  } catch {
    loadedAiRules.delete(categoryRuleId)
  } finally {
    aiLoading.value = false
  }
}

/**
 * 换规则：要点重置为该规则第一条。
 * 原型的 onRuleChange 是重渲染 option 列表、不保留选中项，这里用 watch 表达同一语义。
 */
watch(
  () => form.categoryRuleId,
  (categoryRuleId) => {
    const points = categoryRuleList.value.find((item) => String(item.categoryRuleId) === String(categoryRuleId))?.pointList || []
    if (!points.some((point) => String(point.detailId) === String(form.detailId))) {
      form.detailId = points[0] ? String(points[0].detailId) : ''
    }
    void ensureAiInfo(String(categoryRuleId))
  }
)

/** 换要点：重取该要点的复审记录回填，避免把上一条的结论带到下一条上 */
watch(
  () => form.detailId,
  (detailId) => void loadRecordForPoint(String(detailId))
)

const pickFiles = () => fileInputRef.value?.click()

/** 选择文件：只做本地收集 + 大小校验，真正的上传在提交时进行（文档两步式：upload → save） */
const onFilesPicked = (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files || [])
  const tooLarge: string[] = []
  picked.forEach((file) => {
    if (file.size > UPLOAD_MAX_SIZE) {
      tooLarge.push(file.name)
      return
    }
    form.files.push({ name: file.name, size: file.size, file })
  })
  if (tooLarge.length) ElMessage.warning(`以下文件超过 20MB，未添加：${tooLarge.join('、')}`)
  // 清空 input，否则连续选同一个文件不会再触发 change
  input.value = ''
}

const removeFile = (index: number) => {
  form.files.splice(index, 1)
}

const downloadExisting = async (file: ReviewFile) => {
  if (!recordId.value) return
  try {
    await downloadReviewAttach(recordId.value, file.name)
  } catch {
    ElMessage.error('附件下载失败')
  }
}

const handleClose = () => {
  visible.value = false
  emit('close')
}

/**
 * 提交：校验收敛到原型的 submitReview（复核意见必填、复核结论必选），
 * 之后按文档两步走——先 upload 换 UUID，再 save。
 */
const handleSubmit = async () => {
  if (!form.conclusion) {
    ElMessage.warning('请选择复核结论')
    return
  }
  if (!form.comment.trim()) {
    ElMessage.warning('请填写复核意见')
    return
  }
  if (!form.detailId) {
    ElMessage.warning('当前要点缺少任务明细ID，无法提交')
    return
  }

  submitting.value = true
  try {
    // 未上传过的文件先传，拿到 uuid 后随 save 提交
    for (const file of form.files) {
      if (file.uuid || !file.file) continue
      const res = await uploadReviewAttach(file.file, file.name)
      if (!res.success || !res.data) throw new Error(res.msg || `附件 ${file.name} 上传失败`)
      file.uuid = String(res.data)
      file.existing = true
      delete file.file
    }

    // 接口的 save 只收 fileName + fileUuid 一对，多个附件只能存第一个
    const withUuid = form.files.filter((file) => file.uuid)
    const attachment = withUuid[0]
    if (withUuid.length > 1) {
      ElMessage.warning(`复审接口目前只支持保存 1 个附件，已保留第一个：${attachment.name}`)
    }

    const res = await saveReviewInfo({
      detailId: form.detailId,
      reviewConclusion: form.conclusion ? CONCLUSION_TO_CODE[form.conclusion] : '',
      reviewOpinion: form.comment.trim(),
      fileName: attachment?.name || '',
      fileUuid: attachment?.uuid || ''
    })
    if (!res.success) throw new Error(res.msg || '保存失败')
    recordId.value = res.data != null ? String(res.data) : recordId.value

    ElMessage.success('复核信息已保存')
    emit('submit', {
      detailId: form.detailId,
      ruleName: currentRuleName.value,
      pointName: currentPoint.value?.auditPointName || '',
      conclusion: form.conclusion,
      comment: form.comment.trim(),
      files: [...form.files]
    })
    visible.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 打开弹窗（项目惯例的命令式入口）。
 * init 是入口接口：项目编码/名称、规则+要点树、默认选中项、已有复审记录都由它一次给全。
 */
const acceptParams = async (params: SinglePointReviewParams = {}) => {
  visible.value = true
  initing.value = true
  aiInfoMap.value = { ...(params.aiInfo || {}) }
  loadedAiRules = new Set()
  loadAiInfoFromHost = params.loadAiInfo
  categoryRuleList.value = []
  form.taskId = String(params.taskId || '')
  form.projectCode = ''
  form.projectName = ''
  form.categoryRuleId = ''
  form.detailId = ''
  form.conclusion = ''
  form.comment = ''
  form.files = []
  recordId.value = ''

  try {
    const res = await initReviewInfo({ taskId: params.taskId || undefined, detailId: params.detailId || undefined })
    if (!res.success || !res.data) throw new Error(res.msg || '复核信息初始化失败')
    const data = res.data
    categoryRuleList.value = Array.isArray(data.categoryRuleList) ? data.categoryRuleList : []
    form.taskId = String(data.taskId ?? form.taskId)
    form.projectCode = data.xmbm || ''
    form.projectName = data.xmmc || ''
    // 默认选中项：宿主点开的那个要点优先，其次用 init 给的默认值
    const fallbackRuleId = String(params.categoryRuleId || data.categoryRuleId || '')
    const fallbackDetailId = String(params.detailId || data.detailId || '')
    form.categoryRuleId = categoryRuleList.value.some((item) => String(item.categoryRuleId) === fallbackRuleId)
      ? fallbackRuleId
      : String(categoryRuleList.value[0]?.categoryRuleId || '')
    const points = categoryRuleList.value.find((item) => String(item.categoryRuleId) === String(form.categoryRuleId))?.pointList || []
    form.detailId = points.some((point) => String(point.detailId) === fallbackDetailId) ? fallbackDetailId : String(points[0]?.detailId || '')
    // init 已把默认明细的记录带回来了，直接回填；换要点时再由 watch 单独取
    fillFromRecord(data.reviewInfo || null)
    // 宿主预置了当前规则的 AI 信息就不用再回调拉一次；没预置的规则（含切换过去的）才拉
    if (points.some((point) => aiInfoMap.value[String(point.detailId)])) loadedAiRules.add(String(form.categoryRuleId))
    else void ensureAiInfo(String(form.categoryRuleId))
  } catch (error: any) {
    ElMessage.error(error?.message || '复核信息初始化失败')
    visible.value = false
  } finally {
    initing.value = false
  }
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
/* 弹窗外壳：原型是整页居中一张 680px 卡片，这里包在遮罩里做成应用内弹窗。
   z-index 高于 vxe-modal（智能审核详情是 vxe 弹窗，层级在 1000 段），保证复核弹窗在最上层 */
.sp-review-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.45);
}

.sp-review-modal {
  display: flex;
  flex-direction: column;
  /* 双列布局要的宽度：原单列是 680px，分两列后每列只剩 300 出头，
     「AI 审核意见」这类长文本与复核意见输入框都会被挤到换好几行，故放宽到 1060px
     （每列约 494px）。窄屏由下面 .sp-body 的媒体查询退回单列。 */
  width: 1060px;
  max-width: 100%;
  max-height: 92vh;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.sp-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.sp-head__title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.sp-head__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #00706b;
  background: #f2f9f8;
  border-radius: 5px;

  svg {
    width: 15px;
    height: 15px;
  }
}

.sp-head__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  transition: all 0.15s;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    color: #1e293b;
    background: #f1f5f9;
  }
}

/* 主体：滚动容器，内层 .sp-grid 才是双列。
   外层负责滚动、内层负责列高，分隔线才能随内容全高撑满（内容超高时不会被裁在可视高度）。 */
.sp-body {
  flex: 1;
  min-height: 0;
  padding: 20px 24px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 3px;
  }
}

/* 双列：左列基本信息、右列三个复核块。
   两列等宽，左列右侧一条 1px 分隔线（随列高撑满），中间留出 24px 间距。 */
.sp-grid {
  display: flex;
  align-items: stretch;
}

/* 左列：拉满列高（分隔线随高度撑满），卡片贴顶，下方留白 */
.sp-col--left {
  display: flex;
  flex-direction: column;
  width: 50%;
  min-width: 0;
  padding-right: 24px;
  border-right: 1px solid #e2e8f0;
}

/* 右列：复核结论 / 复核意见 / 佐证材料，依次纵向排列 */
.sp-col--right {
  width: 50%;
  min-width: 0;
  padding-left: 24px;
}

/* 基本信息：列表形式 */
.sp-section {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

/* 窄屏（弹窗被缩到两列都放不下时）退回单列：DOM 顺序即「基本信息 → 三个复核块」 */
@media (max-width: 760px) {
  .sp-grid {
    flex-direction: column;
  }

  .sp-col--left,
  .sp-col--right {
    width: 100%;
    padding: 0;
    border-right: none;
  }

  .sp-col--left {
    margin-bottom: 20px;
  }
}

/* 基本信息块标题：独立于信息卡之外，下方留出间距（与 .sp-block__label 同一层级语义） */
.sp-section__head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.sp-section__bar {
  width: 3px;
  height: 13px;
  background: #00706b;
  border-radius: 2px;
}

.sp-section__title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.sp-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
}

.sp-row__label {
  flex-shrink: 0;
  width: 96px;
  padding-top: 6px;
  font-size: 13px;
  color: #64748b;
}

.sp-row__value {
  flex: 1;
  min-width: 0;
  padding-top: 6px;
  color: #1e293b;
  word-break: break-all;

  &--code {
    padding-top: 6px;
    font-family: Consolas, Monaco, monospace;
    font-weight: 500;
    color: #00706b;
  }
}

.sp-select-wrap {
  position: relative;
  width: 100%;
}

.sp-select {
  width: 100%;
  height: 34px;
  padding: 0 32px 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: #1e293b;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  outline: none;
  appearance: none;
  transition: all 0.15s;

  &:hover {
    border-color: #b8ddd9;
  }

  &:focus {
    border-color: #00706b;
    box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.08);
  }
}

.sp-select-wrap__arrow {
  position: absolute;
  top: 50%;
  right: 11px;
  width: 7px;
  height: 7px;
  pointer-events: none;
  border-right: 1.5px solid #64748b;
  border-bottom: 1.5px solid #64748b;
  transform: translateY(-70%) rotate(45deg);
}

/* AI 结论徽标：功能色只用于状态语义（H5） */
.sp-ai-badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
  border-radius: 4px;
}

.sp-ai-badge__dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

.sp-ai-badge--pending {
  color: #b35e0a;
  background: #fdf3e6;
}

.sp-ai-badge--pass {
  color: #4e9a24;
  background: #f0f9eb;
}

.sp-ai-badge--fail {
  color: #f56c6c;
  background: #fef0f0;
}

.sp-ai-comment {
  min-height: 34px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #475569;
  word-break: break-all;
  background: #f8fafc;
  border-radius: 4px;
}

/* 意见里的富文本（后端带 HTML）会含块级标签，间距统一由外层这一层控制，避免撑破卡片。
   注意 :deep 要写在顶层并显式带父类名——写在嵌套块里会编译出字面量 & 、后续规则被吞掉 */
.sp-ai-comment :deep(p) {
  margin: 0;
}

.sp-ai-comment :deep(ul),
.sp-ai-comment :deep(ol) {
  margin: 0;
  padding-left: 18px;
}

.sp-ai-comment :deep(a) {
  color: #0f6f60;
  text-decoration: underline;
}

/* 表单块 */
.sp-block {
  margin-bottom: 20px;
}

.sp-block__label {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.sp-req {
  color: #f56c6c;
}

.sp-optional {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

.sp-opts {
  display: flex;
  gap: 16px;
}

.sp-opt {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 38px;
  font-family: inherit;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;

  &:hover {
    color: #00706b;
    border-color: #b8ddd9;
  }

  &:focus-visible {
    outline: 2px solid #00706b;
    outline-offset: 1px;
  }

  /* 选中态用主色（DESIGN.md：主色用于选中态） */
  &.is-on {
    font-weight: 500;
    color: #00706b;
    background: #f2f9f8;
    border-color: #00706b;
  }
}

.sp-textarea {
  width: 100%;
  min-height: 88px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.7;
  color: #1e293b;
  resize: vertical;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  outline: none;
  transition: all 0.15s;

  &:focus {
    border-color: #00706b;
    box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.08);
  }

  &::placeholder {
    color: #94a3b8;
  }
}

.sp-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.sp-chip {
  padding: 4px 10px;
  font-family: inherit;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  background: #f1f5f9;
  border: 0;
  border-radius: 12px;
  transition: all 0.15s;

  &:hover {
    color: #00706b;
    background: #f2f9f8;
  }
}

/* 佐证材料 */
.sp-upload {
  display: block;
  width: 100%;
  padding: 16px;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    background: #f7fbfb;
    border-color: #00706b;
  }
}

.sp-upload__icon {
  display: block;
  margin-bottom: 4px;
  color: #64748b;

  svg {
    width: 18px;
    height: 18px;
  }
}

.sp-upload__main {
  font-size: 13px;
  color: #475569;
}

.sp-upload__link {
  font-weight: 500;
  color: #00706b;
}

.sp-upload__tip {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.sp-file-input {
  display: none;
}

.sp-files {
  margin-top: 10px;
}

.sp-file {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #475569;
  background: #f8fafc;
  border-radius: 4px;
}

.sp-file__icon {
  flex-shrink: 0;
  color: #00706b;

  svg {
    width: 14px;
    height: 14px;
  }
}

.sp-file__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-file__size {
  color: #64748b;
}

.sp-file__download {
  padding: 0 6px;
  font-family: inherit;
  font-size: 12px;
  color: #00706b;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    text-decoration: underline;
  }
}

.sp-file__remove {
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: 0;

  svg {
    width: 13px;
    height: 13px;
  }

  &:hover {
    color: #f56c6c;
  }
}

.sp-foot {
  display: flex;
  flex-shrink: 0;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.sp-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 28px;
  font-family: inherit;
  font-size: 13px;
  color: #475569;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    color: #00706b;
    border-color: #00706b;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.sp-btn--primary {
  color: #fff;
  background: #00706b;
  border-color: #00706b;

  &:hover:not(:disabled) {
    color: #fff;
    background: #2a9a92;
    border-color: #2a9a92;
  }
}
</style>
