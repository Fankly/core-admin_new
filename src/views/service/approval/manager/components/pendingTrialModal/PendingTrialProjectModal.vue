<template>
  <vxe-modal
    v-model="modalVisible"
    :title="modalProps.title"
    width="70%"
    height="820"
    resize
    show-zoom
    show-close
    fullscreen
    destroy-on-close
    position="center"
    @close="closeHandle"
  >
    <div class="review-modal">
      <div class="review-modal__actions">
        <el-button size="mini" type="primary" plain @click="handleSelectAll">全 选</el-button>
        <el-button size="mini" type="primary" plain @click="handleInverseSelect">反 选</el-button>
        <el-button size="mini" type="primary" plain :disabled="selectedRows.length === 0" @click="handleIncludeInReview">纳入会审</el-button>
        <el-button size="mini" plain :disabled="loading" @click="closeHandle">关 闭</el-button>
      </div>

      <div class="review-modal__toolbar">
        <el-form :model="searchForm" label-suffix="：" label-width="110px">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="项目编码">
                <ReMultipleText v-model="searchForm.xmbm" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称">
                <el-input v-model="searchForm.xmmc" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级单位">
                <el-select v-model="searchForm.yjdw" clearable style="width: 100%" @change="changeEjdwEnum">
                  <el-option v-for="item in yjdwListData" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位">
                <el-select v-model="searchForm.ejdw" clearable style="width: 100%">
                  <el-option v-for="item in ejdwListData" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算来源">
                <el-select v-model="searchForm.ysly" disabled clearable style="width: 100%">
                  <el-option v-for="item in yslyListData" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="计划实施年份">
                <el-select v-model="searchForm.jhssnd" clearable style="width: 100%">
                  <el-option v-for="item in ndDataList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="专业部门">
                <el-select v-model="searchForm.zgkbmId" disabled clearable style="width: 100%">
                  <el-option v-for="item in gkbmListData" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预算事项名称">
                <el-input v-model="searchForm.yssxmc" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="review-modal__search-actions">
                <el-button size="mini" type="primary" plain @click="searchTable">查 询</el-button>
                <el-button size="mini" type="primary" plain @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="review-modal__table">
        <vxe-grid
          ref="gridRef"
          v-bind="gridOptions"
          :data="tableData"
          :loading="loading"
          @checkbox-change="handleSelection"
          @checkbox-all="handleSelection"
          @cell-click="handleCellClick"
        >
          <template #amountSlot="{ row }">{{ formatAmount(row.amount) }}</template>
          <template #yssxmcSlot="{ row }">{{ row.zyssxmc || row.yssxmc }}</template>
        </vxe-grid>
      </div>

      <div class="review-modal__pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="Number(page.total)"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="ManagerPendingTrialProjectModal">
import { defineEmits, defineExpose, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getCommonCodeByParentCode, getGkbmInProvince, getPublicData, getYjdwFromCm } from '@/api/common'
import { getDnrhsxmPage, saveXm, saveXmWhenPsz } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { formatNumValue } from '@/utils/utils'

interface ModalProps {
  title: string
  pageFlag: string
  isView: boolean
  isPsz: boolean
  row: Partial<any>
  btnPermissions?: string[]
  getTableList?: () => void
}

const emit = defineEmits(['includeInReview'])
const gridRef = ref<VxeGridInstance>()
const modalVisible = ref(false)
const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])
const yjdwListData = ref<any[]>([])
const ejdwListData = ref<any[]>([])
const ndDataList = ref<any[]>([])
const yslyListData = ref<any[]>([])
const gkbmListData = ref<any[]>([])

const modalProps = ref<ModalProps>({
  title: '',
  pageFlag: '',
  isView: false,
  isPsz: false,
  row: {},
  btnPermissions: []
})

const searchForm = reactive<Record<string, any>>({
  xmbm: '',
  xmmc: '',
  yjdw: '',
  ejdw: '',
  ysly: '',
  jhssnd: '',
  zgkbmId: '',
  yssxmc: ''
})

const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const centerConfig = { align: 'center', headerAlign: 'center' } as const
const gridOptions = reactive<VxeGridProps<any>>({
  border: true,
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: true,
  checkboxConfig: { trigger: 'row', highlight: true, range: true },
  rowConfig: { isHover: true, height: 32 },
  columnConfig: { resizable: true },
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left', ...centerConfig },
    { type: 'seq', width: 60, title: '序号', fixed: 'left', ...centerConfig },
    { field: 'xmbm', title: '项目编码', width: 180, fixed: 'left', ...centerConfig },
    { field: 'xmmc', title: '项目名称', minWidth: 260, fixed: 'left', showOverflow: true, ...centerConfig },
    { field: 'isPackName', title: '是否打捆项目', width: 120, ...centerConfig },
    { field: 'ysly', title: '预算来源', width: 100, ...centerConfig },
    { field: 'yjdwName', title: '一级单位', width: 180, ...centerConfig },
    { field: 'ejdwName', title: '二级单位', width: 180, ...centerConfig },
    { field: 'applyCenter', title: '成本中心', width: 180, ...centerConfig },
    { field: 'amount', title: '申报金额（万元）', width: 180, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'jhssndName', title: '计划实施年份', width: 140, ...centerConfig },
    { field: 'zdtxName', title: '重点投向', width: 180, ...centerConfig },
    { field: 'zgkbm', title: '专业部门', width: 180, ...centerConfig },
    { field: 'yssxmc', title: '预算事项名称', width: 260, showOverflow: true, slots: { default: 'yssxmcSlot' }, ...centerConfig },
    { field: 'remark', title: '预算事项说明', width: 280, showOverflow: true, ...centerConfig },
    { field: 'yjfl', title: '一级分类', width: 140, ...centerConfig },
    { field: 'ejfl', title: '二级分类', width: 140, ...centerConfig },
    { field: 'sjfl', title: '三级分类', width: 140, ...centerConfig },
    { field: 'fzrbh', title: '实施部门', width: 180, ...centerConfig },
    { field: 'xmssr', title: '项目实施人', width: 180, ...centerConfig },
    { field: 'ssnr', title: '项目实施内容', width: 280, showOverflow: true, ...centerConfig },
    { field: 'xmjys', title: '项目建议书（数量）', width: 150, ...centerConfig },
    { field: 'ky', title: '可研（数量）', width: 140, ...centerConfig },
    { field: 'pfwj', title: '批复文件（数量）', width: 140, ...centerConfig }
  ]
})

const formatAmount = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  return formatNumValue(value as string | number, 6)
}

const clearSelection = () => {
  selectedRows.value = []
  gridRef.value?.clearCheckboxRow()
}

const normalizeRecords = (records: any[]) => {
  return records.map((item) => ({
    ...item,
    jhssndName: item.jhssndName || item.jhssnd
  }))
}

const loadTable = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: page.page,
      limit: page.limit,
      current: page.page,
      size: page.limit,
      meetingId: modalProps.value.row['meetingId'],
      xmbmList: searchForm.xmbm ? String(searchForm.xmbm).split(',') : []
    }
    const res = await getDnrhsxmPage(params as any)
    if (!res.success) throw new Error(res.msg)
    const records = Array.isArray(res.data?.records) ? res.data.records : []
    tableData.value = normalizeRecords(records)
    page.total = Number(res.data?.total ?? 0)
    clearSelection()
  } catch (error) {
    ElMessage.error((error as Error).message)
    tableData.value = []
    page.total = 0
  } finally {
    loading.value = false
  }
}

const searchTable = () => {
  page.page = 1
  loadTable()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = ''
  })
  searchForm.ysly = modalProps.value.row['ysly'] || ''
  searchForm.zgkbmId = modalProps.value.row['bmId'] || ''
  page.page = 1
  loadTable()
}

const pageChangeHandle = (currentPage: number) => {
  page.page = currentPage
  loadTable()
}

const limitChangeHandle = (limit: number) => {
  page.page = 1
  page.limit = limit
  loadTable()
}

const handleSelection = ({ records }: any) => {
  selectedRows.value = records || []
}

const handleCellClick = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await gridRef.value?.clearCheckboxRow()
  await gridRef.value?.setCheckboxRow(row, true)
  selectedRows.value = [row]
}

const handleSelectAll = async () => {
  await gridRef.value?.setAllCheckboxRow(true)
  selectedRows.value = [...tableData.value]
}

const handleInverseSelect = async () => {
  const selectedSet = new Set(selectedRows.value.map((item) => item.xmId))
  await gridRef.value?.clearCheckboxRow()
  const rows = tableData.value.filter((item) => !selectedSet.has(item.xmId))
  if (rows.length) {
    await gridRef.value?.setCheckboxRow(rows, true)
  }
  selectedRows.value = rows
}

const handleIncludeInReview = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作!')
    return
  }
  const type = await VXETable.modal.confirm('确认将选中项纳入会审？', '温馨提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return
  loading.value = true
  try {
    const ids = selectedRows.value.map((item) => item.xmId)
    const api = modalProps.value.isPsz ? saveXm : saveXmWhenPsz
    const res = await api({
      ids,
      meetingId: modalProps.value.row['meetingId']
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('纳入会审成功!')
    modalProps.value.getTableList?.()
    modalVisible.value = false
    emit('includeInReview')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const changeEjdwEnum = async (val: string) => {
  searchForm.ejdw = ''
  ejdwListData.value = []
  if (!val) return
  const res = await getCommonCodeByParentCode({
    code: 'DW_COM',
    parentCode: val
  })
  if (res.success) {
    ejdwListData.value = res.data || []
  } else {
    ElMessage.error(res.msg)
  }
}

const initOptions = async () => {
  const [yjdwRes, ndRes, yslyRes, gkbmRes] = await Promise.allSettled([
    getYjdwFromCm(),
    getPublicData('NDCX'),
    getPublicData('XMLB_YSLY'),
    getGkbmInProvince()
  ])
  if (yjdwRes.status === 'fulfilled' && yjdwRes.value.success) yjdwListData.value = yjdwRes.value.data || []
  if (ndRes.status === 'fulfilled' && ndRes.value.success) ndDataList.value = ndRes.value.data || []
  if (yslyRes.status === 'fulfilled' && yslyRes.value.success) yslyListData.value = yslyRes.value.data || []
  if (gkbmRes.status === 'fulfilled' && gkbmRes.value.success) gkbmListData.value = gkbmRes.value.data || []
}

const closeHandle = () => {
  modalVisible.value = false
  tableData.value = []
  page.page = 1
  page.limit = 20
  page.total = 0
  clearSelection()
}

const acceptParams = (params: ModalProps) => {
  modalProps.value = { ...modalProps.value, ...params }
  searchForm.ysly = modalProps.value.row['ysly'] || ''
  searchForm.zgkbmId = modalProps.value.row['bmId'] || ''
  modalVisible.value = true
  void initOptions().finally(() => {
    loadTable()
  })
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.review-modal {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__toolbar {
    padding: 10px 10px 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    margin-bottom: 10px;
  }

  &__search-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 10px;
  }

  &__table {
    flex: 1;
    min-height: 0;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
  }
}
</style>
