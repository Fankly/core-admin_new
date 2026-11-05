import { Result } from '@/api/types'
import baseService from '@/service/baseService'

/**
 * 自动提示词管理（智能审核提示词模板）
 *
 * 接口文档：`/ai-audit-prompt-template`
 *
 * 注意：templateId 是雪花算法生成的 int64，经 http 层 jsonBigstring 解析后是**字符串**，
 * 类型统一用 string | number 承接，不要 Number() 转换（会丢精度）。
 */

/** 提示词模板 */
export interface PromptTemplateVO {
  /** 主键ID（雪花，字符串安全） */
  templateId: string | number
  /** 提示词编码 */
  promptCode: string
  /** 提示词内容 */
  promptContent: string
}

/** 新增 / 更新入参（templateId 为空 = 新增） */
export interface PromptTemplateSaveDTO {
  templateId?: string | number | null
  promptCode: string
  promptContent: string
}

/** 查询全部提示词模板（按主键倒序） */
export const listPromptTemplate = (): Promise<Result & { data: PromptTemplateVO[] }> => baseService.post('/ai-audit-prompt-template/list')

/** 根据主键查询提示词模板 */
export const getPromptTemplateDetail = (templateId: string | number): Promise<Result & { data: PromptTemplateVO | null }> =>
  baseService.post(`/ai-audit-prompt-template/detail?templateId=${encodeURIComponent(String(templateId))}`)

/** 根据提示词编码查询模板（未找到时 data 为 null） */
export const getPromptTemplateByCode = (promptCode: string): Promise<Result & { data: PromptTemplateVO | null }> =>
  baseService.post(`/ai-audit-prompt-template/getByPromptCode?promptCode=${encodeURIComponent(promptCode)}`)

/** 保存或更新模板（校验：编码/内容必填、编码唯一） */
export const saveOrUpdatePromptTemplate = (params: PromptTemplateSaveDTO): Promise<Result & { data: string }> =>
  baseService.post('/ai-audit-prompt-template/saveOrUpdate', params)

/** 批量删除模板（按主键 ID 列表） */
export const removePromptTemplate = (templateIdList: Array<string | number>): Promise<Result & { data: string }> =>
  baseService.post('/ai-audit-prompt-template/remove', templateIdList)
