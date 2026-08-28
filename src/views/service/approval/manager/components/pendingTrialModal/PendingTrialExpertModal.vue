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
    <div class="pending-trial-expert-modal">
      <div class="pending-trial-expert-modal__actions">
        <el-button size="mini" type="primary" plain @click="handleSelectAll">全 选</el-button>
        <el-button size="mini" type="primary" plain @click="handleInverseSelect">反 选</el-button>
        <el-button size="mini" type="primary" plain :disabled="selectedRows.length === 0" @click="handleIncludeInReview">纳入会审</el-button>
        <el-button size="mini" plain :disabled="loading" @click="closeHandle">关 闭</el-button>
      </div>

      <div class="pending-trial-expert-modal__toolbar">
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
              <div class="pending-trial-expert-modal__search-actions">
                <el-button size="mini" type="primary" plain @click="searchTable">查 询</el-button>
                <el-button size="mini" type="primary" plain @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="pending-trial-expert-modal__table">
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

      <div class="pending-trial-expert-modal__pager">
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

<script setup lang="ts" name="ManagerPendingTrialExpertModal">
import { defineEmits, defineExpose, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getCommonCodeByParentCode, getPublicData, getYjdwFromCm } from '@/api/common'
import { getDnrhszjPage } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import type { YnrhszjPage } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { addExpert } from '@/api/service/approval/manager'

interface ModalProps {
  title: string
  pageFlag: string
  jd: '1' | '2'
  isView: boolean
  pszyType: string
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
const pszyListData = ref<any[]>([])

const modalProps = ref<ModalProps>({
  title: '',
  pageFlag: '',
  jd: '1',
  isView: false,
  pszyType: '',
  isPsz: false,
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

const buildSearchParams = () => {
  return {
    ...searchForm,
    page: page.page,
    limit: page.limit,
    current: page.page,
    size: page.limit,
    jd: modalProps.value.jd,
    meetingId: modalProps.value.row['meetingId'],
    pszyType: modalProps.value.pszyType || '',
    expertNames: splitMultipleText(searchForm.expertName),
    accounts: splitMultipleText(searchForm.account)
  } as unknown as YnrhszjPage
}

const loadTable = async () => {
  loading.value = true
  try {
    const res = await getDnrhszjPage(buildSearchParams())
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

const handleSelectAll = async () => {
  await gridRef.value?.setAllCheckboxRow(true)
  selectedRows.value = [...tableData.value]
}

const handleInverseSelect = async () => {
  const selectedSet = new Set(selectedRows.value.map((item) => item.expertId))
  await gridRef.value?.clearCheckboxRow()
  const rows = tableData.value.filter((item) => !selectedSet.has(item.expertId))
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
  try {
    loading.value = true
    const ids = selectedRows.value.map((item) => item.expertId)
    const res = await addExpert({
      ids,
      pszyType: modalProps.value.pszyType || '',
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

const closeHandle = () => {
  modalVisible.value = false
  tableData.value = []
  page.page = 1
  page.limit = 20
  page.total = 0
  yjdwListData.value = []
  ejdwListData.value = []
  pszyListData.value = []
  resetSearchForm()
  clearSelection()
}

const initOptions = async () => {
  await Promise.allSettled([getYjdwEnum(), getPublicCode()])
}

const acceptParams = (params: ModalProps) => {
  closeHandle()
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
.pending-trial-expert-modal {
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
