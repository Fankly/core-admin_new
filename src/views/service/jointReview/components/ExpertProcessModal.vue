<!-- 专家评审进度 -->
<template>
  <vxe-modal
    @close="closeHandle"
    title="专家评审进度"
    :loading="loading"
    :destroy-on-close="true"
    v-model="modalVisible"
    width="80%"
    height="820"
    resize
    show-zoom
    position="center"
  >
    <div class="expert-process-modal">
      <div class="search-panel">
        <el-form :model="searchForm" label-suffix="：" label-width="90px" @submit.prevent>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="专家账号">
                <el-input v-model="searchForm.expertAccount" clearable placeholder="请输入专家账号" @keyup.enter="searchHandle" />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <div class="search-panel__buttons">
                <el-button size="mini" type="primary" plain @click="searchHandle">查 询</el-button>
                <el-button size="mini" plain @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="table-wrap">
        <div class="table-wrap__main">
          <vxe-table
            ref="processTableRef"
            height="100%"
            border
            resizable
            show-overflow
            show-header-overflow
            align="center"
            header-align="center"
            :data="tableData"
            :row-config="{ keyField: 'expertId', isHover: true, height: 32 }"
          >
            <vxe-column field="expertName" title="专家姓名" min-width="120" />
            <vxe-column field="expertAccount" title="专家账号" min-width="140" />
            <vxe-column field="pszyType" title="评审专业" min-width="140" />
            <vxe-column field="totalNum" title="评审项目总数量" min-width="130">
              <template #default="{ row }">
                <el-button v-if="ENABLE_COUNT_THROUGH && isCountClickable(row.totalNum)" type="text" @click="openThrough(row, 'totalNum')">
                  {{ formatCount(row.totalNum) }}
                </el-button>
                <span v-else>{{ formatCount(row.totalNum) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="ypsxmNum" title="已评审项目数量" min-width="130">
              <template #default="{ row }">
                <el-button v-if="ENABLE_COUNT_THROUGH && isCountClickable(row.ypsxmNum)" type="text" @click="openThrough(row, 'ypsxmNum')">
                  {{ formatCount(row.ypsxmNum) }}
                </el-button>
                <span v-else>{{ formatCount(row.ypsxmNum) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="thdpsxmNum" title="退回待评审项目统计" min-width="150">
              <template #default="{ row }">
                <el-button v-if="ENABLE_COUNT_THROUGH && isCountClickable(row.thdpsxmNum)" type="text" @click="openThrough(row, 'thdpsxmNum')">
                  {{ formatCount(row.thdpsxmNum) }}
                </el-button>
                <span v-else>{{ formatCount(row.thdpsxmNum) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="dpsxmNum" title="待评审项目数量" min-width="130">
              <template #default="{ row }">
                <el-button v-if="ENABLE_COUNT_THROUGH && isCountClickable(row.dpsxmNum)" type="text" @click="openThrough(row, 'dpsxmNum')">
                  {{ formatCount(row.dpsxmNum) }}
                </el-button>
                <span v-else>{{ formatCount(row.dpsxmNum) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="wcl" title="完成率(%)" min-width="100">
              <template #default="{ row }">{{ formatRate(row.wcl) }}</template>
            </vxe-column>
            <template #empty>
              <div class="table-empty">暂无数据</div>
            </template>
          </vxe-table>
        </div>
        <div class="table-wrap__pager">
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
    </div>
  </vxe-modal>

  <!-- 进度穿透：评审项目明细（导出置于顶部，与其他穿透页一致） -->
  <vxe-modal
    v-if="ENABLE_COUNT_THROUGH"
    @close="closeThroughHandle"
    :title="throughTitle"
    :loading="throughLoading"
    :destroy-on-close="true"
    v-model="throughVisible"
    width="70%"
    height="720"
    resize
    show-zoom
    position="center"
  >
    <div class="expert-process-modal">
      <div class="operation-bar">
        <el-button size="mini" type="primary" plain :loading="exportLoading" @click="exportHandle">导 出</el-button>
      </div>

      <div class="search-panel">
        <el-form :model="throughSearchForm" label-suffix="：" label-width="90px" @submit.prevent>
          <el-row :gutter="16">
            <el-col :span="10">
              <el-form-item label="项目编码">
                <ReMultipleText v-model="throughSearchForm.xmbms" placeholder="请输入项目编码,多个用逗号分隔" dialog-title="批量输入项目编码" />
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <div class="search-panel__buttons">
                <el-button size="mini" type="primary" plain @click="throughSearchHandle">查 询</el-button>
                <el-button size="mini" plain @click="throughResetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="table-wrap">
        <div class="table-wrap__main">
          <vxe-table
            ref="throughTableRef"
            height="100%"
            border
            resizable
            show-overflow
            show-header-overflow
            align="center"
            header-align="center"
            :data="throughTableData"
            :row-config="{ keyField: 'xmbm', isHover: true, height: 32 }"
          >
            <vxe-column field="xmmc" title="项目名称" min-width="200" />
            <vxe-column field="yssxmc" title="预算事项名称" min-width="160" />
            <vxe-column field="yjdwName" title="一级单位" min-width="120" />
            <vxe-column field="ejdwName" title="二级单位" min-width="120" />
            <vxe-column field="reviewOpinion" title="评审意见" min-width="100" />
            <vxe-column field="reason" title="评审意见说明" min-width="180" />
            <template #empty>
              <div class="table-empty">暂无数据</div>
            </template>
          </vxe-table>
        </div>
        <div class="table-wrap__pager">
          <el-pagination
            :current-page="throughPage.page"
            background
            :page-sizes="[10, 20, 50, 100, 500]"
            :page-size="throughPage.limit"
            :total="Number(throughPage.total)"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="throughLimitChangeHandle"
            @current-change="throughPageChangeHandle"
          />
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'ExpertProcessModal'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportExpertProcess, getExpertProcess, getExpertProcessThrough } from '@/api/service/jointReview'
import type { ExpertProcessParams, ExpertProcessRow, ExpertProcessThroughParams } from '@/api/service/jointReview'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { apiExportHandle } from '@/utils/export'
import { useStore } from 'vuex'

interface ModalProps {
  /** 会议信息 */
  row: Partial<{
    meetingId: string
    meetingCode: string
  }>
  /** 当前登录角色/部门信息 */
  userInfo: Partial<{
    deptId: string
    dwId: string
    roleCode: string
    roleId: string
  }>
}

const store = useStore()
const processTableRef = ref()
const throughTableRef = ref()
const loading = ref(false)
const exportLoading = ref(false)
const throughLoading = ref(false)
const modalVisible = ref(false)
const throughVisible = ref(false)
const throughTitle = ref('项目明细')
const tableData = ref<ExpertProcessRow[]>([])
const throughTableData = ref<ExpertProcessRow[]>([])

type CountField = 'totalNum' | 'ypsxmNum' | 'thdpsxmNum' | 'dpsxmNum'

/** 数量穿透开关：开启数量链接、项目明细查询与导出 */
const ENABLE_COUNT_THROUGH = true

const searchForm = reactive({
  expertAccount: ''
})

const throughSearchForm = reactive({
  xmbms: ''
})

const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const throughPage = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const throughContext = ref<{
  expertId: string
  expertName: string
  /** 穿透必须用进度列表行上的 meetingId */
  meetingId: string
  meetingCode: string
  ctType: string
  xmbms: string[]
}>({
  expertId: '',
  expertName: '',
  meetingId: '',
  meetingCode: '',
  ctType: '',
  xmbms: []
})

/** 项目编码统一转为 string[]（支持数组 / 逗号分隔字符串） */
const normalizeXmbms = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean)
  }
  if (value === undefined || value === null || value === '') return []
  return String(value)
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const modalProps = ref<ModalProps>({
  row: {},
  userInfo: {}
})

const CT_TYPE_LABEL: Record<string, string> = {
  totalNum: '评审项目总数量',
  ypsxmNum: '已评审项目数量',
  thdpsxmNum: '退回待评审项目统计',
  dpsxmNum: '待评审项目数量'
}

const buildBaseParams = (): ExpertProcessParams => {
  const user = modalProps.value.userInfo || {}
  const meeting = modalProps.value.row || {}
  return {
    bmId: user.deptId || '',
    dwId: user.dwId || '',
    roleCode: user.roleCode || '',
    roleId: user.roleId || '',
    userId: String(store.getters.getUserMsg?.id ?? ''),
    meetingId: meeting.meetingId || '',
    meetingCode: meeting.meetingCode || ''
  }
}

/** 空值展示为 -；0 也展示为 0，可穿透 */
const formatCount = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

/** 有值（含 0）即可点击穿透；空值不可点 */
const isCountClickable = (value: unknown) => {
  if (value === undefined || value === null || value === '') return false
  return !Number.isNaN(Number(value))
}

const formatRate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value).includes('%') ? String(value) : `${value}%`
}

const normalizePageResult = (val: unknown): { records: ExpertProcessRow[]; total: number } => {
  if (Array.isArray(val)) {
    return {
      records: val as ExpertProcessRow[],
      total: val.length
    }
  }
  if (val && typeof val === 'object') {
    const data = val as Record<string, any>
    if (Array.isArray(data.records)) {
      return {
        records: data.records as ExpertProcessRow[],
        total: Number(data.total || data.records.length || 0)
      }
    }
    if (Array.isArray(data.list)) {
      return {
        records: data.list as ExpertProcessRow[],
        total: Number(data.total || data.list.length || 0)
      }
    }
  }
  return {
    records: [],
    total: 0
  }
}

const getPageList = async () => {
  if (!modalProps.value.row?.meetingId) return
  loading.value = true
  try {
    const params: ExpertProcessParams = {
      ...buildBaseParams(),
      expertAccount: searchForm.expertAccount || '',
      page: String(page.page),
      limit: String(page.limit)
    }
    const res = await getExpertProcess(params)
    if (!res?.success) {
      tableData.value = []
      page.total = 0
      ElMessage.error(res?.msg || '查询专家评审进度失败')
      return
    }
    const normalized = normalizePageResult(res.data)
    tableData.value = normalized.records
    page.total = normalized.total
  } catch (e: any) {
    tableData.value = []
    page.total = 0
    ElMessage.error(e?.message || e?.toString?.() || '查询专家评审进度失败')
  } finally {
    loading.value = false
  }
}

const searchHandle = () => {
  page.page = 1
  getPageList()
}

const resetSearch = () => {
  searchForm.expertAccount = ''
  page.page = 1
  getPageList()
}

const limitChangeHandle = (limit: number) => {
  page.limit = limit
  page.page = 1
  getPageList()
}

const pageChangeHandle = (current: number) => {
  page.page = current
  getPageList()
}

const openThrough = (row: ExpertProcessRow, ctType: CountField) => {
  // 0 也可穿透；仅空值不进入
  if (!isCountClickable(row[ctType])) {
    ElMessage.info('暂无数据')
    return
  }
  // 穿透 meetingId 必须取进度列表行数据，不能用入口页会议 id 兜底
  const rowMeetingId = String(row.meetingId ?? '').trim()
  if (!rowMeetingId) {
    ElMessage.warning('缺少会议ID，无法穿透')
    return
  }
  throughContext.value = {
    expertId: row.expertId || '',
    expertName: row.expertName || '',
    meetingId: rowMeetingId,
    meetingCode: String(row.meetingCode ?? '').trim(),
    ctType,
    // 行上带出的项目编码列表
    xmbms: normalizeXmbms(row.xmbms)
  }
  throughSearchForm.xmbms = ''
  throughPage.page = 1
  throughPage.limit = 20
  throughPage.total = 0
  throughTableData.value = []
  const typeLabel = CT_TYPE_LABEL[ctType] || '项目明细'
  throughTitle.value = `${row.expertName || '专家'} - ${typeLabel}`
  throughVisible.value = true
  getThroughPageList()
}

const buildThroughParams = (): ExpertProcessThroughParams => {
  // 有查询条件时用搜索的 xmbms；否则沿用行上带出的 xmbms（string[]）
  const searchXmbms = normalizeXmbms(throughSearchForm.xmbms)
  const xmbms = searchXmbms.length ? searchXmbms : throughContext.value.xmbms
  const { meetingId: _entryMeetingId, meetingCode: _entryMeetingCode, ...userBase } = buildBaseParams()
  return {
    ...userBase,
    // 穿透/导出：meetingId、meetingCode 只用进度列表行，不用入口页
    meetingId: throughContext.value.meetingId,
    meetingCode: throughContext.value.meetingCode,
    expertAccount: '',
    expertId: throughContext.value.expertId,
    ctType: throughContext.value.ctType,
    xmbms,
    page: String(throughPage.page),
    limit: String(throughPage.limit)
  }
}

const getThroughPageList = async () => {
  if (!throughContext.value.meetingId) {
    ElMessage.warning('缺少会议ID，无法穿透')
    return
  }
  if (!throughContext.value.expertId && !throughContext.value.ctType) return
  throughLoading.value = true
  try {
    const res = await getExpertProcessThrough(buildThroughParams())
    if (!res?.success) {
      throughTableData.value = []
      throughPage.total = 0
      ElMessage.error(res?.msg || '查询项目明细失败')
      return
    }
    const normalized = normalizePageResult(res.data)
    throughTableData.value = normalized.records
    throughPage.total = normalized.total
  } catch (e: any) {
    throughTableData.value = []
    throughPage.total = 0
    ElMessage.error(e?.message || e?.toString?.() || '查询项目明细失败')
  } finally {
    throughLoading.value = false
  }
}

const throughSearchHandle = () => {
  throughPage.page = 1
  getThroughPageList()
}

const throughResetSearch = () => {
  throughSearchForm.xmbms = ''
  throughPage.page = 1
  getThroughPageList()
}

const throughLimitChangeHandle = (limit: number) => {
  throughPage.limit = limit
  throughPage.page = 1
  getThroughPageList()
}

const throughPageChangeHandle = (current: number) => {
  throughPage.page = current
  getThroughPageList()
}

// 穿透明细导出（带上当前穿透上下文与查询条件）
const exportHandle = async () => {
  if (exportLoading.value) return
  if (!throughContext.value.ctType) {
    ElMessage.warning('暂无可导出数据')
    return
  }
  if (!throughContext.value.meetingId) {
    ElMessage.warning('缺少会议ID，无法导出')
    return
  }
  exportLoading.value = true
  try {
    const params = buildThroughParams()
    const expertName = throughContext.value.expertName || '专家'
    const typeLabel = CT_TYPE_LABEL[throughContext.value.ctType] || '项目明细'
    const fileName = `${expertName}_${typeLabel}`
    await apiExportHandle(params, fileName, exportExpertProcess)
  } catch (e: any) {
    ElMessage.error(e?.message || e?.toString?.() || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

const closeHandle = () => {
  loading.value = false
  tableData.value = []
  page.page = 1
  page.total = 0
  searchForm.expertAccount = ''
}

const closeThroughHandle = () => {
  throughLoading.value = false
  throughTableData.value = []
  throughPage.page = 1
  throughPage.total = 0
  throughSearchForm.xmbms = ''
  throughContext.value = {
    expertId: '',
    expertName: '',
    meetingId: '',
    meetingCode: '',
    ctType: '',
    xmbms: []
  }
}

const acceptParams = (params: ModalProps) => {
  if (!params?.row?.meetingId) {
    ElMessage.warning('请选择一条会议数据')
    return
  }
  modalProps.value = {
    row: { ...params.row },
    userInfo: { ...(params.userInfo || {}) }
  }
  searchForm.expertAccount = ''
  page.page = 1
  page.limit = 20
  page.total = 0
  tableData.value = []
  modalVisible.value = true
  getPageList()
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.expert-process-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 8px 4px 0;
  box-sizing: border-box;
}

/* 穿透页顶部操作栏：导出等与 DrillThroughModal 等页面一致置顶 */
.operation-bar {
  display: flex;
  flex-shrink: 0;
  gap: 5px;
  align-items: center;
  padding-bottom: 10px;
}

.search-panel {
  flex-shrink: 0;
  margin-bottom: 8px;

  :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  &__buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 32px;
    gap: 8px;
  }
}

.table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &__main {
    flex: 1;
    min-height: 0;
  }

  &__pager {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    padding: 8px 0 4px;
  }
}

.table-empty {
  padding: 24px 0;
  color: #64748b;
}
</style>
