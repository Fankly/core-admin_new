<!-- 项目预算执行一览表（vxe-grid 树形懒加载 + 动态表头，基于 RangeVxeTable） -->
<template>
  <div v-if="isShowPage" class="xmysylb-view">
    <div class="list-card">
      <RangeVxeTable
        ref="tableRef"
        class="xmysylb-vxe-table"
        stripe
        row-key="id"
        :border="true"
        :pagination="false"
        :request-auto="false"
        :request-api="requestApi"
        :data-callback="dataCallback"
        :columns="tableColumns"
        :search-columns="searchColumns"
        :search-col="4"
        :tool-button="['setting', 'search', 'help']"
        row-click-mode="none"
        :tree-config="treeConfig"
        :tree-load-params="treeLoadParams"
        :loading="loading"
        @search="handleSearch"
      >
        <template #tableHeader>
          <div class="xmysylb-command-group">
            <el-dropdown @command="expandByLevelHandle">
              <el-button v-permission="'EXPAND'" size="mini" plain type="primary">
                一键展开 <i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in formList.ZKCJ" :key="item.code" :command="item.code">{{ item.name }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button v-permission="'EXPORT'" size="mini" plain type="primary" @click="exportDataHandle">导 出</el-button>
          </div>
        </template>
      </RangeVxeTable>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/statistics/xmysylb">
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import userDialog from '@/components/select/userDialog.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { RangeVxeTableTreeConfig } from '@/components/RangeVxeTable/interface'
import type { ColumnProps } from '@/components/ProTable/interface'
import { getPublicCodeList } from '@/api/common'
import { formatNumValue } from '@/utils/utils'
import { getDataList, getDynamicColumn } from '@/api/statistics/xmysylb'
import type { XmYsylData } from '@/api/statistics/xmysylb'
import {
  decorateDynamicColumns,
  getExportLeafColumns,
  applyExportNumberCell,
  createLatestRequestTracker
} from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'

interface CodeData {
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
const userDialogRef = ref()
const tableRef = ref<any>(null)
const isShowPage = ref(false)
const loading = ref(false)

const formList = reactive<{
  ZKCJ: CodeData[]
}>({
  ZKCJ: []
})

const roleContext = ref<RoleContext>({
  bmId: '',
  dwId: '',
  roleId: '',
  roleCode: '',
  userId: ''
})

/** 预算期间默认值：本年 1 月 至 当月 */
const buildDefaultRange = () => {
  const now = new Date()
  const nd = now.getFullYear().toString()
  return {
    nd,
    ydStart: `${nd}-01`,
    ydEnd: `${nd}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
}
const defaultRange = buildDefaultRange()

const year = ref(defaultRange.nd)
const searchRequestTracker = createLatestRequestTracker()

/** 动态表头列（reactive，更新后 RangeVxeTable 通过 watch 自动 rebuild） */
const tableColumns = reactive<VxeGridProps['columns']>([])

/** 树形懒加载配置：hasChildField=leaf（后端 leaf:"0" 表示有子节点，dataCallback 中转为 boolean true） */
const treeConfig: RangeVxeTableTreeConfig = {
  lazy: true,
  hasChildField: 'leaf',
  expandAll: false,
  rowField: 'id'
}

/** 根节点 parentId：首次进入按 0 查询 */
const ROOT_PARENT_ID = '0'
/** 根节点 nodeType：首次进入按 1 查询 */
const ROOT_NODE_TYPE = '1'
/** 小数位数：不再作为查询条件，数值由前端统一格式化，默认 6 位小数 */
const DEFAULT_DIGITS = 6
const DEFAULT_XSWS = `XSWS_${DEFAULT_DIGITS}`

/**
 * 懒加载子节点取参：以当前行 id 作为 parentId；
 * 行上带 nodeType 时按行传，否则沿用根节点类型；
 * 行上带 xmbId 时透传给后端。其余查询条件由 buildQueryParams 补齐。
 */
const treeLoadParams = (row: any) => {
  const params: Record<string, any> = {
    parentId: row?.id,
    nodeType: row?.nodeType ?? ROOT_NODE_TYPE
  }
  if (row?.xmbId != null && row?.xmbId !== '') params.xmbId = row.xmbId
  return params
}

/** 组装查询参数（根查询时 parentId 传 0，nodeType 传 1） */
const buildQueryParams = (params: any = {}): XmYsylData => {
  const searchParam = tableRef.value?.searchParam || {}
  const startDate = searchParam.ydStart || ''
  const endDate = searchParam.ydEnd || ''
  const ydStart = startDate ? String(new Date(startDate).getMonth() + 1) : ''
  const ydEnd = endDate ? String(new Date(endDate).getMonth() + 1) : ''
  const nd = startDate ? String(new Date(startDate).getFullYear()) : year.value
  const result: XmYsylData = {
    nd,
    parentId: params.parentId ?? ROOT_PARENT_ID,
    nodeType: params.nodeType ?? ROOT_NODE_TYPE,
    ydStart,
    ydEnd,
    dwId: roleContext.value.dwId,
    bmId: roleContext.value.bmId || roleContext.value.dwId,
    roleCode: roleContext.value.roleCode,
    roleId: roleContext.value.roleId,
    userId: roleContext.value.userId,
    page: 1,
    limit: 1000
  }
  if (params.xmbId != null && params.xmbId !== '') result.xmbId = params.xmbId
  return result
}

/** 行数据转换：leaf 字符串转布尔（vxe hasChildField 需要布尔） */
const mapTableRows = (rows: any[] = []) =>
  rows.map((item: any) => ({
    ...item,
    leaf: item.leaf === '0'
  }))

/** dataCallback：把后端返回的数组转成 vxe 可用的行（leaf 转布尔） */
const dataCallback = (data: any) => {
  const rows = Array.isArray(data) ? data : data?.records || []
  return mapTableRows(rows)
}

/**
 * 拉取动态表头并装饰列。
 * 由 requestApi 在根查询时调用，沿用调用方的 requestToken（不自行 issue，否则会把调用方的取数请求判为过期）。
 * loading 由调用方统一管理。
 */
const loadDynamicColumns = async (requestToken: number): Promise<boolean> => {
  const params = buildQueryParams()
  try {
    const res = await getDynamicColumn(params)
    if (!searchRequestTracker.isLatest(requestToken)) return false
    if (res.success) {
      const decorated = decorateDynamicColumns(res.data || [], DEFAULT_XSWS, formatNumValue) as any[]
      tableColumns.splice(0, tableColumns.length, ...decorated)
      return true
    }
    ElMessage.error(res.msg)
    return false
  } catch {
    if (searchRequestTracker.isLatest(requestToken)) {
      ElMessage.error('动态列加载失败，请稍后重试')
    }
    return false
  }
}

/**
 * requestApi：RangeVxeTable 查询/懒加载统一入口。
 * - 根查询：params 不带 parentId，buildQueryParams 兜底为 ROOT_PARENT_ID('0')
 * - 懒加载：params.parentId 为被展开行的 id（来自 treeLoadParams）
 *
 * 动态表头需先于根数据加载：根查询（parentId 为 0）时先按当前预算期间拉表头再取数，
 * 表头随期间变化，故每次根查询都重新拉取；懒加载子节点时表头已存在，直接取数。
 */
const requestApi = async (params: any) => {
  const requestToken = searchRequestTracker.issue()
  const queryParams = buildQueryParams(params)
  loading.value = true
  // 根查询：先拉表头，再取数
  if (queryParams.parentId === ROOT_PARENT_ID) {
    const ok = await loadDynamicColumns(requestToken)
    if (!ok || !searchRequestTracker.isLatest(requestToken)) {
      if (searchRequestTracker.isLatest(requestToken)) loading.value = false
      return { success: false, data: [] }
    }
  }
  try {
    const res = await getDataList(queryParams)
    if (searchRequestTracker.isLatest(requestToken)) {
      if (res.success) return res
      ElMessage.error(res.msg)
      return { success: false, data: [] }
    }
    return { success: false, data: [] }
  } catch {
    if (searchRequestTracker.isLatest(requestToken)) {
      ElMessage.error('数据加载失败，请稍后重试')
    }
    return { success: false, data: [] }
  } finally {
    if (searchRequestTracker.isLatest(requestToken)) {
      loading.value = false
    }
  }
}

/**
 * 开始月份变化时同步年度，并纠正已失效的结束月份（与 yszxylb 一致：改为该年度 12 月）。
 */
watch(
  () => tableRef.value?.searchParam?.ydStart,
  (newVal) => {
    if (!newVal) return
    const searchParam = tableRef.value?.searchParam
    if (!searchParam) return
    const startDate = new Date(newVal)
    year.value = startDate.getFullYear().toString()
    if (!searchParam.ydEnd) return
    const endDate = new Date(searchParam.ydEnd)
    if (endDate.getFullYear() !== startDate.getFullYear() || endDate.getMonth() < startDate.getMonth()) {
      searchParam.ydEnd = `${startDate.getFullYear()}-12`
    }
  }
)

/**
 * 结束月份变化时同理反向纠正：同步年度，开始月份跨年或晚于结束月份时改为该年度 1 月。
 * 两个 watch 互为镜像但不会循环：任一方纠正后区间已同年且首尾有序，对侧 watch 不再改值。
 */
watch(
  () => tableRef.value?.searchParam?.ydEnd,
  (newVal) => {
    if (!newVal) return
    const searchParam = tableRef.value?.searchParam
    if (!searchParam) return
    const endDate = new Date(newVal)
    year.value = endDate.getFullYear().toString()
    if (!searchParam.ydStart) return
    const startDate = new Date(searchParam.ydStart)
    if (startDate.getFullYear() !== endDate.getFullYear() || startDate.getMonth() > endDate.getMonth()) {
      searchParam.ydStart = `${endDate.getFullYear()}-01`
    }
  }
)

/** RangeVxeTable search 事件：RangeVxeTable 已自行调 getTableList，这里仅做前置校验 */
const handleSearch = () => {
  const searchParam = tableRef.value?.searchParam || {}
  if (!searchParam.ydStart || !searchParam.ydEnd) {
    ElMessage.error('预算期间不能为空！')
    return
  }
}

/** 导出：基于 vxe-grid 已渲染数据（含已展开的子节点） */
const exportDataHandle = () => {
  const $grid = tableRef.value?.gridRef
  if (!$grid) return
  const columns = getExportLeafColumns((tableColumns as any[]) || [])
  if (!columns.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  $grid.exportData({
    sheetName: '项目预算执行一览表',
    type: 'xlsx',
    filename: '项目预算执行一览表',
    useStyle: true,
    columnFilterMethod: ({ column }: any) => !!column.field,
    columns,
    sheetMethod: ({ worksheet, columns: exportColumns, datas }: any) => {
      const exportRows = Array.isArray(datas) ? datas : []
      const dataStartRowNumber = 2
      const treeColumn = worksheet.getColumn(1)
      treeColumn.eachCell({ includeEmpty: false }, (cell: any, rowNumber: number) => {
        if (rowNumber < dataStartRowNumber) return
        const rowData = exportRows[rowNumber - dataStartRowNumber]
        if (!rowData) return
        const level = Number(rowData._level || 0)
        if (level > 0) {
          const sourceRow = rowData._row || rowData
          cell.value = `${'    '.repeat(level)}${sourceRow.name ?? cell.value ?? ''}`
        }
      })
      worksheet.eachRow((row: any, rowNumber: number) => {
        const rowData = rowNumber >= dataStartRowNumber ? exportRows[rowNumber - dataStartRowNumber] : null
        row.eachCell((cell: any, cellNumber: number) => {
          if (rowData) {
            applyExportNumberCell(cell, rowData._row || rowData, exportColumns[cellNumber - 1])
          }
          if (rowData && Number(rowData._level || 0) === 0) {
            cell.font = { ...cell.font, bold: true }
          }
          cell.border = {
            top: { style: 'thin', color: { argba: 'FF000000' } },
            left: { style: 'thin', color: { argba: 'FF000000' } },
            bottom: { style: 'thin', color: { argba: 'FF000000' } },
            right: { style: 'thin', color: { argba: 'FF000000' } }
          }
        })
      })
    }
  })
}

/** 一键展开到指定层级 */
const expandByLevelHandle = async (command: string) => {
  const $grid = tableRef.value?.gridRef
  if (!$grid || !tableColumns.length) return
  try {
    if (command.includes('ALL')) {
      await $grid.setAllTreeExpand?.(true)
    } else {
      const level = parseInt(command.split('_')[1], 10)
      if (!Number.isFinite(level) || level < 1) {
        ElMessage.warning('展开层级参数无效')
        return
      }
      // vxe-grid 提供 setTreeExpandLevels 按层级展开
      if (typeof $grid.setTreeExpandLevels === 'function') {
        await $grid.setTreeExpandLevels(level)
      } else {
        await $grid.setAllTreeExpand?.(true)
      }
    }
  } catch (e) {
    ElMessage.error('展开失败，请稍后重试')
  }
}

/** 加载公共代码（展开层级） */
const getPublicCode = async () => {
  try {
    const res = await getPublicCodeList({ codes: ['ZKCJ'] })
    if (res.success && res.data) {
      formList.ZKCJ = res.data['ZKCJ'] || []
      return
    }
    ElMessage.error(res.msg)
  } catch {
    ElMessage.error('公共代码加载失败，请稍后重试')
  }
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
    // 表格在 isShowPage 置 true 后才挂载（request-auto 为 false），
    // 这里等挂载完成后主动发起首次根查询：拉动态表头 + 根节点数据。
    await nextTick()
    await tableRef.value?.getTableList()
  } catch (e) {
    console.error(e)
  }
}

/** 搜索列定义 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'ydStart',
    label: '预算期间',
    search: {
      el: 'date-picker',
      order: 1,
      defaultValue: defaultRange.ydStart,
      props: {
        type: 'month',
        valueFormat: 'YYYY-MM',
        format: 'YYYY-MM',
        clearable: false,
        placeholder: '开始月份'
      }
    }
  },
  {
    prop: 'ydEnd',
    label: '至',
    search: {
      el: 'date-picker',
      order: 2,
      defaultValue: defaultRange.ydEnd,
      props: {
        type: 'month',
        valueFormat: 'YYYY-MM',
        format: 'YYYY-MM',
        clearable: false,
        placeholder: '结束月份'
      }
    }
  }
])

const initParams = async () => {
  await getPublicCode()
  userDialogRef.value?.getUser()
}

onMounted(() => {
  initParams()
})
</script>

<style scoped lang="less">
@import './css/xmysylb.less';
</style>
