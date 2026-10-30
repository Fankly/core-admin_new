/**
 * 审核要点来源字典（公共代码 AI_AUDIT_POINT_SOURCE_COM）
 *
 * 接口：GET /commonCode/getData?code=AI_AUDIT_POINT_SOURCE_COM
 * 返回：[{ code: '1', name: '制度文件' }, { code: '2', name: '经验知识' }]
 *
 * 页面里「审核要点来源」的展示名、筛选下拉选项、码值/名称转换都走这份字典
 * （拉取失败时用本地兜底映射，内容与字典一致，不打断页面）；字典全页只请求一次。
 * 约定：**展示用名称、查询/下钻/提交用码值**（接口 line/统计给名称、查询与落库用码值）。
 */
import { computed, ref } from 'vue'
import { getPublicData } from '@/api/common'

/** 来源字典项 */
export interface PointSourceOption {
  /** 码值（查询/提交用） */
  code: string
  /** 名称（展示用） */
  name: string
}

/** 本地兜底选项（字典未就绪或拉取失败时使用，内容与接口一致） */
const FALLBACK_OPTIONS: PointSourceOption[] = [
  { code: '1', name: '制度文件' },
  { code: '2', name: '经验知识' }
]

/** 来源默认码值：2 经验知识（新建经验知识 / 接口未返回来源时兜底） */
export const POINT_SOURCE_DEFAULT_CODE = '2'

/** 字典缓存（模块级，页面内多处共用，只请求一次） */
const dict = ref<PointSourceOption[]>([])
let pending: Promise<void> | null = null

export const usePointSourceDict = () => {
  /** 拉取字典：成功则覆盖缓存，失败保持兜底（静默，不打断页面） */
  const loadPointSourceDict = (): Promise<void> => {
    if (pending) return pending
    pending = getPublicData('AI_AUDIT_POINT_SOURCE_COM')
      .then((res) => {
        const list: PointSourceOption[] = Array.isArray(res?.data)
          ? res.data
              .filter((item: PointSourceOption | null) => item && item.code !== undefined && item.code !== null)
              .map((item: PointSourceOption) => ({ code: String(item.code), name: String(item.name ?? '') }))
          : []
        if (res?.success && list.length) dict.value = list
      })
      .catch(() => {
        // 拉取失败：保持本地兜底映射
      })
    return pending
  }

  /** 筛选下拉选项（字典未回来时用兜底），value 用码值、label 用名称 */
  const pointSourceOptions = computed<PointSourceOption[]>(() => (dict.value.length ? dict.value : FALLBACK_OPTIONS))

  /** 码值 → 名称（展示用：码值转名称、名称原样、空值返回空串） */
  const pointSourceName = (value?: string | null): string => {
    const text = String(value ?? '').trim()
    if (!text) return ''
    const hit = pointSourceOptions.value.find((item) => item.code === text)
    return hit ? hit.name : text
  }

  /** 名称 → 码值（查询/下钻/提交用：名称转码值、码值原样、其它文本原样） */
  const pointSourceCodeOf = (value?: string | null): string => {
    const text = String(value ?? '').trim()
    if (!text) return ''
    const hit = pointSourceOptions.value.find((item) => item.name === text)
    return hit ? hit.code : text
  }

  return { loadPointSourceDict, pointSourceOptions, pointSourceName, pointSourceCodeOf }
}
