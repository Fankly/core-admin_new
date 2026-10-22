import { computed, onScopeDispose, ref } from 'vue'
import { useMenuStore } from '@/store'
import { downloadFj, getConfigByMenuId, listFj } from '@/api/metrics'
import type { HelpAttachment } from '@/api/metrics'
import { getMenuMessage } from '@/api/process'
import { handleError } from '@/utils/error'

export interface HelpModalProps {
  showHelpInfo?: boolean
  menuUrl?: string
  title?: string
}
export interface HelpModalInstance {
  open: () => void
  showModal: boolean
}
export const useHelp = (props: Readonly<HelpModalProps>) => {
  const menu = useMenuStore()
  const showModal = ref(false)
  const activeTab = ref<'help' | 'attachments'>(props.showHelpInfo === false ? 'attachments' : 'help')
  const fetching = ref(false)
  const downloading = ref(false)
  const loading = computed(() => fetching.value || downloading.value)
  const helpText = ref('')
  const attachments = ref<HelpAttachment[]>([])
  const isHide = computed(() => !helpText.value.trim() && attachments.value.length === 0)
  let sequence = 0
  const disposed = ref(false)
  const isDisposed = () => disposed.value
  onScopeDispose(() => {
    disposed.value = true
    sequence += 1
  })

  const showModalHandle = async () => {
    const current = ++sequence
    fetching.value = true
    helpText.value = ''
    attachments.value = []
    activeTab.value = props.showHelpInfo === false ? 'attachments' : 'help'
    try {
      const url = props.menuUrl?.trim() || menu.menuMsg.url || ''
      if (!url) return
      const result = await getMenuMessage(url)
      if (isDisposed() || current !== sequence) return
      if (!result.success || !result.data) throw new Error(result.msg)
      const menuId: unknown = result.data.id
      if (typeof menuId !== 'string' && typeof menuId !== 'number') throw new Error('菜单未绑定 ID')
      const [help, files] = await Promise.allSettled([getConfigByMenuId(menuId), listFj(menuId)])
      if (isDisposed() || current !== sequence) return
      if (help.status === 'fulfilled' && help.value.success && help.value.data?.status === '1') helpText.value = help.value.data.helpInfo ?? ''
      // 附件可独立于帮助文本发布；一个接口失败不会抹掉另一个接口的数据。
      if (files.status === 'fulfilled' && files.value.success && Array.isArray(files.value.data)) attachments.value = files.value.data
    } catch (error) {
      if (!isDisposed() && current === sequence) handleError(error, '获取帮助信息失败')
    } finally {
      if (current === sequence) fetching.value = false
    }
  }
  const saveFile = async (file: HelpAttachment) => {
    const blob = await downloadFj({ fileName: file.fjmc, uuid: file.uuid })
    if (isDisposed()) return
    const anchor = document.createElement('a')
    const url = URL.createObjectURL(blob)
    anchor.href = url
    try {
      anchor.download = decodeURIComponent(file.fjmc)
    } catch {
      anchor.download = file.fjmc
    }
    document.body.appendChild(anchor)
    try {
      anchor.click()
    } finally {
      anchor.remove()
      URL.revokeObjectURL(url)
    }
  }
  const downloadFiles = async (files: HelpAttachment[]) => {
    if (downloading.value || isDisposed()) return
    downloading.value = true
    try {
      for (const file of files) {
        if (isDisposed()) break
        await saveFile(file)
      }
    } catch (error) {
      if (!isDisposed()) handleError(error, '文件下载失败')
    } finally {
      downloading.value = false
    }
  }
  const downloadFile = (fjmc: string, uuid: string) => downloadFiles([{ fjmc, uuid }])
  const downloadAllFiles = () => downloadFiles([...attachments.value])
  const open = () => {
    showModal.value = true
  }
  return { showModal, activeTab, loading, helpText, attachments, isHide, showModalHandle, downloadFile, downloadAllFiles, open }
}
