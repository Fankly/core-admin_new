<!-- 外包适配清单（vxe-grid，对齐标杆 RangeVxeTable） -->
<template>
  <div v-if="isShowPage" class="outsource-adapt-list">
    <div class="list-card">
      <RangeVxeTable
        ref="tableRef"
        class="oal-vxe-table"
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
        @reset="handleSearchReset"
      >
        <template #tableHeader="scope">
          <div class="oal-command-group" aria-label="外包适配清单操作">
            <el-button v-permission="'ADD'" size="mini" type="primary" @click="handleBtn(scope.selectedList, 'ADD')">新 增</el-button>
            <el-button
              v-permission="'EDIT'"
              :disabled="scope.selectedList.length !== 1"
              size="mini"
              type="primary"
              @click="handleBtn(scope.selectedList, 'EDIT')"
              >编 辑</el-button
            >
            <el-button
              v-permission="'DELETE'"
              :disabled="scope.selectedList.length === 0"
              size="mini"
              type="danger"
              @click="handleBtn(scope.selectedList, 'DELETE')"
              >删 除</el-button
            >
            <el-button v-permission="'IMPORT'" size="mini" type="primary" @click="handleImport">导 入</el-button>
            <el-button v-permission="'EXPORT'" size="mini" type="primary" @click="handleExport">导 出</el-button>
          </div>
        </template>
        <template #seqNo_default="{ row }">
          <ReText class="oal-cell-text oal-cell-text--center">{{ row.seqNo || '-' }}</ReText>
        </template>
        <template #bizMajorCatName_default="{ row }">
          <ReText class="oal-cell-text">{{ row.bizMajorCatName || '-' }}</ReText>
        </template>
        <template #bizSubCatName_default="{ row }">
          <ReText class="oal-cell-text">{{ row.bizSubCatName || '-' }}</ReText>
        </template>
        <template #prohibitedBiz_default="{ row }">
          <ReText class="oal-cell-text">{{ row.prohibitedBiz || '-' }}</ReText>
        </template>
        <template #allowedAuxBiz_default="{ row }">
          <ReText class="oal-cell-text">{{ row.allowedAuxBiz || '-' }}</ReText>
        </template>
      </RangeVxeTable>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <editModal ref="editModalRef" @search-handle="searchHandle" />
  <ImportExcel ref="importRef" />
</template>

<script setup lang="ts" name="/ai/outsourceAdaptList/index">
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import userDialog from '@/components/select/userDialog.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import ReText from '@/components/ReText/src/index.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import editModal from '@/views/ai/outsourceAdaptList/components/editModal/index.vue'
import { getCommonDict } from '@/api/common'
import { apiExportHandle } from '@/utils/export'
import {
  getOutsourceAdaptListPage,
  removeOutsourceAdaptList,
  importOutsourceAdaptList,
  importTemplateOutsourceAdaptList,
  exportOutsourceAdaptList
} from '@/api/ai/outsourceAdaptList'
import type { OutsourceAdaptListRow } from '@/api/ai/outsourceAdaptList'
import type { ColumnProps } from '@/components/ProTablePage/interface'

/** 业务大类 / 小类公共代码（级联：大类 getCommonDict(code)，小类 getCommonDict(code, pCode)） */
const BIZ_CAT_CODE = 'OUTSOURCE_RULE_KB_BIZ_CAT'

type OperationType = 'ADD' | 'EDIT' | 'DELETE'

interface CodeItem {
  code: string
  name: string
}

interface RoleContext {
  bmId: string
  dwId: string
  roleId: string
  roleCode: string
  userId: string
}

const store = useStore()
const editModalRef = ref()
const userDialogRef = ref()
const importRef = ref()
const tableRef = ref<any>(null)
const isShowPage = ref(false)
const loading = ref(false)

/** 搜索区业务小类（原地改数组，保证 SearchForm enumMap 引用生效） */
const bizSubCatList = ref<CodeItem[]>([])
const roleContext = ref<RoleContext>({
  bmId: '',
  dwId: '',
  roleId: '',
  roleCode: '',
  userId: ''
})

/** 大类变更：清空小类并按 parentCode 加载小类 */
const handleMajorCatChange = async (val: string) => {
  if (tableRef.value?.searchParam) {
    tableRef.value.searchParam.bizSubCat = ''
  }
  bizSubCatList.value.length = 0
  if (!val) return
  try {
    const res = await getCommonDict(BIZ_CAT_CODE, val)
    if (res.success && res.data?.length) {
      bizSubCatList.value.push(...res.data)
    } else if (!res.success) {
      ElMessage.error(res.msg || '加载业务小类失败')
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

/** vxe-grid 列 */
const tableColumns = reactive<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { field: 'seqNo', title: '序号', width: 100, showOverflow: false, slots: { default: 'seqNo_default' } },
  { field: 'bizMajorCatName', title: '业务大类', width: 160, showOverflow: false, slots: { default: 'bizMajorCatName_default' } },
  { field: 'bizSubCatName', title: '业务小类', width: 160, showOverflow: false, slots: { default: 'bizSubCatName_default' } },
  { field: 'prohibitedBiz', title: '禁止外包的整项业务', minWidth: 220, showOverflow: false, slots: { default: 'prohibitedBiz_default' } },
  {
    field: 'allowedAuxBiz',
    title: '整项业务中外包的辅助性业务',
    minWidth: 240,
    showOverflow: false,
    slots: { default: 'allowedAuxBiz_default' }
  }
])

/** SearchForm 搜索列（ProTable ColumnProps 形态） */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'bizMajorCat',
    label: '业务大类',
    enum: () => getCommonDict(BIZ_CAT_CODE),
    fieldNames: { label: 'name', value: 'code' },
    search: {
      el: 'select',
      order: 1,
      props: {
        filterable: true,
        clearable: true,
        placeholder: '请选择业务大类',
        onChange: handleMajorCatChange
      }
    }
  },
  {
    prop: 'bizSubCat',
    label: '业务小类',
    enum: bizSubCatList.value,
    fieldNames: { label: 'name', value: 'code' },
    search: {
      el: 'select',
      order: 2,
      props: {
        filterable: true,
        clearable: true,
        placeholder: '请选择业务小类'
      }
    }
  }
])

const resetTable = () => {
  tableRef.value?.clearSelection()
  tableRef.value?.getTableList()
}

/** 重置搜索时同步清空小类选项（RangeVxeTable 已清 searchParam 并重查） */
const handleSearchReset = () => {
  bizSubCatList.value.length = 0
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

/** 组装列表/导出公共查询参数 */
const buildQueryParams = (params: any = {}) => {
  const searchParam = tableRef.value?.searchParam || {}
  const pageParam = tableRef.value?.pageable || {}
  return {
    ...searchParam,
    ...params,
    bizMajorCat: params.bizMajorCat ?? searchParam.bizMajorCat ?? '',
    bizSubCat: params.bizSubCat ?? searchParam.bizSubCat ?? '',
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
  return getOutsourceAdaptListPage(buildQueryParams(params)).finally(() => {
    loading.value = false
  })
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

const handleBtn = async (selectedList: OutsourceAdaptListRow[], type: OperationType) => {
  if (type === 'ADD' || type === 'EDIT') {
    editModalRef.value?.acceptParams({
      searchParams: type === 'EDIT' ? { ...selectedList[0] } : {},
      type: type === 'ADD' ? '新增' : '编辑'
    })
    return
  }

  if (selectedList.length === 0) return ElMessage.warning('请选择数据！')

  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', {
    status: 'warning'
  })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const ids = selectedList.map((item) => item.id).filter(Boolean)
  if (ids.length === 0) return ElMessage.warning('请选择有效数据！')

  const res = await removeOutsourceAdaptList([...ids])
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
    title: '外包适配清单',
    specialorgid: roleContext.value.bmId,
    tempApi: () => importTemplateOutsourceAdaptList(),
    importApi: (importParams: any) => importOutsourceAdaptList(importParams),
    getTableList: () => resetTable()
  })
}

const handleExport = async () => {
  try {
    loading.value = true
    await apiExportHandle(buildQueryParams(), '外包适配清单', exportOutsourceAdaptList)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
