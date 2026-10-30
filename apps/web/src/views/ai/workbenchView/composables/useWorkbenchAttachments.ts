import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listAttach } from '@/api/ai/smartTaskAudit'
import type { RuleReviewPoint, TXmAttach } from '@/api/ai/smartTaskAudit'
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

export function useWorkbenchAttachments(
  selectedRule: Readonly<Ref<ReviewRule>>,
  projectTaskId: Readonly<Ref<string>>,
  openPreview: OpenPreview,
  /** 预览抽屉正在下载的附件 id；按 id 屏蔽入口，避免同一份材料被重复请求，切换到别的材料不受影响 */
  loadingDocumentId?: Readonly<Ref<string | undefined>>,
  /**
   * 规则列表是否仍在加载。加载期间的选中项是过渡态：列表先按接口顺序落地，随后分类字典重排、
   * 详情回填才定下真正的首条，此时拉附件等于给一个马上会被替换掉的规则白打一次 listAttach。
   * 列表本身此刻也是 v-loading 遮罩，用户点不到，等 loading 结束再按最终选中项拉一次。
   */
  rulesLoading?: Readonly<Ref<boolean | undefined>>,
  /** 当前选中的审核要点；listAttach 的 detailId 从该要点的 detailId 取，而非规则级 detailId */
  selectedReviewPoint?: Readonly<Ref<RuleReviewPoint | undefined>>
) {
  const attachListLoading = ref(false)
  const attachList = ref<TXmAttach[]>([])
  const attachListEmptyText = ref('暂无附件')
  const attachListDetailId = ref('')
  const attachListLoaded = ref(false)
  let attachListLoadSeq = 0
  let attachListPromise: Promise<TXmAttach[]> | null = null
  let attachListPromiseDetailId = ''

  // detailId 从当前选中的审核要点取（要点来自 listRuleReviewNew，每条带自己的 detailId）
  const selectedReviewDetailId = computed(() => String(selectedReviewPoint?.value?.detailId || '').trim())
  const previewing = computed(() => attachListLoading.value)
  /** 正在下载的附件 id：只禁用这一行的预览入口，附件列表与其他材料照常可点 */
  const openingAttachId = computed(() => String(loadingDocumentId?.value || '').trim())
  const isAttachOpening = (file: TXmAttach) => Boolean(openingAttachId.value) && String(file.id || '').trim() === openingAttachId.value

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
    if (previewing.value || isAttachOpening(file)) return
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
    // 同一份材料正在下载：忽略重复点击；点别的材料照常切换
    if (id === openingAttachId.value) return

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

  // 数组 getter 每次返回新引用，Object.is 恒为 false，规则对象被重建（分类重排、详情回填）就会重复请求；
  // 收成字符串 key 后由 watch 自身的值比较兜底，同一份 detailId 只拉一次附件列表
  const attachListKey = computed(() => `${projectTaskId.value}|${selectedRule.value.id}|${selectedReviewDetailId.value}`)
  const rulesSettling = computed(() => rulesLoading?.value === true)

  watch(
    [attachListKey, rulesSettling] as const,
    ([key, settling], previous) => {
      // 选中项真的换了才清缓存：loading 收尾时 key 未变，保留已加载结果，列表刷新不会重复请求
      if (key !== previous?.[0]) resetAttachList()
      if (settling) return
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
    isAttachOpening,
    getAttachKey,
    getAttachDisplayName,
    getAttachTypeName,
    isAttachPreviewable,
    loadAttachList,
    handlePreviewAttach,
    handleInlineAttachPreview
  }
}
