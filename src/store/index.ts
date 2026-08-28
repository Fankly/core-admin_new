import { CacheToken } from '@/constants/cacheKey'
import { getSysRouteMap } from '@/router'
import baseService from '@/service/baseService'
import { IObject } from '@/types/interface'
import { removeCache } from '@/utils/cache'
import { mergeServerRoute } from '@/utils/router'
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 全局 state。沿用原 Vuex 的扁平大对象结构，索引签名保留 `store[flag]` 这类动态取值
 * （见 hooks/useUser.ts 用 getter 名字符串取穿透参数的写法）。
 */
export interface AppState extends IObject {
  caches: string[]
  appIsLogin: boolean
  appIsReady: boolean
  appIsRender: boolean
  routeLoading: boolean
  permissions: string[]
  ztbData: IObject
  htqdData: IObject
  xmssData: IObject
  xmsjData: IObject
  jsyzjzfData: IObject
  jsyzzData: IObject
  user: IObject
  processData: any[]
  routes: RouteRecordRaw[]
  menus: any[]
  tabs: any[]
  closedTabs: any[]
  routeToMeta: IObject
  activeTabName: string
  hasPermission: boolean
  penetrateParams: IObject
  proParams: IObject
  menuMsg: IObject
  yssxbm: string
  oldDwId: string
  xqGlobalInfo: IObject
  cbGlobalInfo: IObject
  JRGlobalInfo: IObject
  ZlGlobalInfo: IObject
  LSGlobalInfo: IObject
  SZWLlobalInfo: IObject
  loading: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    caches: [], //缓存集合
    appIsLogin: false, //是否登录
    appIsReady: false, //app数据是否就绪
    appIsRender: false, //app是否开始渲染内容
    routeLoading: false, //路由加载状态
    permissions: [], //权限集合
    ztbData: {}, //招投标数据
    htqdData: {}, //合同签订数据
    xmssData: {}, //项目实施数据
    xmsjData: {}, //项目设计数据
    jsyzjzfData: {}, //技术验证及支付数据
    jsyzzData: {}, //技术验证总结数据
    user: {
      id: '',
      name: '',
      systemCode: '',
      domainName: '',
      fullName: ''
    }, //用户信息
    processData: [],
    routes: [], //最终的路由集合
    menus: [], //菜单集合
    tabs: [], //tab标签页集合
    closedTabs: [], //存储已经关闭过的tab
    routeToMeta: {}, //url对应标题meta信息
    activeTabName: '', //tab当前焦点页
    hasPermission: false,
    penetrateParams: {}, // 穿透参数
    proParams: {}, // 省穿透参数
    menuMsg: {}, // 菜单信息
    yssxbm: '',
    oldDwId: '',
    xqGlobalInfo: {},
    cbGlobalInfo: {},
    JRGlobalInfo: {},
    ZlGlobalInfo: {},
    LSGlobalInfo: {},
    SZWLlobalInfo: {},
    loading: false
  }),
  getters: {
    // 原 Vuex 里 hasPermission 既是 state 又是同名 getter，Pinia 不允许重名，
    // 直接读 state.hasPermission（原 getter 也只是透传）
    getPenetrateParams: (state) => state.penetrateParams,
    getProParams: (state) => state.proParams,
    getMenuMsg: (state) => state.menuMsg,
    getUserMsg: (state) => state.user,
    getYssxBm: (state) => state.yssxbm,
    getOldDwId: (state) => state.oldDwId,
    getXqGlobalInfo: (state) => state.xqGlobalInfo,
    getCbGlobalInfo: (state) => state.cbGlobalInfo,
    getJRGlobalInfo: (state) => state.JRGlobalInfo,
    getZlGlobalInfo: (state) => state.ZlGlobalInfo,
    getRouteLoading: (state) => state.routeLoading,
    getLSGlobalInfo: (state) => state.LSGlobalInfo,
    getSZWLlobalInfo: (state) => state.SZWLlobalInfo
  },
  actions: {
    setRouteLoading(payload: boolean) {
      this.routeLoading = payload
    },
    showLoading() {
      this.loading = true
    },
    hideLoading() {
      this.loading = false
    },
    setLoading(flag: boolean) {
      this.loading = flag
    },
    setOldDwId(payload: string) {
      this.oldDwId = payload
    },
    setXqGlobalInfo(payload: IObject) {
      this.xqGlobalInfo = payload
    },
    setZlGlobalInfo(payload: IObject) {
      this.ZlGlobalInfo = payload
    },
    setLSGlobalInfo(payload: IObject) {
      this.LSGlobalInfo = payload
    },
    setSZWLlobalInfo(payload: IObject) {
      this.SZWLlobalInfo = payload
    },
    setJRGlobalInfo(payload: IObject) {
      this.JRGlobalInfo = payload
    },
    setCbGlobalInfo(payload: IObject) {
      this.cbGlobalInfo = payload
    },
    seYssxBm(payload: string) {
      this.yssxbm = payload
    },
    setMenuMsg(payload: IObject) {
      this.menuMsg = payload
    },
    setProParams(payload: IObject) {
      this.proParams = payload
    },
    setPenetrateParams(payload: IObject) {
      this.penetrateParams = payload
    },
    /**
     * 批量覆盖 state。用 Object.assign 而不是 $patch：$patch 对普通对象是递归合并，
     * 会让 logout 里的 `user: {}` 保留旧字段，和原 Vuex mutation 的整体替换语义不一致。
     */
    updateState(payload: IObject) {
      Object.assign(this, payload)
    },
    setHasPermission(payload: boolean) {
      this.hasPermission = payload
    },
    setPermissions(payload: string[]) {
      this.permissions = payload
    },
    setTabs(payload: any[]) {
      this.tabs = payload
    },
    add(payload: string) {
      if (!this.caches.includes(payload)) {
        this.caches.push(payload)
      }
    },
    remove(payload: string) {
      this.caches = this.caches.filter((x: string) => x !== payload)
    },
    clear() {
      this.caches = []
    },
    setZtbData(payload: IObject) {
      this.ztbData = payload
    },
    setHtqdData(payload: IObject) {
      this.htqdData = payload
    },
    setXmssData(payload: IObject) {
      this.xmssData = payload
    },
    setXmsjData(payload: IObject) {
      this.xmsjData = payload
    },
    setJsyzjzfData(payload: IObject) {
      this.jsyzjzfData = payload
    },
    setJsyzzData(payload: IObject) {
      this.jsyzzData = payload
    },
    initApp(): Promise<RouteRecordRaw[]> {
      return Promise.all([
        baseService.get('/sys/menu/nav'), //加载菜单
        baseService.get('/sys/getUserInfo') //加载用户信息
      ]).then(([menus, user]) => {
        if (user.code !== 0) {
          console.error('初始化用户数据错误', user.msg)
        }
        const [routes, routeToMeta] = mergeServerRoute(menus.data || [], getSysRouteMap())
        this.updateState({
          user: user.data || {},
          routeToMeta: routeToMeta || {},
          menus: []
        })

        return routes
      })
    },
    //退出
    logout() {
      removeCache(CacheToken, true)
      this.updateState({
        appIsLogin: false,
        permissions: [],
        user: {},
        menus: [],
        routes: [],
        tabs: [],
        activeTabName: ''
      })
    }
  }
})

export default useAppStore
