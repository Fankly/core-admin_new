<template>
  <div class="home-container" v-if="isShowPage">
    <div v-loading="loading" class="content" element-loading-text="正在加载...">
      <service-general-report
        tab-layout="middle"
        :button-permissions="buttonPermissions"
        :search-code="searchCode"
        :search-api="searchApi"
        :export-api="exportApi"
        :user-info="currentUserRole"
        :tabs="tabs"
        :keep-search-on-tab-change="false"
        :freeze-left-count="2"
        @tab-change="handleTabChange"
        @selection-change="handleSelectionChange"
        @drill-through="handleDrillThrough"
        ref="serviceGeneralReportRef"
      >
        <template #operation="{ selectedList, tabCode }">
          <template v-if="tabCode === 'SQCK_CONFIRM_PROVINCE'">
            <el-button
              v-if="isShowButton('PROVINCE_OUTBOUND')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="handleConfirmOutboundProvince(tabCode)"
            >
              确认出库
            </el-button>
            <el-button
              v-if="isShowButton('PROVINCE_EDITTYPE')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="editProjectTypeHandle(selectedList)"
            >
              项目类型调整
            </el-button>
            <el-button
              v-if="isShowButton('PROVINCE_BOUNCED')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="handleReturn(selectedList)"
              >退回出库申请</el-button
            >
            <el-button
              v-if="isShowButton('PROVINCE_WHXMYXJ')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="yxjHandle(selectedList)"
              >维护项目优先级</el-button
            >
          </template>
          <template v-if="tabCode === 'SQCK_CONFIRM_CITY'">
            <el-button
              v-if="isShowButton('CITY_OUTBOUND')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="handleConfirmOutboundCity(tabCode)"
            >
              确认出库
            </el-button>
            <el-button
              v-if="isShowButton('CITY_EDITTYPE')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="editProjectTypeHandle(selectedList)"
            >
              项目类型调整
            </el-button>
            <el-button
              v-if="isShowButton('CITY_BOUNCED')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="handleReturn(selectedList)"
              >退回出库申请</el-button
            >
            <el-button
              v-if="isShowButton('CITY_WHXMYXJ')"
              :disabled="selectedList.length === 0"
              plain
              type="primary"
              size="mini"
              @click="yxjHandle(selectedList)"
              >维护项目优先级</el-button
            >
          </template>
        </template>
      </service-general-report>
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <ConfirmOutboundModal @submit-after="searchPageData" ref="confirmOutboundModalRef" />
  <ConfirmOutboundTypeModal ref="confirmOutboundTypeModalRef" />
  <XmYxjModal @submit-after="searchPageData" ref="xmYxjModalRef" />
  <DrillThroughModal
    ref="drillThroughModalRef"
    title="穿透明细"
    :search-api="getDrillThroughPage"
    :export-api="exportDrillThrough"
    :columns="drillColumns"
    :default-params="drillDefaultParams"
  >
    <template #search>
      <el-form style="width: 100%">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="项目编码：">
              <ReMultipleText
                v-model="drillSearch.xmbm"
                placeholder="请输入项目编码"
                dialog-title="项目编码"
                tooltip-text="项目编码"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称：">
              <el-input v-model="drillSearch.xmmc" placeholder="请输入项目名称" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div style="text-align: right; margin-bottom: 10px">
              <el-button size="mini" type="primary" plain @click="handleDrillSearch">查 询</el-button>
              <el-button size="mini" plain @click="handleDrillReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </template>
  </DrillThroughModal>
</template>

<script setup lang="ts" name="/service/Storage/confirmOutbound/index">
import { onMounted, ref, watch, provide, computed } from 'vue'
import { ServiceGeneralReport } from '@/components/service'
import type { UserInfo } from '@/components/service/ServiceGeneralReport/types'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import ConfirmOutboundModal from '@/views/service/Storage/confirmOutbound/components/confirmOutboundModal.vue'
import ConfirmOutboundTypeModal from '@/views/service/Storage/confirmOutbound/components/ConfirmOutboundTypeModal.vue'
import XmYxjModal from '@/views/service/Storage/components/XmYxjModal/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VXETable } from 'vxe-table'
import { exportData, getSqckConfirmPage, Params, sqckConfirm, getDrillThroughPage, exportDrillThrough } from '@/api/service/Storage/confirmOutbound'
import DrillThroughModal from '@/components/DrillThroughModal/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { formatNumValue, checkSameProperty } from '@/utils/utils'
import { getParamConfig } from '@/api/common'
import { thData } from '@/api/service/Storage/sqckConfirm'

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const confirmOutboundModalRef = ref<InstanceType<typeof ConfirmOutboundModal>>()
const confirmOutboundTypeModalRef = ref<InstanceType<typeof ConfirmOutboundTypeModal>>()
const xmYxjModalRef = ref<InstanceType<typeof XmYxjModal>>()
const tabs = ref([
  {
    code: 'SQCK_CONFIRM_HZXX',
    name: '汇总信息-省级统筹',
    searchCode: 'SQCK_CONFIRM_HZXX',
    showProcessBtn: false,
    showViewBtn: false,
    isMultiLevelHeader: true,
    showExportBtn: true
  },
  {
    code: 'SQCK_CONFIRM_PROVINCE',
    name: '明细-省级统筹',
    searchCode: 'SQCK_CONFIRM_PROVINCE',
    showProcessBtn: true,
    showViewBtn: true,
    showExportBtn: true
  },
  { code: 'SQCK_CONFIRM_CITY', name: '明细-市级统筹', searchCode: 'SQCK_CONFIRM_CITY', showProcessBtn: true, showViewBtn: true, showExportBtn: true }
])
const serviceGeneralReportRef = ref<InstanceType<typeof ServiceGeneralReport>>()
const currentDetail = ref<any>(null)
const isShowPage = ref<boolean>(false)
const selectedRows = ref<any[]>([])
const buttonPermissions = ref<string[]>([])
const searchCode = ref('SQCK_CONFIRM_PROVINCE')

const currentUserRole = ref<UserInfo>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

const isProvinceFinanceBudgetSpecialist = computed(
  () => currentUserRole.value && currentUserRole.value.roleCode === 'SCWYSZZ' && currentUserRole.value.specialOrgCode === 'BM_CWZC'
)

const loading = ref(false)
const provinceTargetAdjustSwitchKey = 'ZLYS_MBZTZ_QRCK'
const provinceTargetAdjustSwitchDefaultValue = '0'
const provinceTargetAdjustSwitchEnabledValue = '1'
const provinceTargetAdjustTip = '由省专业部门提交目标值调整及出库明细，审批后自动出库。'
const provinceTargetAdjustSkipField = 'sfjjcl'
const provinceTargetAdjustSkipEnabledValue = '1'
const contributionIncentiveBudgetField = 'sfsygxjlys'
const contributionIncentiveBudgetEnabledValue = '1'
const projectPriorityField = 'xmyxj'
const projectPriorityEmptyMessage = '项目优先级未维护，请维护！'

const drillThroughModalRef = ref<InstanceType<typeof DrillThroughModal>>()
const drillCurrentParams = ref<{ meetingId?: any; searchType?: string }>({})
const drillSearch = ref({ xmbm: '', xmmc: '' })
const drillDefaultParams = computed(() => ({
  bmId: currentUserRole.value.bmId,
  dwId: currentUserRole.value.dwId,
  roleCode: currentUserRole.value.roleCode,
  roleId: currentUserRole.value.roleId
}))

const drillColumns = [
  { field: 'meetingName', title: '会议名称', width: 400 },
  { field: 'meetingCode', title: '会议编码', width: 160 },
  { field: 'xmmc', title: '项目名称', width: 300 },
  { field: 'gwxmbm', title: '项目编码', width: 180 },
  { field: 'proType', title: '项目类型', width: 180 },
  { field: 'yssx', title: '预算事项', width: 200 },
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
] as any[]

const getRoleHandle = async () => {
  if (userRoleSelectorRef.value) {
    isShowPage.value = userRoleSelectorRef.value.canRender
    buttonPermissions.value = await userRoleSelectorRef.value.getButtonPermissions()
  }
}

const searchApi = async (params: Params) => {
  const limit = Number.isFinite(Number(params?.limit)) && Number(params.limit) > 0 ? Math.floor(Number(params.limit)) : 20
  const page = Number.isFinite(Number(params?.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
  params['limit'] = limit
  params['page'] = page
  return getSqckConfirmPage(params)
}

const exportApi = async (params: any) => {
  const limit = Number.isFinite(Number(params?.limit)) && Number(params.limit) > 0 ? Math.floor(Number(params.limit)) : 20
  const page = Number.isFinite(Number(params?.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
  params['limit'] = limit
  params['page'] = page
  return exportData(params)
}

const searchPageData = () => {
  serviceGeneralReportRef.value?.refresh()
}

const handleTabChange = (tab: any) => {}

const handleDrillThrough = ({ row, column }: any) => {
  drillCurrentParams.value = { meetingId: row.meeting_id, searchType: column.field }
  drillSearch.value = { xmbm: '', xmmc: '' }
  drillThroughModalRef.value?.open(drillCurrentParams.value)
}

const handleDrillSearch = () => {
  drillThroughModalRef.value?.open({ ...drillCurrentParams.value, ...drillSearch.value })
}

const handleDrillReset = () => {
  drillSearch.value = { xmbm: '', xmmc: '' }
  drillThroughModalRef.value?.open(drillCurrentParams.value)
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleConfirmOutboundCity = async (code: string) => {
  try {
    loading.value = true
    const type = await VXETable.modal.confirm(`是否确认出库？`, '确认', {
      status: 'question',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    const ids = selectedRows.value.map((item) => item.id)
    const res = await sqckConfirm({
      xmIds: ids,
      searchCode: code
    })
    if (!res.success) throw new Error(res.msg)
    serviceGeneralReportRef.value?.refresh()
    ElMessage.success('提交成功!')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const getProvinceTargetAdjustSwitch = async () => {
  try {
    const res = await getParamConfig(provinceTargetAdjustSwitchKey)
    if (res.success && typeof res.data === 'string' && res.data) {
      return res.data
    }
  } catch (error) {
    console.error('获取目标值调整参数失败:', error)
  }
  return provinceTargetAdjustSwitchDefaultValue
}

const getRowValue = (row: any, field: string) => {
  return (row as Record<string, any>)[field]
}

const normalizeConfigValue = (value: string | number | null | undefined) => {
  return String(value ?? '').trim()
}

const isSameContributionIncentiveBudget = (list: any[]) => {
  if (!Array.isArray(list) || list.length === 0) return true
  const firstValue = normalizeConfigValue(getRowValue(list[0], contributionIncentiveBudgetField))
  return list.every((item) => normalizeConfigValue(getRowValue(item, contributionIncentiveBudgetField)) === firstValue)
}

const isContributionIncentiveBudgetEnabled = (list: any[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  return normalizeConfigValue(getRowValue(list[0], contributionIncentiveBudgetField)) === contributionIncentiveBudgetEnabledValue
}

const isProvinceTargetAdjustSkip = (row: any) => {
  return normalizeConfigValue(getRowValue(row, provinceTargetAdjustSkipField)) === provinceTargetAdjustSkipEnabledValue
}

const hasEmptyProjectPriority = (list: any[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  return list.some((item) => normalizeConfigValue(getRowValue(item, projectPriorityField)) === '')
}

const isAllProvinceTargetAdjustSkip = (list: any[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  return list.every((item) => isProvinceTargetAdjustSkip(item))
}

const isPartialProvinceTargetAdjustSkip = (list: any[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  const matchCount = list.filter((item) => isProvinceTargetAdjustSkip(item)).length
  return matchCount > 0 && matchCount < list.length
}

const handleConfirmOutboundProvince = async (code: string) => {
  const records = selectedRows.value
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据!')
    return
  }
  if (!isSameContributionIncentiveBudget(records)) {
    ElMessage.warning('请选择相同的是否贡献激励预算项目进行出库确认!')
    return
  }
  const provinceTargetAdjustSwitch = await getProvinceTargetAdjustSwitch()
  if (provinceTargetAdjustSwitch === provinceTargetAdjustSwitchEnabledValue && hasEmptyProjectPriority(records)) {
    ElMessage.warning(projectPriorityEmptyMessage)
    return
  }
  if (provinceTargetAdjustSwitch === provinceTargetAdjustSwitchEnabledValue && !isContributionIncentiveBudgetEnabled(records)) {
    if (isPartialProvinceTargetAdjustSkip(records)) {
      ElMessage.warning('请选择相同的是否跳过目标值调整项目进行出库确认!')
      return
    }
    if (!isAllProvinceTargetAdjustSkip(records)) {
      await ElMessageBox.alert(provinceTargetAdjustTip, '提示', {
        confirmButtonText: '确定'
      })
      return
    }
  }
  confirmOutboundModalRef.value?.acceptParams({
    searchCode: code,
    selectData: records
  })
}

// 退回
const handleReturn = async (records: any[]) => {
  try {
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    const xmIdList = records.map((item: any) => item.id)
    const isConfirm = await VXETable.modal.confirm('是否确认退回?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (isConfirm == 'confirm') {
      let res: any = await thData(xmIdList)
      if (res.success) {
        ElMessage.success('退回成功！')
        serviceGeneralReportRef.value?.refresh()
      } else {
        ElMessage.error(res.msg)
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const isShowButton = (btnRole: string) => {
  return buttonPermissions.value.includes(btnRole)
}

// 修改项目类型
const editProjectTypeHandle = async (records: any[]) => {
  // 相同类型校验
  const isSameXmlx = checkSameProperty(records, 'xmlx')
  const isSameNd = checkSameProperty(records, 'nd')
  if (!isSameXmlx) {
    ElMessage.warning('请选择相同的项目类型进行出库确认!')
    return
  }
  if (!isSameNd) {
    ElMessage.warning('请选择相同的出库年度进行出库确认!')
    return
  }
  const isConfirmFlag = records.every((obj) => obj['confirm_flag'] === '1')
  if (isConfirmFlag) {
    confirmOutboundTypeModalRef.value?.acceptParams({
      checkedData: records,
      searchData: searchPageData
    })
  } else {
    ElMessage.warning('不存在可调整项目类型的项目!')
    return
  }
}

// 维护项目优先级
const yxjHandle = (records: any[]) => {
  if (!records || records.length === 0) {
    ElMessage.warning('请至少选择一条数据!')
    return
  }
  xmYxjModalRef.value?.acceptParams({
    selectData: records
  })
}

watch(
  () => selectedRows.value,
  (newVal) => {
    if (newVal.length === 1) {
      currentDetail.value = newVal[0]
    }
  }
)

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
provide('currentUserRole', currentUserRole)
provide('buttonPermissions', buttonPermissions)
</script>

<style scoped lang="less">
.home-container {
  height: 100%;

  .content {
    height: 100%;
    padding: 10px;
  }
}
</style>
