<template>
  <ModalShell
    :visible="visible"
    :stack="readonly"
    :title="modalTitle"
    :width="showPreviewPane ? '1180px' : '700px'"
    :height="showPreviewPane ? '760px' : 'auto'"
    fullscreenable
    :fullscreen="isFullscreen"
    @toggle-fullscreen="isFullscreen = !isFullscreen"
    @close="emit('close')"
  >
    <div v-loading="loading" :class="['aep-modal__body', { 'aep-confirm-body--split': showPreviewPane }]">
      <div v-if="showPreviewPane" class="aep-confirm-preview">
        <div v-if="hasPreviewFile" class="aep-confirm-preview__head">
          <span class="aep-confirm-preview__label">来源文件</span>
          <span class="aep-confirm-preview__name" :title="previewFileName">{{ previewFileName }}</span>
        </div>
        <div class="aep-confirm-preview__canvas">
          <FilePreviewPane v-if="previewUuid" :uuid="previewUuid" :attach-name="previewFileName" :active="visible" />
          <div v-else-if="resolvingPreview" class="aep-confirm-preview__empty">正在加载来源文件…</div>
          <div v-else class="aep-confirm-preview__empty aep-preview-empty">
            <svg class="aep-preview-empty__icon" width="60" height="60" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <path
                d="M8 18a4 4 0 0 1 4-4h13l5 5h22a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V18Z"
                stroke="#cbd5e1"
                stroke-width="2.5"
                stroke-linejoin="round"
              />
              <circle cx="24" cy="38" r="2" fill="#cbd5e1" />
              <circle cx="32" cy="38" r="2" fill="#cbd5e1" />
              <circle cx="40" cy="38" r="2" fill="#cbd5e1" />
            </svg>
            <div class="aep-preview-empty__title">{{ previewEmptyTitle }}</div>
            <div v-if="previewEmptyDesc" class="aep-preview-empty__desc">{{ previewEmptyDesc }}</div>
          </div>
        </div>
      </div>
      <div class="aep-confirm-form">
        <div class="aep-confirm">
          <div class="aep-field">
            <label class="aep-field__label">审核要点名称 <i class="aep-required">*</i></label>
            <input v-model="form.pointName" class="aep-input" type="text" :disabled="readonly" />
          </div>
          <div class="aep-field">
            <label class="aep-field__label">审核要点判断规则 <i class="aep-required">*</i></label>
            <textarea v-model="form.judgementRuleDesc" class="aep-textarea" rows="3" :disabled="readonly"></textarea>
          </div>
          <div class="aep-field">
            <label class="aep-field__label">审核要点描述</label>
            <textarea v-model="form.pointDescription" class="aep-textarea" rows="3" :disabled="readonly"></textarea>
          </div>
          <div class="aep-field">
            <label class="aep-field__label">原文出处</label>
            <textarea v-model="form.originalEvidence" class="aep-textarea" rows="3" :disabled="readonly"></textarea>
          </div>
          <!-- 数据来源 / 审核要点来源：同一行展示 -->
          <div class="aep-field-row">
            <div class="aep-field">
              <label class="aep-field__label">数据来源</label>
              <input v-model="form.dataSource" class="aep-input" type="text" :disabled="readonly" />
            </div>
            <div class="aep-field">
              <label class="aep-field__label">审核要点来源</label>
              <!-- 只读展示：确认流程显示接口返回值（接口是什么就显示什么），经验知识维护固定「经验知识」，都不可修改 -->
              <input v-model="form.pointSource" class="aep-input" type="text" disabled />
            </div>
          </div>
          <!-- 是否为有效审核要点 / 是否固化为AI审核要点：同一行展示 -->
          <div class="aep-field-row">
            <div class="aep-field">
              <label class="aep-field__label">是否为有效审核要点</label>
              <select v-model="form.isConfirm" class="aep-select" :disabled="readonly">
                <option value="1">是</option>
                <option value="0">否</option>
              </select>
            </div>
            <div class="aep-field">
              <label class="aep-field__label">是否固化为AI审核要点</label>
              <select v-model="form.isSolidify" class="aep-select" :disabled="readonly">
                <option value="1">是</option>
                <option value="0">否</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="aep-modal__foot aep-modal__foot--confirm">
      <button v-if="readonly" class="aep-btn aep-btn--ghost" @click="emit('close')">关闭</button>
      <template v-else>
        <button class="aep-btn aep-btn--ghost" @click="emit('close')">取消</button>
        <button class="aep-btn aep-btn--primary" @click="handleSubmit">{{ isExperience ? '保存' : '确认' }}</button>
      </template>
    </div>
  </ModalShell>
</template>

<script lang="ts">
export default {
  name: 'AepConfirmModal'
}
</script>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { getKnowledgeFilePage, getPointDetail } from '@/api/ai/automaticExtractionPoints'
import type { ConfirmPreviewFile } from '../types'
import { POINT_SOURCE_DEFAULT_CODE, usePointSourceDict } from '../hooks/usePointSourceDict'
import FilePreviewPane from './FilePreviewPane.vue'
import ModalShell from './ModalShell.vue'

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    visible: boolean
    /** 待确认的审核要点ID（int64，保持字符串；经验知识维护为纯新增，不需要传） */
    pointId?: string | number
    /** 只读模式：来自「知识列表-详情」入口，只展示不可编辑（底部只有关闭） */
    readonly?: boolean
    /** 模式：confirm 审核要点确认（按 pointId 回填）；experience 经验知识维护（纯新增，不回填） */
    mode?: 'confirm' | 'experience'
    /** 左侧来源文件预览（经验知识没有来源文件，不传则不展示预览） */
    previewFile?: ConfirmPreviewFile | null
  }>(),
  { pointId: '', readonly: false, mode: 'confirm', previewFile: null }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', form: Record<string, string>): void
  (e: 'save', form: Record<string, string>): void
}>()

const loading = ref(false)
/** 审核要点确认弹窗全屏态（关闭后恢复普通尺寸） */
const isFullscreen = ref(false)

/** 经验知识维护模式：新建一条经验知识 */
const isExperience = computed(() => props.mode === 'experience')

/** 弹窗标题：与入口一致 */
const modalTitle = computed(() => (isExperience.value ? '经验知识维护' : '审核要点确认'))

/**
 * 左侧来源文件栏：
 * - 审核要点确认 / 只读详情始终保留左栏，没有来源文件时展示空态（经验知识）；
 * - 经验知识维护（纯新增）保持原来的单栏表单，不需要左栏。
 */
const previewFileName = computed(() => props.previewFile?.attachName || '')
const hasPreviewFile = computed(() => !!previewFileName.value)
const showPreviewPane = computed(() => !isExperience.value)

/** 预览文件 uuid（解析中/解析失败时为空） */
const previewUuid = ref('')
const previewError = ref('')
const resolvingPreview = ref(false)

/** 空态文案：经验知识/无来源文件 → 暂无相关制度文件；有来源文件但查不到/失败 → 对应原因 */
const previewEmptyTitle = computed(() => {
  if (!hasPreviewFile.value) return '暂无相关制度文件'
  return previewError.value || '暂无可预览文件'
})
const previewEmptyDesc = computed(() => {
  if (!hasPreviewFile.value) return '该审核要点可能是基于经验或系统数据提取'
  return previewError.value ? '请检查来源文件是否已上传或已删除' : ''
})
/** 解析序号：关闭 / 切换要点时丢弃旧响应 */
let previewSeq = 0

const resetPreview = (): void => {
  previewSeq += 1
  previewUuid.value = ''
  previewError.value = ''
  resolvingPreview.value = false
}

/**
 * 解析来源文件 uuid：
 * - 接口若已返回预览标识，直接用；
 * - 否则按「来源文件名 + 发布年度 + 发布部门」回查文件分页接口补 uuid。
 * 这一步只服务左侧预览，不参与 confirm / save 的提交参数。
 */
const resolvePreviewFile = async (): Promise<void> => {
  resetPreview()
  const file = props.previewFile
  if (!file?.attachName) return
  if (file.uuid) {
    previewUuid.value = file.uuid
    return
  }
  const seq = previewSeq
  resolvingPreview.value = true
  try {
    const res = await getKnowledgeFilePage({
      page: 1,
      limit: 20,
      attachName: file.attachName,
      fwYear: file.fwYear || undefined,
      fwbm: file.fwbm || undefined
    })
    if (seq !== previewSeq) return
    const records = res?.data?.records || []
    const matched = records.find((row) => row.attachName === file.attachName)
    if (!matched) {
      previewError.value = '未找到来源文件，无法预览'
      return
    }
    if (!matched.uuid) {
      previewError.value = '来源文件缺少预览标识，无法预览'
      return
    }
    previewUuid.value = matched.uuid
  } catch (error) {
    if (seq !== previewSeq) return
    previewError.value = '来源文件加载失败，请稍后重试'
  } finally {
    if (seq === previewSeq) resolvingPreview.value = false
  }
}

/** 提交：确认模式走 confirm 接口，经验知识维护走新增接口（必填校验由页面入口统一处理） */
const handleSubmit = (): void => {
  if (loading.value) return
  emit(isExperience.value ? 'save' : 'confirm', { ...form })
}

/** 审核要点来源字典（只读展示用名称：码值转名称，默认码值 2 经验知识） */
const { pointSourceName } = usePointSourceDict()

/**
 * 表单：接口字段 + 页面新增字段
 * 审核要点来源（pointSource）：只读展示——确认流程回填接口返回值，经验知识维护固定默认「经验知识」（码值 2）
 */
const form = reactive({
  pointName: '',
  judgementRuleDesc: '',
  pointDescription: '',
  originalEvidence: '',
  dataSource: '',
  pointSource: pointSourceName(POINT_SOURCE_DEFAULT_CODE),
  /** 是否固化为AI审核要点（1 是 0 否） */
  isSolidify: '1',
  /** 是否为有效审核要点 → 接口字段 isConfirm（1 确认 0 取消确认；不传保持原值） */
  isConfirm: '1',
  /** 生效状态编码（确认时原样回传，接口要求必传） */
  effectiveStatus: ''
})

/**
 * 重置表单：
 * 经验知识维护 = 纯新增——来源固定默认「经验知识」（码值 2）、是否为有效审核要点 / 是否固化为AI审核要点 都为「否」、其余为空；
 * 确认流程——默认 是 / 是，回填时以接口返回值为准
 */
const resetForm = (): void => {
  form.pointName = ''
  form.judgementRuleDesc = ''
  form.pointDescription = ''
  form.originalEvidence = ''
  form.dataSource = ''
  form.pointSource = pointSourceName(POINT_SOURCE_DEFAULT_CODE)
  form.isSolidify = isExperience.value ? '0' : '1'
  form.isConfirm = isExperience.value ? '0' : '1'
  form.effectiveStatus = ''
}

/**
 * 打开时：
 * - 经验知识维护（纯新增）：只重置为空表单，不取详情、不回填；
 * - 审核要点确认：按 pointId 拉取详情回填（确认 / 只读详情入口同一份数据）
 */
watch(
  () => [props.visible, props.pointId, props.mode, props.previewFile] as const,
  async () => {
    if (!props.visible) {
      isFullscreen.value = false
      resetPreview()
      return
    }
    resetForm()
    // 左侧预览独立取数，不阻塞右侧详情回填
    resolvePreviewFile()
    if (isExperience.value || !props.pointId) return
    loading.value = true
    try {
      const res = await getPointDetail(props.pointId)
      const detail = res?.data
      if (!detail) return
      form.pointName = detail.pointName || ''
      form.judgementRuleDesc = detail.judgementRuleDesc || ''
      form.pointDescription = detail.pointDescription || ''
      form.originalEvidence = detail.originalEvidence || ''
      form.dataSource = detail.dataSource || ''
      // 来源：只读展示，优先用稳定码值 pointSourceCode 转名称；旧接口没有该字段时再用 pointSource（码值转名称、名称原样）
      form.pointSource = pointSourceName(detail.pointSourceCode || detail.pointSource) || pointSourceName(POINT_SOURCE_DEFAULT_CODE)
      form.isSolidify = detail.isSolidify || '1'
      // 是否确认：回填接口当前值（已确认显示「是」、未确认显示「否」；接口没给时默认「是」）
      form.isConfirm = detail.isConfirm || '1'
      form.effectiveStatus = detail.effectiveStatus || ''
    } catch (error) {
      // http 层已提示错误
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>
