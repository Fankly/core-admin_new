<template>
  <vxe-modal
    @close="closeHandle"
    v-model="modalVisible"
    title="评审业务"
    width="1400"
    height="850"
    show-zoom
    fullscreen
    resize
    destroy-on-close
    class-name="custom-modal"
    :loading="loading"
  >
    <div class="modal-layout-wrapper">
      <!-- 左侧：评审专业 -->
      <div class="left-sidebar">
        <div class="panel-header">
          <div class="panel-title">
            <span class="title-decorator"></span>
            评审专业
          </div>
        </div>

        <!-- 左侧搜索栏 -->
        <div class="toolbar-section" style="height: auto; flex-direction: column; align-items: stretch; gap: 8px">
          <el-input
            v-model="leftSearchName"
            placeholder="搜索专家姓名/专业"
            prefix-icon="el-icon-search"
            clearable
            @input="handleLeftSearch"
            style="width: 100%"
          ></el-input>
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
              <span class="tab-button-label">
                <span>{{ item.name }}</span>
                <span>（{{ item.expertCount ?? 0 }}人）</span>
              </span>
            </button>
          </div>
        </div>

        <div class="table-flex-container">
          <vxe-grid ref="leftGridRef" v-bind="leftGridOptions" @current-change="handleLeftCurrentChange"> </vxe-grid>
        </div>
      </div>

      <!-- 右侧：业务详情 -->
      <div class="right-main">
        <div class="panel-header">
          <div class="panel-header-left">
            <div class="panel-title">
              <span class="title-decorator purple"></span>
              业务分配详情
              <span v-if="currentExpert" style="font-size: 14px; color: #666; margin-left: 8px"> - 当前专家：{{ currentExpert['expertName'] }} </span>
            </div>
          </div>
          <div>
            <el-button v-if="!modalProps.isView" plain type="primary" icon="el-icon-plus" @click="openAssignModal">新增分配任务</el-button>
            <el-button v-if="!modalProps.isView" plain type="danger" icon="el-icon-delete" @click="handleDeletePro">删除</el-button>
            <!-- <el-button plain type="primary" icon="el-icon-download">导出项目</el-button> -->
            <el-button plain icon="el-icon-close" @click="closeHandle">关闭</el-button>
          </div>
        </div>

        <!-- 右侧工具栏 -->
        <div class="toolbar-section justify-between">
          <div class="search-group">
            <el-input
              v-model="rightSearchKeyword"
              placeholder="请输入项目名称查询..."
              class="copy-text-input w-64"
              clearable
              size="small"
              @change="loadRightData"
            >
              <template #prepend>
                <div class="input-prepend">项目名称</div>
              </template>
            </el-input>
            <ReMultipleText
              v-model="rightProjectCode"
              placeholder="请输入项目编码,多个用逗号分隔"
              show-prepend
              prepend-label="项目编码"
              class="w-64"
              @change="loadRightData"
            />
          </div>
          <el-button circle icon="el-icon-refresh" @click="loadRightData" title="刷新数据"></el-button>
        </div>

        <div class="table-flex-container">
          <vxe-grid
            ref="rightGridRef"
            v-bind="rightGridOptions"
            :loading="rightLoading"
            @checkbox-change="handleRightSelection"
            @checkbox-all="handleRightSelection"
          >
          </vxe-grid>
        </div>

        <!-- 右侧分页组件集成 -->
        <div class="footer-pagination right">
          <el-pagination
            :page-size="rightPage.pageSize"
            :current-page="rightPage.currentPage"
            :page-sizes="[10, 20, 50, 100, 500]"
            size="default"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="rightPage.total"
            @size-change="handleRightSizeChange"
            @current-change="handleRightPageChange"
          />
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="ExpertManagementModal">
import { ref, reactive, nextTick, defineExpose, defineEmits } from 'vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { VxeColumnPropTypes, VxeGridInstance, VxeGridProps, VXETable } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { getYnrhszjListNum, getYfpxx, deleteExpertProject as defaultDeleteExpertProject } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { getPublicData } from '@/api/common'

interface AssignmentApis {
  deleteExpertProject?: (params: any) => Promise<any>
  psfgData?: (params: any) => Promise<any>
}

interface ModalProps {
  title?: string
  isView: boolean
  meetingId: string
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  taskAssignmentModalRef?: any
  assignmentApis?: AssignmentApis
}

interface ExpertTabItem {
  code: string
  name: string
  expertCount: number
  [key: string]: any
}

const emit = defineEmits(['clearSelect'])

const modalVisible = ref(false)
const modalProps = ref<ModalProps>({
  meetingId: '',
  isView: false,
  bmId: '',
  dwId: '',
  roleCode: '',
  roleId: ''
})
const rightLoading = ref(false)
const loading = ref(false)

const leftSearchName = ref('')
const rightSearchKeyword = ref('')
const rightProjectCode = ref('')
const tabList = ref<ExpertTabItem[]>([])
const activeTab = ref('')
let tabCountRequestId = 0
const currentExpert = ref<any>(null)
const leftGridRef = ref<VxeGridInstance>()
const rightGridRef = ref<VxeGridInstance>()
const allLeftExperts = ref<any[]>([])
const rightSelection = ref([])

const leftPage = reactive({
  total: 0
})

const rightPage = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const TAB_PUBLIC_CODE = 'SJTC_LHHS_PSZY'

const centerConfig: {
  resizable: VxeColumnPropTypes.Resizable
  align: VxeColumnPropTypes.Align
  headerAlign: VxeColumnPropTypes.HeaderAlign
} = { align: 'center', headerAlign: 'center', resizable: true }

const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

const leftGridOptions = reactive<VxeGridProps<any>>({
  border: 'inner',
  height: 'auto',
  size: 'mini',
  stripe: true,
  loading: false,
  rowConfig: { isCurrent: true, isHover: true },
  columnConfig: {
    resizable: true
  },
  columns: [
    { field: 'expertName', align: 'center', title: '专家姓名', width: 90, sortable: true },
    {
      field: 'majorName',
      title: '专家专业',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      showOverflow: true
    },
    {
      field: 'deptName',
      title: '所属部门',
      align: 'center',
      headerAlign: 'center',
      showOverflow: true
    },
    {
      field: 'linkNum',
      title: '评审项目数量',
      align: 'center',
      headerAlign: 'center',
      width: 120,
      showOverflow: true
    }
  ],
  data: []
})

const rightGridOptions = reactive<VxeGridProps<any>>({
  border: true,
  height: 'auto',
  size: 'small',
  stripe: false,
  showHeaderOverflow: true,
  showOverflow: true,
  checkboxConfig: { trigger: 'row', highlight: true, range: true },
  rowConfig: { isCurrent: true, isHover: true, height: 32 },
  columnConfig: {
    resizable: true
  },
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left', ...centerConfig },
    {
      field: 'zyssxmc',
      title: '预算事项',
      minWidth: 200,
      showOverflow: true,
      ...centerConfig
    },
    {
      field: 'xmbm',
      title: '项目编码',
      minWidth: 200,
      showOverflow: true,
      ...centerConfig
    },
    {
      field: 'xmmc',
      title: '项目名称',
      minWidth: 220,
      showOverflow: true,
      ...centerConfig
    },
    {
      field: 'yjdw',
      title: '一级单位',
      width: 160,
      ...centerConfig
    },
    {
      field: 'ejdw',
      title: '二级单位',
      width: 160,
      ...centerConfig
    },
    {
      field: 'amount',
      title: '申请金额（元）',
      width: 160,
      ...centerConfig,
      align: 'right',
      headerAlign: 'center'
    }
  ],
  data: []
})

const getTabList = async () => {
  tabList.value.length = 0
  const res = await getPublicData(TAB_PUBLIC_CODE)
  if (res.success) {
    const tabs = (res.data || []).map((item: any) => ({
      ...item,
      expertCount: 0
    }))
    tabList.value.push(...tabs)
    activeTab.value = tabList.value[0]?.code ?? ''
    await loadTabExpertCounts(tabs)
  } else {
    ElMessage.error(res.msg)
  }
}

const resolveExpertCount = (data: unknown) => {
  if (Array.isArray(data)) return data.length
  const count = Number(data)
  return Number.isFinite(count) ? count : 0
}

const loadTabExpertCounts = async (tabs: ExpertTabItem[] = tabList.value) => {
  const meetingId = modalProps.value.meetingId
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

// 加载左侧专家数据
const loadLeftData = async () => {
  leftGridOptions.loading = true
  try {
    const res = await getYnrhszjListNum({
      meetingId: modalProps.value.meetingId,
      pszyType: activeTab.value
    })
    if (!res.success) throw new Error(res.msg)
    allLeftExperts.value = res.data
    leftPage.total = res.data.length
    applyLeftFilter()
  } catch (error) {
    ElMessage.error((error as Error).message)
    allLeftExperts.value = []
    leftGridOptions.data = []
    leftPage.total = 0
  } finally {
    leftGridOptions.loading = false
  }
}

const applyLeftFilter = () => {
  const keyword = leftSearchName.value.trim()
  if (!keyword) {
    leftGridOptions.data = allLeftExperts.value
    return
  }
  const lower = keyword.toLowerCase()
  const filtered = allLeftExperts.value.filter((item) => {
    const name = String(item['expertName'] ?? '').toLowerCase()
    const majorName = String(item['majorName'] ?? '').toLowerCase()
    return name.includes(lower) || majorName.includes(lower)
  })
  leftGridOptions.data = filtered
}

const handleTabClick = (tabCode: string) => {
  if (activeTab.value === tabCode) return
  activeTab.value = tabCode
  handleTabChange()
}

const handleTabChange = () => {
  currentExpert.value = null
  rightSelection.value = []
  rightGridOptions.data = []
  rightPage.currentPage = 1
  rightPage.total = 0
  leftGridRef.value?.clearCurrentRow()
  loadLeftData()
}

// 加载右侧业务数据
const loadRightData = async () => {
  if (!currentExpert.value) return
  rightLoading.value = true
  try {
    const res = await getYfpxx({
      bmId: modalProps.value.bmId,
      dwId: modalProps.value.dwId,
      xmbms: rightProjectCode.value,
      xmmc: rightSearchKeyword.value,
      meetingId: modalProps.value.meetingId,
      pszyType: activeTab.value,
      roleCode: modalProps.value.roleCode,
      roleId: modalProps.value.roleId,
      page: rightPage.currentPage,
      limit: rightPage.pageSize,
      expertId: currentExpert.value['expertId']
    })
    if (!res.success) throw new Error(res.msg)
    rightGridOptions.data = res.data.records
    rightPage.total = Number(res.data.total ?? '0')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    rightLoading.value = false
  }
}

// 处理左侧专家选中
const handleLeftCurrentChange = ({ row }: any) => {
  currentExpert.value = row
  loadRightData()
}

// 处理左侧搜索
const handleLeftSearch = debounce(() => {
  applyLeftFilter()
}, 300)

// 处理右侧分页
const handleRightPageChange = (val: number) => {
  rightPage.currentPage = val
  loadRightData()
}

const handleRightSizeChange = (val: number) => {
  rightPage.pageSize = val
  rightPage.currentPage = 1
  loadRightData()
}

// 打开任务分配弹窗
const openAssignModal = () => {
  if (!currentExpert.value) {
    ElMessage.warning('请选择一个专家!')
    return
  }
  modalProps.value.taskAssignmentModalRef?.acceptParams({
    currentExpoert: currentExpert.value,
    bmId: modalProps.value.bmId,
    dwId: modalProps.value.dwId,
    meetingId: modalProps.value.meetingId,
    roleCode: modalProps.value.roleCode,
    roleId: modalProps.value.roleId,
    pszyType: activeTab.value,
    assignmentApis: modalProps.value.assignmentApis
  })
}

// 删除项目
const handleDeletePro = async () => {
  if (!currentExpert.value) {
    ElMessage.warning('请至少选择一个专家!')
    return
  }
  if (!rightSelection.value || rightSelection.value.length === 0) {
    ElMessage.warning('请至少选择一个项目!')
    return
  }
  const type = await VXETable.modal.confirm('请确认是否删除', '确认', {
    status: 'warning',
    cancelButtonText: '否',
    confirmButtonText: '是'
  })
  if (type !== 'confirm') return
  loading.value = true
  const ids = rightSelection.value.map((item: any) => item.id)
  try {
    const deleteExpertProjectApi = modalProps.value.assignmentApis?.deleteExpertProject || defaultDeleteExpertProject
    const res = await deleteExpertProjectApi({
      xmIds: ids,
      pszyType: activeTab.value,
      meetingId: modalProps.value.meetingId,
      expertId: currentExpert.value['expertId']
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('删除成功!')
    isRoleSearch()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const closeHandle = () => {
  rightGridOptions.data = []
  modalVisible.value = false
  currentExpert.value = null
  rightSelection.value = []
  leftSearchName.value = ''
  rightSearchKeyword.value = ''
  rightProjectCode.value = ''
  allLeftExperts.value = []
  leftGridOptions.data = []
  leftPage.total = 0
  tabList.value.length = 0
  activeTab.value = ''
  tabCountRequestId += 1
  emit('clearSelect')
}

// 接受参数并打开弹窗
const acceptParams = (params: ModalProps) => {
  modalProps.value = params
  modalVisible.value = true
  nextTick(() => {
    void (async () => {
      await getTabList()
      loadLeftData()
    })()
  })
}

// 处理右侧任务选择
const handleRightSelection = ({ records }: any) => {
  rightSelection.value = records
}

// 查询右边数据
const isRoleSearch = async () => {
  await loadLeftData()
  if (!currentExpert.value) return
  const row = leftGridOptions.data?.find((item) => item.expertId === currentExpert.value['expertId'])
  if (!row) {
    currentExpert.value = null
    rightGridOptions.data = []
    rightSelection.value = []
    rightPage.total = 0
    return
  }
  leftGridRef.value?.setCurrentRow(row)
  currentExpert.value = row
  await loadRightData()
}

defineExpose({
  isRoleSearch,
  acceptParams
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
