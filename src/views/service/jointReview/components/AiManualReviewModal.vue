<template>
  <vxe-modal
    v-model="visible"
    :destroy-on-close="true"
    :title="modalTitle"
    :width="560"
    :height="280"
    resize
    show-zoom
    :close-on-press-escape="false"
    :loading="loading"
    class-name="ai-manual-review-modal"
    @close="handleClose"
  >
    <div class="ai-manual-review">
      <el-form :model="form" label-width="100px" label-position="right" class="ai-manual-review__form review-form">
        <el-form-item class="review-opinion-item" label="评审意见：" required>
          <el-radio-group v-model="form.reviewOpinion" :disabled="submitting || isViewMode">
            <el-radio v-for="item in opinionOptions" :key="item.code" :label="item.code">
              {{ item.name }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="review-reason-item" label="意见说明：" :required="isRejectOpinion">
          <el-input
            v-model="form.reason"
            :disabled="submitting || isViewMode"
            :maxlength="2000"
            show-word-limit
            resize="none"
            type="textarea"
            :rows="5"
            placeholder="请输入评审意见说明"
            class="review-textarea"
          />
        </el-form-item>
      </el-form>
      <div class="ai-manual-review__footer">
        <el-button size="mini" type="primary" :loading="submitting" :disabled="isViewMode || loading" @click="handleSubmit">
          确 定
        </el-button>
        <el-button size="mini" plain :disabled="submitting" @click="handleClose">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicData } from '@/api/common'
import {
  getExpertRuleReviewRecord,
  saveExpertRuleReviewRecord,
  type ExpertRuleReviewRecordParams,
  type ExpertRuleReviewRecordResult
} from '@/api/service/jointReview'
import type { RuleReviewDetailItem } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'

/** 专家规则人工复核意见公共代码；0 表示不采纳 */
const REVIEW_OPINION_CODE = 'LHHS_EXPERT_RULE_REVIEW_OPINION_COM'
const REJECT_OPINION = '0'

interface OpinionOption {
  code: string
  name: string
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object as PropType<RuleReviewDetailItem | null>,
    default: null
  },
  project: {
    type: Object as PropType<Record<string, any> | null>,
    default: null
  },
  userInfo: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  }
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'saved', payload: ExpertRuleReviewRecordResult & { ruleId: string }): void
}>()

const loading = ref(false)
const submitting = ref(false)
const opinionOptions = ref<OpinionOption[]>([])
const form = reactive({
  reviewId: '',
  reviewOpinion: '',
  reason: ''
})

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const isViewMode = computed(() => String(props.userInfo?.tag || '') === 'view')

/** 0：不采纳，意见说明必填 */
const isRejectOpinion = computed(() => String(form.reviewOpinion) === REJECT_OPINION)

const modalTitle = computed(() => {
  const ruleName = String(props.item?.ruleName || '').trim()
  return ruleName ? `人工复核 - ${ruleName}` : '人工复核'
})

const buildQueryParams = (): ExpertRuleReviewRecordParams | null => {
  const expertId = String(props.userInfo?.expertId ?? '').trim()
  const meetingId = String(props.userInfo?.meetingId ?? '').trim()
  const reviewXmid = String(props.project?.xmId ?? props.project?.reviewXmid ?? '').trim()
  const ruleId = String(props.item?.ruleId ?? '').trim()
  if (!expertId || !meetingId || !reviewXmid || !ruleId) return null
  return { expertId, meetingId, reviewXmid, ruleId }
}

const resetForm = () => {
  form.reviewId = ''
  form.reviewOpinion = ''
  form.reason = ''
}

const normalizeOpinionOptions = (data: unknown): OpinionOption[] => {
  if (!Array.isArray(data)) return []
  return data
    .map((item: any) => ({
      code: String(item?.code ?? item?.id ?? '').trim(),
      name: String(item?.name ?? item?.label ?? '').trim()
    }))
    .filter((item) => item.code && item.name)
}

const loadOpinionOptions = async () => {
  if (opinionOptions.value.length) return
  try {
    const res: any = await getPublicData(REVIEW_OPINION_CODE)
    if (!res.success) {
      ElMessage.error(res.msg || '获取评审意见选项失败')
      return
    }
    opinionOptions.value = normalizeOpinionOptions(res.data)
    if (!opinionOptions.value.length) {
      ElMessage.warning('暂无评审意见选项')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取评审意见选项失败')
  }
}

const loadRecord = async () => {
  const params = buildQueryParams()
  if (!params) {
    ElMessage.warning('缺少复核必要参数，无法加载记录')
    return
  }

  loading.value = true
  try {
    await loadOpinionOptions()
    const res = await getExpertRuleReviewRecord(params)
    if (!res.success) {
      ElMessage.error(res.msg || '获取复核记录失败')
      return
    }
    const data = (res.data || {}) as Partial<ExpertRuleReviewRecordResult>
    form.reviewId = String(data.reviewId ?? '').trim()
    form.reviewOpinion = String(data.reviewOpinion ?? '').trim()
    form.reason = String(data.reason ?? '').trim()
  } catch (error: any) {
    ElMessage.error(error?.message || '获取复核记录失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (submitting.value) return
  visible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (isViewMode.value || submitting.value || loading.value) return

  const params = buildQueryParams()
  if (!params) {
    ElMessage.warning('缺少复核必要参数，无法保存')
    return
  }
  if (!form.reviewOpinion) {
    ElMessage.warning('请选择评审意见')
    return
  }
  // 0 不采纳：意见说明必填；通过等其它意见也可填写说明，但不强制
  if (isRejectOpinion.value && !String(form.reason || '').trim()) {
    ElMessage.warning('不采纳时请填写意见说明')
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...params,
      reviewId: form.reviewId || '',
      reviewOpinion: form.reviewOpinion,
      reason: String(form.reason || '').trim()
    }
    const res = await saveExpertRuleReviewRecord(payload)
    if (!res.success) {
      ElMessage.error(res.msg || '保存复核记录失败')
      return
    }
    ElMessage.success('人工复核提交成功')
    emit('saved', {
      ruleId: params.ruleId,
      reviewId: form.reviewId || '',
      reviewOpinion: form.reviewOpinion,
      reason: payload.reason
    })
    visible.value = false
    resetForm()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存复核记录失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      resetForm()
      return
    }
    resetForm()
    loadRecord()
  }
)
</script>

<style scoped lang="less">
@primary-color: var(--color-primary, #00857c);
@text-main: #1e293b;
@text-secondary: #475569;
@text-muted: #94a3b8;
@border-main: #e2e8f0;
@surface-bg: rgba(255, 255, 255, 0.96);

.ai-manual-review {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 8px 12px 4px;
  box-sizing: border-box;
  background: linear-gradient(180deg, @surface-bg 0%, rgba(248, 253, 253, 0.96) 100%);
}

.ai-manual-review__form {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.review-opinion-item {
  flex: 0 0 auto;
  min-height: 32px;
  margin-bottom: 12px;

  :deep(.el-form-item__label) {
    color: @text-secondary;
    font-size: 12px;
  }
}

.review-reason-item {
  flex: 1;
  min-height: 0;
  margin-bottom: 8px;

  :deep(.el-form-item__label) {
    align-self: flex-start;
    color: @text-secondary;
    font-size: 12px;
  }

  :deep(.el-form-item__content) {
    min-height: 0;
  }
}

.review-textarea {
  width: 100%;

  :deep(.el-textarea__inner) {
    min-height: 120px;
    border-radius: 6px;
    border-color: @border-main;
    color: @text-main;
    font-size: 12px;
    line-height: 1.5;
    padding: 8px 10px;
    transition: all 0.2s;

    &:focus {
      border-color: @primary-color;
      box-shadow: 0 0 0 2px rgba(0, 133, 124, 0.08);
    }
  }

  :deep(.el-input__count) {
    background: transparent;
    bottom: 8px;
    right: 12px;
    color: @text-muted;
    font-size: 11px;
  }
}

.ai-manual-review__footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;

  :deep(.el-button--primary) {
    background-color: @primary-color;
    border-color: @primary-color;
    font-weight: 600;
  }
}
</style>
