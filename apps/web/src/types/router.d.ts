import 'vue-router'

/**
 * 统一路由 meta 的形状。
 *
 * 原代码到处 `meta as IObject` 再取字段；把已知字段声明出来，
 * 新页面能获得补全，动态菜单也能保留扩展字段。
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string | boolean
    /** 外壳类型；不写则走默认 page 布局 */
    layout?: 'page' | 'fullscreen'
    /** 菜单原始地址，动态路由用它反查菜单信息 */
    url?: string
    openStyle?: number
    id?: string
    outsideMenu?: string
    isNewPage?: boolean
    isIframe?: boolean
    frameSrc?: string
    isNavigationMenu?: boolean
    requiresAuth?: boolean
    keepAlive?: boolean
    affix?: boolean
    /** Let the page own the full workspace viewport (iframes, canvases). */
    fullBleed?: boolean
    matched?: Array<{ path: string; title?: string }>
    [key: string]: unknown
  }
}
