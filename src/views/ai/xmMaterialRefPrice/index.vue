<!-- 项目物资参考价格库（vxe-grid，对齐标杆 smartTaskAudit） -->
<template>
  <div v-if="isShowPage" class="xm-material-ref-price">
    <section class="workbench-panel">
      <!-- 工具栏：命令按钮 + 工具图标 -->
      <div class="xmrp-toolbar">
        <div class="xmrp-toolbar__commands">
          <el-button v-if="!popMode" v-permission="'ADD'" size="mini" type="primary" plain @click="handleBtn([], 'ADD')">新 增</el-button>
          <el-button
            v-if="!popMode"
            v-permission="'EDIT'"
            size="mini"
            type="primary"
            plain
            :disabled="selectedCount !== 1"
            @click="handleBtn(selectedList, 'EDIT')"
            >编 辑</el-button
          >
          <el-button
            v-if="!popMode"
            v-permission="'DELETE'"
            size="mini"
            type="primary"
            plain
            :disabled="selectedCount === 0"
            @click="handleBtn(selectedList, 'DELETE')"
            >删 除</el-button
          >
          <el-button v-if="!popMode" v-permission="'IMPORT'" size="mini" type="primary" plain @click="handleImport">导 入</el-button>
          <el-button v-permission="'EXPORT'" size="mini" type="primary" plain :loading="exporting" @click="handleExport">导 出</el-button>
          <span v-if="selectedCount > 0" class="xmrp-toolbar__count" aria-live="polite">已选 {{ selectedCount }} 条</span>
        </div>
        <div class="xmrp-toolbar__tools">
          <ToolbarButtons
            v-model:search-visible="searchVisible"
            :tool-button="['search', 'setting', 'help']"
            @setting-click="openColSetting"
            @help-click="openHelp"
          />
        </div>
      </div>

      <!-- 查询条件 -->
      <SearchForm
        v-show="searchVisible"
        :columns="searchColumns"
        :search-param="searchParam"
        :search-col="4"
        :search="handleSearch"
        :reset="handleReset"
      />

      <!-- 表格 -->
      <div class="table-region">
        <RangeVxeTable
          ref="tableRef"
          class="xmrp-vxe-table"
          stripe
          row-key="id"
          row-click-mode="exclusive"
          :border="true"
          :pagination="true"
          :request-auto="true"
          :request-api="getPageList"
          :data-callback="callBackHandle"
          :columns="tableColumns"
          column-setting
          :loading="loading"
          @selection-change="handleSelectionChange"
        >
          <template #materialMajor_default="{ row }">
            <ReText class="xmrp-cell-text">{{ row.materialMajor || '-' }}</ReText>
          </template>
          <template #materialMiddle_default="{ row }">
            <ReText class="xmrp-cell-text">{{ row.materialMiddle || '-' }}</ReText>
          </template>
          <template #materialMinor_default="{ row }">
            <ReText class="xmrp-cell-text">{{ row.materialMinor || '-' }}</ReText>
          </template>
          <template #materialCode_default="{ row }">
            <ReText class="xmrp-cell-text">{{ row.materialCode || '-' }}</ReText>
          </template>
          <template #materialDesc_default="{ row }">
            <ReText class="xmrp-cell-text">{{ row.materialDesc || '-' }}</ReText>
          </template>
        </RangeVxeTable>
      </div>
    </section>
  </div>
  <userDialog v-if="!hasSharedPermission" ref="userDialogRef" @loadCompany="getRoleHandle" />
  <editModal ref="editModalRef" @search-handle="searchHandle" />
  <ImportExcel ref="importRef" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/ai/xmMaterialRefPrice/index">
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import userDialog from '@/components/select/userDialog.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import ReText from '@/components/ReText/src/index.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import SearchForm from '@/components/SearchForm/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import editModal from '@/views/ai/xmMaterialRefPrice/components/editModal/index.vue'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import {
  getXmMaterialRefPricePage,
  deleteXmMaterialRefPrice,
  importXmMaterialRefPrice,
  exportXmMaterialRefPrice
} from '@/api/ai/xmMaterialRefPrice'
import type { XmMaterialRefPriceRow } from '@/api/ai/xmMaterialRefPrice'
import type { ColumnProps } from '@/components/ProTable/interface'

type OperationType = 'ADD' | 'EDIT' | 'DELETE'

interface RoleContext {
  bmId: string
  dwId: string
  roleId: string
  roleCode: string
  userId: string
}

const props = defineProps<{
  sharedUserInfo?: Record<string, any>
  popMode?: boolean
}>()
const hasSharedPermission = computed(() => Boolean(props.sharedUserInfo))

const store = useStore()
const editModalRef = ref()
const userDialogRef = ref()
const importRef = ref()
const helpModalRef = ref<any>()
const tableRef = ref<any>(null)
const isShowPage = ref(false)
const loading = ref(false)
const exporting = ref(false)
const searchVisible = ref(true)
const selectedList = ref<XmMaterialRefPriceRow[]>([])
const selectedCount = ref(0)

const roleContext = ref<RoleContext>({
  bmId: '',
  dwId: '',
  roleId: '',
  roleCode: '',
  userId: ''
})

// 父级已解析角色时直接复用，避免在 tab 内重复弹 userDialog
if (hasSharedPermission.value) {
  const shared = props.sharedUserInfo as Record<string, any>
  roleContext.value = {
    bmId: shared.specialorgid || '',
    dwId: shared.org_id || '',
    roleId: shared.role_id || shared.id || '',
    roleCode: shared.code || '',
    userId: store.getters.getUserMsg?.id || ''
  }
}

/** 公用查询参数 */
const searchParam = reactive<Record<string, any>>({
  materialMajor: '',
  materialMiddle: '',
  materialMinor: '',
  materialCode: '',
  materialDesc: ''
})

/** vxe-grid 列 */
const tableColumns = reactive<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', title: '序号', width: 60 },
  { field: 'materialMajor', title: '物料大类', minWidth: 140, align: 'center', headerAlign: 'center', showOverflow: true, slots: { default: 'materialMajor_default' } },
  { field: 'materialMiddle', title: '物料中类', minWidth: 140, align: 'center', headerAlign: 'center', showOverflow: true, slots: { default: 'materialMiddle_default' } },
  { field: 'materialMinor', title: '物料小类', minWidth: 140, align: 'center', headerAlign: 'center', showOverflow: true, slots: { default: 'materialMinor_default' } },
  { field: 'materialCode', title: '物料编码', minWidth: 180, align: 'center', headerAlign: 'center', showOverflow: true, slots: { default: 'materialCode_default' } },
  { field: 'materialDesc', title: '物料描述', minWidth: 240, align: 'left', headerAlign: 'center', showOverflow: true, slots: { default: 'materialDesc_default' } },
  { field: 'unit', title: '单位', minWidth: 100, align: 'center', headerAlign: 'center' },
  {
    field: 'priceExTax',
    title: '除税价格（元）',
    minWidth: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => (cellValue == null || cellValue === '' ? '-' : formatNumValue(String(cellValue), 2))
  },
  {
    field: 'priceInTax',
    title: '含税价格（元）',
    minWidth: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => (cellValue == null || cellValue === '' ? '-' : formatNumValue(String(cellValue), 2))
  },
  { field: 'createTime', title: '创建时间', minWidth: 160, align: 'center', headerAlign: 'center' }
])

/** SearchForm 搜索列 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'materialMajor',
    label: '物料大类',
    search: { el: 'input', order: 1, props: { clearable: true, placeholder: '请输入物料大类' } }
  },
  {
    prop: 'materialMiddle',
    label: '物料中类',
    search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入物料中类' } }
  },
  {
    prop: 'materialMinor',
    label: '物料小类',
    search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入物料小类' } }
  },
  {
    prop: 'materialCode',
    label: '物料编码',
    search: { el: 'input', order: 4, props: { clearable: true, placeholder: '请输入物料编码' } }
  },
  {
    prop: 'materialDesc',
    label: '物料描述',
    search: { el: 'input', order: 5, props: { clearable: true, placeholder: '请输入物料描述' } }
  }
])

const resetTable = () => {
  tableRef.value?.clearSelection()
  tableRef.value?.getTableList()
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

/** 组装列表/导出公共查询参数 */
const buildQueryParams = (params: any = {}) => {
  const pageParam = tableRef.value?.pageable || {}
  return {
    ...searchParam,
    ...params,
    materialMajor: searchParam.materialMajor || '',
    materialMiddle: searchParam.materialMiddle || '',
    materialMinor: searchParam.materialMinor || '',
    materialCode: searchParam.materialCode || '',
    materialDesc: searchParam.materialDesc || '',
    bmId: roleContext.value.bmId,
    dwId: roleContext.value.dwId,
    roleId: roleContext.value.roleId,
    roleCode: roleContext.value.roleCode,
    userId: roleContext.value.userId,
    page: String(params.page ?? pageParam.current ?? ''),
    limit: String(params.limit ?? pageParam.size ?? '')
  }
}

const getPageList = (params: any) => {
  loading.value = true
  return getXmMaterialRefPricePage(buildQueryParams(params)).finally(() => {
    loading.value = false
  })
}

/** 查询：回到第一页并刷新 */
const handleSearch = () => {
  if (tableRef.value?.pageable) tableRef.value.pageable.current = 1
  resetTable()
}

/** 重置：清空查询条件后查询 */
const handleReset = () => {
  searchParam.materialMajor = ''
  searchParam.materialMiddle = ''
  searchParam.materialMinor = ''
  searchParam.materialCode = ''
  searchParam.materialDesc = ''
  handleSearch()
}

/** 打开列设置 */
const openColSetting = () => {
  tableRef.value?.openColSetting()
}

/** 打开帮助弹窗 */
const openHelp = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

/** 选中行变化 */
const handleSelectionChange = (rows: XmMaterialRefPriceRow[]) => {
  selectedList.value = rows
  selectedCount.value = rows.length
}

const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    if (!isQuery) return

    const userMsg = userDialogRef.value?.userMsg || {}
    roleContext.value = {
      bmId: userMsg.specialorgid || '',
      dwId: userMsg.org_id || '',
      roleId: userMsg.role_id || userMsg.id || '',
      roleCode: userMsg.code || userDialogRef.value?.roleCode || '',
      userId: store.getters.getUserMsg?.id || ''
    }
    isShowPage.value = true
  } catch (e) {
    console.error(e)
  }
}

const handleBtn = async (list: XmMaterialRefPriceRow[], type: OperationType) => {
  if (type === 'ADD' || type === 'EDIT') {
    editModalRef.value?.acceptParams({
      searchParams: type === 'EDIT' ? { ...list[0] } : {},
      type: type === 'ADD' ? '新增' : '编辑'
    })
    return
  }

  if (list.length === 0) return ElMessage.warning('请选择数据！')

  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', {
    status: 'warning'
  })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const ids = list.map((item) => item.id).filter(Boolean) as string[]
  if (ids.length === 0) return ElMessage.warning('请选择有效数据！')

  const res = await deleteXmMaterialRefPrice([...ids])
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功！')
  resetTable()
}

const searchHandle = (val: any) => {
  if (!val) return
  resetTable()
}

const handleImport = () => {
  importRef.value?.acceptParams({
    title: '项目物资参考价格库',
    specialorgid: roleContext.value.bmId,
    importApi: (importParams: any) => importXmMaterialRefPrice(importParams),
    getTableList: () => resetTable()
  })
}

const handleExport = async () => {
  try {
    exporting.value = true
    await apiExportHandle(buildQueryParams(), '项目物资参考价格库', exportXmMaterialRefPrice)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  if (hasSharedPermission.value) {
    isShowPage.value = true
    return
  }
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
