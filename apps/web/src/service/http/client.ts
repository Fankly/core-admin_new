import appConfig from '@/config/app'
import { CacheToken, Permissions } from '@/constants/cacheKey'
import { getToken, removeCache } from '@/utils/cache'
import { createHttpClient } from './transport'

let unauthorizedHandler: (() => void) | undefined

/** 应用组装层注入导航副作用，API 模块本身不再加载整个路由和视图树。 */
export function setUnauthorizedHandler(handler: () => void): () => void {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = undefined
  }
}

const { client, request } = createHttpClient({
  baseURL: appConfig.api,
  timeout: appConfig.requestTimeout,
  getToken,
  onUnauthorized() {
    removeCache(CacheToken, true)
    removeCache(Permissions, true)
    unauthorizedHandler?.()
  }
})

export { client }
export default request
