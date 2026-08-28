<template>
  <div class="container" v-loading="loading">
    <ProTable
      @row-click="rowClick"
      row-key="meetingId"
      @selection-change="handleSelectionChange"
      :cell-style="columnStyle"
      @cell-click="psmsView"
      @search="clearSelect"
      @reset="clearSelect"
      v-if="isShowPage"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="lhhsMeeting"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="mini" type="primary" plain @click="openModal('创建')">创 建</el-button>
        <el-button
          v-permission="'EDIT'"
          size="mini"
          :disabled="!scope['isSelected']"
          type="primary"
          plain
          @click="openModal('修改', scope['selectedList'])"
          >修 改</el-button
        >
        <el-button
          v-permission="'VIEW'"
          size="mini"
          :disabled="!scope['isSelected']"
          type="primary"
          plain
          @click="openModal('查看', scope['selectedList'])"
          >查 看</el-button
        >
        <el-button
          v-permission="'DELETE'"
          size="mini"
          :disabled="!scope['isSelected']"
          type="primary"
          plain
          @click="handleDeleteFormData(scope['selectedList'])"
          >删 除</el-button
        >
        <el-button
          v-permission="'PRODETAIL'"
          :disabled="isDisabled"
          size="mini"
          type="primary"
          plain
          @click="openReviewModal('PROGRAM', '联合会审会议项目明细', scope['selectedList'])"
          >评审项目确定</el-button
        >
        <el-button
          v-permission="'EXPDETAIL'"
          :disabled="isDisabled"
          size="mini"
          type="primary"
          plain
          @click="openReviewModal('EXPERT', '联合会审会议专家明细', scope['selectedList'])"
          >评审专家确定</el-button
        >
        <el-button
          v-permission="'ASSIGNED'"
          size="mini"
          :disabled="!scope.isSelected || scope.selectedListIds.length != 1"
          type="primary"
          plain
          @click="choosePsms(scope['selectedList'])"
        >
          评审分工
        </el-button>
        <el-button
          v-permission="'PUBLISH'"
          size="mini"
          :disabled="!scope['isSelected']"
          type="primary"
          plain
          @click="handlePublish('PUBLISH', '发布', scope['selectedList'])"
          >会议发布</el-button
        >
        <el-button
          v-permission="'CANCEL'"
          size="mini"
          :disabled="!scope['isSelected']"
          type="primary"
          plain
          @click="handlePublish('CACEL_PUBLISH', '取消发布', scope['selectedList'])"
          >取消会议发布</el-button
        >
      </template>
    </ProTable>
    <TheesMeetingEdit @clearSelect="clearSelect" ref="modalRef" />
    <ReViewModal @clearSelect="clearSelect" ref="reViewModalRef" />
    <!-- 权限选择 -->
    <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
    <select-modal
      ref="selectModalRef"
      @show-modal="showModal"
      :title="'评审模式'"
      :label="'评审模式'"
      :options="reviewModeOptions"
      :loading="reviewModeLoading"
      :disabled="reviewModeLoadFailed"
    />
    <pro-assigned ref="proAssignedRef" />
    <proAssignedModal @include-in-review="clearMoadl" ref="proAssignedModalRef" />
  </div>
</template>

<script lang="ts">
export default {
  name: '/service/jointReview/lhhsMeeting/index'
}
</script>
<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { addOrUpdateMeeting, canclePublish, deleteLhhsMeeting, getLhhsMeetingPageData, getMeetingCode, publish } from '@/api/service/IhhsMeeting'
import { psfg } from '@/api/service/jointReview'
import { getPublicData } from '@/api/common'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VXETable } from 'vxe-table'
import { formatNumValue } from '@/utils/utils'
import ProTable from '@/components/ProTable/index.vue'
import TheesMeetingEdit from '@/views/service/jointReview/lhhsMeeting/components/TheesMeetingEdit'
import ReViewModal from '@/views/service/jointReview/lhhsMeeting/components/ReViewModal'
import userDialog from '@/components/select/userDialog.vue'
import { useUser } from '@/hooks/useUser'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import selectModal from '@/views/service/ywpt/components/selectModal.vue'
import proAssignedModal from '@/views/service/ywpt/components/proAssignedModal/review.vue'
import proAssigned from '@/views/service/ywpt/components/proAssigned.vue'
import { REVIEW_MODE_ASSIGNED_CODE, useReviewModeCode } from '@/hooks/useReviewModeCode'

const userDialogRef = ref()
const isShowPage = ref(false)
const route = useRoute()

const proTableRef = ref<any>(null)
const modalRef = ref<InstanceType<typeof TheesMeetingEdit> | null>(null)
const reViewModalRef = ref<InstanceType<typeof ReViewModal> | null>(null)

const isDisabled = ref(true)
const loading = ref(false)

const statusEnum = ref<any>([])
const meetingId = ref<any>()

const store = useStore()
const psms = ref<string>('')
const proAssignedRef = ref()
const selectModalRef = ref()
const {
  reviewModeOptions,
  reviewModeLoading,
  reviewModeLoadFailed,
  loadReviewModeOptions,
  getReviewModeName,
  getReviewModeUpdateMessage,
  hasReviewMode,
  checkReviewModeOptionsReady
} = useReviewModeCode()

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
})
const clearSelect = () => {
  proTableRef.value?.clearSelection()
}

const clearMoadl = () => {
  proTableRef.value?.getTableList()
  proTableRef.value?.clearSelection()
}

const rowClick = (row: any) => {
  clearSelect()
  proTableRef.value?.element.toggleRowSelection(row)
}
const getPageList = (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  return getLhhsMeetingPageData(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const handleSelectionChange = (rows: any[]) => {
  if (rows.length === 1) isDisabled.value = false
  else {
    isDisabled.value = true
    return
  }
  const row = rows[0]
  if (row['status'] === '00') {
    isDisabled.value = false
  } else {
    isDisabled.value = true
  }
}

const getPublicCodeData = async () => {
  try {
    const res = await getPublicData('LHHS_MEETING_STATUS')
    if (!res.success) {
      throw new Error(res.msg)
    }
    const statusData: any[] = res.data
    for (let i = 0; i < statusData.length; i++) {
      const tagType = ['info', 'warning', 'success']
      if (i > 3) {
        statusData[i].tagType = 'danger'
      } else {
        statusData[i].tagType = tagType[i]
      }
    }
    statusEnum.value.push(...statusData)
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
}

// 选择评审方式
const showModal = (val: any) => {
  const value = getReviewModeUpdateMessage(val)
  const text = psms.value ? (val === psms.value ? '当前评审模式保持不变，请确认。' : '是否调整评审模式？') : '是否选择当前评审模式？'
  ElMessageBox.confirm(`${text}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const params = {
        meetingId: meetingId.value,
        psms: val
      }
      if (val === psms.value && val == REVIEW_MODE_ASSIGNED_CODE) {
        selectModalRef.value.isShowModel = false
        showAssigned()
        return
      }
      const res: any = await psfg({ ...params })
      if (res.success) {
        ElMessage.success(`${value}`)
        selectModalRef.value.isShowModel = false
        if (val == REVIEW_MODE_ASSIGNED_CODE) {
          showAssigned()
        }
        proTableRef.value?.getTableList()
        proTableRef.value?.clearSelection()
      } else {
        ElMessage.error(res.msg)
        selectModalRef.value.isShowModel = false
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}

// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (['评审模式'].includes(column.label)) {
    return {
      cursor: 'pointer',
      color: 'var(--color-primary, #00857c)'
    }
  }
}

// 查看评审模式
const psmsView = async (row: any, column: any) => {
  if (column.label == '评审模式') {
    if (!hasReviewMode(row.psms)) {
      return ElMessage.warning('暂未选择评审模式，请选择后查看。')
    }
    proAssignedRef.value.searchData.meetingId = row.meetingId
    proAssignedRef.value.isShowModel = true
    proAssignedRef.value.isShowBtn = false
    nextTick(() => {
      proAssignedRef.value.initParamLists()
      proAssignedRef.value.proTableRef.getTableList()
    })
  }
}

const showAssigned = () => {
  proAssignedRef.value.isShowModel = true
  proAssignedRef.value.isShowBtn = true
  nextTick(() => {
    proAssignedRef.value.searchData.meetingId = meetingId.value
    proAssignedRef.value.initParamLists()
    proAssignedRef.value.proTableRef.getTableList()
  })
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80 },
  { type: 'index', width: 80, label: '序号' },
  {
    prop: 'status',
    label: '会议状态',
    enum: statusEnum.value,
    tag: true,
    search: {
      el: 'select',
      order: 5
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    width: '120'
  },
  {
    prop: 'meetingCode',
    label: '会议编号',
    search: {
      el: 'input',
      order: 1
    },
    width: '180'
  },
  {
    prop: 'meetingName',
    label: '会议名称',
    search: {
      el: 'input',
      order: 1
    },
    width: '280'
  },
  {
    prop: 'psms',
    label: '评审模式',
    width: '80',
    render: ({ row }: any) => {
      return getReviewModeName(row.psms, '-')
    }
  },
  {
    prop: 'meetingAddr',
    label: '会议地点',
    width: '180'
  },
  {
    prop: 'organizer',
    label: '组织人',
    width: '180'
  },
  {
    prop: 'phone',
    label: '组织电话',
    width: '180'
  },
  {
    prop: 'yslyName',
    label: '预算来源',
    width: '100'
  },
  {
    prop: 'startTime',
    label: '会议开始时间',
    width: '180',
    search: {
      el: 'date-picker',
      order: 3,
      props: {
        type: 'datetime',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        onChange: (val: string) => {
          if (val && proTableRef.value?.searchParam.endTime) {
            const startTime = new Date(val).getTime()
            const endTime = new Date(proTableRef.value.searchParam.endTime).getTime()
            if (startTime > endTime) {
              proTableRef.value.searchParam.endTime = val
            }
          }
        },
        clearable: true
      }
    }
  },
  {
    prop: 'endTime',
    label: '会议结束时间',
    width: '180',
    search: {
      el: 'date-picker',
      order: 4,
      props: {
        type: 'datetime',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        onChange: (val: string) => {
          if (!val) {
            proTableRef.value.searchParam.startTime = ''
            return
          }
          if (val && proTableRef.value?.searchParam.startTime) {
            const startTime = new Date(proTableRef.value.searchParam.startTime).getTime()
            const endTime = new Date(val).getTime()
            if (startTime > endTime) {
              proTableRef.value.searchParam.startTime = val
            }
          }
        },
        clearable: true
      }
    }
  },
  {
    prop: 'majorName',
    label: '评审专业',
    width: '180'
  },
  {
    prop: 'xmNum',
    label: '评审项目数量',
    width: '180'
  },
  {
    prop: 'sumJe',
    label: '评审项目金额(万元)',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sumJe
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  {
    prop: 'zjNum',
    label: '评审专家人数',
    width: '100'
  }
])

const openModal = async (title: string, selectedData: any[] = []) => {
  if (title !== '创建' && selectedData && selectedData.length !== 1) {
    ElMessage.warning('请选择一条数据进行' + title + '操作!')
    return
  }
  const row: any = selectedData.length === 0 ? {} : { ...selectedData[0] }
  if (title === '修改' && row['status'] !== '00') {
    ElMessage.warning('仅状态为[未发布]状态才可进行编辑!')
    return
  }
  if (title === '创建') {
    row['major'] = []
    const res = await getMeetingCode()
    row['meetingCode'] = res.data
  } else {
    const major: any = selectedData[0] && selectedData[0].major
    if (major) row['major'] = major.split(',')
    else row['major'] = []
  }
  const params = {
    title,
    isView: title === '查看',
    row: { ...row },
    api: title !== '查看' ? addOrUpdateMeeting : undefined,
    getTableList: proTableRef.value?.getTableList
  }
  modalRef.value?.acceptParams(params)
}

const openReviewModal = (pageFlag: string, title: string, selectedData: any[] = []) => {
  let btnPermissions = []
  if (selectedData && selectedData.length !== 1) {
    ElMessage.warning('请选择一条数据进行操作!')
    return
  }
  const row = selectedData.length === 0 ? {} : { ...selectedData[0] }
  if (pageFlag === 'PROGRAM') {
    btnPermissions = row['status'] === '00' ? ['ADD', 'DELETE', 'EXPORT'] : ['EXPORT']
  } else {
    btnPermissions = row['status'] === '00' ? ['ADD', 'DELETE', 'EXPORT', 'ADD_PERSONNEL', 'RESET_PERSONNEL'] : ['EXPORT']
  }
  const params = {
    pageFlag: pageFlag,
    title,
    isView: row['status'] === '00',
    row: { ...row },
    btnPermissions: btnPermissions
  }
  reViewModalRef.value?.acceptParams(params)
}

const handleDeleteFormData = async (meetingList: any[] = []) => {
  if (meetingList && meetingList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除操作!')
    return
  }
  const status = meetingList.some((item: any) => item.status !== '00' || item.xmNum !== '0' || item.zjNum !== '0')
  if (status) {
    ElMessage.warning('仅状态为[未发布]状态且[评审项目数量]、[评审专家人数]均为空，联合会审会议才可进行删除!')
    return
  }
  const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    const delIds = meetingList.map((item: any) => item.meetingId)
    const res = await deleteLhhsMeeting(delIds)
    if (res.success) {
      ElMessage.success('删除成功!')
      proTableRef.value?.getTableList()
      clearSelect()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const choosePsms = (meetingList: any[] = []) => {
  if (!checkReviewModeOptionsReady()) return
  selectModalRef.value.isShowModel = true
  selectModalRef.value.type = meetingList[0].psms
  meetingId.value = meetingList[0].meetingId
  psms.value = meetingList[0]?.psms
}

const handlePublish = async (opType: string, title: string, meetingList: any[] = []) => {
  try {
    if (meetingList && meetingList.length === 0) {
      ElMessage.warning('请至少选择一条数据进行' + title + '操作!')
      return
    }
    if (opType === 'PUBLISH') {
      const name = meetingList
        .filter((item: any) => item.status !== '00')
        .map((item) => item.meetingName)
        .join(',')

      if (name) throw new Error('会议名称:' + '[' + name + ']' + '：状态不是初始状态，不允许发布')
    } else {
      const name = meetingList
        .filter((item: any) => item.status !== '01')
        .map((item) => item.meetingName)
        .join(',')
      if (name) throw new Error('会议名称:' + '[' + name + ']' + '：状态不是已发布状态，不允许取消发布')
    }
    const type = await VXETable.modal.confirm('是否确定' + title + '？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const meetingIds = meetingList.map((item: any) => item.meetingId)
      const api = opType === 'PUBLISH' ? publish : canclePublish
      const res = await api({
        ids: meetingIds,
        dwId: userInfo.value.dwId,
        bmId: userInfo.value.deptId || ''
      })
      if (res.success) {
        ElMessage.success(title + '成功!')
        proTableRef.value?.getTableList()
        clearSelect()
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message)
    console.error(error.message)
  }
}

const getRoleHandle = () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    const userInfoOthers = {
      deptId: userInfOther.specialorgid,
      deptName: userInfOther.specialorgname,
      dwId: userInfOther.org_id,
      dwName: userInfOther.org_name,
      roleId: userInfOther.role_id,
      roleCode: userInfOther.code,
      spRoleId: userInfOther.id,
      specialorgcode: userInfOther.specialorgcode
    }
    userInfo.value = userInfoOthers
    store.commit('setJRGlobalInfo', userInfoOthers)
    isShowPage.value = true
  }
}

const initParams = () => {
  getPublicCodeData()
  loadReviewModeOptions()
}

onMounted(async () => {
  initParams()
  const isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const jRGlobalInfo = store.getters.getJRGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(jRGlobalInfo as any)
    }
    isShowPage.value = true
  } else {
    await nextTick()
    if (userDialogRef.value) await userDialogRef.value.getUser()
  }
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
