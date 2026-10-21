import type { App } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import VxeUI from 'vxe-pc-ui'
import VXETable from 'vxe-table'
import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx'
import ExcelJS from 'exceljs'
import ECharts from 'vue-echarts'

/** 第三方 UI 库只在这里注册，main.ts 不再堆叠插件细节。 */
export function installUiPlugins(app: App) {
  VXETable.setConfig({ select: { transfer: true } })
  VXETable.use(VXETablePluginExportXLSX, { ExcelJS })

  app.use(ElementPlus, { locale: zhCn, size: 'small' })
  // vxe-pc-ui 提供 vxe-modal / vxe-button 等基础组件，vxe-table 只含表格四大件。
  app.use(VxeUI).use(VXETable)
  app.component('v-chart', ECharts)
}
