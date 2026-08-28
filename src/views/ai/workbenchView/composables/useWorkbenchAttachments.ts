import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listAttach } from '@/api/ai/smartTaskAudit'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import {
  decodeAuditPreviewFileName,
  getAuditPreviewFileExtension,
  getAuditPreviewFileKey,
  isSupportedAuditPreviewFile,
  UNSUPPORTED_AUDIT_PREVIEW_TIP
} from '../../smartTaskAudit/components/auditFilePreview'
import type { ReviewRule } from '../types'

/** 打开预览抽屉；trigger 为触发按钮，抽屉关闭后焦点回到它 */
type OpenPreview = (file: TXmAttach, trigger?: HTMLElement | null) => void | Promise<void>

export function useWorkbenchAttachments(selectedRule: Readonly<Ref<ReviewRule>>, projectTaskId: Readonly<Ref<string>>, openPreview: OpenPreview) {
  const attachListLoading = ref(false)
  const attachList = ref<TXmAttach[]>([])
  const attachListEmptyText = ref('暂无附件')
  const attachListDetailId = ref('')
  const attachListLoaded = ref(false)
  let attachListLoadSeq = 0
  let attachListPromise: Promise<TXmAttach[]> | null = null
  let attachListPromiseDetailId = ''

  const selectedReviewDetailId = computed(() => String(selectedRule.value.detailId || '').trim())
  const previewing = computed(() => attachListLoading.value)

  const getAttachKey = (file: TXmAttach) => getAuditPreviewFileKey(file)
  const getAttachDisplayName = (file: TXmAttach) => decodeAuditPreviewFileName(file.name)

  const getAttachTypeName = (file: TXmAttach) => {
    const typeName = String(file.fjType || '').trim()
    if (typeName) return typeName
    const fjId = String(file.fjId || '').trim()
    if (fjId) return fjId
    const extension = getAuditPreviewFileExtension(file)
    return extension ? extension.toUpperCase() : '-'
  }

  const isAttachPreviewable = (file: TXmAttach) => isSupportedAuditPreviewFile(file)

  const resetAttachList = () => {
    attachListLoadSeq += 1
    attachListLoading.value = false
    attachList.value = []
    attachListEmptyText.value = '暂无附件'
    attachListDetailId.value = ''
    attachListLoaded.value = false
    attachListPromise = null
    attachListPromiseDetailId = ''
  }

  const ensureAttachList = async (notifyMissingDetail = false) => {
    const detailId = selectedReviewDetailId.value
    if (!detailId) {
      attachList.value = []
      attachListEmptyText.value = '当前评审详情缺少明细ID'
      attachListDetailId.value = ''
      attachListLoaded.value = false
      if (notifyMissingDetail) ElMessage.warning('当前评审详情缺少明细ID')
      return []
    }

    if (attachListDetailId.value === detailId && attachListLoaded.value) return attachList.value
    if (attachListPromise && attachListPromiseDetailId === detailId) return attachListPromise

    const seq = ++attachListLoadSeq
    const request = (async () => {
      attachListLoading.value = true
      attachListEmptyText.value = '暂无附件'
      try {
        const res = await listAttach(detailId)
        if (seq !== attachListLoadSeq) return []
        if (!res.success) {
          attachList.value = []
          attachListDetailId.value = ''
          attachListLoaded.value = false
          attachListEmptyText.value = res.msg || '源文件列表获取失败'
          ElMessage.error(res.msg || '源文件列表获取失败')
          return []
        }

        const files = (Array.isArray(res.data) ? res.data : []).filter((file) => file && getAttachKey(file))
        attachList.value = files
        attachListDetailId.value = detailId
        attachListLoaded.value = true
        return files
      } catch (error: any) {
        if (seq !== attachListLoadSeq) return []
        attachList.value = []
        attachListDetailId.value = ''
        attachListLoaded.value = false
        attachListEmptyText.value = error?.message || '源文件列表获取失败'
        ElMessage.error(error?.message || '源文件列表获取失败')
        return []
      } finally {
        if (seq === attachListLoadSeq) attachListLoading.value = false
      }
    })()

    attachListPromise = request
    attachListPromiseDetailId = detailId
    try {
      return await request
    } finally {
      if (attachListPromise === request) {
        attachListPromise = null
        attachListPromiseDetailId = ''
      }
    }
  }

  const loadAttachList = async () => {
    await ensureAttachList(true)
  }

  const handlePreviewAttach = (file: TXmAttach, trigger?: HTMLElement | null) => {
    if (previewing.value) return
    if (!isAttachPreviewable(file)) {
      ElMessage.warning(UNSUPPORTED_AUDIT_PREVIEW_TIP)
      return
    }
    void openPreview(file, trigger)
  }

  const handleInlineAttachPreview = (payload: { attachId: string; attachName?: string }) => {
    if (previewing.value) return
    const id = String(payload?.attachId || '').trim()
    if (!id) {
      ElMessage.warning('附件标识缺失，无法预览')
      return
    }

    const attachName = String(payload?.attachName || '').trim()
    const matched = attachList.value.find((file) => String(file.id || '') === id || String(file.uuid || '') === id || String(file.fjId || '') === id)
    if (matched) {
      const file: TXmAttach = attachName ? { ...matched, name: attachName } : matched
      // 正文内联附件扩展名可能缺失，交给抽屉按 id 直开并展示后端返回的错误
      if (isAttachPreviewable(file)) handlePreviewAttach(file)
      else void openPreview(file)
      return
    }

    void openPreview({ id, uuid: id, name: attachName, fjId: '', size: 0, proId: '' })
  }

  watch(
    () => [projectTaskId.value, selectedRule.value.id, selectedReviewDetailId.value] as const,
    () => {
      resetAttachList()
      if (selectedReviewDetailId.value) void ensureAttachList()
    },
    { immediate: true }
  )

  onBeforeUnmount(resetAttachList)

  return {
    attachListLoading,
    attachList,
    attachListEmptyText,
    previewing,
    getAttachKey,
    getAttachDisplayName,
    getAttachTypeName,
    isAttachPreviewable,
    loadAttachList,
    handlePreviewAttach,
    handleInlineAttachPreview
  }
}
