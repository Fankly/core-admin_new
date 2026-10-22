import type { App } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { defineAsyncComponent } from 'vue'

let workspaceApp: App | undefined
let workspacePending: Promise<void> | undefined

/** 第三方 UI 库只在这里注册，main.ts 不再堆叠插件细节。 */
export function installUiPlugins(app: App) {
  workspaceApp = app
  app.use(ElementPlus, { locale: zhCn, size: 'small' })
  app.component(
    'v-chart',
    defineAsyncComponent(() => import('vue-echarts'))
  )
}

/** Load the table stack only when entering an authenticated workspace. */
export function loadWorkspacePlugins(): Promise<void> {
  if (workspacePending) return workspacePending
  const app = workspaceApp
  if (!app) return Promise.resolve()
  workspacePending = import('./workspace-plugins')
    .then(({ installWorkspacePlugins }) => {
      installWorkspacePlugins(app)
    })
    .catch((error: unknown) => {
      workspacePending = undefined
      throw error
    })
  return workspacePending
}
