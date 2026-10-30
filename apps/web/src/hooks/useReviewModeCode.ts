import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicData } from '@/api/common'

export interface ReviewModeOption {
  code: string
  name: string
}

export const REVIEW_MODE_PUBLIC_CODE = 'LHHS_PSMS'
export const REVIEW_MODE_ASSIGNED_CODE = '02'

export const useReviewModeCode = () => {
  const reviewModeOptions = ref<ReviewModeOption[]>([])
  const reviewModeLoading = ref(false)
  const reviewModeLoadFailed = ref(false)

  const loadReviewModeOptions = async () => {
    reviewModeLoading.value = true
    reviewModeLoadFailed.value = false
    try {
      const res = await getPublicData(REVIEW_MODE_PUBLIC_CODE)
      if (!res.success) throw new Error(res.msg)
      const options = Array.isArray(res.data) ? res.data : []
      if (!options.length) throw new Error('评审模式公共代码为空')
      reviewModeOptions.value = options
      return options
    } catch (error) {
      reviewModeOptions.value = []
      reviewModeLoadFailed.value = true
      ElMessage.error((error as Error).message || String(error))
      return []
    } finally {
      reviewModeLoading.value = false
    }
  }

  const getReviewModeName = (code: unknown, defaultValue = '') => {
    if (code === undefined || code === null || code === '') return defaultValue
    return reviewModeOptions.value.find((item) => String(item.code) === String(code))?.name || defaultValue
  }

  const hasReviewMode = (code: unknown) => {
    return Boolean(getReviewModeName(code))
  }

  const getReviewModeUpdateMessage = (code: unknown) => {
    const name = getReviewModeName(code)
    return name ? `评审模式已更新为${name}！` : '评审模式已更新！'
  }

  const checkReviewModeOptionsReady = () => {
    if (reviewModeLoading.value) {
      ElMessage.warning('评审模式加载中，请稍后重试')
      return false
    }
    if (reviewModeLoadFailed.value || !reviewModeOptions.value.length) {
      ElMessage.warning('评审模式加载失败，请稍后重试')
      return false
    }
    return true
  }

  return {
    reviewModeOptions,
    reviewModeLoading,
    reviewModeLoadFailed,
    loadReviewModeOptions,
    getReviewModeName,
    hasReviewMode,
    getReviewModeUpdateMessage,
    checkReviewModeOptionsReady
  }
}
