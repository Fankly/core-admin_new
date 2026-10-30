<!-- 历史项目领用物料汇总 -->
<template>
  <div class="list-card" v-if="isShowPage">
    <RangeVxeTable
      ref="tableRef"
      class="hps-vxe-table"
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
      @reset="resetHandle"
    >
      <template #tableHeader>
        <div class="material-price-library__actions">
          <el-button size="small" type="primary" :loading="exporting" @click="handleExport">导 出</el-button>
        </div>
      </template>
      <!-- pop 模式（workbenchView / smartTaskAudit 跳转打开）只展示单价，不穿透明细 -->
      <template #newestUnitPrice_default="{ row }">
        <span v-if="!hasPrice(row.newestUnitPrice)">-</span>
        <span v-else-if="popMode || !isClick">{{ formatPrice(row.newestUnitPrice) }}</span>
        <span v-else class="hps-price-link" @click="openDetail(row, 0)">{{ formatPrice(row.newestUnitPrice) }}</span>
      </template>
      <template #minUnitPrice_default="{ row }">
        <span v-if="!hasPrice(row.minUnitPrice)">-</span>
        <span v-else-if="popMode || !isClick">{{ formatPrice(row.minUnitPrice) }}</span>
        <span v-else class="hps-price-link" @click="openDetail(row, 1)">{{ formatPrice(row.minUnitPrice) }}</span>
      </template>
      <template #maxUnitPrice_default="{ row }">
        <span v-if="!hasPrice(row.maxUnitPrice)">-</span>
        <span v-else-if="popMode || !isClick">{{ formatPrice(row.maxUnitPrice) }}</span>
        <span v-else class="hps-price-link" @click="openDetail(row, 2)">{{ formatPrice(row.maxUnitPrice) }}</span>
      </template>
    </RangeVxeTable>
    <PriceDetailDialog
      v-if="!popMode"
      v-model="detailVisible"
      :matnr="detailRow.matnr"
      :maktx="detailRow.maktx"
      :unit-price-type="detailRow.unitPriceType"
    />
  </div>
  <userDialog v-if="!hasSharedPermission" ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts">
defineOptions({ name: "/ai/materialPriceLibrary/historyPriceSummary/index" })
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from '@/store/business'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import { exportDataNew, getPageNew } from '@/api/ai/materialPriceLibrary'
import PriceDetailDialog from './PriceDetailDialog.vue'

const props = defineProps<{
  sharedUserInfo?: Record<string, any>
  popMode?: boolean
  isClick?: boolean
}>()

// ========== 响应式状态 ==========
const userDialogRef = ref()
const tableRef = ref<any>(null)
const isShowPage = ref(false)
const loading = ref(false)
const exporting = ref(false)
const hasSharedPermission = computed(() => Boolean(props.sharedUserInfo))
const userInfo = ref<any>(props.sharedUserInfo ? { ...props.sharedUserInfo } : undefined)
const store = useStore()
const queryParams = ref<any>({})

// ========== 明细弹窗 ==========
const detailVisible = ref(false)
const detailRow = reactive<{ matnr: string; maktx: string; unitPriceType: number }>({
  matnr: '',
  maktx: '',
  unitPriceType: 0
})

const openDetail = (row: any, unitPriceType: number) => {
  detailRow.matnr = row.matnr
  detailRow.maktx = row.maktx
  detailRow.unitPriceType = unitPriceType
  detailVisible.value = true
}

// ========== 表格相关 ==========
const resetHandle = () => tableRef.value?.clearSelection()

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (param: any) => {
  loading.value = true
  queryParams.value = {
    ...param,
    userId: store.getters.getUserMsg.id,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    roleId: userInfo.value.role_id,
    roleCode: userInfo.value.code
  }
  queryParams.value.matnrList = param.matnr
    ? param.matnr
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean)
    : []
  queryParams.value.pspidList = param.pspid
    ? param.pspid
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean)
    : []
  return getPageNew(queryParams.value).finally(() => {
    loading.value = false
  })
}

// 导出
const handleExport = async () => {
  exporting.value = true
  try {
    await apiExportHandle({ ...queryParams.value }, '历史项目领用物料汇总', exportDataNew)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// ========== 价格单元格渲染辅助 ==========
const hasPrice = (val: any) => val !== null && val !== undefined && val !== ''
const formatPrice = (val: any) => formatNumValue(String(val), 2)

// ========== 角色权限 ==========
const getRoleHandle = () => {
  if (!userDialogRef.value?.isQuery) return
  userInfo.value = { ...(userDialogRef.value?.userMsg || {}) }
  isShowPage.value = true
}

// ========== 生命周期 ==========
onMounted(async () => {
  if (hasSharedPermission.value) {
    isShowPage.value = true
    return
  }
  await userDialogRef.value?.getUser()
})

/** vxe-grid 列 */
const tableColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'seq', title: '序号', width: 60 },
  { field: 'matnr', title: '物料编码', align: 'center', headerAlign: 'center' },
  { field: 'maktx', title: '物料描述' },
  { field: 'unit', title: '计量单位', width: 120, align: 'center', headerAlign: 'center' },
  {
    field: 'newestUnitPrice',
    title: '当前最新领料单价(元)',
    width: 180,
    align: 'right',
    headerAlign: 'center',
    slots: { default: 'newestUnitPrice_default' }
  },
  {
    field: 'minUnitPrice',
    title: '年度最低领料单价(元)',
    width: 180,
    align: 'right',
    headerAlign: 'center',
    slots: { default: 'minUnitPrice_default' }
  },
  {
    field: 'maxUnitPrice',
    title: '年度最高领料单价(元)',
    width: 180,
    align: 'right',
    headerAlign: 'center',
    slots: { default: 'maxUnitPrice_default' }
  }
])

/** SearchForm 搜索列 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'matnr',
    label: '物料编码',
    search: {
      order: 1,
      render: ReMultipleText as any,
      props: { class: 'hps-search-input', placeholder: '请输入物料编码，多个用逗号分隔' }
    }
  },
  {
    prop: 'maktx',
    label: '物料描述',
    search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入物料描述' } }
  },
  {
    prop: 'pspid',
    label: '项目定义',
    search: {
      order: 3,
      render: ReMultipleText as any,
      props: { class: 'hpl-search-input', placeholder: '请输入项目定义，多个用逗号分隔' }
    }
  },
  {
    prop: 'post1',
    label: '项目描述',
    search: { el: 'input', order: 4, props: { clearable: true, placeholder: '请输入项目描述' } }
  }
])
</script>

<style scoped lang="less">
@import '../css/index.less';

.hps-price-link {
  color: var(--color-primary, #00706b);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}
</style>
