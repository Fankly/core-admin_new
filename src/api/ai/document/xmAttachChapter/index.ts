import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

/** 附件章节切片（接口文档 docs/默认模块.md「附件章节切片」） */
export interface AttachChapterRow {
  /** 章节ID（主键，雪花） */
  chapterId: string | number
  /** 附件ID */
  attachId?: string | number
  /** 章节序号（同级内递增） */
  sequence?: number
  /** 章节UUID（树节点自标识，parentId 指向它） */
  chapterUuid: string
  /** 章节标题 */
  title: string
  /** 章节内容（markdown 片段，不含子章节） */
  content?: string
  /** 父章节UUID（根节点为空） */
  parentId?: string | null
  /** 关联附件ID列表（英文逗号拼接） */
  attachmentIds?: string
  createTime?: string
}

/**
 * 按附件ID查询章节切片：返回**树序**（第一章 → 其子章 → 第二章 …，文档顺序）。
 * 入参只需要 attachId（即文档预处理每行的 id）。
 */
export const listAttachChaptersByTree = (attachId: string): Promise<Result & { data: AttachChapterRow[] }> => {
  return budget.post('xm-attach-chapter/listByTree', { attachId }, {}, false)
}

/** 导出附件章节切片（POST xm-attach-chapter/export，入参 attachId，返回文件流） */
export const exportAttachChapters = (attachId: string): Promise<Result> => {
  return budget.exportFile('xm-attach-chapter/export', { attachId }, {}, false)
}
