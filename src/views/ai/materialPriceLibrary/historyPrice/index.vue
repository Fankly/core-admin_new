<!-- 历史项目领用物料单价 -->
<template>
  <div class="list-card" v-if="isShowPage">
    <RangeVxeTable
      ref="tableRef"
      class="hpl-vxe-table"
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
          <el-button v-if="!popMode" size="mini" type="primary" :loading="syncing" @click="handleSync">同步数据</el-button>
          <el-button size="mini" type="primary" :loading="exporting" @click="handleExport">导 出</el-button>
        </div>
      </template>
    </RangeVxeTable>
  </div>
  <userDialog v-if="!hasSharedPermission" ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/ai/materialPriceLibrary/historyPrice/index">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStore } from 'vuex'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import { getPublicData } from '@/api/common'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import { exportMaterialPriceHistory, getMaterialPriceHistoryPage, syncMaterialPriceHistory } from '@/api/ai/materialPriceLibrary'

const props = defineProps<{
  sharedUserInfo?: Record<string, any>
  popMode?: boolean
}>()

// ========== 响应式状态 ==========
const userDialogRef = ref()
const tableRef = ref<any>(null)
const isShowPage = ref(false)
const loading = ref(false)
const syncing = ref(false)
const exporting = ref(false)
const hasSharedPermission = computed(() => Boolean(props.sharedUserInfo))
const userInfo = ref<any>(props.sharedUserInfo ? { ...props.sharedUserInfo } : undefined)
const store = useStore()
const queryParams = ref<any>({})

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
  queryParams.value.mblnrList = param.mblnr
    ? param.mblnr
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean)
    : []
  return getMaterialPriceHistoryPage(queryParams.value).finally(() => {
    loading.value = false
  })
}

// 导出
const handleExport = async () => {
  exporting.value = true
  try {
    await apiExportHandle({ ...queryParams.value }, '历史项目领用物料单价', exportMaterialPriceHistory)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// 同步数据（二次确认 + 调用 syncData + 成功提示）
const handleSync = async () => {
  try {
    await ElMessageBox.confirm('确定要同步物料历史价格数据吗？同步期间请勿重复操作。', '同步确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  syncing.value = true
  try {
    const res: any = await syncMaterialPriceHistory()
    if (!res.success) return ElMessage.error(res.msg || '同步失败')
    ElMessage.success(res.data || '同步成功')
    tableRef.value?.getTableList()
  } catch (e) {
    ElMessage.error((e as Error).message || '同步失败')
  } finally {
    syncing.value = false
  }
}

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
const tableColumns = reactive<VxeGridProps['columns']>([
  { type: 'seq', title: '序号', width: 60 },
  { field: 'matnr', title: '物料编码', width: 160, align: 'center', headerAlign: 'center' },
  { field: 'maktx', title: '物料描述', width: 280 },
  {
    field: 'unitPriceType',
    title: '单价类型',
    width: 110,
    align: 'center',
    headerAlign: 'center'
  },
  {
    field: 'unitPrice',
    title: '单价(元)',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => (cellValue == null || cellValue === '' ? '-' : formatNumValue(String(cellValue), 2))
  },
  { field: 'unit', title: '计量单位', width: 120, align: 'center', headerAlign: 'center' },
  { field: 'pspid', title: '项目定义', width: 160, align: 'center', headerAlign: 'center' },
  { field: 'post1', title: '项目描述', width: 280 },
  { field: 'mblnr', title: '物料凭证编号', width: 160, align: 'center', headerAlign: 'center' },
  { field: 'mjahr', title: '年度', width: 100, align: 'center', headerAlign: 'center' },
  { field: 'createTime', title: '创建日期', width: 130, align: 'center', headerAlign: 'center' }
])

/** SearchForm 搜索列 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'matnr',
    label: '物料编码',
    search: {
      order: 1,
      render: ReMultipleText as any,
      props: { class: 'hpl-search-input', placeholder: '请输入物料编码，多个用逗号分隔' }
    }
  },
  {
    prop: 'maktx',
    label: '物料描述',
    search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入物料描述' } }
  },
  {
    prop: 'unitPriceType',
    label: '单价类型',
    enum: () => getPublicData('AI_MAT_PRICE_HIS_TYPE_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 7, props: { clearable: true } }
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
  },
  {
    prop: 'mblnr',
    label: '物料凭证编号',
    search: {
      order: 5,
      render: ReMultipleText as any,
      props: { class: 'hpl-search-input', placeholder: '请输入物料凭证编号，多个用逗号分隔' }
    }
  },
  {
    prop: 'mjahr',
    label: '年度',
    search: { el: 'date-picker', order: 6, props: { type: 'year', valueFormat: 'YYYY', clearable: true } }
  }
])
</script>

<style scoped lang="less">
@import '../css/index.less';
</style>
