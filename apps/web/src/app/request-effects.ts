import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { setUnauthorizedHandler } from '@/service/http'
import { setRequestLoadingHandler } from '@/service/request-loading'
import { useShellStore } from '@/store/modules/shell'

/** 在 pinia 安装后、router 启动前连接传输层与应用界面。 */
export function installRequestEffects(router: Router, pinia: Pinia): () => void {
  let redirecting = false
  let pending = 0
  const shell = useShellStore(pinia)
  const removeUnauthorized = setUnauthorizedHandler(() => {
    if (redirecting || router.currentRoute.value.path === '/login') return
    redirecting = true
    void router
      .replace('/login')
      .catch((error: unknown) => {
        console.error('[session] 无法跳转登录页', error)
      })
      .finally(() => {
        redirecting = false
      })
  })
  const removeLoading = setRequestLoadingHandler(() => {
    pending += 1
    shell.showLoading()
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      pending -= 1
      if (pending === 0) shell.hideLoading()
    }
  })
  return () => {
    removeUnauthorized()
    removeLoading()
  }
}
