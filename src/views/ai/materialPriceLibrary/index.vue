<template>
  <div class="material-price-tabs-page">
    <el-tabs v-if="isShowPage" v-model="activeTab" class="material-price-tabs">
      <el-tab-pane v-if="visibleTabs.includes('historyPrice')" label="历史项目领用物料单价" name="historyPrice">
        <HistoryPrice v-if="historyPriceMounted" :shared-user-info="roleUserInfo" :pop-mode="isPopMode" />
      </el-tab-pane>
      <el-tab-pane v-if="visibleTabs.includes('xmMaterialRefPrice')" label="国网公司价格库参考价" name="xmMaterialRefPrice">
        <XmMaterialRefPrice v-if="xmMaterialRefPriceMounted" :shared-user-info="roleUserInfo" :pop-mode="isPopMode" />
      </el-tab-pane>
      <el-tab-pane v-if="visibleTabs.includes('materialPriceLibrary')" label="国网参考采购价格" name="materialPriceLibrary">
        <div
          class="list-card"
          v-loading="importing"
          element-loading-text="正在导入物料价格数据，请勿关闭或刷新页面…"
          element-loading-background="rgba(255, 255, 255, 0.78)"
        >
          <RangeVxeTable
            ref="tableRef"
            class="mpl-vxe-table"
            stripe
            row-key="id"
            row-click-mode="exclusive"
            :border="true"
            :pagination="true"
            :request-auto="true"
            :request-api="getPageList"
            :data-callback="callBackHandle"
            :columns="tableColumns"
            :search-columns="searchColumns"
            :search-col="4"
            :tool-button="['setting', 'search', 'help']"
            :loading="loading"
            @reset="clearSelection"
          >
            <template #tableHeader>
              <div class="material-price-library__actions">
                <el-upload
                  v-if="!isPopMode"
                  class="material-price-library__upload"
                  action="#"
                  :show-file-list="false"
                  accept=".xls,.xlsx"
                  :http-request="handleImport"
                  :disabled="importing"
                >
                  <el-button size="mini" type="primary" :disabled="importing">导 入</el-button>
                </el-upload>
                <el-button size="mini" type="primary" :disabled="importing" @click="handleExport">导 出</el-button>
              </div>
            </template>
          </RangeVxeTable>
        </div>
      </el-tab-pane>
      <el-tab-pane v-if="visibleTabs.includes('priceQuery')" label="历史项目申报价格" name="priceQuery">
        <PriceQuery v-if="priceQueryMounted" :shared-user-info="roleUserInfo" :pop-mode="isPopMode" />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/ai/materialPriceLibrary/index">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import PriceQuery from '@/views/ai/priceQuery/index.vue'
import HistoryPrice from '@/views/ai/materialPriceLibrary/historyPrice/index.vue'
import XmMaterialRefPrice from '@/views/ai/xmMaterialRefPrice/index.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import { exportMaterialPriceLibrary, getMaterialPriceLibraryPage, importMaterialPriceLibrary } from '@/api/ai/materialPriceLibrary'

const activeTab = ref('historyPrice')
const priceQueryMounted = ref(false)
const historyPriceMounted = ref(true)
const xmMaterialRefPriceMounted = ref(false)
const isShowPage = ref(false),
  roleUserInfo = ref<Record<string, any>>({}),
  loading = ref(false),
  importing = ref(false),
  tableRef = ref<any>(),
  userDialogRef = ref(),
  queryParams = ref<any>({})

const route = useRoute()

// 支持通过路由 query 指定初始 tab（由 smartTaskAudit / workbenchView 跳转时传入）
const queryTab = route.query.tab
if (queryTab === 'materialPriceLibrary' || queryTab === 'historyPrice' || queryTab === 'priceQuery' || queryTab === 'xmMaterialRefPrice') {
  activeTab.value = queryTab
  if (queryTab === 'priceQuery') priceQueryMounted.value = true
  if (queryTab === 'historyPrice') historyPriceMounted.value = true
  if (queryTab === 'xmMaterialRefPrice') xmMaterialRefPriceMounted.value = true
}

// pop 模式（由 workbenchView 新标签页打开）：只展示目标 tab，按钮只保留导出
const isPopMode = computed(() => route.query.pop === 'true')
const visibleTabs = computed(() => {
  if (!isPopMode.value) return ['historyPrice', 'xmMaterialRefPrice', 'materialPriceLibrary', 'priceQuery']
  const tab = route.query.tab
  return tab ? [String(tab)] : ['historyPrice', 'xmMaterialRefPrice', 'materialPriceLibrary', 'priceQuery']
})

watch(activeTab, (value) => {
  if (value === 'priceQuery') priceQueryMounted.value = true
  if (value === 'historyPrice') historyPriceMounted.value = true
  if (value === 'xmMaterialRefPrice') xmMaterialRefPriceMounted.value = true
})

const clearSelection = () => tableRef.value?.clearSelection()
const getPageList = (params: any) => {
  loading.value = true
  queryParams.value = {
    ...params,
    materialCodeList: params.materialCode
      ? params.materialCode
          .split(',')
          .map((v: string) => v.trim())
          .filter(Boolean)
      : []
  }
  return getMaterialPriceLibraryPage(queryParams.value).finally(() => {
    loading.value = false
  })
}
const callBackHandle = (data: any) => {
  loading.value = false
  return data
}
const handleImport = async (options: any) => {
  const data = new FormData()
  data.append('file', options.file)
  importing.value = true
  try {
    const res = await importMaterialPriceLibrary(data)
    if (!res.success) return ElMessage.error(res.msg || '导入失败')
    ElMessage.success(res.data || '导入成功')
    tableRef.value?.getTableList()
  } catch (e) {
    ElMessage.error((e as Error).message || '导入失败')
  } finally {
    importing.value = false
  }
}
const handleExport = () => apiExportHandle({ ...queryParams.value }, '物料价格库', exportMaterialPriceLibrary)
const getRoleHandle = () => {
  if (!userDialogRef.value?.isQuery) return
  roleUserInfo.value = { ...(userDialogRef.value?.userMsg || {}) }
  isShowPage.value = true
}
onMounted(async () => {
  await userDialogRef.value?.getUser()
})

/** vxe-grid 列 */
const tableColumns = reactive<VxeGridProps['columns']>([
  { type: 'seq', title: '序号', width: 60 },
  { field: 'materialCode', title: '物料编码', minWidth: 220, align: 'center', headerAlign: 'center' },
  { field: 'materialDescription', title: '物料描述', width: 400 },
  { field: 'measurementUnit', title: '计量单位', minWidth: 120, align: 'center', headerAlign: 'center' },
  {
    field: 'purchasePrice',
    title: '采购价格(元)',
    minWidth: 180,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => (cellValue == null ? '-' : formatNumValue(String(cellValue), 2))
  },
  {
    field: 'priceFloatPercent',
    title: '价格浮动百分比',
    minWidth: 180,
    align: 'center',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => {
      if (cellValue == null || cellValue === '') return '-'
      return `${formatNumValue(String(Number(cellValue) * 100), 2)}%`
    }
  },
  { field: 'updateDate', title: '下发日期', minWidth: 130, align: 'center', headerAlign: 'center' },
  { field: 'updateTime', title: '下发时间', minWidth: 160, align: 'center', headerAlign: 'center' }
])

/** SearchForm 搜索列 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'materialCode',
    label: '物料编码',
    search: {
      order: 1,
      render: ReMultipleText as any,
      props: { class: 'mpl-search-input', placeholder: '请输入物料编码，多个用逗号分隔' }
    }
  },
  {
    prop: 'materialDescription',
    label: '物料描述',
    search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入物料描述' } }
  }
])
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>

<style lang="less">
/* vxe showOverflow 浮层渲染在 body 下，需全局样式覆盖为 ReText 青绿 tooltip 风格。
   覆盖本模块三个 tab（historyPrice / materialPriceLibrary / priceQuery）的表格溢出提示。 */
.vxe-table--tooltip-wrapper,
.vxe-table--tooltip-wrapper.theme--light,
.vxe-table--tooltip-wrapper.theme--dark {
  max-width: min(360px, 42vw) !important;
  padding: 10px 12px !important;
  color: #475569 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.55 !important;
  word-break: break-word !important;
  white-space: pre-wrap !important;
  background: #f7fdfd !important;
  border: 1px solid #b8ddd9 !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 20px rgba(0, 112, 107, 0.12), 0 2px 6px rgba(0, 112, 107, 0.06) !important;
}
</style>
