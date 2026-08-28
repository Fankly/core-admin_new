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
    <div class="review-expert-modal">
      <div class="review-expert-modal__actions">
        <el-button size="mini" type="primary" plain @click="handleAddPendingTrial">添 加</el-button>
        <el-button size="mini" type="primary" plain :disabled="selectedRows.length === 0" @click="handleDeleteData"> 删 除 </el-button>
        <el-button size="mini" type="primary" plain @click="handleExport">导 出</el-button>
        <el-button size="mini" plain :disabled="loading" @click="closeHandle">关 闭</el-button>
      </div>

      <div class="review-expert-modal__toolbar">
        <el-form :model="searchForm" label-suffix="：" label-width="110px" @submit.prevent>
          <el-row :gutter="16">
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
              <el-form-item label="专家姓名">
                <ReMultipleText v-model="searchForm.expertName" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="统一权限账号">
                <ReMultipleText v-model="searchForm.account" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="专家专业">
                <el-select v-model="searchForm.major" clearable style="width: 100%">
                  <el-option v-for="item in pszyListData" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="备注">
                <el-input v-model="searchForm.remark" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="review-expert-modal__search-actions">
                <el-button size="mini" type="primary" plain :disabled="!activeTab" @click="searchTable">查 询</el-button>
                <el-button size="mini" type="primary" plain :disabled="!activeTab" @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="review-expert-modal__table">
        <div
          v-if="tabList.length"
          class="tw-mb-0 tw-flex tw-items-center tw-gap-1 tw-bg-gray-100 tw-p-1.5 tw-rounded-t-lg tw-border tw-border-gray-200 tw-border-b-0 tw-w-fit"
        >
          <button
            v-for="item in tabList"
            :key="item.code"
            type="button"
            class="tw-border tw-border-transparent tw-px-6 tw-py-1.5 tw-text-sm tw-font-medium tw-transition-all tw-duration-300 tw-cursor-pointer tw-rounded-md tw-select-none tw-focus:outline-none tw-focus-visible:tw-ring-2 tw-focus-visible:tw-ring-[var(--color-primary)] tw-focus-visible:tw-ring-offset-1"
            :class="
              activeTab === item.code
                ? 'tw-bg-[var(--color-primary)] tw-text-white tw-shadow-[0_4px_16px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] tw-scale-105'
                : 'tw-text-gray-500 hover:tw-text-[var(--color-primary)] hover:tw-bg-[var(--color-primary-light)]'
            "
            @click="handleTabClick(item.code)"
          >
            {{ item.name }}
            <span>（{{ item.expertCount ?? 0 }}人）</span>
          </button>
        </div>

        <div class="review-expert-modal__grid">
          <vxe-grid
            ref="gridRef"
            v-bind="gridOptions"
            :data="tableData"
            :loading="loading"
            @checkbox-change="handleSelection"
            @checkbox-all="handleSelection"
            @cell-click="handleCellClick"
          />
        </div>
      </div>

      <div class="review-expert-modal__pager">
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
  <PendingTrialExpertModal @include-in-review="handleExpertDataChanged" ref="pendingTrialRef" />
</template>

<script setup lang="ts" name="ManagerReviewExpertModal">
import { defineExpose, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getCommonCodeByParentCode, getPublicData, getYjdwFromCm } from '@/api/common'
import { exportYnrzj, getYnrhszjListNum, getYnrhszjPage } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import type { YnrhszjPage } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { deleteExpert } from '@/api/service/approval/manager'
import { downloadExportBlob } from '@/views/service/approval/provinceLhhsMeeting/utils/download'
import PendingTrialExpertModal from '@/views/service/approval/manager/components/pendingTrialModal/PendingTrialExpertModal.vue'

interface ModalProps {
  search?: () => void
  title: string
  pageFlag: string
  isView: boolean
  row: Partial<any>
  btnPermissions: string[]
}

interface ReviewExpertTabItem {
  code: string
  name: string
  expertCount: number
  [key: string]: any
}

const TAB_PUBLIC_CODE = 'SJTC_LHHS_PSZY'
const gridRef = ref<VxeGridInstance>()
const pendingTrialRef = ref<InstanceType<typeof PendingTrialExpertModal>>()
const modalVisible = ref(false)
const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])
const yjdwListData = ref<any[]>([])
const ejdwListData = ref<any[]>([])
const pszyListData = ref<any[]>([])
const tabList = ref<ReviewExpertTabItem[]>([])
const activeTab = ref('')
let tabCountRequestId = 0

const modalProps = ref<ModalProps>({
  title: '',
  pageFlag: '',
  isView: false,
  row: {},
  btnPermissions: []
})

const searchForm = reactive<Record<string, any>>({
  yjdw: '',
  ejdw: '',
  expertName: '',
  account: '',
  major: '',
  remark: ''
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
    { field: 'majorName', title: '专家专业', width: 120, fixed: 'left', ...centerConfig },
    { field: 'expertName', title: '专家姓名', width: 100, fixed: 'left', ...centerConfig },
    { field: 'sex', title: '专家性别', width: 90, ...centerConfig },
    { field: 'account', title: '统一权限账号', width: 130, ...centerConfig },
    { field: 'phoneNo', title: '联系方式', width: 120, ...centerConfig },
    { field: 'mail', title: '邮箱', width: 180, showOverflow: true, ...centerConfig },
    { field: 'yjdwName', title: '一级单位', width: 180, showOverflow: true, ...centerConfig },
    { field: 'ejdwName', title: '二级单位', width: 180, showOverflow: true, ...centerConfig },
    { field: 'deptName', title: '所属部门', width: 180, showOverflow: true, ...centerConfig },
    { field: 'remark', title: '备注', minWidth: 180, showOverflow: true, ...centerConfig }
  ]
})

const splitMultipleText = (value: unknown) => {
  return String(value ?? '')
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeRecords = (data: any) => {
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data)) return data
  return []
}

const resetSearchForm = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = ''
  })
}

const clearSelection = () => {
  selectedRows.value = []
  gridRef.value?.clearCheckboxRow()
}

const resetModalState = () => {
  yjdwListData.value = []
  ejdwListData.value = []
  pszyListData.value = []
  tabList.value = []
  activeTab.value = ''
  tableData.value = []
  page.page = 1
  page.limit = 20
  page.total = 0
  tabCountRequestId += 1
  resetSearchForm()
  clearSelection()
}

const closeHandle = () => {
  modalVisible.value = false
  resetModalState()
}

const buildSearchParams = () => {
  return {
    ...searchForm,
    page: page.page,
    limit: page.limit,
    current: page.page,
    size: page.limit,
    meetingId: modalProps.value.row['meetingId'],
    expertNames: splitMultipleText(searchForm.expertName),
    accounts: splitMultipleText(searchForm.account),
    pszyType: activeTab.value
  } as unknown as YnrhszjPage
}

const loadTable = async () => {
  if (!activeTab.value) {
    tableData.value = []
    page.total = 0
    clearSelection()
    return
  }
  loading.value = true
  try {
    const res = await getYnrhszjPage(buildSearchParams())
    if (!res.success) throw new Error(res.msg)
    tableData.value = normalizeRecords(res.data)
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

const searchTableHandle = () => {
  loadTable()
}

const searchTable = () => {
  page.page = 1
  loadTable()
}

const resetSearch = () => {
  resetSearchForm()
  ejdwListData.value = []
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

const getYjdwEnum = async () => {
  yjdwListData.value = []
  ejdwListData.value = []
  const res = await getYjdwFromCm()
  if (res.success) {
    yjdwListData.value = res.data || []
  } else {
    ElMessage.error(res.msg)
  }
}

const getPublicCode = async () => {
  pszyListData.value = []
  const list = await getPublicData('MAJOR_COM')
  if (list.success) {
    pszyListData.value = list.data || []
  } else {
    ElMessage.error(list.msg)
  }
}

const resolveExpertCount = (data: unknown) => {
  if (Array.isArray(data)) return data.length
  const count = Number(data)
  return Number.isFinite(count) ? count : 0
}

const loadTabExpertCounts = async (tabs: ReviewExpertTabItem[] = tabList.value) => {
  const meetingId = modalProps.value.row['meetingId']
  if (!meetingId || tabs.length === 0) return

  const currentRequestId = ++tabCountRequestId
  const responses = await Promise.allSettled(tabs.map((item) => getYnrhszjListNum({ meetingId, pszyType: item.code })))

  if (currentRequestId !== tabCountRequestId) return

  let hasError = false
  tabList.value = tabs.map((item, index) => {
    const response = responses[index]
    if (response.status !== 'fulfilled' || !response.value.success) {
      hasError = true
      return {
        ...item,
        expertCount: 0
      }
    }
    return {
      ...item,
      expertCount: resolveExpertCount(response.value.data)
    }
  })

  if (hasError) {
    ElMessage.warning('部分评审专业人数加载失败')
  }
}

const getTabList = async () => {
  tabList.value = []
  const res = await getPublicData(TAB_PUBLIC_CODE)
  if (res.success) {
    const tabs = (res.data || []).map((item: any) => ({
      ...item,
      expertCount: 0
    }))
    tabList.value = tabs
    activeTab.value = tabList.value[0]?.code ?? ''
    await loadTabExpertCounts(tabs)
  } else {
    ElMessage.error(res.msg)
  }
}

const handleExpertDataChanged = () => {
  clearSelection()
  void loadTabExpertCounts()
  modalProps.value.search?.()
}

const handleTabChange = () => {
  clearSelection()
  page.page = 1
  loadTable()
}

const handleTabClick = (tabCode: string) => {
  if (activeTab.value === tabCode) return
  activeTab.value = tabCode
  handleTabChange()
}

const changeEjdwEnum = async (val: string) => {
  searchForm.ejdw = ''
  ejdwListData.value = []
  if (!val) return
  loading.value = true
  try {
    const res = await getCommonCodeByParentCode({
      code: 'DW_COM',
      parentCode: val
    })
    if (res.success) {
      ejdwListData.value = res.data || []
    } else {
      ElMessage.error(res.msg)
    }
  } finally {
    loading.value = false
  }
}

const handleAddPendingTrial = () => {
  pendingTrialRef.value?.acceptParams({
    title: '添加',
    pageFlag: modalProps.value.pageFlag,
    jd: '1',
    isView: false,
    isPsz: modalProps.value.isView,
    pszyType: activeTab.value,
    row: { ...modalProps.value.row },
    getTableList: searchTableHandle
  })
}

const handleDeleteData = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作!')
    return
  }
  const type = await VXETable.modal.confirm('确认是否删除？', '温馨提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return
  try {
    loading.value = true
    const ids = selectedRows.value.map((item) => item.expertId)
    const res = await deleteExpert({
      pszyType: activeTab.value,
      ids,
      meetingId: modalProps.value.row['meetingId']
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('删除成功!')
    await loadTable()
    void loadTabExpertCounts()
    modalProps.value.search?.()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  loading.value = true
  try {
    const blob: any = await exportYnrzj(buildSearchParams())
    downloadExportBlob(blob, '已纳入会审专家清单.xlsx')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const initOptions = async () => {
  await Promise.allSettled([getYjdwEnum(), getPublicCode(), getTabList()])
}

const acceptParams = (params: ModalProps) => {
  resetModalState()
  modalProps.value = { ...modalProps.value, ...params }
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
.review-expert-modal {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__tabs {
    display: flex;
  }

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
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  &__table-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 10px;
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
