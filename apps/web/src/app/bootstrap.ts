import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import baseService from '@/service/baseService'
import { usePreferencesStore } from '@/store'
import { installDirectives } from '@/directives'
import { installUiPlugins } from './plugins'

// 全局副作用样式与图标注册集中在这里，业务组件不再各自 import 全局资源。
// Vendor CSS loads first so the design tokens can own the final cascade.
import 'virtual:svg-icons/register'
import '@/assets/icons/iconfont/iconfont.js'
import 'element-plus/theme-chalk/index.css'
import 'element-plus/theme-chalk/display.css'
import 'driver.js/dist/driver.css'
import 'nprogress/nprogress.css'
import '@/styles/tokens.css'
import '@/styles/tailwind.css'
import '@/styles/index.less'
import '@/styles/driver.less'

/**
 * 应用启动顺序：
 * 1. pinia（路由守卫与指令安装都依赖 store）
 * 2. 主题色（首屏「正在载入工作区」遮罩在第一帧就要取品牌色变量）
 * 3. 全局指令
 * 4. UI 库
 * 5. router（守卫内部会开始拉菜单）
 */
export function bootstrapApp() {
  const app = createApp(App)
  app.config.globalProperties.$baseService = baseService

  const pinia = createPinia()
  app.use(pinia)
  // 必须早于 mount：换成靛蓝/绛红等品牌色后，遮罩不能再用 tokens.css 里的深青兜底。
  usePreferencesStore(pinia).applyTheme()
  installDirectives(app)
  installUiPlugins(app)
  app.use(router)
  app.mount('#app')
}
