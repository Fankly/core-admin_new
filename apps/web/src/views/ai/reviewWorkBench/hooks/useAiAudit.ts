import { computed, ref, type Ref, type ComputedRef } from 'vue'
import {
  canShowAiAuditBySpecialOrg,
  getAiRiskLevel,
  hasAiAuditEntry,
  loadAiAuditParams,
  type AiAuditParams
} from '@/views/ai/reviewWorkBench/utils/aiAudit'

export type UseAiAuditOptions = {
  /** 当前选中项目（需含 sfaishxm） */
  selectedProject: Ref<any> | ComputedRef<any>
  /** 用户信息（需含 specialorgcode） */
  userInfo: Ref<any> | ComputedRef<any>
}

/**
 * 评审工作台自用 AI 审核展示逻辑
 * 对齐 expertReview：风险等级标签 + 意见区/旧入口显隐
 * 后续 reviewDeatil 等页面可直接复用，当前不强制接入
 */
export const useAiAudit = (options: UseAiAuditOptions) => {
  const hideAiAuditOpinion = ref(false)
  const aiAuditVisibleOrgConfig = ref('')
  const aiAuditParamsLoaded = ref(false)

  const hasCurrentAiAuditProject = computed(() => hasAiAuditEntry(options.selectedProject.value?.sfaishxm))

  const canShowAiAuditByOrg = computed(() =>
    canShowAiAuditBySpecialOrg(options.userInfo.value?.specialorgcode, aiAuditVisibleOrgConfig.value)
  )

  /** 展示右侧 AI 审核意见面板 */
  const showAiAuditOpinion = computed(
    () => canShowAiAuditByOrg.value && !hideAiAuditOpinion.value && hasCurrentAiAuditProject.value
  )

  /** 展示旧版「AI智能审核」入口按钮（参数关闭意见区时） */
  const showLegacyAiAuditEntry = computed(
    () => canShowAiAuditByOrg.value && hideAiAuditOpinion.value && hasCurrentAiAuditProject.value
  )

  /** 拉取公共参数并写入本地状态 */
  const initAiAuditParams = async (): Promise<AiAuditParams> => {
    const params = await loadAiAuditParams()
    hideAiAuditOpinion.value = params.hideAiAuditOpinion
    aiAuditVisibleOrgConfig.value = params.visibleOrgConfig
    aiAuditParamsLoaded.value = true
    return params
  }

  /** 应用已拉取的参数（避免重复请求） */
  const applyAiAuditParams = (params: AiAuditParams) => {
    hideAiAuditOpinion.value = params.hideAiAuditOpinion
    aiAuditVisibleOrgConfig.value = params.visibleOrgConfig
    aiAuditParamsLoaded.value = true
  }

  return {
    hideAiAuditOpinion,
    aiAuditVisibleOrgConfig,
    aiAuditParamsLoaded,
    hasCurrentAiAuditProject,
    canShowAiAuditByOrg,
    showAiAuditOpinion,
    showLegacyAiAuditEntry,
    getAiRiskLevel,
    initAiAuditParams,
    applyAiAuditParams
  }
}
