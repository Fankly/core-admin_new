<!-- 项目预计完成数填报统计表 -->
<template>
  <div class="container" v-if="isShowPage">
    <div class="operation">
      <el-button size="small" plain type="primary" @click="handleExpandAll">一键展开</el-button>
      <el-button size="small" plain type="primary" @click="handleExport">导 出</el-button>
    </div>
    <div class="table-main">
      <div class="form">
        <el-form>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="年份：">
                <el-date-picker
                  style="width: 100%"
                  v-model="formData.nd"
                  type="year"
                  format="YYYY"
                  value-format="YYYY"
                  clearable
                  placeholder="请选择年份"
                  @change="changeNdHandle"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="任务名称：">
                <el-select style="width: 100%" v-model="formData.rwId" clearable placeholder="请选择">
                  <el-option v-for="item in taskList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级单位：">
                <el-select style="width: 100%" v-model="formData.yjdw" clearable placeholder="请选择" @change="changeYjdwHandle">
                  <el-option v-for="item in yjdwList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：">
                <el-select style="width: 100%" v-model="formData.ejdw" clearable placeholder="请选择">
                  <el-option v-for="item in ejdwList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <div class="search">
                <el-button size="small" plain type="primary" @click="getDataHandle">查 询</el-button>
                <el-button size="small" plain @click="resetDataHandle">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="table">
        <vxe-grid
          ref="gridRef"
          class="mytable-style"
          v-bind="gridOptions"
          :columns="tableColumns"
          :data="tableData"
          :cell-style="cellStyle"
          :row-style="rowStyle"
          @cell-click="cellClickHandle"
        ></vxe-grid>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <xmDetailModal ref="xmDetailModalRef" />
</template>

<script lang="ts">
export default {
  name: '/lyg/finishXm/xmyjwcstbtjb/index'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, reactive, ref, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VxeGridProps, VxeTableDefines } from 'vxe-table'
import xmDetailModal from '@/views/lyg/finishXm/components/xmDetailModal/index.vue'
import { finishXmTjData, finishXmTjExport, listRwByNd } from '@/api/lyg/finishXm'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import { usePage } from '@/hooks/useUser'
import { useStore } from '@/store/business'
import { useRoute } from 'vue-router'

interface ListValue {
  code: string
  name: string
}

const userDialogRef = ref()
const gridRef = ref()
const xmDetailModalRef = ref()
const isShowPage = ref(false)
const userInfo = ref<any>()
const tableData = ref<any[]>([])
const taskList = ref<any[]>([])
const yjdwList = ref<ListValue[]>([])
const ejdwList = ref<ListValue[]>([])
const exportParams = ref<any>({})
const store = useStore()
const route = useRoute()

const formData = reactive<any>({
  nd: new Date().getFullYear().toString(),
  rwId: '',
  yjdw: '',
  ejdw: ''
})

const gridOptions = reactive<VxeGridProps<any>>({
  border: true,
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: { height: 32 },
  columnConfig: { resizable: true },
  size: 'mini',
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    childrenField: 'children',
    rowField: 'id',
    expandAll: false,
    loadMethod: ({ row }: any) => requestTableRowsByParent(row.id)
  }
})

const tableColumns = reactive<any[]>([
  { field: 'name', title: '归口部门', minWidth: 160, treeNode: true, headerAlign: 'center', align: 'left' },
  { field: 'xmlxmc', title: '项目类型', minWidth: 160 },
  {
    field: 'ndys',
    title: '项目年度预算',
    width: 150,
    headerAlign: 'center',
    align: 'right',
    formatter: ({ cellValue }: any) => formatNumValue(cellValue, 2)
  },
  {
    field: 'ndfs',
    title: '项目年度发生',
    width: 150,
    headerAlign: 'center',
    align: 'right',
    formatter: ({ cellValue }: any) => formatNumValue(cellValue, 2)
  },
  { field: 'xmsl', title: '项目数量', width: 110 },
  { field: 'ytbsl', title: '应填报数量', width: 120 },
  { field: 'ytbslDone', title: '已填报数量', width: 120 },
  {
    field: 'yjwcz',
    title: '预计完成值',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => formatNumValue(cellValue, 2)
  }
])

/** 应填报/已填报数量列渲染为可点击链接 */
const cellStyle = ({ row, column }: any) => {
  if ((column.field === 'ytbsl' || column.field === 'ytbslDone') && row.id != 'TOTAL') {
    return { color: '#00706b', cursor: 'pointer' }
  }
  return {}
}

/** 总计行加粗 */
const rowStyle = ({ row }: any) => {
  if (row?.id === 'TOTAL') {
    return { fontWeight: 'bold' }
  }
  return {}
}

// ========== 数据加载 ==========
/** 根节点 parentId：首次进入按空串查询顶层 */
const ROOT_PARENT_ID = ''

/** 行数据转换：后端 leaf=false 表示有下级，vxe 的 hasChildField 需要 true 才允许展开 */
const mapTableRows = (rows: any[] = []) =>
  rows.map((item: any) => ({
    ...item,
    leaf: item.leaf === false
  }))

/** 按父级 id 查询子节点（供根查询、懒加载、一键展开复用） */
const requestTableRowsByParent = async (parentId: string, options: { showError?: boolean } = {}): Promise<any[]> => {
  const { showError = true } = options
  try {
    const res: any = await finishXmTjData({ ...formData, parentId })
    if (res.success) return mapTableRows(res.data || [])
    if (showError) ElMessage.error(res.msg)
    return []
  } catch (e) {
    console.error(e)
    if (showError) ElMessage.error('数据加载失败，请稍后重试')
    return []
  }
}

const getDataHandle = async () => {
  gridOptions.loading = true
  exportParams.value = { ...formData }
  try {
    tableData.value = await requestTableRowsByParent(ROOT_PARENT_ID)
  } finally {
    gridOptions.loading = false
  }
}

const resetDataHandle = async () => {
  formData.nd = new Date().getFullYear().toString()
  formData.rwId = ''
  formData.yjdw = ''
  formData.ejdw = ''
  ejdwList.value = []
  await getDataHandle()
}

// ========== 单位联动 ==========
const getYjdwDataList = async () => {
  try {
    const res: any = await getYjdwList({ bmId: userInfo.value?.specialorgid, dwId: userInfo.value?.org_id })
    if (res.success) yjdwList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const changeNdHandle = async () => {
  formData.rwId = ''
  const task: any = await listRwByNd({ nd: formData.nd })
  if (task.success) taskList.value = task.data
}

const changeYjdwHandle = async (val: string) => {
  formData.ejdw = ''
  ejdwList.value = []
  if (!val) return
  try {
    const res: any = await getEjdwList({
      YJDW: val,
      parentCode: val,
      bmId: userInfo.value?.specialorgid,
      dwId: userInfo.value?.org_id
    })
    if (res.success) ejdwList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

// ========== 一键展开 ==========
const isExpanding = ref(false)
const EXPAND_YIELD_INTERVAL = 40
const EXPAND_PRELOAD_CONCURRENCY = 4
const expandTaskId = ref(0)

const isExpandTaskCanceled = (taskId: number) => taskId !== expandTaskId.value

const yieldToMainThread = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** 并发预加载各级子节点写入 row.children，避免逐行触发懒加载造成的卡顿 */
const preloadLazyDataByLevel = async (data: any[], state: { count: number }, taskId: number): Promise<void> => {
  const queue: Array<{ row: any }> = []
  for (const row of data) {
    if (row && typeof row === 'object' && row.leaf) {
      queue.push({ row })
    }
  }
  let cursor = 0
  const worker = async () => {
    while (true) {
      if (isExpandTaskCanceled(taskId)) return
      if (cursor >= queue.length) return
      const current = queue[cursor]
      cursor += 1
      const children = await requestTableRowsByParent(current.row.id, { showError: false })
      if (isExpandTaskCanceled(taskId)) return
      current.row.children = children
      state.count += 1
      if (state.count % EXPAND_YIELD_INTERVAL === 0) {
        await yieldToMainThread()
      }
      for (const child of children) {
        if (child && typeof child === 'object' && child.leaf) {
          queue.push({ row: child })
        }
      }
    }
  }
  const workerCount = Math.max(1, Math.min(EXPAND_PRELOAD_CONCURRENCY, queue.length || 1))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}

/** 递归展开已预加载的行 */
const expandToLevel = async (data: any[], $table: any, state: { count: number }, visitedRows: WeakSet<object>, taskId: number): Promise<void> => {
  for (const row of data) {
    if (isExpandTaskCanceled(taskId)) return
    if (!row || typeof row !== 'object') continue
    if (visitedRows.has(row)) continue
    visitedRows.add(row)
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      state.count += 1
      if (state.count % EXPAND_YIELD_INTERVAL === 0) {
        await yieldToMainThread()
      }
      if (row.children) {
        await expandToLevel(row.children, $table, state, visitedRows, taskId)
      }
    }
  }
}

const handleExpandAll = async () => {
  if (isExpanding.value) return
  const taskId = ++expandTaskId.value
  isExpanding.value = true
  gridOptions.loading = true
  try {
    const rootRows = await requestTableRowsByParent(ROOT_PARENT_ID, { showError: false })
    if (isExpandTaskCanceled(taskId)) return
    await preloadLazyDataByLevel(rootRows, { count: 0 }, taskId)
    if (isExpandTaskCanceled(taskId)) return
    tableData.value = rootRows
    await nextTick()
    if (isExpandTaskCanceled(taskId)) return
    const $table = gridRef.value
    if (!$table) return
    await $table.clearTreeExpand()
    await expandToLevel(rootRows, $table, { count: 0 }, new WeakSet<object>(), taskId)
  } finally {
    if (!isExpandTaskCanceled(taskId)) {
      gridOptions.loading = false
      isExpanding.value = false
    }
  }
}

// ========== 导出 ==========
const handleExport = () => {
  apiExportHandle({ ...exportParams.value }, '项目预计完成数填报统计表', finishXmTjExport)
}

// ========== 明细弹窗 ==========
const cellClickHandle = ({ row, column }: VxeTableDefines.CellClickParams) => {
  const field = column.field
  console.log(row, 'row')
  if ((field !== 'ytbsl' && field !== 'ytbslDone') || row.id == 'TOTAL') return
  xmDetailModalRef.value?.acceptParams({
    mode: field === 'ytbslDone' ? 'done' : 'ytb',
    tbzt: field === 'ytbslDone' ? '1' : '',
    name: field === 'ytbslDone' ? '预计完成数填报明细' : '应填报预计完成数项目明细',
    nd: formData.nd,
    rwId: formData.rwId,
    qkjgkbm: row.gkbm,
    qkjxmlxbm: row.xmlxbm,
    bmId: userInfo.value?.specialorgid,
    dwId: userInfo.value?.org_id
  })
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      await getYjdwDataList()
      await changeNdHandle()
      await getDataHandle()
    } else {
      ElMessage.warning('无权限访问')
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 生命周期 ==========
/** 接收任务分发页跳转带入的年度与任务参数，命中则覆盖默认筛选条件并自动查询 */
const initByRouteParams = async () => {
  isShowPage.value = false
  if (JSON.stringify(route.params) === '{}') return
  const { roleId, specialorgid, spRoleId, status, roleCode, dwId, nd, rwId }: any = route.params
  const isRoel = await usePage(roleId, specialorgid, spRoleId)
  if (isRoel) {
    isShowPage.value = true
    await nextTick()
    userInfo.value = {
      role_id: roleId,
      code: roleCode,
      org_id: dwId,
      specialorgid: specialorgid
    }
    isShowPage.value = true
    await nextTick()
    await getYjdwDataList()
    if (nd) formData.nd = nd
    await changeNdHandle()
    if (rwId) formData.rwId = rwId
    await getDataHandle()
  } else {
    await userDialogRef.value?.getUser()
  }
}

onMounted(async () => {
  if (JSON.stringify(route.params) != '{}') {
    await initByRouteParams()
  } else {
    isShowPage.value = false
    await userDialogRef.value?.getUser()
  }
})

watch(
  () => route.params,
  (newParams, oldParams) => {
    if (JSON.stringify(newParams) === '{}') return
    if (JSON.stringify(newParams) === JSON.stringify(oldParams)) return
    initByRouteParams()
  },
  { deep: true }
)
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
