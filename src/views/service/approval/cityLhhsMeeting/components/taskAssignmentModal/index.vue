<template>
  <vxe-modal
    @close="closeHandle"
    v-model="modalVisible"
    title="新增分配任务"
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
      <!-- 左侧：评审专业（带多选） -->
      <div class="left-sidebar">
        <div class="panel-header">
          <div class="panel-title">
            <span class="title-decorator"></span>
            专家选择
          </div>
        </div>

        <!-- 左侧搜索栏 -->
        <div class="toolbar-section" style="height: auto; flex-direction: column; align-items: stretch; gap: 8px">
          <el-input
            v-model="assignLeftSearchName"
            placeholder="搜索专家姓名/专业"
            prefix-icon="el-icon-search"
            clearable
            @input="handleAssignLeftSearch"
            style="width: 100%"
          ></el-input>
        </div>

        <div class="table-flex-container">
          <vxe-grid
            ref="assignLeftGridRef"
            v-bind="assignLeftGridOptions"
            @checkbox-change="handleAssignLeftSelection"
            @checkbox-all="handleAssignLeftSelection"
          >
          </vxe-grid>
        </div>
      </div>

      <!-- 右侧：未分配清单 -->
      <div class="right-main">
        <div class="panel-header">
          <div class="panel-header-left">
            <div class="panel-title">
              <span class="title-decorator purple"></span>
              未分配项目清单
            </div>
            <el-radio-group v-model="assignMode" class="custom-radio-group" @change="changeAssignMode">
              <el-radio-button v-for="item in assignModeOptions" :key="item.code" :label="item.code">
                <span class="radio-label-content"> <i :class="assignModeIconMap[item.code]"></i> {{ item.name }} </span>
              </el-radio-button>
            </el-radio-group>
          </div>
          <div>
            <el-button type="success" icon="el-icon-check" :disabled="!isAssignEnabled" @click="handleAllocated">确认分配</el-button>
            <el-button icon="el-icon-close" @click="closeHandle">关闭</el-button>
          </div>
        </div>

        <!-- 右侧工具栏 -->
        <div class="toolbar-section justify-between">
          <div class="search-group">
            <template v-if="assignMode === '3'">
              <el-input
                v-model="assignRightSearchKeyword"
                placeholder="请输入项目名称查询..."
                class="copy-text-input w-64"
                clearable
                size="small"
                @input="handleAssignRightSearch"
              >
                <template #prepend>
                  <div class="input-prepend">项目名称</div>
                </template>
              </el-input>
              <ReMultipleText
                v-model="assignRightProjectCode"
                placeholder="请输入项目编码,多个用逗号分隔"
                show-prepend
                prepend-label="项目编码"
                class="w-64"
                @change="handleAssignRightSearch"
              />
              <div class="select-with-prepend w-64">
                <div class="select-prepend">是否已分配</div>
                <el-select
                  clearable
                  @change="handleAssignRightSearch"
                  placeholder="请选择"
                  class="filter-select"
                  size="small"
                  v-model="assignRightIsAllocated"
                >
                  <el-option label="未分配" value="0"></el-option>
                  <el-option label="已分配" value="1"></el-option>
                </el-select>
              </div>
            </template>
          </div>
          <el-button circle icon="el-icon-refresh" title="刷新数据" @click="loadAssignRightData"></el-button>
        </div>

        <div class="table-flex-container">
          <vxe-grid
            ref="assignRightGridRef"
            v-bind="assignRightGridOptions"
            :loading="assignRightLoading"
            @checkbox-change="handleAssignRightSelection"
            @checkbox-all="handleAssignRightSelection"
          >
          </vxe-grid>
        </div>

        <!-- 右侧分页组件集成 -->
        <div class="footer-pagination right">
          <el-pagination
            :page-size="assignRightPage.pageSize"
            :current-page="assignRightPage.currentPage"
            :page-sizes="[10, 20, 50, 100, 500]"
            size="default"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="assignRightPage.total"
            @size-change="handleAssignRightSizeChange"
            @current-change="handleAssignRightPageChange"
          />
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="TaskAssignmentModal">
import { ref, reactive, nextTick, defineExpose, computed } from 'vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getDfpxx, getYnrhszjListNum, psfgData as defaultPsfgData } from '@/api/service/IhhsMeeting/approval/cityLhhsMeeting'
import { getPublicData } from '@/api/common'
import { ElMessage } from 'element-plus'
import { VxeGridInstance, VxeGridProps, VXETable } from 'vxe-table'
import { IObject } from '@/types/interface'
import { buildRoleRequestParams } from '@/views/service/approval/cityLhhsMeeting/utils/roleParams'

interface AssignmentApis {
  psfgData?: (params: any) => Promise<any>
}

interface ModalProps {
  title?: string
  meetingId: string
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  currentExpoert: IObject | null
  pszyType?: string
  assignmentApis?: AssignmentApis
}

type AssignModeCode = '1' | '2' | '3'

interface AssignModeOption {
  code: AssignModeCode
  name: string
}

const ASSIGN_MODE_PUBLIC_CODE = 'LHHS_FGPS_TYPE_CITY'
const assignModeIconMap: Record<AssignModeCode, string> = {
  '1': 'el-icon-tickets',
  '2': 'el-icon-office-building',
  '3': 'el-icon-folder'
}

const emit = defineEmits(['allocated'])
const modalVisible = ref(false)
const modalProps = ref<ModalProps>({
  meetingId: '',
  bmId: '',
  dwId: '',
  roleCode: '',
  roleId: '',
  currentExpoert: null,
  pszyType: ''
})
const assignMode = ref<AssignModeCode | ''>('')
const assignModeOptions = ref<AssignModeOption[]>([])
const assignRightLoading = ref(false)

const getModalRoleRequestParams = () => buildRoleRequestParams(modalProps.value)

const assignLeftSearchName = ref('')
const assignRightSearchKeyword = ref('')
const assignRightProjectCode = ref('')
const assignRightIsAllocated = ref<'0' | '1' | ''>('')
const assignLeftSelection = ref<any[]>([])
const assignRightSelection = ref([])
const allLeftExperts = ref<any[]>([])

const assignLeftGridRef = ref<VxeGridInstance>()
const assignRightGridRef = ref<VxeGridInstance>()
const loading = ref(false)

const assignRightPage = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 是否启用确认分配按钮
const isAssignEnabled = computed(() => {
  return assignLeftSelection.value.length > 0 && assignRightSelection.value.length > 0
})

const centerConfig = { align: 'center', headerAlign: 'center' }

const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// 列映射定义
const columnsMap: Record<string, any[]> = {
  '1': [
    { type: 'checkbox', width: 50, fixed: 'left', ...centerConfig },
    {
      type: 'seq',
      width: 80,
      title: '序号',
      fixed: 'left',
      ...centerConfig
    },
    {
      field: 'zyssxbm',
      title: '事项编码',
      width: 130,
      ...centerConfig
    },
    {
      field: 'zyssxmc',
      title: '事项名称',
      minWidth: 200,
      showOverflow: true,
      ...centerConfig
    },
    {
      field: 'num',
      title: '项目数量',
      width: 120,
      sortable: true,
      ...centerConfig
    }
  ],
  '2': [
    { type: 'checkbox', width: 50, fixed: 'left', ...centerConfig },
    {
      field: 'yjdw',
      title: '单位名称',
      minWidth: 220,
      showOverflow: true,
      fixed: 'left',
      ...centerConfig
    },
    {
      field: 'num',
      title: '项目数量',
      width: 120,
      sortable: true,
      ...centerConfig
    }
  ],
  '3': [
    { type: 'checkbox', width: 50, fixed: 'left', ...centerConfig },
    {
      field: 'xmbm',
      title: '项目编码',
      minWidth: 200,
      showOverflow: true,
      fixed: 'left',
      ...centerConfig
    },
    {
      field: 'xmmc',
      title: '项目名称',
      minWidth: 220,
      showOverflow: true,
      fixed: 'left',
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
      field: 'yjfl',
      title: '一级分类',
      width: 160,
      ...centerConfig
    },
    {
      field: 'ejfl',
      title: '二级分类',
      width: 160,
      ...centerConfig
    },
    {
      field: 'sjfl',
      title: '三级分类',
      width: 160,
      ...centerConfig
    }
  ]
}

const assignLeftGridOptions = reactive<VxeGridProps<any>>({
  border: 'inner',
  height: 'auto',
  size: 'mini',
  stripe: true,
  loading: false,
  checkboxConfig: { trigger: 'row', highlight: true },
  rowConfig: { isCurrent: true, isHover: true, keyField: 'expertId' },
  columnConfig: {
    resizable: true
  },
  columns: [
    { type: 'checkbox', width: 40, align: 'center' },
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

const assignRightGridOptions = reactive<VxeGridProps<any>>({
  border: true,
  height: '100%',
  size: 'small',
  stripe: false,
  showHeaderOverflow: true,
  showOverflow: true,
  columnConfig: {
    resizable: true
  },
  checkboxConfig: { trigger: 'row', highlight: true, range: true },
  rowConfig: { isCurrent: true, isHover: true, height: 32 },
  columns: columnsMap['1'],
  data: []
})

const normalizeAssignModeOptions = (list: any[]): AssignModeOption[] => {
  if (!Array.isArray(list)) return []
  const result: AssignModeOption[] = []
  for (const item of list) {
    const code = item?.code as AssignModeCode
    if (!code || !(code in columnsMap)) continue
    const name = String(item?.name ?? '').trim()
    if (!name) continue
    result.push({ code, name })
  }
  return result
}

const initAssignModeOptions = async () => {
  let options: AssignModeOption[] = []
  try {
    const res = await getPublicData(ASSIGN_MODE_PUBLIC_CODE)
    if (res.success) {
      options = normalizeAssignModeOptions(res.data || [])
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
  assignModeOptions.value = options
  const firstMode = options[0]?.code ?? ''
  assignMode.value = firstMode
  if (firstMode) {
    changeAssignMode(firstMode)
  } else {
    assignRightGridOptions.data = []
    assignRightPage.total = 0
  }
}

// 加载左侧专家数据 (mock data)
const loadAssignLeftData = async () => {
  assignLeftGridOptions.loading = true
  try {
    const res = await getYnrhszjListNum({
      meetingId: modalProps.value.meetingId,
      pszyType: modalProps.value.pszyType,
      ...getModalRoleRequestParams()
    })
    if (!res.success) throw new Error(res.msg)
    allLeftExperts.value = res.data
    applyLeftFilter()
  } catch (error) {
    ElMessage.error((error as Error).message)
    allLeftExperts.value = []
    assignLeftGridOptions.data = []
  } finally {
    assignLeftGridOptions.loading = false
  }
}

const applyLeftFilter = () => {
  const keyword = assignLeftSearchName.value.trim()
  if (!keyword) {
    assignLeftGridOptions.data = allLeftExperts.value
    return
  }
  const lower = keyword.toLowerCase()
  const filtered = allLeftExperts.value.filter((item) => {
    const name = String(item['expertName'] ?? '').toLowerCase()
    const majorName = String(item['majorName'] ?? '').toLowerCase()
    return name.includes(lower) || majorName.includes(lower)
  })
  assignLeftGridOptions.data = filtered
}

const handleAssignLeftSearch = debounce(() => {
  applyLeftFilter()
}, 300)

const handleAssignRightSearch = debounce(() => {
  assignRightPage.currentPage = 1
  loadAssignRightData()
}, 300)

// 加载右侧任务数据
const loadAssignRightData = async () => {
  if (!assignMode.value) return
  assignRightLoading.value = true
  assignRightSelection.value = []
  await assignRightGridRef.value?.clearCheckboxRow()
  try {
    const res = await getDfpxx({
      meetingId: modalProps.value.meetingId,
      fgpsType: assignMode.value,
      xmmc: assignMode.value === '3' ? assignRightSearchKeyword.value : '',
      xmbms: assignMode.value === '3' ? assignRightProjectCode.value : '',
      sfyfp: assignMode.value === '3' ? assignRightIsAllocated.value : '',
      page: assignRightPage.currentPage,
      limit: assignRightPage.pageSize,
      pszyType: modalProps.value.pszyType,
      ...getModalRoleRequestParams()
    })
    if (!res.success) throw new Error(res.msg)
    const allRecords = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.records) ? res.data.records : []
    const isPagedResponse = !Array.isArray(res.data)
    const startIndex = (assignRightPage.currentPage - 1) * assignRightPage.pageSize
    const records = isPagedResponse ? allRecords : allRecords.slice(startIndex, startIndex + assignRightPage.pageSize)
    const total = isPagedResponse ? Number(res.data?.total ?? allRecords.length) : allRecords.length
    assignRightGridOptions.data = records
    assignRightPage.total = total
  } catch (error) {
    ElMessage.error((error as Error).message)
    assignRightGridOptions.data = []
    assignRightPage.total = 0
  } finally {
    assignRightLoading.value = false
  }
}

// 处理左侧专家选择
const handleAssignLeftSelection = ({ records }: any) => {
  assignLeftSelection.value = records
}

// 处理右侧任务选择
const handleAssignRightSelection = ({ records }: any) => {
  assignRightSelection.value = records
}

// 切换分配模式
const changeAssignMode = (val: string) => {
  if (!columnsMap[val]) return
  assignMode.value = val as AssignModeCode
  assignRightGridOptions.columns = columnsMap[val]
  assignRightPage.currentPage = 1
  assignRightSelection.value = []
  loadAssignRightData()
}

// 处理右侧分页
const handleAssignRightPageChange = (val: number) => {
  assignRightPage.currentPage = val
  loadAssignRightData()
}

const handleAssignRightSizeChange = (val: number) => {
  assignRightPage.pageSize = val
  assignRightPage.currentPage = 1
  loadAssignRightData()
}

// 确认分配
const handleAllocated = async () => {
  if (!assignMode.value) {
    ElMessage.warning('请选择分配模式')
    return
  }
  const type = await VXETable.modal.confirm('确认是否分配？', '温馨提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return
  loading.value = true
  try {
    const expertIds = assignLeftSelection.value.map((item: any) => item.expertId)
    const ids = assignRightSelection.value.map((item: any) => item.id)
    const psfgDataApi = modalProps.value.assignmentApis?.psfgData || defaultPsfgData
    const res = await psfgDataApi({
      fgpsType: assignMode.value,
      expertIds: expertIds ?? [],
      pszyType: modalProps.value.pszyType || '',
      meetingId: modalProps.value.meetingId,
      ids: ids ?? [],
      ...getModalRoleRequestParams()
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('分配成功!')
    emit('allocated')
    closeHandle()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const closeHandle = () => {
  // 清空所有数据
  assignLeftSelection.value = []
  assignRightSelection.value = []
  assignLeftSearchName.value = ''
  assignMode.value = assignModeOptions.value[0]?.code ?? ''
  if (assignMode.value) {
    assignRightGridOptions.columns = columnsMap[assignMode.value]
  }
  modalVisible.value = false
  assignRightIsAllocated.value = ''
  assignRightProjectCode.value = ''
  assignRightSearchKeyword.value = ''
  assignRightGridOptions.data = []
  assignRightPage.currentPage = 1
  assignRightPage.pageSize = 20
  assignRightPage.total = 0
}

// 接受参数并打开弹窗
const acceptParams = (params: ModalProps) => {
  modalProps.value = params
  modalVisible.value = true
  if (assignLeftGridOptions.checkboxConfig && params.currentExpoert) {
    assignLeftGridOptions.checkboxConfig.checkRowKeys = [params.currentExpoert['expertId']]
    assignLeftSelection.value = [params.currentExpoert]
  }
  nextTick(() => {
    void initAssignModeOptions()
    loadAssignLeftData()
  })
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
