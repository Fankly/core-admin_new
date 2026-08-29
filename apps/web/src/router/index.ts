import { EMitt } from '@/constants/enum'
import { useAppStore } from '@/store'
import { IObject } from '@/types/interface'
import { getPermissions, getToken } from '@/utils/cache'
import emits from '@/utils/emits'
import { getBaseRouteToMeta, registerToRouter } from '@/utils/router'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { createRouter, createWebHashHistory, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import baseRoutes, { errorRoute } from './base'

interface dynamicRouteParams {
  path: string
  query?: IObject
  mete?: IObject
}

NProgress.configure({ showSpinner: false })

const routers = baseRoutes
const router = createRouter({
  history: createWebHashHistory(), //createWebHashHistory() hash模式
  routes: routers
})

// 路由加载前
router.beforeEach((to, from, next) => {
  // pinia 在 main.ts 里晚于 router 模块求值，所以只能在守卫内部取 store
  const store = useAppStore()
  if (to.meta.url || to.path) {
    const map = new Map(Object.entries(store.routeToMeta))
    const menuMsg = map.get((to.meta.url || to.path) as string)
    store.setMenuMsg({
      ...(menuMsg as object),
      url: to.meta.url || to.path
    })
    //外链
    if (to.meta.isNewPage) {
      if (to.query.pop !== 'true') {
        return false
      }
    }
  }
  //token
  const token = getToken()
  // permission
  const permission = getPermissions()

  const isPop = to.query.pop === 'true' //新窗口打开内页
  // const isPop = "true"; //新窗口打开内页
  // 获取tabs
  const index = store.tabs.findIndex((item: any) => item.value === to.path)

  // 设置路由loading状态
  if (index === -1) store.setRouteLoading(true)
  NProgress.start()
  if (to.path !== '/login') {
    setDomian()
    if (store.routes.length) {
      if (to.name === 'error') {
        /* const isMatched = autoRegisterDynamicToRouterAndNext(to);
        if (!isMatched) {
         store.updateState({ appIsRender: true, appIsLogin: true });
          next();
        } */
        next()
      } else {
        if (!to.query.pop) {
          try {
            const routeMeta: IObject = store.routeToMeta[to.path]
            emits.emit(EMitt.OnPushMenuToTabs, {
              label: to.meta.title || routeMeta.title || to.path,
              value: to.fullPath,
              mete: routeMeta
            })
          } catch (error) {
            next('/login')
          }
        }
        if (!(to.path.includes('workflow') && to.path !== '/workflow/todoTasks')) {
          store.updateState({ appIsRender: true, appIsLogin: true })
        } else {
          store.initApp().then(() => {
            next()
          })
        }
        next()
      }
    } else if (to.path.includes('workflow') && to.path !== '/workflow/todoTasks') {
      store.initApp().then(() => {
        next()
      })
    } else {
      if (token && permission) {
        //初始化数据
        store.initApp().then((res: Array<RouteRecordRaw>) => {
          const mergeRoute = routers.concat(res).concat(errorRoute)
          router.options.routes = mergeRoute
          registerToRouter(router, mergeRoute)
          if (!to.matched.length) {
            registerDynamicToRouterAndNext({ path: to.path, query: to.query })
          }

          store.updateState({
            appIsReady: true,
            routes: mergeRoute,
            routeToMeta: { ...store.routeToMeta, ...getBaseRouteToMeta(baseRoutes) }
          })
          setTimeout(() => {
            store.updateState({ appIsRender: true, appIsLogin: true })
          }, 600)
          next({ ...to, replace: true })
        })
      } else {
        if (isPop) {
          if (!to.matched.length) {
            registerDynamicToRouterAndNext({ path: to.path, query: to.query })
            store.updateState({ appIsRender: true, appIsReady: true })
            next(to.fullPath)
          } else {
            store.updateState({ appIsRender: true, appIsReady: true })
            if (to.meta.requiresAuth) {
              next('/login')
            } else {
              next()
            }
          }
        } else if (to.path.includes('workflow') && to.path !== '/workflow/todoTasks') {
          store.initApp().then(() => {
            next()
          })
        } else {
          next('/login')
        }
      }
    }
  } else {
    store.updateState({ appIsReady: true, appIsRender: true })
    next()
  }
})

// 路由加载后
router.afterEach(() => {
  setTimeout(() => {
    useAppStore().setRouteLoading(false)
  }, 300)
  NProgress.done()
})

const setDomian = () => {
  const domain = useAppStore().getUserMsg.domainName || 'sgcc.com.cn'
  try {
    document.domain = domain
  } catch (e) {
    ElMessage({
      type: 'warning',
      dangerouslyUseHTMLString: true,
      message: `修改域名出错,请用使用域名访问,否则有些功能无法正常使用!<br>设置域名:${domain}`
    })
  }
}

/**
 * 获取系统视图路径映射
 * @returns
 */
export const getSysRouteMap = (): IObject => {
  return import.meta.glob('/src/views/**/*.vue')
}

/**
 * 根据路由path转换为系统视图组件路径
 * @param path
 * @returns
 */
export const toSysViewComponentPath = (path: string): string => {
  path = path.replace('_', '-')
  return `/src/views${path}.vue`
}
/**
 *
 * 自动注册路由
 * @param to
 * @returns
 */
const autoRegisterDynamicToRouterAndNext = (to: RouteLocationNormalized): boolean => {
  if (to.redirectedFrom) {
    const path = to.redirectedFrom.path
    const component = matchedSysRouteComponent(path)
    if (component) {
      registerToRouter(router, [
        {
          path: path,
          name: path,
          component,
          redirect: ''
        }
      ])
      router.push(to.redirectedFrom)
      return true
    }
  }
  return false
}

/**
 * 寻找视图组件
 * @param path
 * @returns
 */
const matchedSysRouteComponent = (path: string): any => {
  const sysRouteMap = getSysRouteMap()
  const component = sysRouteMap[toSysViewComponentPath(path)]
  if (!component) {
    console.error('实时注册动态路由失败，未找到组件路径', path)
  }
  return component
}

/**
 * 实时注册动态路由并直接跳转过去
 * @param route
 */
export const registerDynamicToRouterAndNext = (route: dynamicRouteParams): void => {
  const component = matchedSysRouteComponent(route.path)
  const newRoute: RouteRecordRaw = {
    path: route.path,
    name: route.path,
    component,
    redirect: !component ? { path: '/error', query: { to: 404 }, replace: true } : ''
  }
  registerToRouter(router, [newRoute])
  router.push(route)
}
export default router
