import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { getAuditTaskIdByLHHSProId, getAuditTaskIdByProId } from '@/api/ai/smartTaskAudit'
import type { SmartTaskAuditRow } from '@/views/ai/smartTaskAudit/types'

export const AI_AUDIT_TAB_NAME = '__ai_smart_audit__'

interface ProjectAiAuditTabOptions {
  globalParams: Record<string, any>
  isVisible: Ref<boolean>
  getFormData: () => Record<string, any>
  getProjectId: () => unknown
  getProjectType: () => unknown
  getProjectInfoApi: () => string
}

export const useProjectAiAuditTab = (options: ProjectAiAuditTabOptions) => {
  const taskId = ref('')
  let requestSeq = 0

  const getValue = (...keys: string[]) => {
    for (const source of [options.globalParams, options.getFormData() || {}]) {
      for (const key of keys) {
        const value = source[key]
        if (value !== undefined && value !== null && String(value).trim() !== '') return value
      }
    }
    return ''
  }

  const normalizeTaskId = (response: any) => {
    const payload = response?.data ?? response
    if (payload && typeof payload === 'object') return String(payload.taskId ?? '').trim()
    return String(payload ?? '').trim()
  }

  const reset = () => {
    requestSeq += 1
    taskId.value = ''
  }

  const loadTaskId = async (hasCustomComponent: boolean) => {
    const seq = ++requestSeq
    taskId.value = ''
    if (!hasCustomComponent) return

    const projectId = String(options.getProjectId() ?? '').trim()
    if (!projectId) return

    try {
      const response = options.getProjectInfoApi() ? await getAuditTaskIdByLHHSProId(projectId) : await getAuditTaskIdByProId(projectId)
      if (seq !== requestSeq || !options.isVisible.value || response?.success === false) return
      taskId.value = normalizeTaskId(response)
    } catch {
      // 审核任务不可用时静默隐藏页签，不影响项目详情。
    }
  }

  const detailRow = computed<SmartTaskAuditRow>(() => {
    const projectId = String(options.getProjectId() ?? '').trim()
    const projectType = String(options.getProjectType() ?? '').trim()
    const formData = options.getFormData() || {}
    return {
      ...formData,
      ...options.globalParams,
      id: projectId,
      proId: projectId,
      xmId: projectId,
      xmid: projectId,
      proType: projectType,
      pro_type_id: projectType,
      proTypeId: projectType,
      xmmc: getValue('xmmc', 'XMMC', 'taskName', 'name'),
      xmbm: getValue('xmbm', 'XMBM'),
      proTypeName: getValue('proTypeName', 'xmlxName', 'XMLX_NAME', 'PRO_TYPE_NAME'),
      jhssnd: getValue('jhssnd', 'JHSSND'),
      yjdw: getValue('yjdw', 'YJDW', 'yjdwName', 'YJDW_NAME'),
      ejdw: getValue('ejdw', 'EJDW', 'ejdwName', 'EJDW_NAME'),
      yssxName: getValue('yssxName', 'YSSX_NAME'),
      allInvestTax: getValue('allInvestTax', 'ALL_INVEST_TAX'),
      amount: getValue('amount', 'AMOUNT'),
      taskId: taskId.value
    }
  })

  return {
    taskId,
    detailRow,
    loadTaskId,
    reset
  }
}
