import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
import type { EffectScope } from 'vue'
import type { ColumnProps, EnumProps, SearchParams } from './interface'
import { useColumns } from './useColumns'
import { findEnumItem, formatCellValue, getCellValue } from './cell'

const scopes: EffectScope[] = []
afterEach(() => {
  scopes.splice(0).forEach((scope) => {
    scope.stop()
  })
})
const setup = (initial: ColumnProps[]) => {
  const columns = shallowRef(initial)
  const search = ref<SearchParams>({})
  const defaults = ref<SearchParams>({})
  const scope = effectScope()
  scopes.push(scope)
  const state = scope.run(() => useColumns(() => columns.value, search, defaults))
  if (!state) throw new Error('Table scope was not initialized')
  return { columns, search, defaults, state, scope }
}
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await nextTick()
}

describe('table column configuration', () => {
  it('replaces grouped columns without mutating the caller and preserves edited filters', async () => {
    const original: ColumnProps[] = [
      {
        label: 'Group',
        _children: [
          { prop: 'name', search: { el: 'input', defaultValue: 'initial', order: 10 } },
          { prop: 'enabled', search: { el: 'switch', defaultValue: false, order: 1 } }
        ]
      }
    ]
    const { columns, search, defaults, state } = setup(original)
    expect(state.searchColumns.value.map((column) => column.prop)).toEqual(['enabled', 'name'])
    expect(original[0]._children?.[0].isShow).toBeUndefined()
    search.value.name = 'edited'
    columns.value = [{ prop: 'name', search: { el: 'input', defaultValue: 'new' } }]
    await nextTick()
    expect(search.value).toEqual({ name: 'edited' })
    expect(defaults.value).toEqual({ name: 'new' })
    expect(state.colSetting.value).toHaveLength(1)
  })

  it('keeps array defaults independent from form edits', () => {
    const { search, defaults } = setup([{ prop: 'range', search: { el: 'date-picker', defaultValue: [1, 2] } }])
    const value = search.value.range as number[]
    value.push(3)
    expect(defaults.value.range).toEqual([1, 2])
  })

  it('ignores old enum responses when configuration is replaced or disposed', async () => {
    let resolve!: (response: { data: EnumProps[] }) => void
    const request = () =>
      new Promise<{ data: EnumProps[] }>((done) => {
        resolve = done
      })
    const { columns, state, scope } = setup([{ prop: 'status', enum: request }])
    await flush()
    columns.value = [{ prop: 'status', enum: [{ value: 2, label: 'current' }] }]
    await flush()
    resolve({ data: [{ value: 1, label: 'old' }] })
    await flush()
    expect(state.enumMap.get('status')).toEqual([{ value: 2, label: 'current' }])
    columns.value = [{ prop: 'status', enum: request }]
    await flush()
    scope.stop()
    resolve({ data: [{ value: 3, label: 'disposed' }] })
    await flush()
    expect(state.enumMap.get('status')).toEqual([])
  })

  it('reads nested values and enum children while retaining zero and false', () => {
    expect(getCellValue({ person: { count: 0 } }, 'person.count')).toBe(0)
    expect(getCellValue({ person: null }, 'person.count')).toBeUndefined()
    expect(formatCellValue(false)).toBe('false')
    expect(formatCellValue([0, false])).toBe('0 / false')
    expect(
      findEnumItem([{ code: 'parent', nodes: [{ code: 'child', title: 'Child' }] }], 'child', { label: 'title', value: 'code', children: 'nodes' })
        ?.title
    ).toBe('Child')
  })
})
