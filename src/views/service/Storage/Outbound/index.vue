<script lang="ts">
export default {
  name: '/service/Storage/Outbound/index'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import GeneralReport from '@/views/service/Storage/components/GeneralReport/index.vue'
import { ElMessage } from 'element-plus'
import { UserInfo } from '@/views/service/Storage/interface'
import { saveOrUpdateTXmThxxb } from '@/api/workflow/xm'
import { exportData, stockOutData, getSqckPage, thData, unABTh } from '@/api/service/Storage/Outbound'
import { RowVo } from '@/views/service/Storage/interface'
import { getInfo } from '@/api/service/Storage/PlannedOutbound/Declaration'
import { getMenuMessage } from '@/api/process'
import { onMounted, ref } from 'vue'
import { getParamConfig, getPublicCodeList } from '@/api/common'
import XmYxjModal from '@/views/service/Storage/components/XmYxjModal/index.vue'
import VXETable from 'vxe-table'
import { useUser } from '@/hooks/useUser'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { GlobalInfo } from '@/views/service/lkyptzl/interface'
import { useGuide } from '@/hooks/useGuide'
import baseService from '@/service/baseService'

const userInfo = ref<UserInfo>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleId: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: ''
})

const store = useStore()
const route = useRoute()
const router = useRouter()

const provinceTargetAdjustSwitchKey = 'ZLYS_MBZTZ_QRCK'
const provinceTargetAdjustSwitchDefaultValue = '0'
const provinceTargetAdjustSwitchEnabledValue = '1'
const provinceTargetAdjustRoutePath = '/targetBudget/provinceTarget/index'
const provinceTargetAdjustNoPermissionMessage = '无权限访问项目类型调整页面'
const provinceTargetAdjustSourceType = '1'
const provinceTargetAdjustSkipField = 'sfjjcl'
const provinceTargetAdjustSkipEnabledValue = '1'
const contributionIncentiveBudgetField = 'sfsygxjlys'
const contributionIncentiveBudgetEnabledValue = '1'
const projectPriorityField = 'xmyxj'
const projectPriorityEmptyMessage = '项目优先级未维护，请维护！'

const { startGuide } = useGuide({
  moduleKey: 'Outbound',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const ndList = ref<
  {
    code: string
    name: string
  }[]
>([])

const xmYxjModalRef = ref<InstanceType<typeof XmYxjModal>>()

const tab = ref<{
  type: string
  name: string
}>({
  type: '',
  name: '省级统筹项目'
})

const formRef = ref()
const generalReportRef = ref<InstanceType<typeof GeneralReport>>()
const isShowPage = ref(false)
const loading = ref(false)
const modalVisible = ref(false)
const xmIdList = ref<any[]>([])

const ckFormData = ref({
  isYap: '',
  nd: '',
  xmIds: []
})

const formRules = ref({
  isYap: [{ required: true, message: '请选择是否预安排', trigger: 'change' }],
  nd: [{ required: true, message: '请选择年度', trigger: 'change' }]
})

const userDialogRef = ref<InstanceType<typeof userDialog>>()

const getRoleHandle = async () => {
  try {
    if (userDialogRef.value) {
      const isQuery = userDialogRef.value.isQuery
      const userMsg = userDialogRef.value.userMsg as any
      userInfo.value = {
        deptId: userMsg.specialorgid,
        deptName: userMsg.specialorgname,
        dwId: userMsg.org_id,
        dwName: userMsg.org_name,
        roleId: userMsg.role_id,
        roleCode: userMsg.code,
        spRoleId: userMsg.id,
        specialorgcode: userMsg.specialorgcode
      }
      await getXmType(userMsg.org_id)
      if (isQuery) {
        isShowPage.value = true
        startGuide()
      }
    }
  } catch (e: any) {
    console.error(e.message)
  }
}

const selectedDatas = ref<RowVo[]>([])

const getProvinceTargetAdjustSwitch = async () => {
  try {
    const res = await getParamConfig(provinceTargetAdjustSwitchKey)
    if (res.success && typeof res.data === 'string' && res.data) {
      return res.data
    }
  } catch (error) {
    // 参数接口异常时回退为关闭，避免影响原有申请出库流程。
    console.error('获取省专业目标值调整开关失败:', error)
  }
  return provinceTargetAdjustSwitchDefaultValue
}

const ensureProvinceTargetAdjustMenuPermission = async () => {
  const userId = store.getters.getUserMsg.id
  if (!userId) {
    throw new Error('获取当前用户信息失败')
  }

  const menuRes = await getMenuMessage(provinceTargetAdjustRoutePath)
  const menuCode = menuRes?.data?.outsideMenu
  if (!menuRes.success || !menuCode) {
    throw new Error('获取项目类型调整菜单信息失败')
  }

  const roleList = await baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${menuCode}`)
  if (!Array.isArray(roleList)) {
    throw new Error('获取项目类型调整菜单权限失败')
  }

  if (roleList.length === 0) {
    throw new Error(provinceTargetAdjustNoPermissionMessage)
  }
}

const getProvinceTargetAdjustRows = (list: RowVo[]) => {
  return list.filter((item) => item.ysly === provinceTargetAdjustSourceType)
}

const getRowValue = (row: RowVo, field: string) => {
  return (row as Record<string, any>)[field]
}

const normalizeConfigValue = (value: string | number | null | undefined) => {
  return String(value ?? '').trim()
}

const isSameContributionIncentiveBudget = (list: RowVo[]) => {
  if (!Array.isArray(list) || list.length === 0) return true
  const firstValue = normalizeConfigValue(getRowValue(list[0], contributionIncentiveBudgetField))
  return list.every((item) => normalizeConfigValue(getRowValue(item, contributionIncentiveBudgetField)) === firstValue)
}

const isContributionIncentiveBudgetEnabled = (list: RowVo[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  return normalizeConfigValue(getRowValue(list[0], contributionIncentiveBudgetField)) === contributionIncentiveBudgetEnabledValue
}

const isProvinceTargetAdjustSkip = (row: RowVo) => {
  return normalizeConfigValue(getRowValue(row, provinceTargetAdjustSkipField)) === provinceTargetAdjustSkipEnabledValue
}

const hasEmptyProjectPriority = (list: RowVo[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  return list.some((item) => normalizeConfigValue(getRowValue(item, projectPriorityField)) === '')
}

const isAllProvinceTargetAdjustSkip = (list: RowVo[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  return list.every((item) => isProvinceTargetAdjustSkip(item))
}

const isPartialProvinceTargetAdjustSkip = (list: RowVo[]) => {
  if (!Array.isArray(list) || list.length === 0) return false
  const matchCount = list.filter((item) => isProvinceTargetAdjustSkip(item)).length
  return matchCount > 0 && matchCount < list.length
}

const outboundHandle = async (list: RowVo[]) => {
  if (list && list.length === 0) {
    ElMessage.warning('请至少选择一条数据!')
    return
  }
  try {
    if (!isSameContributionIncentiveBudget(list)) {
      ElMessage.warning('请选择相同的是否贡献激励预算项目进行申请出库!')
      return
    }

    // 开启目标值调整模式后，申请出库入口统一跳转到省专业目标值调整页。
    const provinceTargetAdjustSwitch = await getProvinceTargetAdjustSwitch()
    if (provinceTargetAdjustSwitch === provinceTargetAdjustSwitchEnabledValue && hasEmptyProjectPriority(list)) {
      ElMessage.warning(projectPriorityEmptyMessage)
      return
    }
    if (provinceTargetAdjustSwitch === provinceTargetAdjustSwitchEnabledValue && !isContributionIncentiveBudgetEnabled(list)) {
      if (isPartialProvinceTargetAdjustSkip(list)) {
        ElMessage.warning('请选择相同的是否跳过目标值调整项目进行申请出库!')
        return
      }
      if (isAllProvinceTargetAdjustSkip(list)) {
        selectedDatas.value = list
        modalVisible.value = true
        return
      }
      const provinceTargetAdjustRows = getProvinceTargetAdjustRows(list)
      if (provinceTargetAdjustRows.length > 0) {
        await ensureProvinceTargetAdjustMenuPermission()
        await router.push({
          path: provinceTargetAdjustRoutePath
        })
        return
      }
    }
    selectedDatas.value = list
    modalVisible.value = true
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const getPublicDataList = async () => {
  const res = await getPublicCodeList({
    codes: ['ZLYS_XMJHSSND']
  })
  ndList.value = res.data['ZLYS_XMJHSSND']
}

const submitHandle = async () => {
  try {
    await formRef.value.validate()
    const type = await VXETable.modal.confirm('确认是否申请出库?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      loading.value = true
      const xmIds = selectedDatas.value.map((item) => item.id)
      const res = await stockOutData({
        ...ckFormData.value,
        xmIds: xmIds
      })
      if (res.success) {
        ElMessage.success('申请出库成功!')
        loading.value = false
        closeHandle()
        if (generalReportRef.value) generalReportRef.value.searchDataHandle()
      } else {
        loading.value = false
        throw new Error(res.msg)
      }
    }
  } catch (e: any) {
    loading.value = false
    ElMessage.error(e.message)
  }
}
// 退回
const returnHandle = async (records: any, type: any) => {
  try {
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    xmIdList.value = records.map((item: any) => item.id)
    let thList: any[] = records.map((element: any) => ({
      id: element.id,
      thyj: '退回',
      thsbys: element.amount
    }))
    // returnModal.value.isShowModel = true
    const isConfirm = await VXETable.modal.confirm('是否确认退回?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (isConfirm == 'confirm') {
      loading.value = true
      const params = xmIdList.value
      const api = type == '1' ? thData : unABTh
      let res: any = await api(params)
      if (res.success) {
        let thRes = await saveOrUpdateTXmThxxb({ list: thList })
        console.log(thRes)
        ElMessage.success('退回成功！')
        searchData()
      } else {
        ElMessage.error(res.msg)
      }
    }
  } catch (e: any) {
    loading.value = false
    ElMessage.error(e.message)
  }
}
const searchData = () => {
  if (generalReportRef.value) {
    loading.value = false
    generalReportRef.value.searchDataHandle()
  }
}

const closeHandle = () => {
  modalVisible.value = false
  formRef.value.resetFields()
  selectedDatas.value = []
}

// 维护项目优先级
const yxjHandle = (list: RowVo[]) => {
  if (!list || list.length === 0) {
    ElMessage.warning('请至少选择一条数据!')
    return
  }
  xmYxjModalRef.value?.acceptParams({
    selectData: list
  })
}

// 获取项目类型
const getXmType = async (dwId: string) => {
  const res = await getInfo(dwId)
  if (res.success) {
    tab.value = res.data
  }
}

const handleError = (error: Error, message = '操作失败'): void => {
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}

onMounted(async () => {
  try {
    // 获取公共代码
    await getPublicDataList()
    const isRoel = await useUser('getCbGlobalInfo', store as any)
    if (isRoel && route.params.formJsc) {
      const cbGlobalInfo = store.getters.getCbGlobalInfo as GlobalInfo
      userInfo.value = {
        deptId: cbGlobalInfo.deptId,
        deptName: cbGlobalInfo.deptName,
        dwId: cbGlobalInfo.dwId,
        dwName: cbGlobalInfo.dwName,
        roleId: cbGlobalInfo.roleId,
        roleCode: cbGlobalInfo.roleCode,
        spRoleId: cbGlobalInfo.spRoleId,
        specialorgcode: cbGlobalInfo.specialorgcode
      }
      isShowPage.value = true
      startGuide()
    } else {
      if (userDialogRef.value) {
        userDialogRef.value.getUser()
      }
    }
  } catch (e) {
    handleError(e as Error, '初始化加载失败')
  }
})
</script>

<template>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <GeneralReport
    ref="generalReportRef"
    v-if="isShowPage"
    search-code="SQCK"
    :search-api="getSqckPage"
    :export-api="exportData"
    :userInfo="userInfo"
    :freeze-left-count="2"
  >
    <template #operation="scope">
      <el-button
        v-permission="'SUBMIT'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="outboundHandle(scope['selectedList'])"
        >申请出库</el-button
      >
      <el-button
        v-permission="'BOUNCED'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="returnHandle(scope['selectedList'], '1')"
        >强制退回</el-button
      >
      <el-button
        v-permission="'TH'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="returnHandle(scope['selectedList'], '2')"
        >退回需求草稿</el-button
      >
      <el-button
        v-permission="'WHXMYXJ'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="yxjHandle(scope['selectedList'])"
        >维护项目优先级</el-button
      >
    </template>
  </GeneralReport>
  <vxe-modal
    @close="closeHandle"
    position="center"
    v-model="modalVisible"
    width="400"
    height="200"
    title="出库"
    destroy-on-close
    :mask-closable="false"
    :loading="loading"
    transfer
  >
    <el-form ref="formRef" :rules="formRules" label-position="right" label-width="120px" label-suffix="：" :model="ckFormData">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item prop="isYap" label="是否预安排">
            <el-select v-model="ckFormData.isYap" style="width: 100%">
              <el-option value="0" label="否"></el-option>
              <el-option value="1" label="是"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="nd" label="年度">
            <el-select v-model="ckFormData.nd" style="width: 100%">
              <el-option v-for="item in ndList" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div style="text-align: center">
      <el-button plain type="primary" size="mini" @click="submitHandle">提 交</el-button>
      <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
    </div>
  </vxe-modal>
  <XmYxjModal @submit-after="searchData" ref="xmYxjModalRef" />
</template>
