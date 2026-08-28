<template>
  <vxe-modal
    v-model="modalVisible"
    :title="modalProps.title"
    width="70%"
    height="720"
    resize
    show-zoom
    show-close
    fullscreen
    destroy-on-close
    position="center"
    @close="closeHandle"
  >
    <div class="auto-meeting-modal">
      <div class="auto-meeting-modal__actions">
        <el-button size="mini" type="primary" plain :disabled="selectedRows.length === 0" @click="handleAutoMeeting"> 纳入会议 </el-button>
        <el-button size="mini" plain :disabled="loading" @click="closeHandle">关 闭</el-button>
      </div>

      <div class="auto-meeting-modal__toolbar">
        <el-form :model="searchForm" label-suffix="：" label-width="110px" @submit.prevent>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="项目编码">
                <ReMultipleText v-model="searchForm.xmbm" />
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <div class="auto-meeting-modal__search-actions">
                <el-button size="mini" type="primary" plain @click="searchTable">查 询</el-button>
                <el-button size="mini" type="primary" plain @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="auto-meeting-modal__table">
        <div class="auto-meeting-modal__grid">
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
            <template #yssxmcSlot="{ row }">{{ row.zyssxmc }}</template>
          </vxe-grid>
        </div>
      </div>

      <div class="auto-meeting-modal__pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="ManagerAutoMeetingModal">
import { defineExpose, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { autoMeeting, getProjectList } from '@/api/service/approval/manager'
import { formatNumValue } from '@/utils/utils'

interface ModalProps {
  title: string
  meetingId: string
  search?: () => void
}

interface ProjectRow {
  xmbm: string
  xmmc: string
  [key: string]: any
}

const gridRef = ref<VxeGridInstance>()
const modalVisible = ref(false)
const loading = ref(false)
const tableData = ref<ProjectRow[]>([])
const selectedRows = ref<ProjectRow[]>([])

const modalProps = ref<ModalProps>({
  title: '',
  meetingId: '',
  search: undefined
})

const searchForm = reactive<Record<string, any>>({
  xmbm: ''
})

const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const centerConfig = { align: 'center', headerAlign: 'center' } as const
const gridOptions = reactive<VxeGridProps<ProjectRow>>({
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
    { field: 'xmbm', title: '项目编码', width: 180, fixed: 'left', showOverflow: true, ...centerConfig },
    { field: 'xmmc', title: '项目名称', width: 280, fixed: 'left', showOverflow: true, ...centerConfig },
    { field: 'isPackName', title: '是否打捆项目', width: 100, ...centerConfig },
    { field: 'proType', title: '项目类型', width: 280, showOverflow: true, ...centerConfig },
    { field: 'ysly', title: '预算来源', width: 100, ...centerConfig },
    { field: 'yjdwName', title: '一级单位', width: 180, showOverflow: true, ...centerConfig },
    { field: 'ejdwName', title: '二级单位', width: 180, showOverflow: true, ...centerConfig },
    { field: 'applyCenter', title: '成本中心', width: 180, showOverflow: true, ...centerConfig },
    { field: 'amount', title: '申报金额（万元）', width: 180, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'jhssndName', title: '计划实施年份', width: 140, ...centerConfig },
    { field: 'zdtxName', title: '重点投向', width: 180, showOverflow: true, ...centerConfig },
    { field: 'zgkbm', title: '专业部门', width: 180, showOverflow: true, ...centerConfig },
    { field: 'yssxmc', title: '预算事项名称', width: 280, showOverflow: true, slots: { default: 'yssxmcSlot' }, ...centerConfig },
    { field: 'remark', title: '预算事项说明', width: 280, showOverflow: true, ...centerConfig },
    { field: 'yjfl', title: '一级分类', width: 140, ...centerConfig },
    { field: 'ejfl', title: '二级分类', width: 140, ...centerConfig },
    { field: 'sjfl', title: '三级分类', width: 140, ...centerConfig },
    { field: 'fzrbh', title: '实施部门', width: 180, showOverflow: true, ...centerConfig },
    { field: 'xmssr', title: '项目实施人', width: 180, showOverflow: true, ...centerConfig },
    { field: 'zyfjftrtjfw', title: '研发投入统计范围', width: 180, showOverflow: true, ...centerConfig },
    { field: 'zyqcgbm', title: '预期成果', width: 180, showOverflow: true, ...centerConfig },
    { field: 'jryftrbfb', title: '研发投入百分比', width: 180, showOverflow: true, ...centerConfig },
    { field: 'bfbjsfssm', title: '百分比说明', width: 180, showOverflow: true, ...centerConfig },
    { field: 'sfaqsc', title: '是否安全生产', width: 140, ...centerConfig },
    { field: 'aqscfylx', title: '安全生产费用类型', width: 180, showOverflow: true, ...centerConfig },
    { field: 'xllx', title: '线路类型', width: 180, showOverflow: true, ...centerConfig },
    { field: 'dydj', title: '电压等级', width: 140, ...centerConfig },
    { field: 'ssnr', title: '项目实施内容', width: 280, showOverflow: true, ...centerConfig },
    { field: 'xmjys', title: '项目建议书（数量）', width: 140, ...centerConfig },
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

const resetSearchForm = () => {
  searchForm.xmbm = ''
}

const resetModalState = () => {
  tableData.value = []
  resetSearchForm()
  clearSelection()
  page.page = 1
  page.limit = 20
  page.total = 0
}

const closeHandle = () => {
  if (loading.value) return
  modalVisible.value = false
  resetModalState()
}

const loadTable = async () => {
  if (!modalProps.value.meetingId) {
    ElMessage.warning('未获取到会议ID')
    return
  }
  loading.value = true
  try {
    const xmbmList = searchForm.xmbm
      ? String(searchForm.xmbm)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : []
    const res = await getProjectList({
      meetingId: modalProps.value.meetingId,
      xmbmList,
      current: page.page,
      size: page.limit
    })
    if (!res.success) throw new Error(res.msg)
    const records = Array.isArray(res.data?.records) ? res.data.records : Array.isArray(res.data) ? res.data : []
    tableData.value = records
    page.total = Number(res.data?.total ?? records.length)
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
  resetSearchForm()
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

const handleAutoMeeting = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据进行自动纳会操作!')
    return
  }
  const ids = selectedRows.value.map((item) => item.xmId).filter(Boolean)
  if (ids.length === 0) {
    ElMessage.warning('未获取到项目ID')
    return
  }
  try {
    await ElMessageBox.confirm(`确认将选中的 ${ids.length} 条项目纳入会议？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (error) {
    return
  }
  loading.value = true
  try {
    const res = await autoMeeting({
      meetingId: modalProps.value.meetingId,
      ids
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('自动纳会成功!')
    modalProps.value.search?.()
    modalVisible.value = false
    resetModalState()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const acceptParams = (params: ModalProps) => {
  resetModalState()
  modalProps.value = { ...modalProps.value, ...params }
  modalVisible.value = true
  void loadTable()
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.auto-meeting-modal {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    margin-bottom: 10px;
  }

  &__toolbar {
    padding: 10px 10px 0;
  }

  &__search-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 10px;
  }

  &__table {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  &__grid {
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
