import { useContextStore, useMenuStore, useSessionStore, useShellStore, useTabsStore } from './index'
import type { GlobalContextKey } from './modules/context'
import type { IObject } from '@/types/interface'

/**
 * 已迁入页面的状态适配入口。所有数据仍由现有 Pinia 领域 store 持有，
 * 不创建第二套用户、权限或导航状态；新页面直接使用领域 store。
 * 这里保留旧页面的调用形状，以便逐模块改写时不改变业务行为。
 */
const globalKeys: Record<string, GlobalContextKey> = {
  Xq: 'xqGlobalInfo', Cb: 'cbGlobalInfo', JR: 'JRGlobalInfo',
  Zl: 'ZlGlobalInfo', LS: 'LSGlobalInfo', SZWL: 'SZWLlobalInfo'
}

function stateFields(): IObject {
  const session = useSessionStore()
  const menu = useMenuStore()
  const shell = useShellStore()
  const context = useContextStore()
  const tabs = useTabsStore()
  return {
    user: session.user, permissions: session.permissions, hasPermission: session.hasPermission,
    menuMsg: menu.menuMsg, routes: menu.routes, menus: menu.menus, routeToMeta: menu.routeToMeta,
    tabs: tabs.tabs, appIsReady: shell.isReady, appIsRender: shell.isRendered,
    appIsLogin: session.isLogin, routeLoading: shell.isRouteLoading, loading: shell.isLoading,
    penetrateParams: context.penetrateParams, proParams: context.proParams,
    oldDwId: context.oldDwId, yssxbm: context.yssxbm, processData: context.processData,
    ...context.globalInfo, ...context.projectStageData
  }
}

const state: IObject = new Proxy({}, { get: (_target, key) => stateFields()[String(key)] })
const getterFields: Record<string, string> = {
  getUserMsg: 'user', getUserInfo: 'user', getMenuMsg: 'menuMsg', hasPermission: 'hasPermission',
  getPenetrateParams: 'penetrateParams', getProParams: 'proParams', getOldDwId: 'oldDwId',
  getYssxBm: 'yssxbm', getRouteLoading: 'routeLoading',
  ...Object.fromEntries(Object.entries(globalKeys).map(([name, key]) => [`get${name}GlobalInfo`, key])),
  getSZWLlobalInfo: 'SZWLlobalInfo'
}
const getters: IObject = new Proxy({}, {
  get: (_target, key) => key === 'getCurrentMenuId' ? useMenuStore().menuMsg.id : state[getterFields[String(key)]]
})

function commit(type: string, payload?: any): void {
  const context = useContextStore()
  for (const [name, key] of Object.entries(globalKeys)) {
    if (type === `set${name}GlobalInfo` || (key === 'SZWLlobalInfo' && type === 'setSZWLlobalInfo')) {
      context.setGlobalInfo(key, payload)
      return
    }
  }
  if (Object.hasOwn(context.projectStageData, type)) {
    context.projectStageData[type as keyof typeof context.projectStageData] = payload
    return
  }
  switch (type) {
    case 'setPermissions': useSessionStore().setPermissions(payload); break
    case 'setHasPermission': useSessionStore().setHasPermission(payload); break
    case 'setMenuMsg': useMenuStore().setMenuMessage(payload); break
    case 'setPenetrateParams': context.setPenetrateParams(payload); break
    case 'setProParams': context.setProParams(payload); break
    case 'setOldDwId': context.setOldDwId(payload); break
    case 'seYssxBm': context.setYssxbm(payload); break
    case 'showLoading': useShellStore().showLoading(); break
    case 'hideLoading': useShellStore().hideLoading(); break
    case 'setLoadingStatus': useShellStore().setLoading(Boolean(payload)); break
    case 'setRouteLoading': useShellStore().setRouteLoading(Boolean(payload)); break
    case 'closeCurrentTab': useTabsStore().closeCurrent(); break
    case 'addCachePage': {
      const tabs = useTabsStore()
      if (tabs.activePath && !tabs.cachedViews.includes(tabs.activePath)) tabs.cachedViews.push(tabs.activePath)
      break
    }
    case 'removeCachePage': {
      const tabs = useTabsStore()
      const path = typeof payload === 'string' && payload.startsWith('/') ? payload : tabs.activePath
      tabs.cachedViews = tabs.cachedViews.filter((item) => item !== path)
      break
    }
    case 'removeTag': {
      const tabs = useTabsStore()
      const key = payload?.path ?? payload?.value ?? payload
      const tab = tabs.tabs.find((item) => item.path === key || item.meta?.id === key || item.meta?.outsideMenu === key)
      if (tab) tabs.closeTab(tab.path)
      break
    }
    default: throw new Error(`未适配的业务状态操作: ${type}`)
  }
}

const businessStore = { state, getters, commit }
export const useStore = () => businessStore
export const mapGetters = (names: string[]): Record<string, () => any> =>
  Object.fromEntries(names.map((name) => [name, () => getters[name]]))
export const mapMutations = (names: string[]): Record<string, (payload?: any) => void> =>
  Object.fromEntries(names.map((name) => [name, (payload?: any) => commit(name, payload)]))
export default businessStore
