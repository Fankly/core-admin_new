<template>
  <div class="modalDy">
    <div class="operation" v-if="xmid">
      <!-- <el-button type="primary" size="mini" plain @click="openModal('add')">新 增</el-button> -->
      <el-button v-if="!isDisabled" type="primary" size="mini" plain @click="openModal('edit')">编 辑</el-button>
      <el-button type="primary" size="mini" plain @click="openModal('view')">查 看</el-button>
    </div>
    <div class="table">
      <vxe-table
        ref="vxeTableRef"
        :cell-style="cellStyle"
        @cell-click="cellClick"
        border
        stripe
        resizable
        show-overflow
        height="100%"
        :data="tableData"
        :row-config="{ height: 32 }"
      >
        <vxe-column align="center" type="checkbox" width="50" fixed="left" />
        <vxe-column align="center" type="seq" width="50" title="序号" fixed="left" />
        <vxe-column
          v-for="column in columns"
          :key="column.field"
          :field="column.field"
          :title="column.title"
          :width="column.width"
          :fixed="column.fixed"
          :formatter="column.formatter"
          :align="column.align || 'center'"
          header-align="center"
        />
      </vxe-table>
    </div>
  </div>
  <FormTableModal
    ref="formModalRef"
    :title="modalTitle"
    :mode="mode"
    :fields="formFields"
    :data="formData"
    @save="handleSave"
    @close="handleClose"
    @fieldChange="handleFieldChange"
    :label-width="'138px'"
  >
    <template #zymc="{ formData: modalFormData, disabled, setFieldValue }">
      <el-input
        :model-value="modalFormData.zymc"
        placeholder="请选择作业名称"
        readonly
        clearable
        :disabled="disabled"
        @click="handleZymcClick(setFieldValue, modalFormData)"
        @clear="clearStandardCost(setFieldValue)"
      >
        <template #suffix>
          <i class="el-icon-arrow-down"></i>
        </template>
      </el-input>
    </template>
  </FormTableModal>
  <vxe-modal
    v-model="standardSelectorVisible"
    title="选择作业标准成本"
    width="90%"
    height="760"
    position="center"
    resize
    show-zoom
    show-footer
    :loading="standardSelectorLoading"
    @close="closeStandardSelector"
  >
    <div class="standard-selector-wrap">
      <splitpane :splitSet="standardSplitConfig">
        <template #paneL>
          <div class="standard-selector__left">
            <div class="standard-selector__title">作业标准分类目录</div>
            <el-input
              v-model="standardFilterText"
              placeholder="请输入目录名称"
              prefix-icon="el-icon-search"
              clearable
              class="standard-selector__search"
              @input="filterStandardTree"
            />
            <el-tree
              ref="standardTreeRef"
              :data="standardTreeData"
              node-key="id"
              :props="standardTreeProps"
              :expand-on-click-node="false"
              :highlight-current="true"
              :filter-node-method="filterStandardTreeNode"
              @node-click="handleStandardNodeClick"
            >
              <template #default="{ node, data }">
                <span class="standard-tree-node">
                  <i :class="data.nodeLevel === 3 || node.isLeaf ? 'el-icon-document' : 'el-icon-folder'"></i>
                  <span :title="data.dirName">{{ data.dirName }}</span>
                </span>
              </template>
            </el-tree>
          </div>
        </template>
        <template #paneR>
          <div class="standard-selector__right">
            <div class="standard-selector__search-bar">
              <span class="standard-selector__search-label">作业编码：</span>
              <ReMultipleText
                v-model="standardQuery.zybm"
                placeholder="请输入作业编码,多个用逗号分隔"
                dialog-title="批量输入作业编码"
                class="standard-selector__search-item"
                @change="handleStandardSearch"
              />
              <span class="standard-selector__search-label">作业名称：</span>
              <el-input
                v-model="standardQuery.zymc"
                placeholder="请输入作业名称"
                clearable
                class="standard-selector__search-item"
                @keyup.enter="handleStandardSearch"
                @clear="handleStandardSearch"
              />
              <el-button type="primary" @click="handleStandardSearch">查 询</el-button>
              <el-button @click="resetStandardSearch">重 置</el-button>
            </div>
            <div class="standard-selector__selected">
              <span class="standard-selector__selected-label">已选作业:</span>
              <el-tooltip v-if="selectedStandardNames.length" effect="dark" placement="top-start" :content="selectedStandardNamesText">
                <span class="standard-selector__selected-names">{{ selectedStandardNamesText }}</span>
              </el-tooltip>
              <span v-else class="standard-selector__selected-empty">暂未选择</span>
              <span class="standard-selector__selected-count">共 {{ selectedStandardNames.length }} 项</span>
              <el-button type="text" :disabled="!selectedStandardNames.length" @click="clearStandardSelection">清 空</el-button>
            </div>
            <div class="standard-selector__table">
              <vxe-grid
                ref="standardGridRef"
                v-bind="standardGridOptions"
                @checkbox-change="handleStandardCheckboxChange"
                @checkbox-all="handleStandardCheckboxChange"
              >
                <template #mlcjbm="{ row }">
                  <el-tooltip effect="dark" placement="bottom" popper-class="project-info-full-tooltip" :enterable="true">
                    <div style="cursor: pointer; color: var(--color-primary)">
                      {{ `${row.zybm || ''}` }}
                    </div>
                    <template #content>
                      <div class="project-info-full-tooltip__content">{{ `${row.dirPath || ''}` }}</div>
                    </template>
                  </el-tooltip>
                </template>
                <template #mlcjmc="{ row }">
                  <el-tooltip effect="dark" placement="bottom" popper-class="project-info-full-tooltip" :enterable="true">
                    <div style="cursor: pointer; color: var(--color-primary)">
                      {{ `${row.zymc || ''}` }}
                    </div>
                    <template #content>
                      <div class="project-info-full-tooltip__content">{{ `${row.dirPath || ''}` }}</div>
                    </template>
                  </el-tooltip>
                </template>
              </vxe-grid>
            </div>
            <div class="standard-selector__pagination">
              <el-pagination
                :current-page="standardPage.currentPage"
                background
                :page-sizes="[20, 50, 100, 200]"
                :page-size="standardPage.pageSize"
                :total="parseInt(standardPage.total + '')"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleStandardSizeChange"
                @current-change="handleStandardCurrentChange"
              />
            </div>
          </div>
        </template>
      </splitpane>
    </div>
    <template #footer>
      <div class="standard-selector__footer">
        <el-button type="primary" @click="confirmStandardSelector">确 定</el-button>
        <el-button @click="closeStandardSelector">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'dytable'
}
</script>
<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import FormTableModal, { FormField } from '@/components/FormTableModal'
import VXETable from 'vxe-table'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { saveOrUpdateHandler, deleteDyHandler } from '@/api/service/xmcs/index'
import { decimal2Rules } from '@/utils/rules'
import { queryDir, query as queryStandardCost, queryIdsByDirIdAndZybm, queryDirPathByName } from '@/api/service/xmcs/workStandardCostConfig'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import { ReMultipleText } from '@/components/ReMultipleText'
import { formatNumValue } from '@/utils/utils'

interface Props {
  tableData: any[]
  xmid: string
  userInfo?: Record<string, any>
  creatorAccount: string
  zxcsspstatus: string
  isDisabled: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['saveDy'])
const modalTitle = ref<string>('')
const formFields = ref<FormField[]>([
  {
    prop: 'id',
    label: 'id',
    type: 'hidden'
  },
  {
    prop: 'sheetname',
    label: '动因',
    type: 'input',
    disabled: true
  },
  {
    prop: 'dw',
    label: '单位',
    type: 'input',
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus == '2',
    required: true
  },
  {
    prop: 'sszq',
    label: '实施周期',
    type: 'input',
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus == '2',
    required: true
  },
  {
    prop: 'sfxj',
    label: '是否询价',
    type: 'select',
    apiConfig: {
      method: 'get',
      url: 'commonCode/getData',
      params: { code: 'GY_SF' },
      valueField: 'code',
      labelField: 'name'
    },
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus == '2',
    required: true
  },
  {
    prop: 'gzllyyj',
    label: '工作量来源依据',
    type: 'select',
    apiConfig: {
      method: 'get',
      url: 'commonCode/getData',
      params: { code: 'NUMSOURCE_COM' },
      valueField: 'code',
      labelField: 'name'
    },
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus == '2',
    required: true
  },
  {
    prop: 'lscbpjz',
    label: '历史成本\n(单位 :元)',
    type: 'input',
    rules: decimal2Rules(),
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus != '0',
    required: true
  },
  {
    prop: 'gzytzdj',
    label: '各专业调整参考价\n(单位 :元)',
    type: 'input',
    rules: decimal2Rules(),
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus != '0',
    required: true
  },
  {
    prop: 'gwbzjg',
    label: '国网标准\n(单位 :元)',
    type: 'input',
    disabled: true,
    required: false
  },
  {
    prop: 'zydetailid',
    label: '作业明细id',
    type: 'hidden'
  },
  {
    prop: 'zymc',
    label: '作业名称',
    type: 'slot',
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus != '0',
    required: true
  },
  {
    prop: 'dyyj',
    label: '预警',
    type: 'input',
    disabled: true,
    required: false
  },
  {
    prop: 'bz',
    label: '备注',
    type: 'input',
    disabled: props.creatorAccount != 'fangy7' && props.zxcsspstatus == '2',
    required: false
  }
])
const mode = ref<'add' | 'edit' | 'view'>('add')
const formData = ref<any>({})
const gzljnrList = ref<any[]>([])
const formModalRef = ref<InstanceType<typeof FormTableModal>>()
const vxeTableRef = ref()
const standardTreeRef = ref<InstanceType<typeof ElTree>>()
const standardGridRef = ref()
const standardSelectorVisible = ref(false)
const standardSelectorLoading = ref(false)
const standardFilterText = ref('')
const standardTreeData = ref<any[]>([])
const standardCurrentNode = ref<any>(null)
// 勾选状态以 dirId::zybm 复合键累积，支持跨末级节点同时选中且避免不同目录下相同作业编码冲突
const selectedStandardKeySet = ref<Set<string>>(new Set())
const selectedStandardKeyRowMap = ref<Map<string, any>>(new Map())
const standardFieldSetter = ref<((field: string, value: any) => void) | null>(null)
let zymcClickTimer: ReturnType<typeof setTimeout> | null = null
const ZYMC_DBLCLICK_DELAY = 250
// 打开选择器时缓存弹窗表单数据，确认作业名称后即可读取各专业调整单价做预警校验
const standardModalFormData = ref<Record<string, any> | null>(null)
const standardTreeProps = { children: 'children', label: 'dirName' }
const standardQuery = reactive({ zybm: '', zymc: '' })
const getStandardRowKey = (row: any) => `${row?.dirId ?? ''}::${row?.zybm ?? ''}`
// 已选作业名称（按 dirId::zybm 去重），用于顶部提示展示与清空操作
const selectedStandardNames = computed(() => {
  const names = [...selectedStandardKeyRowMap.value.values()].map((r: any) => r?.zymc).filter(Boolean)
  return [...new Set(names)]
})
const selectedStandardNamesText = computed(() => selectedStandardNames.value.join('、'))
// 明细请求序号：仅采用最后一次请求的结果，避免快速切换目录/翻页时旧响应覆盖新数据
let standardDetailRequestId = 0
const standardPage = reactive({
  currentPage: 1,
  pageSize: 200,
  total: 0
})
const standardSplitConfig = reactive<ContextProps>({
  minPercent: 18,
  maxPercent: 45,
  defaultPercent: 24,
  split: 'vertical'
})

const formatMoneyDecimal = (value: any) => {
  if (value === null || typeof value === 'undefined' || value === '') return ''
  const normalizedValue = typeof value === 'string' ? value.replace(/,/g, '').trim() : value
  if (normalizedValue === '') return ''
  const numberValue = Number(normalizedValue)
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : value
}

const moneyFormatter = ({ cellValue }: any) => formatMoneyDecimal(cellValue)

const parseMoneyValue = (value: any) => {
  if (value === null || typeof value === 'undefined' || value === '') return null
  const normalizedValue = typeof value === 'string' ? value.replace(/,/g, '').trim() : value
  if (normalizedValue === '') return null
  const numberValue = Number(normalizedValue)
  return Number.isFinite(numberValue) ? numberValue : null
}

const WARNING_TAG = '各专业调整参考价高于国网标准'

const isAdjustPriceExceedStandard = (data: any) => {
  const adjustPrice = parseMoneyValue(data?.gzytzdj)
  const gridStandardPrice = parseMoneyValue(data?.gwbzjg)
  return adjustPrice !== null && gridStandardPrice !== null && adjustPrice > gridStandardPrice
}

const cellStyle = ({ row, column }: any) => {
  if (column.title == '作业名称') {
    return {
      color: 'var(--color-primary)',
      cursor: 'pointer'
    }
  }
}

const cellClick = async ({ row, column }: any) => {
  if (column.title != '作业名称') return
  getDirDetail(row.zymc)
}

const showDirDetail = async (value: any) => {
  if (!value) return ElMessage.warning('请维护作业名称后再点击！')
  getDirDetail(value)
}

const handleZymcClick = (setFieldValue: (field: string, value: any) => void, modalFormData: Record<string, any>) => {
  if (zymcClickTimer) {
    clearTimeout(zymcClickTimer)
    zymcClickTimer = null
    showDirDetail(modalFormData.zymc)
    return
  }
  zymcClickTimer = setTimeout(() => {
    zymcClickTimer = null
    openStandardSelector(setFieldValue, modalFormData)
  }, ZYMC_DBLCLICK_DELAY)
}

const getDirDetail = async (zymc: string) => {
  const params = {
    zymc: zymc || ''
  }
  const res: any = await queryDirPathByName({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  await VXETable.modal.confirm(`${res.data || '暂未找到目录！'}`, '作业名称目录路径', { status: undefined })
}

const columns = reactive<any>([
  { field: 'sheetname', title: '动因', width: 120, fixed: 'left' },
  { field: 'gzljnr', title: '工作量及内容', width: 160 },
  { field: 'dw', title: '单位', width: 220 },
  { field: 'sszq', title: '实施周期', width: 160 },
  { field: 'sfxjName', title: '是否询价', width: 140 },
  { field: 'gzllyyjName', title: '工作量来源依据', width: 160 },
  { field: 'fourzerosixwcsjg', title: '406号文方法\n(单位 :元)', width: 200, align: 'right', formatter: moneyFormatter },
  { field: 'decsjg', title: '检修定额方法\n(单位 :元)', width: 200, align: 'right', formatter: moneyFormatter },
  { field: 'lscbpjz', title: '历史成本(单位 :元)\n(单位 :元)', width: 180, align: 'right', formatter: moneyFormatter },
  { field: 'bjjg', title: '比较结果', width: 160 },
  { field: 'zzywcbbz', title: '最终运维参考价\n(单位 :元)', width: 180, align: 'right', formatter: moneyFormatter },
  { field: 'gzytzdj', title: '各专业调整参考价\n(单位 :元)', width: 180, align: 'right', formatter: moneyFormatter },
  {
    field: 'gwbzjg',
    title: '国网标准\n(单位 :元)',
    width: 160,
    align: 'right',
    formatter({ row }: any) {
      if (typeof row.zymc === 'undefined' || row.zymc === null || row.zymc === '') return '-'
      return formatNumValue(row.gwbzjg.toString(), 2)
    }
  },
  { field: 'zymc', title: '作业名称', width: 180 },
  { field: 'dyyj', title: '预警', width: 160 },
  { field: 'dyBz', title: '备注', width: 120 }
])

const standardGridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  size: 'mini',
  rowConfig: { height: 32 },
  columnConfig: { resizable: true },
  checkboxConfig: { trigger: 'row', highlight: true },
  data: [],
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' },
    { field: 'zybm', title: '作业编码', width: 140, fixed: 'left', slots: { default: 'mlcjbm' } },
    { field: 'zymc', title: '作业名称', minWidth: 160, fixed: 'left', slots: { default: 'mlcjmc' } },
    { field: 'zynrms', title: '作业内容描述', minWidth: 200 },
    { field: 'dydj', title: '电压等级', width: 100 },
    { field: 'rl', title: '容量(KVA)', width: 100 },
    { field: 'sbdw', title: '设备单位', width: 100 },
    { field: 'rcjbm', title: '人材机编码', width: 140 },
    { field: 'rcjmc', title: '人材机名称', minWidth: 160 },
    { field: 'dw', title: '单位', width: 80 },
    { field: 'dj', title: '单价\n(单位 :元)', width: 100, align: 'right', formatter: ({ row }: any) => formatMoneyDecimal(row.dj) },
    { field: 'sl', title: '数量', width: 100, align: 'right' },
    { field: 'je', title: '金额\n(单位 :元)', width: 120, align: 'right', formatter: ({ row }: any) => formatMoneyDecimal(row.je) },
    { field: 'sortNo', title: '排序', width: 80 },
    { field: 'remark', title: '备注', minWidth: 160 }
  ]
})

const getStandardRoleParams = () => ({
  dwId: props.userInfo?.dwId || '',
  bmId: props.userInfo?.deptId || props.userInfo?.bmId || '',
  roleId: props.userInfo?.roleId || ''
})

const formatStandardMoneyFields = (row: any) => ({
  ...row,
  dj: formatMoneyDecimal(row?.dj),
  je: formatMoneyDecimal(row?.je)
})

const getStandardTreeData = async () => {
  standardSelectorLoading.value = true
  try {
    const res: any = await queryDir()
    if (!res.success) return ElMessage.error(res.msg)
    standardTreeData.value = Array.isArray(res.data) ? res.data : res.data?.records || []
  } catch (error) {
    ElMessage.error((error as Error).message || '查询作业标准分类目录失败')
  } finally {
    standardSelectorLoading.value = false
  }
}

const loadStandardDetail = async () => {
  if (!standardCurrentNode.value) {
    standardGridOptions.data = []
    standardPage.total = 0
    return
  }
  const requestId = ++standardDetailRequestId
  standardGridOptions.loading = true
  try {
    const res: any = await queryStandardCost({
      dirId: standardCurrentNode.value.id,
      ...getStandardRoleParams(),
      zybm: standardQuery.zybm.trim(),
      zymc: standardQuery.zymc.trim(),
      page: standardPage.currentPage,
      limit: standardPage.pageSize
    })
    // 丢弃过期响应：只有最后一次发起的请求才允许写入表格
    if (requestId !== standardDetailRequestId) return
    if (!res.success) return ElMessage.error(res.msg)
    const records = Array.isArray(res.data) ? res.data : res.data?.records || []
    standardGridOptions.data = records.map(formatStandardMoneyFields)
    // 分页片段：total 取后端返回的总条数，不能用当前页长度，否则分页控件页数算错
    standardPage.total = Number(res.data?.total ?? (Array.isArray(res.data) ? res.data.length : 0))
    await nextTick()
    restoreStandardCheckbox()
  } catch (error) {
    if (requestId !== standardDetailRequestId) return
    ElMessage.error((error as Error).message || '查询作业标准成本失败')
  } finally {
    if (requestId === standardDetailRequestId) standardGridOptions.loading = false
  }
}

const doOpenStandardSelector = async () => {
  standardSelectorVisible.value = true
  standardPage.currentPage = 1
  selectedStandardKeySet.value = new Set()
  selectedStandardKeyRowMap.value = new Map()
  standardCurrentNode.value = null
  standardGridOptions.data = []
  standardPage.total = 0
  standardQuery.zybm = ''
  standardQuery.zymc = ''
  await getStandardTreeData()
  await nextTick()
  standardTreeRef.value?.filter(standardFilterText.value)
}

const openStandardSelector = async (setFieldValue: (field: string, value: any) => void, modalFormData: Record<string, any>) => {
  standardFieldSetter.value = setFieldValue
  standardModalFormData.value = modalFormData
  if (!props.userInfo?.dwId || !(props.userInfo?.deptId || props.userInfo?.bmId) || !props.userInfo?.roleId) {
    return ElMessage.warning('当前用户角色信息缺失，无法查询作业标准成本')
  }
  await doOpenStandardSelector()
}

const closeStandardSelector = () => {
  standardSelectorVisible.value = false
}

const clearStandardCost = (setFieldValue: (field: string, value: any) => void) => {
  setFieldValue('zydetailid', [])
  setFieldValue('zymc', '')
  setFieldValue('gwbzjg', '')
}

const filterStandardTree = (val: string) => {
  standardTreeRef.value?.filter(val)
}

const filterStandardTreeNode = (value: string, data: any) => {
  if (!value) return true
  return (data.dirName || '').indexOf(value) !== -1
}

const handleStandardNodeClick = (data: any) => {
  // 支持跨末级节点同时选中：切换目录时保留已累积的勾选状态（以 dirId::zybm 复合键存储），
  // 重新加载明细后由 restoreStandardCheckbox 回显属于该目录的勾选
  standardCurrentNode.value = data
  standardPage.currentPage = 1
  standardQuery.zybm = ''
  standardQuery.zymc = ''
  loadStandardDetail()
}

const restoreStandardCheckbox = () => {
  const $table = standardGridRef.value
  if (!$table) return
  const set = selectedStandardKeySet.value
  if (set.size === 0) return
  const rows = (standardGridOptions.data || []).filter(
    (r: any) => r.zybm !== undefined && r.zybm !== null && r.zybm !== '' && set.has(getStandardRowKey(r))
  )
  if (rows.length > 0) $table.setCheckboxRow(rows, true)
}

const handleStandardSearch = () => {
  standardPage.currentPage = 1
  loadStandardDetail()
}

const resetStandardSearch = () => {
  standardQuery.zybm = ''
  standardQuery.zymc = ''
  standardPage.currentPage = 1
  loadStandardDetail()
}

const handleStandardCheckboxChange = (params: any) => {
  const { row, checked } = params || {}
  const $table = standardGridRef.value
  const set = selectedStandardKeySet.value
  const rowMap = selectedStandardKeyRowMap.value
  if (!row) {
    // 全选/取消全选：以当前页数据为准。取消全选时 records 为空，用它会漏删已累积的键
    const pageRows = standardGridOptions.data || []
    pageRows.forEach((r: any) => {
      const zybm = r?.zybm
      if (zybm === undefined || zybm === null || zybm === '') return
      const key = getStandardRowKey(r)
      if (checked) {
        set.add(key)
        rowMap.set(key, r)
      } else {
        set.delete(key)
        rowMap.delete(key)
      }
    })
    return
  }
  const zybm = row.zybm
  if (zybm !== undefined && zybm !== null && zybm !== '') {
    const key = getStandardRowKey(row)
    if (checked) {
      set.add(key)
      rowMap.set(key, row)
    } else {
      set.delete(key)
      rowMap.delete(key)
    }
    const sameRows = (standardGridOptions.data || []).filter((r: any) => r.zybm === zybm)
    if (sameRows.length > 1 && $table) {
      $table.setCheckboxRow(sameRows, checked)
    }
  }
}

const handleStandardSizeChange = (val: number) => {
  standardPage.pageSize = val
  standardPage.currentPage = 1
  loadStandardDetail()
}

const handleStandardCurrentChange = (val: number) => {
  standardPage.currentPage = val
  loadStandardDetail()
}

const clearStandardSelection = () => {
  selectedStandardKeySet.value.clear()
  selectedStandardKeyRowMap.value.clear()
  standardGridRef.value?.clearCheckboxRow?.()
}

const confirmStandardSelector = async () => {
  const selectedRows = [...selectedStandardKeyRowMap.value.values()]
  if (selectedRows.length === 0) return ElMessage.warning('请选择作业标准成本数据')
  const setter = standardFieldSetter.value
  if (!setter) return

  // 跨末级节点选中时，按 dirId 分组分别调用接口，再合并结果
  const groups = new Map<string, string[]>()
  selectedRows.forEach((item: any) => {
    const dirId = item?.dirId
    const zybm = item?.zybm
    if (dirId === undefined || dirId === null || dirId === '') return
    if (zybm === undefined || zybm === null || zybm === '') return
    const list = groups.get(dirId) || []
    if (!list.includes(zybm)) list.push(zybm)
    groups.set(dirId, list)
  })

  if (groups.size === 0) return ElMessage.warning('所选数据缺少目录或作业编码，无法查询明细')

  standardSelectorLoading.value = true
  try {
    const mergedIds: any[] = []
    const zymcSet = new Set<string>()
    let amountTotal = 0
    const results = await Promise.all([...groups.entries()].map(([dirId, zybmList]) => queryIdsByDirIdAndZybm(dirId, zybmList)))
    const failed = results.find((res: any) => !res?.success)
    if (failed) return ElMessage.error(failed.msg || '查询作业标准成本明细失败')

    results.forEach((res: any) => {
      const data = res?.data
      if (!data) return
      if (Array.isArray(data.ids)) mergedIds.push(...data.ids)
      if (data.zymc) {
        data.zymc
          .split(',')
          .map((v: string) => v.trim())
          .filter(Boolean)
          .forEach((v: string) => zymcSet.add(v))
      }
      const je = parseMoneyValue(data.je)
      if (je !== null) amountTotal += je
    })

    const gwbzjg = formatMoneyDecimal(amountTotal) || ''
    setter('zydetailid', mergedIds)
    setter('zymc', [...zymcSet].join(','))
    setter('gwbzjg', gwbzjg)
    // 选完作业名称即校验：各专业调整参考价高于国网标准则填充预警，否则清空残留预警
    const priceExceeded = isAdjustPriceExceedStandard({ gzytzdj: standardModalFormData.value?.gzytzdj, gwbzjg })
    setter('dyyj', priceExceeded ? WARNING_TAG : '')
    if (priceExceeded) ElMessage.warning(WARNING_TAG)
    standardSelectorVisible.value = false
  } catch (error) {
    ElMessage.error((error as Error).message || '查询作业标准成本明细失败')
  } finally {
    standardSelectorLoading.value = false
  }
}

// 表单字段变更：各专业调整单价变更时需重新校验是否高于国网标准，并同步更新预警
const handleFieldChange = ({ field, formData: modalFormData }: { field: FormField; formData: Record<string, any> }) => {
  if (field?.prop !== 'gzytzdj') return
  const priceExceeded = isAdjustPriceExceedStandard(modalFormData)
  formModalRef.value?.setFieldValue('dyyj', priceExceeded ? WARNING_TAG : '')
  if (priceExceeded) ElMessage.warning(WARNING_TAG)
}

// 操作功能编辑
const openModal = async (modeFlag: 'add' | 'edit' | 'view', row?: any[]) => {
  mode.value = modeFlag
  const $table = vxeTableRef.value
  if (!$table) return
  const selectData = $table.getCheckboxRecords()
  if (selectData.length != 1 && modeFlag != 'add') return ElMessage.warning('请选择一条数据')
  gzljnrList.value = mode.value != 'add' ? selectData[0].gzljnrList : []
  formData.value = mode.value != 'add' ? { ...selectData[0] } : { xmid: props.xmid }
  formModalRef.value?.open({ gzljnrList: gzljnrList.value, dyid: formData.value?.dyId })
}
const handleDelDy = async () => {
  const $table = vxeTableRef.value
  if (!$table) return
  const selectData = $table.getCheckboxRecords()
  if (selectData.length == 0) return ElMessage.warning('请选择数据')
  const type = await VXETable.modal.confirm('删除后无法恢复，请谨慎操作。', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      const params = selectData.map((item: any) => item.dyId)
      const res = await deleteDyHandler({ ids: params })
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('删除成功!')
      emit('saveDy', { ...formData.value })
    } catch (error) {
      ElMessage.error((error as Error).message || '删除失败!')
    }
  }
}

//编辑保存功能
const handleSave = async (data: any) => {
  // 预警在选择作业名称时已校验并写入表单，这里直接取用
  const dyyj = data.dyyj || ''

  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  const params = {
    zxcsDyDTO: [
      {
        id: formData.value?.dyId || '',
        xmid: props.xmid,
        sheetId: formData.value.sheetid,
        sheetName: data.sheetname,
        gzljnrList: data.gzljnrList,
        dw: data.dw,
        sszq: data.sszq,
        sfxj: data.sfxj,
        gzllyyj: data.gzllyyj,
        fourzerosixwcsjg: data.fourzerosixwcsjg,
        decsjg: data.decsjg,
        lscbpjz: data.lscbpjz,
        bjjg: data.bjjg,
        zzywcbbz: data.zzywcbbz,
        gzytzdj: data.gzytzdj,
        zydetailid: Array.isArray(data.zydetailid) ? data.zydetailid : data.zydetailid ? [data.zydetailid] : [],
        zymc: data.zymc,
        gwbzjg: data.gwbzjg,
        dyyj,
        bz: data.bz
      }
    ]
  }
  if (type === 'confirm') {
    try {
      const res = await saveOrUpdateHandler([{ ...params }])
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('保存成功!')
      emit('saveDy', { ...formData.value })
    } catch (error) {
      ElMessage.error((error as Error).message || '保存失败!')
    } finally {
      // 处理保存逻辑
      formModalRef.value?.close()
    }
  }
}
// 关闭功能
const handleClose = () => {
  console.log('弹窗关闭')
}
</script>
<style scoped lang="less">
.modalDy {
  width: 100%;
  height: 80%;
  display: flex;
  flex-direction: column;
}
.operation {
  padding-bottom: 10px;
}

.table {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

:deep(.vxe-header--column .vxe-cell--title) {
  white-space: pre-line;
  line-height: 18px;
}

.main-pagination {
  padding-top: 10px;
}

:deep(.vxe-modal--body) {
  min-height: 0;
}

.standard-selector-wrap {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.standard-selector {
  &__left,
  &__right {
    height: 100%;
    min-height: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 6px;
    background: var(--el-bg-color, #ffffff);
  }

  &__left {
    width: 100%;
  }

  &__right {
    min-width: 0;
  }

  &__title {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &__search {
    margin-bottom: 10px;
  }

  &__search-bar {
    flex: 0 0 auto;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__search-label {
    flex: 0 0 auto;
    color: #606266;
    font-size: 13px;
    white-space: nowrap;
  }

  &__search-item {
    width: 200px;
  }

  &__selected {
    flex: 0 0 auto;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 6px 10px;
    border-radius: 4px;
    background: var(--el-color-primary-light-9, #ecf5ff);
    color: #606266;
    font-size: 13px;
  }

  &__selected-label {
    flex: 0 0 auto;
    font-weight: 600;
    color: #303133;
  }

  &__selected-names {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-color-primary, #409eff);
  }

  &__selected-empty {
    flex: 1;
    min-width: 0;
    color: #909399;
  }

  &__selected-count {
    flex: 0 0 auto;
    color: #909399;
  }

  &__pagination {
    flex: 0 0 42px;
    padding-top: 10px;
    text-align: right;
    box-sizing: border-box;
    overflow: visible;
  }

  &__footer {
    text-align: center;
  }

  :deep(.el-tree) {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &__table {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.vxe-grid) {
    height: 100%;
  }

  :deep(.el-pagination) {
    white-space: nowrap;
  }

  :deep(.vue-splitter-container) {
    min-height: 0;
  }
}

.standard-tree-node {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
