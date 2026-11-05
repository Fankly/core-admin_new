const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createHarness, flush, Vue } = require('./helpers/overviewHarness.cjs')

test('ranking tooltip hovers reuse the total instead of scanning every ranking row', (t) => {
  const { createRankingChartOption } = createHarness(t).load('charts.ts')
  let valueReads = 0
  const rows = Array.from({ length: 1000 }, (_, index) => ({
    id: String(index),
    name: `单位${index}`,
    get value() {
      valueReads++
      return '123.45'
    },
    ratio: 0.1
  }))
  const option = createRankingChartOption(rows, '单位')
  valueReads = 0
  for (let index = 0; index < 10; index++) {
    const tooltip = option.tooltip.formatter({ dataIndex: index, name: `单位${index}` })
    assert.ok(tooltip.includes('123450.00'))
    assert.ok(tooltip.includes(`单位${index}`))
  }
  assert.equal(valueReads, 10, 'each hover should only read the hovered row')
  const updated = createRankingChartOption([{ id: 'new', name: '新数据', value: '200.01' }], '单位')
  assert.ok(updated.tooltip.formatter({ dataIndex: 0, name: '新数据' }).includes('200.01'))
})

const setupChart = async (t, initiallyEnabled = true) => {
  const frames = new Map()
  const observers = []
  const instances = []
  let frameId = 0
  let buildCount = 0
  let resolveFonts
  const fontsReady = new Promise((resolve) => {
    resolveFonts = resolve
  })
  const state = Vue.reactive({ enabled: initiallyEnabled, value: 1, selected: -1 })
  const h = createHarness(t, {
    realChart: true,
    globals: {
      document: { fonts: { ready: fontsReady } },
      requestAnimationFrame: (callback) => {
        const id = ++frameId
        frames.set(id, callback)
        return id
      },
      cancelAnimationFrame: (id) => frames.delete(id),
      ResizeObserver: class {
        constructor(callback) {
          this.callback = callback
          this.connected = false
          observers.push(this)
        }
        observe() {
          this.connected = true
        }
        unobserve() {
          this.connected = false
        }
        disconnect() {
          this.connected = false
        }
      }
    },
    mocks: {
      echarts: {
        init(element, theme, size) {
          const instance = {
            element,
            size,
            options: [],
            resizes: [],
            actions: [],
            disposed: false,
            on() {},
            setOption(option) {
              this.options.push(option)
            },
            resize(size) {
              this.resizes.push(size)
            },
            dispatchAction(action) {
              this.actions.push(action)
            },
            dispose() {
              this.disposed = true
            }
          }
          instances.push(instance)
          return instance
        }
      }
    }
  })
  const chart = h.run(() =>
    h.load('composables/useOverviewChart.ts').useOverviewChart({
      enabled: () => state.enabled,
      option: () => {
        buildCount++
        return { series: [{ type: 'bar', data: [state.value] }] }
      },
      selectedDataIndex: () => state.selected,
      filename: () => 'overview.png'
    })
  )
  const element = { clientWidth: 640, clientHeight: 320 }
  chart.chartRef.value = element
  await h.mount()
  const frame = async () => {
    await flush()
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(0))
    await flush()
  }
  return { h, chart, state, element, instances, observers, frames, frame, resolveFonts, buildCount: () => buildCount }
}

test('mount, data updates and initial resize notifications share one chart draw', async (t) => {
  const c = await setupChart(t)
  c.state.value = 2
  c.observers[0].callback()
  c.chart.renderChart()
  c.resolveFonts()
  await c.frame()
  assert.equal(c.instances.length, 1)
  assert.equal(c.instances[0].options.length, 1)
  assert.deepEqual(c.instances[0].options[0].series[0].data, [2])
  assert.deepEqual(c.instances[0].size, { width: 640, height: 320 })
  assert.equal(c.instances[0].resizes.length, 0)

  // ResizeObserver 首次通知或相同尺寸重复通知不应重新跑 ECharts 布局。
  c.observers[0].callback()
  c.observers[0].callback()
  await c.frame()
  assert.equal(c.instances[0].options.length, 1)
  assert.equal(c.instances[0].resizes.length, 0)

  c.element.clientWidth = 720
  c.observers[0].callback()
  c.element.clientWidth = 800
  c.observers[0].callback()
  await c.frame()
  assert.deepEqual(c.instances[0].resizes, [{ width: 800, height: 320, animation: { duration: 0 } }])
  assert.equal(c.instances[0].options.length, 1)
})

test('highlight changes do not resubmit chart data; fonts loaded after drawing still relayout labels', async (t) => {
  const c = await setupChart(t)
  await c.frame()
  c.state.selected = 0
  await c.frame()
  assert.equal(c.instances[0].options.length, 1)
  assert.equal(c.instances[0].actions.at(-1).type, 'highlight')
  assert.equal(c.instances[0].actions.at(-1).dataIndex, 0)
  c.resolveFonts()
  await c.frame()
  assert.equal(c.instances[0].resizes.length, 1)
  assert.equal(c.instances[0].options.length, 1)
})

test('table views skip option construction and returning charts use the latest data', async (t) => {
  const c = await setupChart(t, false)
  await c.frame()
  c.state.value = 10
  await c.frame()
  assert.equal(c.buildCount(), 0)
  assert.equal(c.instances.length, 0)
  c.state.enabled = true
  await c.frame()
  assert.deepEqual(c.instances[0].options[0].series[0].data, [10])

  c.state.enabled = false
  c.chart.chartRef.value = null
  await c.frame()
  assert.equal(c.instances[0].disposed, true)
  const builds = c.buildCount()
  c.state.value = 20
  await c.frame()
  assert.equal(c.buildCount(), builds)
  c.chart.chartRef.value = { clientWidth: 480, clientHeight: 240 }
  c.state.enabled = true
  await c.frame()
  assert.deepEqual(c.instances[1].options[0].series[0].data, [20])
})

test('keep-alive deactivation cancels pending drawing and releases observers and chart instances', async (t) => {
  const c = await setupChart(t)
  await c.frame()
  c.state.value = 2
  await flush()
  assert.equal(c.frames.size, 1)
  await c.h.deactivate()
  assert.equal(c.frames.size, 0)
  assert.equal(c.instances[0].disposed, true)
  assert.equal(c.observers[0].connected, false)
  assert.equal(c.chart.chartAvailable.value, false)
  const builds = c.buildCount()
  c.state.value = 3
  c.observers[0].callback()
  await c.frame()
  assert.equal(c.buildCount(), builds)
  assert.equal(c.instances.length, 1)
  await c.h.activate()
  await c.frame()
  assert.equal(c.observers[0].connected, true)
  assert.deepEqual(c.instances[1].options[0].series[0].data, [3])
  assert.equal(c.chart.chartAvailable.value, true)
})
