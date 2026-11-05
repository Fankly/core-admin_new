/**
 * 看板穿透明细里的「查看」→ 智能审核详情（未通过清单、文件清单共用）。
 *
 * 详情弹窗就是智能审核任务管理那一个（`smartTaskAudit/components/DetailModal.vue`，内部是
 * AuditDetailWorkbench），它那套接口（`getXmAuditConclude` / `listCategoryRuleReview` / …）要的是
 * **taskId**；而这两份穿透明细的返参只有 `proId`，所以先按 proId 换 taskId
 * （`ai-audit-task-manage/getAuditTaskIdByProId` —— 工作流详情、联合会审 AI 意见那几处都是这么做的）。
 *
 * 顺序上**必须先拿到 taskId 再开弹窗**：换 taskId 的接口可能返回空（该项目没有审核任务），
 * 若先开弹窗再关，弹窗会一闪而过。等待期间用全屏 loading 顶住，拿到 taskId 才 `visible = true`，
 * 此时工作台监听 `detailRow.taskId` 变化，自己会走「先结论、再规则」的加载链。
 */
import { reactive, ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import { getAuditTaskIdByProId } from '@/api/ai/smartTaskAudit'

interface AuditDetailRowLike {
  proId?: string
  xmmc?: string
  [key: string]: any
}

export const useAuditDetailModal = () => {
  /** 给 DetailModal 的 modal prop（loading 同时用作请求进行中的重入保护） */
  const auditDetailModal = reactive({ visible: false, loading: false })
  /** 传给 DetailModal 的行：原始行 + 换来的 taskId */
  const auditDetailRow = ref<Record<string, any>>({})

  /**
   * taskId 归一化。
   * `getAuditTaskIdByProId` 的 `data` **就是 taskId 本身**（后端实测 `data:"2095064962462117889"`），
   * 但历史上类型/文档按 `{ taskId }` 写过，所以这里两种形状都吃 ——
   * 与 `composables/useProjectAiAuditTab`、`service/jointReview/components/AiAuditOpinion` 的 normalizeTaskId 同一套口径。
   */
  const normalizeTaskId = (payload: any): string => {
    if (payload && typeof payload === 'object') return String(payload.taskId ?? '').trim()
    return String(payload ?? '').trim()
  }

  const openAuditDetail = async (row: AuditDetailRowLike) => {
    const proId = String(row?.proId ?? '').trim()
    if (!proId) {
      ElMessage.warning('当前记录缺少项目ID（proId），无法查看智能审核详情')
      return
    }
    // 换 taskId 期间锁住，避免连点发出重复请求
    if (auditDetailModal.loading) return
    auditDetailModal.loading = true
    const loadingInstance = ElLoading.service({ lock: true, text: '正在获取智能审核任务...' })
    try {
      const res = await getAuditTaskIdByProId(proId)
      const taskId = normalizeTaskId((res as any)?.data)
      if (!taskId) {
        ElMessage.warning('该项目暂无智能审核任务')
        return
      }
      // 拿到 taskId 才开弹窗：没有任务时弹窗根本不出现，不会闪
      auditDetailRow.value = { ...row, taskId }
      auditDetailModal.visible = true
    } catch (error) {
      ElMessage.error((error as Error)?.message || '智能审核任务获取失败')
    } finally {
      auditDetailModal.loading = false
      loadingInstance.close()
    }
  }

  /** 只关弹窗、不清空行：关闭瞬间弹窗内的异步组件可能还在请求（与另两个入口一致） */
  const closeAuditDetail = () => {
    auditDetailModal.visible = false
  }

  return { auditDetailModal, auditDetailRow, openAuditDetail, closeAuditDetail }
}
