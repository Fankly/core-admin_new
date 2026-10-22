import type { Server, ServerResponse } from 'node:http'
import type { IObject } from '@/types/interface'
import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import { useTable } from './useTable'
import { useTable as useLargeTable } from './useTableSize'

interface ReceivedRequest {
  params: IObject
  response: ServerResponse
}

let server: Server
let baseUrl: string
const requests: ReceivedRequest[] = []
const waiters: ((request: ReceivedRequest) => void)[] = []

beforeAll(async () => {
  server = createServer((request, response) => {
    const received = {
      params: Object.fromEntries(new URL(request.url!, baseUrl).searchParams),
      response
    }
    const waiter = waiters.shift()
    if (waiter) waiter(received)
    else requests.push(received)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('HTTP server did not bind a TCP port')
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  server?.closeAllConnections()
  if (server?.listening)
    await new Promise<void>((resolve) =>
      server.close(() => {
        resolve()
      })
    )
})

const api = async (params: IObject) => {
  const url = new URL(baseUrl)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const response = await fetch(url)
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

const nextRequest = (): Promise<ReceivedRequest> => {
  const request = requests.shift()
  return request ? Promise.resolve(request) : new Promise((resolve) => waiters.push(resolve))
}

const respond = (request: ReceivedRequest, rows: string[], pageable = true) => {
  const data = pageable ? { records: rows, current: Number(request.params.page), size: Number(request.params.limit), total: 100 } : rows
  request.response.setHeader('Content-Type', 'application/json')
  request.response.end(JSON.stringify({ data }))
}

describe('useTable with HTTP responses', () => {
  it('keeps the latest page when responses arrive in reverse order', async () => {
    const transformed: string[][] = []
    const table = useTable(api, {}, true, (data) => {
      if (Array.isArray(data)) throw new Error('Expected a paginated response')
      transformed.push(data.records as string[])
      return data
    })
    const first = table.getTableList()
    const firstRequest = await nextRequest()
    const second = table.handleCurrentChange(2)
    const secondRequest = await nextRequest()

    expect(table.loading.value).toBe(true)
    respond(secondRequest, ['new'])
    await second
    expect(table.loading.value).toBe(false)
    respond(firstRequest, ['old'])
    await first

    expect(table.tableData.value).toEqual(['new'])
    expect(table.pageable.value.current).toBe(2)
    expect(transformed).toEqual([['new']])
  })

  it('keeps loading until the latest request completes', async () => {
    const table = useTable(api)
    const first = table.getTableList()
    const firstRequest = await nextRequest()
    const second = table.getTableList()
    const secondRequest = await nextRequest()

    respond(firstRequest, ['old'])
    await first
    expect(table.loading.value).toBe(true)
    expect(table.tableData.value).toEqual([])
    respond(secondRequest, ['new'])
    await second
    expect(table.loading.value).toBe(false)
  })

  it('reports only a failure belonging to the latest request', async () => {
    const errors: unknown[] = []
    const table = useTable(api, {}, true, undefined, (error) => errors.push(error))
    const first = table.getTableList()
    const firstRequest = await nextRequest()
    const second = table.getTableList()
    const secondRequest = await nextRequest()

    firstRequest.response.writeHead(500).end('old failure')
    await first
    expect(errors).toEqual([])
    expect(table.loading.value).toBe(true)
    secondRequest.response.writeHead(500).end('current failure')
    await second
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe('current failure')
    expect(table.loading.value).toBe(false)
  })

  it.each(['success', 'failure'])('ignores a %s response after scope disposal', async (result) => {
    const errors: unknown[] = []
    const scope = effectScope()
    const table = scope.run(() => useTable(api, {}, true, undefined, (error) => errors.push(error)))!
    const pending = table.getTableList()
    const request = await nextRequest()
    scope.stop()

    expect(table.loading.value).toBe(false)
    await table.getTableList()
    expect(requests).toEqual([])
    if (result === 'success') respond(request, ['late'])
    else request.response.writeHead(500).end('late failure')
    await pending
    expect(table.tableData.value).toEqual([])
    expect(table.pageable.value.total).toBe(0)
    expect(errors).toEqual([])
  })

  it.each(['ref', 'getter'])('reads replaced and deleted init parameters from a %s', async (mode) => {
    const initParam = ref<IObject>({ department: 'A', obsolete: 'remove' })
    const table = useTable(api, mode === 'ref' ? initParam : () => initParam.value)
    const first = table.getTableList()
    const firstRequest = await nextRequest()
    expect(firstRequest.params).toMatchObject({ department: 'A', obsolete: 'remove' })
    respond(firstRequest, ['A'])
    await first

    initParam.value = { department: 'B' }
    const second = table.getTableList()
    const secondRequest = await nextRequest()
    expect(secondRequest.params).toEqual({ department: 'B', page: '1', limit: '20' })
    respond(secondRequest, ['B'])
    await second

    delete initParam.value.department
    const third = table.getTableList()
    const thirdRequest = await nextRequest()
    expect(thirdRequest.params).toEqual({ page: '1', limit: '20' })
    respond(thirdRequest, ['all'])
    await third
  })

  it('updates pagination mode without retaining page parameters', async () => {
    const isPageable = ref(true)
    const table = useTable(api, {}, isPageable)
    const first = table.search()
    const firstRequest = await nextRequest()
    expect(firstRequest.params).toEqual({ page: '1', limit: '20' })
    respond(firstRequest, ['page'])
    await first

    isPageable.value = false
    const second = table.getTableList()
    const secondRequest = await nextRequest()
    expect(secondRequest.params).toEqual({})
    respond(secondRequest, ['all'], false)
    await second
    expect(table.tableData.value).toEqual(['all'])
  })

  it('awaits search, reset and pagination while preserving submitted filters', async () => {
    let selectionsCleared = 0
    const table = useTable(api, {}, true, undefined, undefined, () => selectionsCleared++)
    table.searchInitParam.value = { keyword: 'default' }
    table.searchParam.value = { keyword: 'submitted', enabled: false, count: 0, empty: '', absent: null }
    const search = table.search()
    expect(search).toBeInstanceOf(Promise)
    const searched = await nextRequest()
    expect(searched.params).toEqual({ keyword: 'submitted', enabled: 'false', count: '0', page: '1', limit: '20' })
    respond(searched, ['search'])
    await search

    table.searchParam.value.keyword = 'not submitted'
    const size = table.handleSizeChange(50)
    expect(size).toBeInstanceOf(Promise)
    const resized = await nextRequest()
    expect(resized.params).toMatchObject({ keyword: 'submitted', page: '1', limit: '50' })
    respond(resized, ['size'])
    await size

    const page = table.handleCurrentChange(3)
    expect(page).toBeInstanceOf(Promise)
    const paged = await nextRequest()
    expect(paged.params).toMatchObject({ keyword: 'submitted', page: '3', limit: '50' })
    respond(paged, ['page'])
    await page
    expect(selectionsCleared).toBe(2)

    const reset = table.reset()
    expect(reset).toBeInstanceOf(Promise)
    const resetRequest = await nextRequest()
    expect(resetRequest.params).toEqual({ keyword: 'default', page: '1', limit: '50' })
    respond(resetRequest, ['reset'])
    await reset
    expect(table.searchParam.value).toEqual({ keyword: 'default' })
    expect(table.tableData.value).toEqual(['reset'])
  })

  it('preserves the large-page compatibility entry point', async () => {
    expect(useTable().pageable.value.size).toBe(20)
    expect(useLargeTable(undefined, undefined, undefined, undefined, undefined, undefined, 75).pageable.value.size).toBe(75)
    const table = useLargeTable(api)
    const pending = table.getTableList()
    const request = await nextRequest()
    expect(request.params.limit).toBe('100')
    respond(request, ['large page'])
    await pending
    expect(table.tableData.value).toEqual(['large page'])
  })
})
