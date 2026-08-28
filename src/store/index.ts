import { CacheToken } from '@/constants/cacheKey'
import { IObject } from '@/types/interface'
import { getSysRouteMap } from '@/router'
import baseService from '@/service/baseService'
import { removeCache } from '@/utils/cache'
import { mergeServerRoute } from '@/utils/router'
import { createStore } from 'vuex'
import app from './app'

export default createStore({
  state: {
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
  } as IObject,
  getters: {
    hasPermission: (state) => state.hasPermission,
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
  mutations: {
    setRouteLoading(state, payload) {
      state.routeLoading = payload
    },
    showLoading(state) {
      state.loading = true
    },
    hideLoading(state) {
      state.loading = false
    },
    setOldDwId(state, payload) {
      state.oldDwId = payload
    },
    setXqGlobalInfo(state, payload) {
      state.xqGlobalInfo = payload
    },
    setZlGlobalInfo(state, payload) {
      state.ZlGlobalInfo = payload
    },
    setLSGlobalInfo(state, payload) {
      state.LSGlobalInfo = payload
    },
    setSZWLlobalInfo(state, payload) {
      state.SZWLlobalInfo = payload
    },
    setJRGlobalInfo(state, payload) {
      state.JRGlobalInfo = payload
    },
    setCbGlobalInfo(state, payload) {
      state.cbGlobalInfo = payload
    },
    seYssxBm(state, payload) {
      state.yssxbm = payload
    },
    setMenuMsg(state, payload) {
      state.menuMsg = payload
    },
    setProParams(state, payload) {
      state.proParams = payload
    },
    setPenetrateParams(state, payload) {
      state.penetrateParams = payload
    },
    updateState(state, payload) {
      Object.keys(payload).forEach((x: string) => {
        state[x] = payload[x]
      })
    },
    setHasPermission(state, payload) {
      state.hasPermission = payload
    },
    setPermissions(state, payload) {
      state.permissions = payload
    },
    add(state, payload) {
      if (!state.caches.includes(payload)) {
        state.caches.push(payload)
      }
    },
    remove(state, payload) {
      state.caches = state.caches.filter((x: string) => x !== payload)
    },
    clear(state) {
      state.caches = []
    },
    ztbData(state, payload) {
      state.ztbData = payload
    },
    htqdData(state, payload) {
      state.htqdData = payload
    },
    xmssData(state, payload) {
      state.xmssData = payload
    },
    xmsjData(state, payload) {
      state.xmsjData = payload
    },
    jsyzjzfData(state, payload) {
      state.jsyzjzfData = payload
    },
    jsyzzData(state, payload) {
      state.jsyzzData = payload
    }
  },
  actions: {
    setLoading({ commit }, flag: boolean) {
      if (flag) commit('showLoading')
      else commit('hideLoading')
    },
    add(type, name) {
      this.commit('add', name)
    },
    remove(type, name) {
      this.commit('remove', name)
    },
    clear(type) {
      this.commit('clear')
    },
    updateState(ctx, { payload }) {
      ctx.commit('updateState', payload)
    },
    initApp(ctx) {
      return Promise.all([
        baseService.get('/sys/menu/nav'), //加载菜单
        baseService.get('/sys/getUserInfo') //加载用户信息
      ]).then(([menus, user]) => {
        if (user.code !== 0) {
          console.error('初始化用户数据错误', user.msg)
        }
        const [routes, routeToMeta] = mergeServerRoute(menus.data || [], getSysRouteMap())
        ctx.commit('updateState', {
          user: user.data || {},
          routeToMeta: routeToMeta || {},
          menus: []
        })

        return routes
      })
    },
    //退出
    logout(ctx) {
      removeCache(CacheToken, true)
      ctx.commit('updateState', {
        appIsLogin: false,
        permissions: [],
        user: {},
        menus: [],
        routes: [],
        tabs: [],
        activeTabName: ''
      })
    }
  },
  modules: {
    app: app
  }
})
