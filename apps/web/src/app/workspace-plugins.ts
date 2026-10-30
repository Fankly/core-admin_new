import type { App } from 'vue'
import VxeUI from 'vxe-pc-ui'
import VXETable from 'vxe-table'
import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx'
import ExcelJS from 'exceljs'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'
import AutoImport from '@/components/AutoImport'
import httpUtil from '@/core/http'
import globalMixin from '@/core/mixins/global'
import * as dictionaries from '@/staticDict'
import businessStore from '@/store/business'
import { useShellStore } from '@/store'
import emits from '@/utils/emits'

export function installWorkspacePlugins(app: App) {
  VXETable.setConfig({ select: { transfer: true } })
  VXETable.use(VXETablePluginExportXLSX, { ExcelJS })
  app.use(VxeUI).use(VXETable)
  app.use(AutoImport)
  app.config.globalProperties.$store = businessStore
  Object.assign(app.config.globalProperties, {
    doUrl: httpUtil.doUrl,
    upload: httpUtil.fetchUpload,
    download: httpUtil.fetchDownload,
    downloadFileName: httpUtil.fetchDownloadFileName,
    loadingManager: httpUtil.loadingManager,
    ...dictionaries
  })
  app.mixin(globalMixin)
  emits.on('isMainPageRole', (value) => useShellStore().setMainPageRole(Boolean(value)))
}
