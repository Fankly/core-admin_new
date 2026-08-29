import { EMitt, ESidebarLayoutEnum } from '@/constants/enum'
import { IObject } from '@/types/interface'
import mitt from 'mitt'

/**
 * tab标签页条目，OnPushMenuToTabs 的载荷
 */
export interface IMittTabRoute {
  label: any
  value: string
  mete: IObject
}

/**
 * 事件总线的事件表。载荷类型含 undefined 的事件允许不传参数 emit。
 * 用 type 而不是 interface：mitt 的约束是 `Record<EventType, unknown>`，
 * 只有类型别名的对象字面量才会拿到隐式索引签名，interface 不会。
 */
export type IMittEvents = {
  [EMitt.OnLoading]: boolean
  [EMitt.OnSwitchLeftSidebar]: undefined
  [EMitt.OnPushMenuToTabs]: IMittTabRoute
  /** [主题配置key, 对应的class后缀] */
  [EMitt.OnSetTheme]: [string, string]
  [EMitt.OnSetThemeNotUniqueOpened]: boolean
  [EMitt.OnSetThemeTabsPage]: boolean
  [EMitt.OnSetNavLayout]: ESidebarLayoutEnum
  [EMitt.OnReloadTabPage]: undefined
  [EMitt.OnMobileOpenSidebar]: undefined
  [EMitt.OnSelectHeaderNavMenusByMixNav]: string
  [EMitt.OnCloseCurrTab]: undefined
  /** 切换用户角色后主页是否有权限，UserRoleSelector 通知 home.vue */
  isMainPageRole: boolean
}

/**
 * 事件总线
 */
export default mitt<IMittEvents>()
