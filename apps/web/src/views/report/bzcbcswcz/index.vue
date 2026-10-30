<template>
  <div class="bzcbcswcz-tabs-page">
    <el-tabs v-if="isShowPage" v-model="activeTab" class="bzcbcswcz-tabs">
      <el-tab-pane label="标准成本测算完成值" name="bzcbcxWcz">
        <div class="list-card">
          <RangeVxeTable
            ref="wczTableRef"
            class="bzcbcx-wcz-vxe-table"
            stripe
            row-key="id"
            row-click-mode="exclusive"
            :border="true"
            :pagination="true"
            :request-auto="false"
            :request-api="getWczPageList"
            :data-callback="wczCallBackHandle"
            :columns="wczColumns"
            :search-columns="wczSearchColumns"
            :search-col="4"
            :tool-button="['setting', 'search', 'help']"
            :loading="wczLoading"
            @search="wczSearchHandle"
            @reset="wczResetHandle"
          >
            <template #tableHeader>
              <div class="bzcbcswcz__actions">
                <el-button size="small" type="primary" :loading="wczExporting" @click="handleWczExport">导 出</el-button>
              </div>
            </template>
          </RangeVxeTable>
        </div>
      </el-tab-pane>
      <el-tab-pane label="标准成本差异项目完成值" name="bzcbcxXmwcz">
        <div class="list-card">
          <RangeVxeTable
            ref="xmwczTableRef"
            class="bzcbcx-xmwcz-vxe-table"
            stripe
            row-key="id"
            row-click-mode="exclusive"
            :border="true"
            :pagination="true"
            :request-auto="false"
            :request-api="getXmwczPageList"
            :data-callback="xmwczCallBackHandle"
            :columns="xmwczColumns"
            :search-columns="xmwczSearchColumns"
            :search-col="4"
            :tool-button="['setting', 'search', 'help']"
            :loading="xmwczLoading"
            @search="xmwczSearchHandle"
            @reset="xmwczResetHandle"
          >
            <template #tableHeader>
              <div class="bzcbcswcz__actions">
                <el-button size="small" type="primary" :loading="xmwczExporting" @click="handleXmwczExport">导 出</el-button>
              </div>
            </template>
          </RangeVxeTable>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts">
defineOptions({ name: "/report/bzcbcswcz/index" })
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from '@/store/business'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import { bzcbcxWczExportExcel, bzcbcxWczGetPage, bzcbcxXmwczExportExcel, bzcbcxXmwczGetPage } from '@/api/report/bzcbwcz'

// ========== 响应式状态 ==========
const activeTab = ref('bzcbcxWcz')
const isShowPage = ref(false)
const roleUserInfo = ref<Record<string, any>>({})
const userDialogRef = ref()
const store = useStore()

// 标准成本测算完成值
const wczTableRef = ref<any>(null)
const wczLoading = ref(false)
const wczExporting = ref(false)
const wczQueryParams = ref<any>({})

// 标准成本差异项目完成值
const xmwczTableRef = ref<any>(null)
const xmwczLoading = ref(false)
const xmwczExporting = ref(false)
const xmwczQueryParams = ref<any>({})

// ========== 通用：金额六位小数格式化 ==========
const formatAmount = (cellValue: any) => (cellValue == null || cellValue === '' ? '-' : formatNumValue(String(cellValue), 6))

// 月度字典：{ name: '1月', code: '001' } ... { name: '12月', code: '012' }
const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  return { name: `${m}月`, code: String(m).padStart(3, '0') }
})

// ========== 标准成本测算完成值 ==========
const wczSearchHandle = () => {
  wczTableRef.value?.clearSelection()
}
const wczResetHandle = () => {
  wczTableRef.value?.clearSelection()
  wczLoading.value = false
}
const wczCallBackHandle = (data: any) => {
  wczLoading.value = false
  return data
}
const getWczPageList = (params: any) => {
  wczLoading.value = true
  wczQueryParams.value = {
    ...params,
    yd: (params?.yd || []).join(','),
    current: params['page'],
    size: params['limit']
  }
  return bzcbcxWczGetPage(wczQueryParams.value).finally(() => {
    wczLoading.value = false
  })
}
const handleWczExport = async () => {
  const total = wczTableRef.value?.pageable?.total ?? 0
  if (total > 50000) {
    ElMessage.warning('数据超过5万条，不允许导出，请缩小查询范围后重试！')
    return
  }
  wczExporting.value = true
  try {
    await apiExportHandle({ ...wczQueryParams.value }, '标准成本测算完成值', bzcbcxWczExportExcel)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    wczExporting.value = false
  }
}

// ========== 标准成本差异项目完成值 ==========
const xmwczSearchHandle = () => {
  xmwczTableRef.value?.clearSelection()
}
const xmwczResetHandle = () => {
  xmwczTableRef.value?.clearSelection()
  xmwczLoading.value = false
}
const xmwczCallBackHandle = (data: any) => {
  xmwczLoading.value = false
  return data
}
const getXmwczPageList = (params: any) => {
  xmwczLoading.value = true
  xmwczQueryParams.value = {
    ...params,
    yd: (params?.yd || []).join(','),
    current: params['page'],
    size: params['limit']
  }
  return bzcbcxXmwczGetPage(xmwczQueryParams.value).finally(() => {
    xmwczLoading.value = false
  })
}
const handleXmwczExport = async () => {
  const total = xmwczTableRef.value?.pageable?.total ?? 0
  if (total > 50000) {
    ElMessage.warning('数据超过5万条，不允许导出，请缩小查询范围后重试！')
    return
  }
  xmwczExporting.value = true
  try {
    await apiExportHandle({ ...xmwczQueryParams.value }, '标准成本差异项目完成值', bzcbcxXmwczExportExcel)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    xmwczExporting.value = false
  }
}

// ========== 角色权限 ==========
const getRoleHandle = () => {
  if (!userDialogRef.value?.isQuery) return
  roleUserInfo.value = { ...(userDialogRef.value?.userMsg || {}) }
  isShowPage.value = true
  // 首屏自动拉数（与 ThreeRates 等 report 页一致）
  // nextTick(() => {
  //   wczTableRef.value?.getTableList()
  //   xmwczTableRef.value?.getTableList()
  // })
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})

/** vxe-grid 列 - 标准成本测算完成值 */
const wczColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'seq', title: '序号', width: 60, align: 'center', headerAlign: 'center' },
  { field: 'cnx', title: '承诺项编码', minWidth: 160, align: 'center', headerAlign: 'center' },
  { field: 'nd', title: '年度', minWidth: 100, align: 'center', headerAlign: 'center' },
  { field: 'yd', title: '月度', minWidth: 100, align: 'center', headerAlign: 'center' },
  { field: 'yjdw', title: '一级单位', minWidth: 160, align: 'center', headerAlign: 'center' },
  { field: 'ejdw', title: '二级单位', minWidth: 160, align: 'center', headerAlign: 'center' },
  { field: 'cbzx', title: '成本中心', minWidth: 160, align: 'center', headerAlign: 'center' },
  {
    field: 'ysje',
    title: '预算金额(万元)',
    minWidth: 180,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ row }: any) => formatAmount(row.ysje)
  },
  {
    field: 'ysjeFee',
    title: '预算金额不含税(万元)',
    minWidth: 200,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ row }: any) => formatAmount(row.ysjeFee)
  }
])

/** vxe-grid 列 - 标准成本差异项目完成值 */
const xmwczColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'seq', title: '序号', width: 60, align: 'center', headerAlign: 'center' },
  { field: 'cnx', title: '承诺项编码', minWidth: 160, align: 'center', headerAlign: 'center' },
  { field: 'nd', title: '年度', minWidth: 100, align: 'center', headerAlign: 'center' },
  { field: 'yd', title: '月度', minWidth: 100, align: 'center', headerAlign: 'center' },
  { field: 'yjdw', title: '一级单位', minWidth: 160, align: 'center', headerAlign: 'center' },
  { field: 'ejdw', title: '二级单位', minWidth: 160, align: 'center', headerAlign: 'center' },
  { field: 'cbzx', title: '成本中心', minWidth: 160, align: 'center', headerAlign: 'center' },
  {
    field: 'jsje',
    title: '预算金额(万元)',
    minWidth: 180,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ row }: any) => formatAmount(row.ysje)
  }
])

// 当年年度（年度搜索项默认值）
const currentYear = String(new Date().getFullYear())

/** SearchForm 搜索列 - 标准成本测算完成值 */
const wczSearchColumns = reactive<ColumnProps[]>([
  {
    prop: 'nd',
    label: '年度',
    search: { el: 'date-picker', order: 1, defaultValue: currentYear, props: { type: 'year', valueFormat: 'YYYY', clearable: false } }
  },
  {
    prop: 'yd',
    label: '月度',
    enum: monthOptions,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true, clearable: true, placeholder: '请选择月度' } }
  }
])

/** SearchForm 搜索列 - 标准成本差异项目完成值 */
const xmwczSearchColumns = reactive<ColumnProps[]>([
  {
    prop: 'nd',
    label: '年度',
    search: { el: 'date-picker', order: 1, defaultValue: currentYear, props: { type: 'year', valueFormat: 'YYYY', clearable: false } }
  },
  {
    prop: 'yd',
    label: '月度',
    enum: monthOptions,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true, clearable: true, placeholder: '请选择月度' } }
  }
])
</script>

<style scoped lang="less">
.bzcbcswcz-tabs-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;

  .bzcbcswcz-tabs {
    display: flex;
    flex-direction: column;
    height: 100%;

    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
    }

    .el-tab-pane {
      height: 100%;
    }
  }

  .list-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .bzcbcswcz__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;
  }
}
</style>
