<template>
  <PendingReportModal
    ref="pendingReportModalRef"
    title="无会议项目"
    :search-api="getNoMeetingXmPage"
    :export-api="exportNoMeetingXmPage"
    :columns="noMeetingColumns"
    :default-params="defaultParams"
    :show-checkbox="true"
  >
    <template #operation="{ selectedList }">
      <el-button
        :disabled="selectedList.length === 0"
        v-if="isShowButton('PSYJSC_WH')"
        plain
        type="primary"
        size="mini"
        @click="handleUpload(selectedList)"
      >
        评审意见上传
      </el-button>
      <el-button
        :disabled="selectedList.length === 0"
        v-if="isShowButton('SUBMIT')"
        plain
        type="primary"
        size="mini"
        @click="handleSubmit(selectedList)"
      >
        提交
      </el-button>
      <el-button
        :disabled="selectedList.length !== 1"
        v-if="isShowButton('VIEW')"
        plain
        type="primary"
        size="mini"
        @click="handleView(selectedList)"
      >
        查看明细
      </el-button>
    </template>
    <template #search>
      <el-form style="width: 100%">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="项目编码：">
              <ReMultipleText
                v-model="searchForm.xmbm"
                placeholder="请输入项目编码"
                dialog-title="项目编码"
                tooltip-text="项目编码"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称：">
              <el-input v-model="searchForm.xmmc" placeholder="请输入项目名称" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div style="text-align: right; margin-bottom: 10px">
              <el-button size="mini" type="primary" plain @click="handleSearch">查 询</el-button>
              <el-button size="mini" plain @click="handleReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </template>
  </PendingReportModal>
  <BatchMaintenance
    @submit-after="handleUploadAfter"
    input-key="wh"
    input-text="评审意见文号"
    modal-title="评审意见上传"
    :select-data="uploadRows"
    :allowed-file-types="[]"
    :submit-api="submitMaintenance"
    ref="uploadModalRef"
  />
  <CentralizedModification ref="detailModalRef" :user-info="detailUserInfo" :form-data="detailRow" flag="VIEW" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import PendingReportModal from '@/views/service/Storage/reviewReplyUpload/components/pendingReportModal/index.vue'
import BatchMaintenance from '@/views/service/Storage/components/BatchMaintenance/index.vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { formatNumValue } from '@/utils/utils'
import {
  exportNoMeetingXmPage,
  getNoMeetingXmPage,
  maintainNoMeetingPsyj,
  submitNoMeetingPsyj
} from '@/api/service/Storage/reviewReplyUpload/index'

interface Props {
  buttonPermissions?: string[]
  defaultParams?: Record<string, any>
  userInfo?: {
    bmId?: string
    bmName?: string
    dwId?: string
    dwName?: string
    roleId?: string
    roleCode?: string
    spRoleId?: string
    specialOrgCode?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  buttonPermissions: () => [],
  defaultParams: () => ({}),
  userInfo: () => ({})
})

const emit = defineEmits<{
  (e: 'submitAfter'): void
}>()

const pendingReportModalRef = ref<InstanceType<typeof PendingReportModal>>()
const uploadModalRef = ref<InstanceType<typeof BatchMaintenance>>()
const detailModalRef = ref<InstanceType<typeof CentralizedModification>>()

const searchForm = ref({ xmbm: '', xmmc: '' })
const openParams = ref<Record<string, any>>({})
const uploadRows = ref<any[]>([])
const detailRow = ref<any>({})
const loading = ref(false)

const noMeetingColumns = [
  { field: 'xmmc', title: '项目名称', width: 300 },
  { field: 'gwxmbm', title: '项目编码', width: 180 },
  { field: 'proType', title: '项目类型', width: 180 },
  { field: 'yssx', title: '预算事项', width: 200 },
  { field: 'kypswh', title: '可研评审文号', width: 180 },
  { field: 'yjdw', title: '一级单位', width: 200 },
  { field: 'ejdw', title: '二级单位', width: 200 },
  { field: 'yjfl', title: '一级分类', width: 200 },
  { field: 'ejfl', title: '二级分类', width: 200 },
  { field: 'sjfl', title: '三级分类', width: 200 },
  {
    field: 'amount',
    title: '当年预算(万元)',
    width: 180,
    headerAlign: 'center',
    align: 'right',
    formatter({ cellValue }: { cellValue: string }) {
      if (cellValue === null || cellValue === undefined || cellValue === '') {
        return '-'
      }
      return formatNumValue(cellValue, 6)
    }
  }
]

const detailUserInfo = computed(() => ({
  deptId: props.userInfo.bmId,
  deptName: props.userInfo.bmName,
  dwId: props.userInfo.dwId,
  dwName: props.userInfo.dwName,
  roleId: props.userInfo.roleId,
  roleCode: props.userInfo.roleCode,
  spRoleId: props.userInfo.spRoleId,
  specialorgcode: props.userInfo.specialOrgCode
}))

const isShowButton = (btnRole: string) => props.buttonPermissions.includes(btnRole)

const getFirstValue = (row: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

/** 无会议项目无 meetingId，仅取项目 ID */
const getXmId = (row: Record<string, any>) => getFirstValue(row, ['xmId', 'xmid', 'id'])

const open = (params?: Record<string, any>) => {
  // 无会议：不传 meetingId，仅保留筛选与外部透传参数
  openParams.value = { ...(params ?? {}) }
  searchForm.value = { xmbm: '', xmmc: '' }
  pendingReportModalRef.value?.open(openParams.value)
}

const refresh = () => {
  pendingReportModalRef.value?.refresh()
}

const handleSearch = () => {
  pendingReportModalRef.value?.open({ ...openParams.value, ...searchForm.value })
}

const handleReset = () => {
  searchForm.value = { xmbm: '', xmmc: '' }
  pendingReportModalRef.value?.open(openParams.value)
}

const handleUpload = (records: any[]) => {
  if (!records.length) {
    ElMessage.warning('请选择需要上传评审意见的项目!')
    return
  }
  // 无会议：以项目 xmId 作为维护主体（BatchMaintenance 用 row.id 拼接）
  const rows = records
    .map((row) => {
      const id = getXmId(row)
      return id ? { ...row, id } : null
    })
    .filter(Boolean)
  if (rows.length === 0) {
    ElMessage.warning('未找到项目ID，无法进行评审意见上传!')
    return
  }
  uploadRows.value = rows as any[]
  uploadModalRef.value?.openModal()
}

/** 适配 BatchMaintenance 回调：xmId/wh 为字符串，uuids 为附件 uuid 数组 */
const submitMaintenance = (params: any) => {
  const xmId = params.xmId
  const wh = params.wh
  const uuids = Array.isArray(params.uuids)
    ? params.uuids.filter(Boolean)
    : String(params.uuids || '')
        .split(',')
        .filter(Boolean)
  if (!xmId) {
    return Promise.reject(new Error('未找到项目ID，无法保存!'))
  }
  if (!wh) {
    return Promise.reject(new Error('请输入评审意见文号!'))
  }
  if (!uuids.length) {
    return Promise.reject(new Error('请上传至少一个附件!'))
  }
  return maintainNoMeetingPsyj({ xmId, wh, uuids })
}

const handleUploadAfter = async () => {
  pendingReportModalRef.value?.refresh()
  emit('submitAfter')
}

const handleSubmit = async (records: any[]) => {
  if (!records.length) {
    ElMessage.warning('请选择需要提交的项目!')
    return
  }
  const ids = records.map((row) => getXmId(row)).filter(Boolean)
  if (ids.length === 0) {
    ElMessage.warning('未找到项目ID，无法提交!')
    return
  }
  try {
    loading.value = true
    const type = await VXETable.modal.confirm('是否提交评审意见报告？', '确认', {
      status: 'question',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    const res = await submitNoMeetingPsyj(ids)
    if (!res.success) throw new Error(res.msg)
    pendingReportModalRef.value?.refresh()
    emit('submitAfter')
    ElMessage.success('提交成功!')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleView = (records: any[]) => {
  const row = records[0] || {}
  const id = getXmId(row)
  if (!id) {
    ElMessage.warning('未找到项目ID，无法查看明细!')
    return
  }
  detailRow.value = {
    ...row,
    id,
    xmlx: getFirstValue(row, ['proTypeId', 'protypeId', 'xmlx'])
  }
  if (detailModalRef.value) detailModalRef.value.isShowModal = true
}

defineExpose({ open, refresh })
</script>
