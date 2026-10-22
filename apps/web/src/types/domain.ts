/**
 * 领域模型。
 *
 * 这里只放跨模块共享、且会被 store / 页面同时消费的类型；页面局部类型仍就近声明。
 */

/** 当前登录用户。保留索引签名，兼容后端下发的扩展字段。 */
export interface UserProfile {
  id: string
  name: string
  systemCode: string
  domainName: string
  fullName: string
  [key: string]: unknown
}

export const createEmptyUser = (): UserProfile => ({
  id: '',
  name: '',
  systemCode: '',
  domainName: '',
  fullName: ''
})

/** 服务端菜单元信息里前端真正消费的部分。 */
export interface MenuMeta {
  title?: string
  icon?: string | boolean
  openStyle?: number
  id?: string
  url?: string
  outsideMenu?: string
  isIframe?: boolean
  isNewPage?: boolean
  isUnavailable?: boolean
  frameSrc?: string
  requiresAuth?: boolean
  matched?: Array<{ path: string; title?: string }>
  [key: string]: unknown
}

/**
 * 标签页条目。
 *
 * path 使用 fullPath（含 query），同一个菜单在不同参数下视为不同标签页，
 * 这也是原实现的行为。
 */
export interface TabItem {
  /** fullPath，标签页唯一键 */
  path: string
  title: string
  /** 固定标签页不可关闭 */
  affix?: boolean
  /** 是否进入 keep-alive 缓存 */
  keepAlive?: boolean
  meta?: MenuMeta
}
