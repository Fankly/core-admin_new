import { computed, onScopeDispose, shallowReactive, shallowRef, unref, watch } from 'vue'
import type { Ref } from 'vue'
import type { ColumnProps, EnumMap, SearchParams } from './interface'
import { handleError } from '@/utils/error'

export const getSearchKey = (column: ColumnProps) => column.search?.key ?? column.prop?.split('.').pop() ?? ''
export const flattenColumns = (columns: ColumnProps[]): ColumnProps[] =>
  columns.flatMap((column) => (column._children?.length ? flattenColumns(column._children) : [column]))

/** 配置仅复制公开字段；显示状态由本组件维护，不写回调用方配置。 */
const copyColumn = (column: ColumnProps): ColumnProps =>
  shallowReactive({
    ...column,
    isShow: unref(column.isShow) ?? true,
    isHide: unref(column.isHide) ?? false,
    isFilterEnum: unref(column.isFilterEnum) ?? true,
    tag: unref(column.tag),
    search: column.search ? { ...column.search } : undefined,
    _children: column._children?.map(copyColumn)
  })

export const useColumns = (source: () => ColumnProps[], searchParam: Ref<SearchParams>, searchInitParam: Ref<SearchParams>) => {
  const tableColumns = shallowRef<ColumnProps[]>([])
  const enumMap = shallowReactive<EnumMap>(new Map())
  const enumSources = new Map<string, ColumnProps['enum']>()
  let generation = 0
  let disposed = false
  const flatColumns = computed(() => flattenColumns(tableColumns.value))
  const searchColumns = computed(() =>
    flatColumns.value
      .filter((column) => column.search?.el || column.search?.render)
      .map((column, index) => ({ column, order: column.search?.order ?? index + 2 }))
      .sort((left, right) => left.order - right.order)
      .map(({ column }) => column)
  )
  const colSetting = computed(() => tableColumns.value.filter((column) => !column.type && column.prop !== 'operation'))

  const loadEnums = () => {
    const currentGeneration = ++generation
    const keys = new Set(flatColumns.value.map((column) => column.prop).filter((key): key is string => !!key))
    for (const key of enumMap.keys())
      if (!keys.has(key)) {
        enumMap.delete(key)
        enumSources.delete(key)
      }
    const visited = new Set<string>()
    for (const column of flatColumns.value) {
      const key = column.prop
      const source = column.enum
      if (!key || visited.has(key)) continue
      visited.add(key)
      if (!source) {
        enumMap.delete(key)
        enumSources.delete(key)
        continue
      }
      if (typeof source !== 'function') {
        enumMap.set(key, unref(source))
        enumSources.set(key, source)
        continue
      }
      if (enumSources.get(key) === source && enumMap.has(key)) continue
      enumSources.delete(key)
      enumMap.set(key, [])
      // 不缓存尚未完成的请求，配置更换后旧请求不能覆盖新枚举。
      void Promise.resolve()
        .then(() => source())
        .then(({ data }) => {
          if (disposed || currentGeneration !== generation) return
          if (!Array.isArray(data)) throw new Error('枚举响应必须是数组')
          enumMap.set(key, data)
          enumSources.set(key, source)
        })
        .catch((error: unknown) => {
          if (disposed || currentGeneration !== generation) return
          enumMap.delete(key)
          enumSources.delete(key)
          handleError(error, '加载表格选项失败')
        })
    }
  }
  watch(
    source,
    (columns) => {
      tableColumns.value = columns.map(copyColumn)
      const defaults: SearchParams = {}
      for (const column of searchColumns.value) {
        const key = getSearchKey(column)
        const value = unref(column.search?.defaultValue)
        if (key && value != null) defaults[key] = Array.isArray(value) ? [...(value as unknown[])] : value
      }
      // 仅移除已删除字段的默认值；保留用户正在编辑的其他查询条件。
      const previousDefaults = searchInitParam.value
      for (const key of Object.keys(previousDefaults))
        if (!(key in defaults) && searchParam.value[key] === previousDefaults[key]) Reflect.deleteProperty(searchParam.value, key)
      for (const [key, value] of Object.entries(defaults))
        if (!(key in searchParam.value)) searchParam.value[key] = Array.isArray(value) ? [...(value as unknown[])] : value
      searchInitParam.value = defaults
      loadEnums()
    },
    { deep: true, immediate: true }
  )
  onScopeDispose(() => {
    disposed = true
    generation += 1
  })
  return { tableColumns, searchColumns, colSetting, enumMap }
}
