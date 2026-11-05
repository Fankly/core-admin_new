<template>
  <div v-loading="pageLoading" class="target-value-mbz" element-loading-text="正在加载..." element-loading-background="rgba(255, 255, 255, 0.72)">
    <div class="target-value-mbz__operation">
      <div class="target-value-mbz__actions">
        <el-button type="primary" plain size="mini" @click="emitNotify">知道了</el-button>
        <el-button type="primary" plain size="mini" @click="emitClose">关闭</el-button>
        <el-button :disabled="pageInfo.loading" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
      </div>
      <div class="target-value-mbz__meta">
        <span class="target-value-mbz__item">
          版本编号: <span>{{ versionInfo.versionNo }}</span>
        </span>
        <span class="target-value-mbz__item">
          版本名称: <span>{{ versionInfo.versionName }}</span>
        </span>
        <span class="target-value-mbz__item">
          年度:<span>{{ formData.nd }}</span>
        </span>
      </div>
    </div>
    <div v-show="pageInfo.isShowPage" class="target-value-mbz__table">
      <el-tabs v-model="isZgs" @tab-click="handleTab">
        <template :key="item.code" v-for="item in tabList">
          <el-tab-pane v-if="String(item.code) === String(isZgs)" :disabled="pageInfo.loading" :label="item.name" :name="item.code" />
        </template>
      </el-tabs>
      <vxe-table
        :row-config="{ keyField: 'id', height: 32 }"
        :loading="tableLoading"
        :column-config="{ resizable: true }"
        :border="true"
        align="center"
        show-overflow
        keep-source
        headerAlign="center"
        :editConfig="tableInfo.editConfig"
        :treeConfig="tableInfo.treeConfig"
        :data="tableInfo.tableData"
        height="92%"
        ref="tableRef"
      >
        <template v-for="item in tableInfo.columns" :key="item.columnKey">
          <vxe-column
            :fixed="item.fixed ? 'left' : ''"
            v-if="item.columnKey === 'name'"
            tree-node
            header-align="center"
            border
            width="280"
            :title="item.columnValue"
            :field="item.columnKey"
            align="left"
          />
          <vxe-column
            :fixed="item.fixed ? 'left' : ''"
            :formatter="formatterData"
            v-else
            header-align="center"
            border
            width="180"
            :title="item.columnValue"
            :field="item.columnKey"
            align="right"
          />
        </template>
      </vxe-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPublicData } from '@/api/common'
import { getData } from '@/api/goalValue/versionDetail'
import { getDynamicColumn } from '@/api/xmInfo/mbz'
import { formatValue } from '@/utils/utils'
import { Columns } from '@/views/xmInfo/interface'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { TargetValueWorkflowParams } from './types'

const props = defineProps<{
  params: TargetValueWorkflowParams
}>()

const emit = defineEmits(['close', 'notify'])

const tableRef = ref()
const loadingTreeCount = ref(0)
const tabList = ref<any[]>([])
const isZgs = ref<any>('0')

const pageInfo = reactive({
  loading: false,
  isShowPage: false,
  pageFlag: false
})

const formData = reactive({
  nd: ''
})

const pageLoading = computed(() => pageInfo.loading && !pageInfo.isShowPage)
const tableLoading = computed(() => pageInfo.loading && pageInfo.isShowPage)

const versionInfo = reactive({
  specialOrgId: '',
  versionId: '',
  versionName: '',
  versionNo: ''
})

const tableInfo = reactive<any>({
  tableData: [],
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      return loadChildRows(row)
    }
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: false
  }
})

const normalizeParams = (params: TargetValueWorkflowParams) => ({
  nd: String(params.nd || ''),
  dwId: String(params.dwId || ''),
  versionId: String(params.versionId || ''),
  versionName: String(params.versionName || ''),
  versionNo: String(params.versionNo || ''),
  isZgs: String(params.isZgs || '')
})

const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}

const buildDataParams = (row?: any) => ({
  nd: formData.nd,
  parentId: row?.id || '0',
  isZgs: isZgs.value,
  specialorgid: versionInfo.specialOrgId,
  cj: row?.cj || '0',
  versionId: versionInfo.versionId
})

const loadChildRows = async (row: any) => {
  loadingTreeCount.value++
  pageInfo.loading = true
  try {
    const res = await getData(buildDataParams(row))
    if (!res.success) throw new Error(res.msg)
    return Array.isArray(res.data) ? res.data : []
  } catch (error) {
    ElMessage.error((error as Error).message)
    return []
  } finally {
    loadingTreeCount.value--
    if (loadingTreeCount.value <= 0) {
      loadingTreeCount.value = 0
      pageInfo.loading = false
    }
  }
}

const expandAllTree = async (data: any[], table: any) => {
  for (const row of data) {
    if (row.leaf) {
      await table.setTreeExpand(row, true)
      if (row.children) {
        await expandAllTree(row.children, table)
      }
    }
  }
}

const expandHandle = async () => {
  await nextTick()
  const table = tableRef.value
  if (table) {
    await expandAllTree(tableInfo.tableData, table)
  }
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData = []
  try {
    const res = await getData(buildDataParams())
    if (!res.success) throw new Error(res.msg)
    tableInfo.tableData = Array.isArray(res.data) ? res.data : []
    pageInfo.pageFlag = true
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    pageInfo.loading = false
  }
}

const getHeaderData = async () => {
  const res = await getDynamicColumn(versionInfo.specialOrgId, isZgs.value, 'EDIT')
  if (res.success) {
    tableInfo.columns = Array.isArray(res.data) ? res.data.filter((item: Columns) => !item.hidden) : []
    pageInfo.pageFlag = true
    pageInfo.isShowPage = true
    return true
  }
  pageInfo.isShowPage = false
  ElMessage.error(res.msg)
  return false
}

const initParamLists = async () => {
  const res = await getPublicData('MBZ_TAB_TYPE')
  if (res.success && Array.isArray(res.data) && res.data.length) {
    tabList.value = res.data
    if (!isZgs.value || !res.data.some((item: any) => String(item.code) === String(isZgs.value))) {
      isZgs.value = res.data[0].code
    }
    return
  }
  if (isZgs.value) {
    tabList.value = [{ code: isZgs.value, name: '目标值' }]
    return
  }
  throw new Error(res.msg || '缺少目标值页签参数!')
}

const initData = async () => {
  const params = normalizeParams(props.params)
  versionInfo.specialOrgId = params.dwId
  versionInfo.versionId = params.versionId
  versionInfo.versionName = params.versionName
  versionInfo.versionNo = params.versionNo
  formData.nd = params.nd || new Date().getFullYear().toString()
  isZgs.value = params.isZgs || isZgs.value

  if (!versionInfo.specialOrgId || !versionInfo.versionId) {
    ElMessage.error('缺少目标值参数!')
    return
  }

  pageInfo.loading = true
  pageInfo.isShowPage = false
  tableInfo.tableData = []
  tableInfo.columns = []
  try {
    await initParamLists()
    const headerLoaded = await getHeaderData()
    if (headerLoaded) {
      await getDataList()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    pageInfo.loading = false
  }
}

const handleTab = async () => {
  tableInfo.columns = []
  const headerLoaded = await getHeaderData()
  if (headerLoaded) {
    await getDataList()
  }
}

const emitClose = () => {
  emit('close')
}

const emitNotify = () => {
  emit('notify')
}

watch(
  () => props.params,
  () => {
    initData()
  },
  {
    deep: true
  }
)

onMounted(initData)
</script>

<style scoped lang="less">
.target-value-mbz {
  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: white;

  &__operation {
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__meta {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    flex: 1 1 auto;
    gap: 8px;
    font-weight: bold;
    color: #212529;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    color: #555;
    padding: 5px 10px;
    background-color: #e9ecef;
    border-radius: 5px;
    min-height: 0;
    min-width: 0;
    max-width: 260px;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__table {
    flex: 1;
    min-height: 0;
  }

  :deep(.el-tabs) {
    height: 8%;
    min-height: 40px;
  }
}
</style>
