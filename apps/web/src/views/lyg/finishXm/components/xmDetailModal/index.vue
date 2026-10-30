<!-- 项目明细弹窗：应填报 / 已填报 -->
<template>
  <vxe-modal resize show-zoom v-model="isShowModal" destroy-on-close :title="modalTitle" fullscreen width="50%" @close="handleClose">
    <ProTable
      :key="`${mode}_${searchVersion}`"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="mode !== 'done'"
      :columns="tableColumns"
      ref="proTableRef"
      stripe
      :loading="loading"
      height="100%"
    >
      <template #tableHeader>
        <el-button @click="handleExport" size="small" plain type="primary">导 出</el-button>
      </template>
    </ProTable>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'finishXmXmDetailModal'
}
</script>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, h } from 'vue'
import ProTable from '@/components/ProTablesource/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import { finishXmDetailPage, finishXmDetailExport, finishXmYtbPage, finishXmYtbExport, listRwByNd } from '@/api/lyg/finishXm'
import { getPublicData } from '@/api/common'
import { getSubProtypeTreeByXmlx } from '@/api/lyg/index'
import { getSgbm } from '@/api/service/requirement'
import { getYjdwList } from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'

/** 弹窗模式：ytb-应填报项目明细；done-已填报明细 */
type DetailMode = 'ytb' | 'done'

const isShowModal = ref(false)
const loading = ref(false)
const proTableRef = ref<any>(null)
const modalTitle = ref('应填报预计完成数项目明细')
const mode = ref<DetailMode>('ytb')
const getParams = ref<any>({})
const exportParams = ref<any>({})

// ========== 已填报明细查询条件下拉数据 ==========
const yjdwList = ref<any[]>([]) // 一级单位
const gkbmList = ref<any[]>([]) // 归口部门
const projectTypeList = ref<any[]>([]) // 项目类型树
const taskList = ref<any[]>([]) // 任务名称
const proTypeProps = { label: 'name', children: 'children', value: 'id' }
// 单条数据时默认选中且不可编辑的字段标记
const disabledMap = reactive<{ yjdw: boolean; gkbm: boolean; xmlx: boolean }>({ yjdw: false, gkbm: false, xmlx: false })
// 搜索表单版本号：done 模式下数据加载完毕后自增，强制 ProTable 重新挂载以刷新下拉枚举
const searchVersion = ref(0)

// ========== 表格相关 ==========
const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = async (param: any) => {
  loading.value = true
  const params = { ...param, ...getParams.value }
  exportParams.value = { ...params }
  const api = mode.value === 'done' ? finishXmYtbPage : finishXmDetailPage
  try {
    return await api({ ...params })
  } catch (e) {
    console.error(e)
    return { data: { records: [], total: 0 } }
  } finally {
    loading.value = false
  }
}

// ========== 导出 ==========
const handleExport = () => {
  const isDone = mode.value === 'done'
  const fileName = isDone ? '预计完成数填报明细' : '应填报预计完成数项目明细'
  const api = isDone ? finishXmYtbExport : finishXmDetailExport
  apiExportHandle({ ...exportParams.value }, fileName, api)
}

/** 关闭弹窗 */
const handleClose = () => {
  isShowModal.value = false
  // 清空下拉数据，避免下次打开残留
  yjdwList.value = []
  gkbmList.value = []
  projectTypeList.value = []
  taskList.value = []
  disabledMap.yjdw = false
  disabledMap.gkbm = false
  disabledMap.xmlx = false
}

// ========== 已填报明细查询条件下拉数据加载 ==========
/** 加载一级单位 */
const loadYjdwData = async () => {
  yjdwList.value = []
  const res: any = await getYjdwList({ bmId: getParams.value.bmId, dwId: getParams.value.dwId })
  if (res.success && res.data?.length) {
    yjdwList.value = res.data
  }
}

/** 加载归口部门（依赖一级单位 YJDW） */
const loadGkbm = async (yjdwVal: string) => {
  gkbmList.value = []
  if (!yjdwVal) return
  const res: any = await getSgbm({ YJDW: yjdwVal, parentCode: yjdwVal, bmId: getParams.value.bmId, dwId: getParams.value.dwId })
  if (res.success && res.data?.length) {
    gkbmList.value = res.data
  }
}

/** 加载项目类型树（依赖项目大类 xmlx） */
const loadProjectType = async (xmlxVal: string) => {
  projectTypeList.value = []
  if (!xmlxVal) return
  const res: any = await getSubProtypeTreeByXmlx({ xmlx: xmlxVal })
  if (res.success && res.data?.length) {
    projectTypeList.value = res.data
  }
}

/** 加载任务名称（依赖年份 nd） */
const loadTaskList = async () => {
  taskList.value = []
  if (!getParams.value.nd) return
  const res: any = await listRwByNd({ nd: getParams.value.nd })
  if (res.success && res.data?.length) {
    taskList.value = res.data
  }
}

/** 一级单位变化：联动归口部门 */
const onYjdwChange = async (val: string) => {
  const sp = proTableRef.value?.searchParam
  if (sp) sp.qkjgkbm = ''
  gkbmList.value = []
  disabledMap.gkbm = false
  if (!val) return
  await loadGkbm(val)
  if (gkbmList.value.length === 1) {
    if (sp) sp.qkjgkbm = gkbmList.value[0].code
    disabledMap.gkbm = true
  }
}

/** 打开弹窗 */
const acceptParams = async (params: any) => {
  mode.value = params.mode === 'done' ? 'done' : 'ytb'
  getParams.value = { ...params }
  modalTitle.value = params.name || (mode.value === 'done' ? '预计完成数填报明细' : '应填报预计完成数项目明细')
  // 重置下拉状态
  disabledMap.yjdw = false
  disabledMap.gkbm = false
  disabledMap.xmlx = false
  yjdwList.value = []
  gkbmList.value = []
  projectTypeList.value = []
  taskList.value = []

  // 缓存 done 模式初始搜索值（待 ProTable 重新挂载后回填）
  const initSearch: any = {}

  if (mode.value === 'done') {
    // 加载任务名称
    await loadTaskList()
    // 加载一级单位
    await loadYjdwData()
    let yjdwDefault = ''
    if (yjdwList.value.length === 1) {
      yjdwDefault = yjdwList.value[0].code
      disabledMap.yjdw = true
      // 联动加载归口部门
      await loadGkbm(yjdwDefault)
      if (gkbmList.value.length === 1) {
        initSearch.qkjgkbm = gkbmList.value[0].code
        disabledMap.gkbm = true
      }
    }
    // 加载项目类型树（大类默认成本）
    await loadProjectType('CB')
    if (getParams.value.qkjxmlxbm) {
      disabledMap.xmlx = true
    }
    // 回填上级带入值（单条默认选中优先，否则用带入值）
    initSearch.zyear = params.nd ?? ''
    initSearch.rwId = params.rwId ?? ''
    initSearch.xmlx = 'CB'
    if (!initSearch.qkjgkbm) initSearch.qkjgkbm = params.qkjgkbm ?? ''
    if (!initSearch.qkjxmlxbm) initSearch.qkjxmlxbm = params.qkjxmlxbm ?? ''
    if (yjdwDefault) initSearch.qkjyjdw = yjdwDefault
  }

  // 先打开弹窗并刷新版本号，触发 ProTable 以已填充的下拉数据重新挂载
  isShowModal.value = true
  searchVersion.value++
  await nextTick()

  if (mode.value === 'done') {
    const sp = proTableRef.value?.searchParam
    if (sp) {
      Object.keys(initSearch).forEach((k) => {
        sp[k] = initSearch[k]
      })
    }
    // 触发首次查询（带入初始条件）
    proTableRef.value?.getTableList()
  }
}

defineExpose({ acceptParams })

// ========== 表格列配置 ==========
const baseColumns: any[] = [
  { prop: 'pspid', label: '项目编码', width: 150 },
  { prop: 'post1', label: '项目名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'zyear', label: '年度', width: 80 },
  { prop: 'qkjyjdwName', label: '一级单位', width: 150 },
  { prop: 'qkjejdwName', label: '二级单位', width: 150 },
  { prop: 'applyCenterName', label: '实施部门', width: 180 },
  { prop: 'qkjgkbmName', label: '项目归口部门', width: 180 },
  { prop: 'qkjxmlxmc', label: '项目类型', width: 180 },
  { prop: 'projectManagerName', label: '责任人', width: 120 },
  {
    prop: 'erpztys',
    label: '年度预算（万元）',
    width: 160,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.erpztys, 6)
  }
]

// 已填报明细额外展示年度结算金额、预计完成数
const doneExtraColumns: any[] = [
  {
    prop: 'settlementAmt',
    label: '年度结算金额（万元）',
    width: 170,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.settlementAmt, 6)
  },
  {
    prop: 'yjwcz',
    label: '预计完成数（万元）',
    width: 160,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.yjwcz, 6)
  }
]

// 已填报明细查询条件列（仅用于搜索表单，不展示为表格列）
// 用 computed 使 disabled 等响应式值随 disabledMap 变化刷新
const searchColumns = computed<any[]>(() => [
  {
    prop: 'zyear',
    label: '年份',
    isShow: false,
    search: { el: 'select', order: 1 },
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'rwId',
    label: '任务名称',
    isShow: false,
    search: { el: 'select', order: 2 },
    enum: taskList,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'qkjyjdw',
    label: '一级单位',
    isShow: false,
    search: { el: 'select', order: 3, props: { onChange: onYjdwChange, disabled: disabledMap.yjdw } },
    enum: yjdwList,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'qkjgkbm',
    label: '归口部门',
    isShow: false,
    search: { el: 'select', order: 4, props: { disabled: true } },
    enum: gkbmList,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'qkjxmlxbm',
    label: '项目类型',
    isShow: false,
    search: {
      order: 6,
      render: (scope: any) => {
        return h(ElTreeSelect, {
          clearable: true,
          data: projectTypeList.value,
          props: proTypeProps,
          nodeKey: 'id',
          modelValue: scope.modelValue,
          disabled: disabledMap.xmlx
        })
      }
    }
  }
])

const tableColumns = computed<any[]>(() => {
  const cols = [...baseColumns]
  if (mode.value === 'done') {
    cols.push(...doneExtraColumns)
    // 注入查询条件列（仅 done 模式有搜索表单）
    cols.push(...searchColumns.value)
  }
  cols.push({ prop: 'closeStatus', label: '项目关闭状态', width: 120 })
  return cols
})
</script>
