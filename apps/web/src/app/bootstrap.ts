import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import baseService from '@/service/baseService'
import { installDirectives } from '@/directives'
import { installUiPlugins } from './plugins'

// 全局副作用样式与图标注册集中在这里，业务组件不再各自 import 全局资源。
// Vendor CSS loads first so the design tokens can own the final cascade.
import 'virtual:svg-icons/register'
import '@/assets/icons/iconfont/iconfont.js'
import 'element-plus/theme-chalk/index.css'
import 'element-plus/theme-chalk/display.css'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'
import 'driver.js/dist/driver.css'
import 'nprogress/nprogress.css'
import '@/styles/tokens.css'
import '@/styles/tailwind.css'
import '@/styles/index.less'
import '@/styles/driver.less'

/**
 * 应用启动顺序：
 * 1. pinia（路由守卫与指令安装都依赖 store）
 * 2. 全局指令
 * 3. UI 库
 * 4. router（守卫内部会开始拉菜单）
 */
export function bootstrapApp() {
  const app = createApp(App)
  app.config.globalProperties.$baseService = baseService

  app.use(createPinia())
  installDirectives(app)
  installUiPlugins(app)
  app.use(router)
  app.mount('#app')
}
