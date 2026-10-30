/**
 * 联合会审 · 导出审核意见（移植自智能评审工作台的「导出审核意见」）。
 *
 * 原实现（views/ai/workbenchView/useProjectReviewWorkbench.ts 的 exportAuditSummary）：
 * 直接拿 `selectedProject.taskId` 调 `exportTaskDetail`，把该任务下**全部审核要点结论**
 * 导成一个 Excel（接口 ai-audit-task-manage/exportTaskDetail，无分页）。
 *
 * 联合会审这边项目行上只有项目口径的 id（originXmId / xmId），没有 taskId，
 * 所以先按项目换 taskId 再导出 —— 取数口径与同页「AI审核意见」面板保持一致
 * （AiAuditOpinion 也是用 originXmId 调 getAuditTaskIdByProId），
 * 保证**导出的就是页面上正在看的那批意见**。
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportTaskDetail, getAuditTaskIdByProId } from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'

/** 导出后的兜底文件名；服务端给了 Content-Disposition 时以服务端为准 */
export const AUDIT_OPINION_EXPORT_FILE_NAME = '审核任务明细'

/**
 * `getAuditTaskIdByProId` 的 data 形状不固定：
 * 后端实测 `data` 本身就是 taskId 字符串，也见过 `{ taskId }` 对象。
 * 两种都兼容，与 useProjectAiAuditTab 的 normalizeTaskId 同一口径。
 */
export const normalizeAuditTaskId = (payload: unknown): string => {
  if (payload && typeof payload === 'object') return String((payload as Record<string, unknown>).taskId ?? '').trim()
  return String(payload ?? '').trim()
}

/**
 * 从联合会审的项目行上取项目 id。
 * `originXmId` 必须排第一 —— 与同页「AI审核意见」面板取 taskId 用的是同一个入参
 * （AiAuditOpinion.vue：`props.project?.originXmId`），这样导出和列表看的是同一个任务。
 */
export const getProjectSourceId = (project?: Record<string, any> | null): string => {
  if (!project) return ''
  for (const key of ['originXmId', 'proId', 'xmId', 'id']) {
    const value = String(project[key] ?? '').trim()
    if (value) return value
  }
  return ''
}

export const useAuditOpinionExport = () => {
  const exportingAuditOpinion = ref(false)

  /**
   * 导出当前项目的审核意见（审核要点结论明细）。
   * 失败一律转成一句正式、可行动的提示，不把异常原样抛给用户。
   */
  const exportAuditOpinion = async (project?: Record<string, any> | null) => {
    if (exportingAuditOpinion.value) return

    const proId = getProjectSourceId(project)
    if (!proId) {
      ElMessage.warning('当前项目缺少项目ID，无法导出审核意见')
      return
    }

    exportingAuditOpinion.value = true
    try {
      const taskRes = await getAuditTaskIdByProId(proId)
      if (taskRes?.success === false) {
        ElMessage.error(taskRes.msg || '审核任务获取失败，无法导出审核意见')
        return
      }

      const taskId = normalizeAuditTaskId(taskRes?.data)
      if (!taskId) {
        // 项目还没跑过 AI 审核时后端不回 taskId：这不是异常，说明白话即可
        ElMessage.warning('当前项目暂无审核任务，暂无可导出的审核意见')
        return
      }

      await apiExportHandle(taskId, AUDIT_OPINION_EXPORT_FILE_NAME, exportTaskDetail)
    } catch (error: any) {
      ElMessage.error(error?.message || '导出审核意见失败，请稍后重试')
    } finally {
      exportingAuditOpinion.value = false
    }
  }

  return { exportingAuditOpinion, exportAuditOpinion }
}
