import '@/assets/icons/iconfont/iconfont.js'
import '@/assets/styles/tailwind.css'
import ElementPlus from 'element-plus'
import { ElMessageBoxShortcutMethod } from 'element-plus/lib/el-message-box/src/message-box.type'
import { IMessage } from 'element-plus/lib/el-message/src/types'
import 'element-plus/lib/theme-chalk/display.css'
import 'element-plus/lib/theme-chalk/index.css'
import Sortable from 'sortablejs'
import 'vite-plugin-svg-icons/register'
import { createApp } from 'vue'
import { Store } from 'vuex'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'
import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx'
import ExcelJS from 'exceljs'
import 'xe-utils'
import App from './App.vue'
import { IObject } from './types/interface'
import router from './router'
import store from './store'
import baseService from '@/service/baseService'
import '@/assets/css/element.scss'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'

import plugin from '@/utils/plugin'
import 'echarts-liquidfill'
import 'echarts'
import ECharts from 'vue-echarts'

import 'driver.js/dist/driver.css'
import '@/assets/css/driver.less'
import appConfig from '@/utils/appConfig'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * vuex存储库
     */
    $store: Store<IObject>
    /**
     * ref引用
     */
    $refs: any
    /**
     * element-plus消息方法
     */
    $message: IMessage
    /**
     * element-plus弹窗确认
     */
    $confirm: ElMessageBoxShortcutMethod
    /**
     * element-plus弹窗
     */
    $alert: ElMessageBoxShortcutMethod
    /**
     * vue3 v-model绑定默认字段名称
     */
    modelValue: any
    /**
     * sortablejs组件
     */
    sortable: Sortable
  }
}
VXETable.setConfig({
  select: {
    transfer: true
  }
})
VXETable.setIcon({
  TABLE_TREE_LOADED: 'el-icon-loading',
  TABLE_TREE_OPEN: 'el-icon-arrow-down',
  TABLE_TREE_CLOSE: 'el-icon-arrow-right',
  SELECT_OPEN: 'el-icon-arrow-up',
  SELECT_CLOSE: 'el-icon-arrow-down'
})
VXETable.use(VXETablePluginExportXLSX, {
  ExcelJS
})

async function bootstrap() {
  // await appConfig.load()
  const app = createApp(App)
  app.config.globalProperties.$baseService = baseService

  /**
   * 引用plugin 自定义指令文件
   */
  plugin(app)

  app
    // .use(Base64)
    .use(store)
    .use(router)
    .use(ElementPlus, { locale: zhCn, size: 'small' })
    .use(VXETable)
    .component('v-chart', ECharts)
    .mount('#app')
}

bootstrap()
