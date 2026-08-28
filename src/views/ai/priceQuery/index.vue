<!-- 项目信息补充 -->
<template>
  <div class="list-card" v-if="isShowPage">
    <RangeVxeTable
      ref="tableRef"
      class="pq-vxe-table"
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
          <el-button v-permission="'EXPORT'" size="mini" type="primary" @click="handleExport">导 出</el-button>
        </div>
      </template>
      <template #xmbm_default="{ row }">
        <ReText class="pq-cell-text">{{ row.xmbm || '-' }}</ReText>
      </template>
      <template #xmmc_default="{ row }">
        <ReText class="pq-cell-text">{{ row.xmmc || '-' }}</ReText>
      </template>
      <template #proTypeList_default="{ row }">
        <ReText class="pq-cell-text">{{ row.proTypeName || '-' }}</ReText>
      </template>
      <template #yjdw_default="{ row }">
        <ReText class="pq-cell-text">{{ row.yjdw || '-' }}</ReText>
      </template>
      <template #ejdw_default="{ row }">
        <ReText class="pq-cell-text">{{ row.ejdw || '-' }}</ReText>
      </template>
      <template #wlbm_default="{ row }">
        <ReText class="pq-cell-text">{{ row.wlbm || '-' }}</ReText>
      </template>
      <template #wlmc_default="{ row }">
        <ReText class="pq-cell-text">{{ row.wlmc || '-' }}</ReText>
      </template>
      <template #model_default="{ row }">
        <ReText class="pq-cell-text">{{ row.model || '-' }}</ReText>
      </template>
      <template #sjly_default="{ row }">
        <ReText class="pq-cell-text">{{ row.sjly || '-' }}</ReText>
      </template>
    </RangeVxeTable>
  </div>
  <userDialog v-if="!hasSharedPermission" ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/ai/priceQuery/index">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import ReText from '@/components/ReText/src/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import userDialog from '@/components/select/userDialog.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import { getGssJgDataWithPage, exportGssJgData } from '@/api/ai/priceQuery'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { getPublicData, getSubProtypeTree } from '@/api/common'

const props = defineProps<{
  sharedUserInfo?: Record<string, any>
  popMode?: boolean
}>()

// ========== 响应式状态 ==========
const userDialogRef = ref()
const isShowPage = ref(false)
const tableRef = ref<any>(null)
const loading = ref(false)
const hasSharedPermission = computed(() => Boolean(props.sharedUserInfo))
const userInfo = ref<any>(props.sharedUserInfo ? { ...props.sharedUserInfo } : undefined)
const store = useStore()
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const infoParams = ref<any>({})
const projectTypeList = ref<any[]>([])
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// ========== 表格相关 ==========
const resetHandle = () => {
  ejdwList.value.length = 0
  tableRef.value?.clearSelection()
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (param: any) => {
  loading.value = true
  infoParams.value = {
    ...param,
    userId: store.getters.getUserMsg.id,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    roleId: userInfo.value.role_id,
    roleCode: userInfo.value.code
  }
  infoParams.value.xmbmList = param.xmbm ? param.xmbm.split(',') : []
  infoParams.value.wlbmList = param.wlbm ? param.wlbm.split(',') : []

  return getGssJgDataWithPage(infoParams.value)
}

// 导出
const handleExport = () => {
  const params = { ...infoParams.value }
  const fileName = '项目信息补充'
  apiExportHandle(params, fileName, exportGssJgData)
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      initParamLists()
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

const initParamLists = async () => {
  yjdwList.value.length = 0
  projectTypeList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value.specialorgid, dwId: userInfo.value.org_id })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }
  let xmlx = await getSubProtypeTree()
  if (xmlx.success && xmlx.data.length !== 0) {
    projectTypeList.value.push(...xmlx.data)
  }
}

const selectChange = async (val: any) => {
  const params = tableRef.value?.searchParam
  if (params) {
    params.qkjejdw = ''
    params.qkjgkbm = ''
  }
  ejdwList.value.length = 0
  const param = {
    YJDW: val,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    parentCode: val
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
}

// ========== 生命周期 ==========
onMounted(async () => {
  if (hasSharedPermission.value) {
    initParamLists()
    isShowPage.value = true
    return
  }
  await userDialogRef.value?.getUser()
})

/** vxe-grid 列 */
const tableColumns = reactive<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', title: '序号', width: 50 },
  { field: 'xmbm', title: '项目编码', width: 150, align: 'center', headerAlign: 'center', slots: { default: 'xmbm_default' } },
  { field: 'xmmc', title: '项目名称', width: 280, slots: { default: 'xmmc_default' } },
  { field: 'jhssnd', title: '计划实施年度', width: 120, align: 'center', headerAlign: 'center' },
  { field: 'proTypeName', title: '项目类型', width: 150, align: 'center', headerAlign: 'center', slots: { default: 'proTypeList_default' } },
  { field: 'yjdw', title: '一级单位', width: 150, align: 'center', headerAlign: 'center', slots: { default: 'yjdw_default' } },
  { field: 'ejdw', title: '二级单位', width: 150, align: 'center', headerAlign: 'center', slots: { default: 'ejdw_default' } },
  { field: 'wlbm', title: '物料编码', width: 150, align: 'center', headerAlign: 'center', slots: { default: 'wlbm_default' } },
  { field: 'wlmc', title: '物料名称', width: 280, slots: { default: 'wlmc_default' } },
  { field: 'model', title: '规格及型号', width: 150, align: 'center', headerAlign: 'center', slots: { default: 'model_default' } },
  { field: 'unit', title: '单位', width: 80, align: 'center', headerAlign: 'center' },
  {
    field: 'count',
    title: '设计用量',
    width: 100,
    align: 'center',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => (typeof cellValue === 'undefined' || cellValue === null || cellValue === '' ? '-' : cellValue)
  },
  {
    field: 'unitPriceTaxIn',
    title: '单价-含税',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) =>
      typeof cellValue === 'undefined' || cellValue === null || cellValue === '' ? '-' : formatNumValue(cellValue.toString(), 2)
  },
  {
    field: 'unitPriceTaxEx',
    title: '单价-不含税',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) =>
      typeof cellValue === 'undefined' || cellValue === null || cellValue === '' ? '-' : formatNumValue(cellValue.toString(), 2)
  },
  { field: 'sjly', title: '数据来源', width: 180, slots: { default: 'sjly_default' } }
])

/** SearchForm 搜索列 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'xmbm',
    label: '项目编码',
    search: {
      order: 1,
      render: ReMultipleText as any,
      props: { class: 'pq-search-input', placeholder: '请输入项目编码，多个用逗号分隔' }
    }
  },
  { prop: 'xmmc', label: '项目名称', search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入项目名称' } } },
  {
    prop: 'jhssnd',
    label: '计划实施年度',
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 5, props: { clearable: true } }
  },
  {
    prop: 'proTypeList',
    label: '项目类型',
    enum: projectTypeList.value,
    search: {
      el: 'tree-select',
      order: 6,
      render: ElTreeSelect as any,
      props: {
        showCheckbox: true,
        collapseTags: true,
        clearable: true
      }
    },
    fieldNames: { label: 'name', value: 'middleId', children: 'children' }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 3, props: { onChange: selectChange, clearable: true, filterable: true } }
  },
  {
    prop: 'ejdwList',
    label: '二级单位',
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 4, props: { multiple: true, collapseTags: true, clearable: true } }
  },
  {
    prop: 'wlbm',
    label: '物料编码',
    search: {
      order: 7,
      render: ReMultipleText as any,
      props: { class: 'pq-search-input', placeholder: '请输入物料编码，多个用逗号分隔' }
    }
  },
  { prop: 'wlmc', label: '物料名称', search: { el: 'input', order: 8, props: { clearable: true, placeholder: '请输入物料名称' } } },
  {
    prop: 'sjly',
    label: '数据来源',
    enum: () => getPublicData('GSS_MAT_SJLY_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 9, props: { clearable: true } }
  }
])
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
