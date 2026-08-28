<script lang="ts">
export default {
  name: '/service/Storage/Approval/index'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import GeneralReport from '@/views/service/Storage/components/GeneralReport/index.vue'
import BatchMaintenance from '@/views/service/Storage/components/BatchMaintenance/index.vue'
import { ElMessage } from 'element-plus'
import { UserInfo } from '@/views/service/Storage/interface'
import { RowVo } from '@/views/service/Storage/interface'
import { getInfo } from '@/api/service/Storage/PlannedOutbound/Declaration'
import { nextTick, onMounted, ref } from 'vue'
import { getPublicCodeList } from '@/api/common'
import { exportData, getPageDataList, nrcbData, thData } from '@/api/service/Storage/Approval'
import { pfwhwhData } from '@/api/service/Storage/Approval'
import { VXETable } from 'vxe-table'
import { useUser } from '@/hooks/useUser'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { GlobalInfo } from '@/views/service/lkyptzl/interface'
import { useGuide } from '@/hooks/useGuide'

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

const { startGuide } = useGuide({
  moduleKey: 'Review',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const store = useStore()
const route = useRoute()

const ndList = ref<
  {
    code: string
    name: string
  }[]
>([])

const tab = ref<{
  type: string
  name: string
}>({
  type: '1',
  name: '省级统筹项目'
})
const generalReportRef = ref<InstanceType<typeof GeneralReport>>()
const isShowPage = ref(false)
const xmIdList = ref<any[]>([])

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
      await getInfoData(userMsg.org_id)
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
const batchMaintenanceRef = ref<InstanceType<typeof BatchMaintenance>>()

const batchMaintenanceHandle = async (records: RowVo[]) => {
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作!')
    return
  }
  const ztRes = records.some((record: any) => record.zt === '310')
  if (ztRes) {
    ElMessage.warning('【发展合规审核中】状态,无法进行批复文号维护!')
    return
  }
  selectedDatas.value = [...records]
  await nextTick()
  if (batchMaintenanceRef.value) batchMaintenanceRef.value?.openModal()
}

const reserveHandle = async (records: RowVo[]) => {
  const ztRes = records.some((record: any) => record.zt === '310')
  if (ztRes) {
    ElMessage.warning('非【待发展合规审核、发展合规审核驳回】状态,无法提交计划审核!')
    return
  }
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作!')
    return
  }
  const type = await VXETable.modal.confirm('确认是否提交计划审核?', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type === 'confirm') {
    try {
      if (generalReportRef.value) generalReportRef.value.loading = true
      const ids = records.map((item: any) => item.id)
      const res = await nrcbData(ids)
      if (res.success) {
        searchData()
        await VXETable.modal.message({
          content: '提交计划审核成功',
          status: 'success',
          duration: 2000
        })
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      await VXETable.modal.message({
        content: e.message,
        status: 'error',
        duration: 2000
      })
    } finally {
      if (generalReportRef.value) generalReportRef.value.loading = false
    }
  }
}

// 退回
const returnHandle = async (records: any) => {
  try {
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    xmIdList.value = records.map((item: any) => item.id)
    const isConfirm = await VXETable.modal.confirm('是否确认退回?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (isConfirm == 'confirm') {
      if (generalReportRef.value) generalReportRef.value.loading = true
      const params = xmIdList.value
      let res: any = await thData(params)
      if (res.success) {
        ElMessage.success('退回成功！')
        searchData()
      } else {
        ElMessage.error(res.msg)
        if (generalReportRef.value) generalReportRef.value.loading = false
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
    if (generalReportRef.value) generalReportRef.value.loading = false
  }
}

const getPublicDataList = async () => {
  const res = await getPublicCodeList({
    codes: ['ZLYS_XMJHSSND']
  })
  ndList.value = res.data['ZLYS_XMJHSSND']
}

// 获取项目类型
const getInfoData = async (dwId: string) => {
  const res = await getInfo(dwId)
  if (res.success) {
    tab.value = res.data
  }
}

const searchData = () => {
  if (generalReportRef.value) generalReportRef.value.searchDataHandle()
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
    search-code="XMPFWJSC"
    :search-api="getPageDataList"
    :export-api="exportData"
    :userInfo="userInfo"
    :freeze-left-count="2"
  >
    <template #operation="scope">
      <el-button
        v-permission="'PSWH'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="batchMaintenanceHandle(scope['selectedList'])"
        >批复文号维护</el-button
      >
      <el-button
        v-permission="'SUBMIT'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="reserveHandle(scope['selectedList'])"
        >提交计划审核</el-button
      >
      <el-button
        v-permission="'BOUNCED'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="returnHandle(scope['selectedList'])"
        >退回评审意见上传</el-button
      >
    </template>
  </GeneralReport>
  <BatchMaintenance
    @submitAfter="searchData"
    :selectData="selectedDatas"
    :allowed-file-types="['pdf', 'ofd']"
    ref="batchMaintenanceRef"
    :submit-api="pfwhwhData"
  />
</template>
