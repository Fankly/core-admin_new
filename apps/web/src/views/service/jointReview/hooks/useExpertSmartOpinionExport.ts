import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportExpertSmartReviewOpinion, exportOfflineSmartReviewOpinion } from '@/api/service/jointReview'
import { apiExportHandle } from '@/utils/export'

/** 服务端未给 Content-Disposition 时的兜底文件名 */
export const EXPERT_SMART_OPINION_FILE_NAME = '智审意见'

/**
 * 联合会审（市级/省级共用）——导出智审意见。
 * 接口：POST /expertReview/expertSmartReviewOpinion，入参 { meetingId, expertId }，返回文件流。
 */
export const useExpertSmartOpinionExport = () => {
  const exportingSmartOpinion = ref(false)

  const exportSmartOpinion = async (meetingId?: string, expertId?: string) => {
    if (exportingSmartOpinion.value) return

    const mid = String(meetingId ?? '').trim()
    const eid = String(expertId ?? '').trim()
    if (!mid || !eid) {
      ElMessage.warning('当前会议或专家信息不完整，无法导出智审意见')
      return
    }

    exportingSmartOpinion.value = true
    try {
      await apiExportHandle({ meetingId: mid, expertId: eid }, EXPERT_SMART_OPINION_FILE_NAME, exportExpertSmartReviewOpinion)
    } catch (error: any) {
      ElMessage.error(error?.message || '导出智审意见失败，请稍后重试')
    } finally {
      exportingSmartOpinion.value = false
    }
  }

  /**
   * 线下会审——导出智审意见（待审 + 已审全部项目合并导出）。
   * 入参与项目信息下载（leaderReviewExportXmInfo）一致：会话上下文 + leaderReviewStatus，
   * 但 leaderReviewStatus 会被服务端强制覆盖为「先 0 后 1 合并」，故前端传不传都不影响结果。
   * 接口协议见 doc/LeaderReviewController-exportOfflineSmartReviewOpinion接口协议.md。
   */
  const exportOfflineSmartOpinion = async (params: Record<string, any>) => {
    if (exportingSmartOpinion.value) return

    const mid = String(params?.meetingId ?? '').trim()
    if (!mid) {
      ElMessage.warning('当前会议信息不完整，无法导出智审意见')
      return
    }

    exportingSmartOpinion.value = true
    try {
      await apiExportHandle(params, EXPERT_SMART_OPINION_FILE_NAME, exportOfflineSmartReviewOpinion)
    } catch (error: any) {
      ElMessage.error(error?.message || '导出智审意见失败，请稍后重试')
    } finally {
      exportingSmartOpinion.value = false
    }
  }

  return { exportingSmartOpinion, exportSmartOpinion, exportOfflineSmartOpinion }
}
