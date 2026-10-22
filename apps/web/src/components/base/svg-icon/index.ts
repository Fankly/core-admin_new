import type { App, Plugin } from 'vue'
import SvgIcon from './index.vue'

export default Object.assign(SvgIcon, {
  install(app: App) {
    app.component('SvgIcon', SvgIcon)
  }
}) satisfies typeof SvgIcon & Plugin
