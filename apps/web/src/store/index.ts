/**
 * 领域 store 统一出口。
 *
 * 旧的扁平 `useAppStore` 已拆成 session / menu / tabs / shell / preferences / context / favorites
 * 七个域。页面按需取用，避免一个 store 既管用户、又管路由、又管标签页。
 */
export { useSessionStore } from './modules/session'
export { useMenuStore } from './modules/menu'
export { useTabsStore } from './modules/tabs'
export { useShellStore } from './modules/shell'
export { usePreferencesStore } from './modules/preferences'
export { useContextStore } from './modules/context'
export { useFavoritesStore } from './modules/favorites'
