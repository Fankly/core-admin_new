import type { App } from 'vue'
import VxeUI from 'vxe-pc-ui'
import VXETable from 'vxe-table'
import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx'
import ExcelJS from 'exceljs'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'

export function installWorkspacePlugins(app: App) {
  VXETable.setConfig({ select: { transfer: true } })
  VXETable.use(VXETablePluginExportXLSX, { ExcelJS })
  app.use(VxeUI).use(VXETable)
}
