import { dirname, posix } from 'node:path'

export function localImportPath(source, specifier) {
  if (specifier.startsWith('@/')) return posix.normalize(specifier.slice(2))
  if (specifier.startsWith('.')) return posix.normalize(posix.join(dirname(source), specifier))
  return undefined
}

const presentation = /^(app|router|store|layouts|views|features|components|design-system|hooks)(\/|$)/
const uiPackage = /^(vue|pinia|vue-router|element-plus)(\/|$)/

/** 只约束本轮已经梳理完的边界；历史业务页面可以保留原有目录。 */
export function architectureViolation(source, { specifier, typeOnly }) {
  const target = localImportPath(source, specifier)
  if (/\.test\.[cm]?[jt]sx?$/.test(source)) return undefined
  if (/^(api|service|config)\//.test(source) && ((target && presentation.test(target)) || uiPackage.test(specifier))) {
    return 'API、请求和配置层不得依赖界面、路由或 store；共享类型归入 API/types，副作用在 app 层注入'
  }
  if (source.startsWith('router/') && target?.startsWith('app/')) {
    return '路由不得反向导入 app；由启动入口注入工作区能力'
  }
  if (!typeOnly && /^axios(\/|$)/.test(specifier) && !source.startsWith('service/http/')) {
    return 'Axios 运行时只能由 service/http 使用；业务调用领域 API 或 baseService'
  }
  if (specifier === 'vuex') return '请使用 Pinia 领域 store'
  return undefined
}
