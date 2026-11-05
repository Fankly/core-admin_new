const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const Vue = require('vue')

const base = path.resolve(__dirname, '../../src/views/service/overview')
const flush = async () => {
  for (let i = 0; i < 8; i++) await Vue.nextTick()
}

// Execute the real component setup and Vue watchers; replace network and browser boundaries only.
const createHarness = (t, { mocks = {}, globals = {}, realChart = false } = {}) => {
  let frameId = 0
  const frames = new Map()
  globals = {
    document: { removeEventListener() {} },
    requestAnimationFrame: (callback) => {
      const id = ++frameId
      frames.set(id, callback)
      queueMicrotask(() => {
        if (frames.delete(id)) callback(0)
      })
      return id
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    ...globals
  }
  const mounted = []
  const unmounting = []
  const activated = []
  const deactivated = []
  const cache = new Map()
  const scope = Vue.effectScope()
  t.after(() => {
    unmounting.forEach((callback) => callback())
    scope.stop()
  })
  const dependencies = {
    vue: {
      ...Vue,
      onMounted: (callback) => mounted.push(callback),
      onBeforeUnmount: (callback) => unmounting.push(callback),
      onActivated: (callback) => activated.push(callback),
      onDeactivated: (callback) => deactivated.push(callback)
    },
    'lucide-vue-next': {},
    'element-plus': { ElMessage: { error() {} } },
    '@/api/common': {},
    '@/api/overview': {},
    '@/utils/export': {},
    ...mocks
  }
  const load = (filename, component = false) => {
    if (cache.has(filename)) return cache.get(filename).exports
    let source = fs.readFileSync(filename, 'utf8')
    if (filename.endsWith('.vue')) {
      if (!component) return {}
      source = compileScript(parse(source, { filename }).descriptor, { id: 'overview-test' }).content
    }
    const loaded = { exports: {} }
    cache.set(filename, loaded)
    const localRequire = (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name]
      if (/useOverviewChart$/.test(name) && !realChart) {
        return { useOverviewChart: () => ({ chartRef: Vue.ref(null), chartAvailable: Vue.ref(false) }) }
      }
      if (name.endsWith('.less') || name.endsWith('.png')) return name
      if (name.startsWith('.')) {
        const target = path.resolve(path.dirname(filename), name)
        return load(path.extname(target) ? target : `${target}.ts`)
      }
      return require(name)
    }
    const code = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
    }).outputText
    const args = ['require', 'module', 'exports', ...Object.keys(globals)]
    vm.runInThisContext(`(function(${args.join(',')}) {${code}\n})`, { filename })(localRequire, loaded, loaded.exports, ...Object.values(globals))
    return loaded.exports
  }
  return {
    run: (callback) => scope.run(callback),
    load: (file) => load(path.join(base, file)),
    // 可选的 context 便于断言组件 emit（如点击扇区切换阶段卡片）。
    setup: (file, props, context) => scope.run(() => load(path.join(base, file), true).default.setup(props, context || { expose() {}, emit() {} })),
    mount: async () => {
      mounted.forEach((callback) => callback())
      await flush()
    },
    activate: async () => {
      activated.forEach((callback) => callback())
      await flush()
    },
    deactivate: async () => {
      deactivated.forEach((callback) => callback())
      await flush()
    }
  }
}

module.exports = { createHarness, flush, Vue }
