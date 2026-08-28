import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPsydAndfjByYssxId } from '@/api/matter/matterBasic'

export interface FinancialBasisFile {
  uuid: string
  name: string
  attachName?: string
  [key: string]: any
}

/**
 * 归一化 getPsydAndfjByYssxId 返回的附件列表
 * 参考 src/views/matter/yssxzsj.vue 的 normalizeFinancialBasisRows
 */
const normalizeBasisRows = (data: any): FinancialBasisFile[] => {
  const rows =
    data?.attachLists ||
    data?.attachments ||
    data?.attachmentList ||
    data?.fjList ||
    data?.fj ||
    data?.attachList ||
    data?.list ||
    data?.records ||
    data?.data ||
    data
  if (!Array.isArray(rows)) return []

  return rows.map((row: any) => ({
    ...row,
    uuid: String(row?.uuid || row?.id || ''),
    name: row?.attachName || row?.fjmc || row?.fileName || row?.name || '未命名附件'
  }))
}

/** 获取审核依据附件名称 */
export const getFinancialBasisFileName = (row: any): string => {
  return row?.name || row?.attachName || row?.fjmc || row?.fileName || '未命名附件'
}

/** 获取审核依据附件的展示类型（按文件名后缀映射为中文/通用类型名） */
export const getFinancialBasisFileType = (row: any): string => {
  const fileName = getFinancialBasisFileName(row)
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.trim().toLowerCase() : ''
  if (!extension) return '-'

  const typeMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    txt: 'TXT',
    zip: '压缩包',
    rar: '压缩包',
    '7z': '压缩包',
    ofd: 'OFD',
    wps: 'WPS',
    et: 'ET'
  }
  return typeMap[extension] || extension.toUpperCase()
}

/**
 * 按预算事项id加载"财务审核要点"与"审核依据附件"
 * 供 expertReview / offlineReview / offlineReviewReturn 的评审佐证材料抽屉复用
 */
export const useFinancialReviewBasis = () => {
  const financialBasisLoading = ref<boolean>(false)
  // 财务审核要点（cwpsyd 文本）
  const financialReviewPoint = ref<string>('')
  // 审核依据附件列表
  const financialBasisFiles = ref<FinancialBasisFile[]>([])
  let loadSequence = 0

  const resetFinancialBasis = () => {
    loadSequence += 1
    financialBasisLoading.value = false
    financialReviewPoint.value = ''
    financialBasisFiles.value = []
  }

  /**
   * 按预算事项id加载财务审核要点与审核依据附件
   * yssxId 为空时清空并返回，不报错
   */
  const loadFinancialBasis = async (yssxId: string | number | undefined | null) => {
    if (yssxId === undefined || yssxId === null || String(yssxId).trim() === '') {
      resetFinancialBasis()
      return
    }
    const sequence = ++loadSequence
    financialBasisLoading.value = true
    try {
      const res: any = await getPsydAndfjByYssxId(String(yssxId))
      if (!res.success) {
        throw new Error(res.msg || '财务审核要求查询失败')
      }
      if (sequence !== loadSequence) return
      const data = res.data || {}
      financialReviewPoint.value = data.cwpsyd || ''
      financialBasisFiles.value = normalizeBasisRows(data)
    } catch (e: any) {
      if (sequence !== loadSequence) return
      resetFinancialBasis()
      ElMessage.error(e?.message || '财务审核要求查询失败')
    } finally {
      if (sequence === loadSequence) financialBasisLoading.value = false
    }
  }

  return {
    financialBasisLoading,
    financialReviewPoint,
    financialBasisFiles,
    loadFinancialBasis,
    resetFinancialBasis
  }
}
