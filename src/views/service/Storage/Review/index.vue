<template>
  <div class="home-container" v-if="isShowPage">
    <div class="content">
      <service-general-report
        tab-layout="top"
        :button-permissions="buttonPermissions"
        search-code="XMPSYJSC"
        :search-api="searchApi"
        :export-api="exportApi"
        :user-info="currentUserRole"
        :freeze-left-count="2"
        @selection-change="handleSelectionChange"
        ref="serviceGeneralReportRef"
      >
        <template #operation="{ selectedList }">
          <el-button
            v-if="isShowButton('PSWH')"
            :disabled="selectedList.length === 0"
            plain
            type="primary"
            size="mini"
            @click="batchMaintenanceHandle(selectedList)"
            >评审信息维护</el-button
          >
          <el-button
            v-if="isShowButton('SUBMIT')"
            :disabled="selectedList.length === 0"
            plain
            type="primary"
            size="mini"
            @click="reserveHandle(selectedList)"
            >提 交</el-button
          >
          <el-button
            v-if="isShowButton('BOUNCED')"
            :disabled="selectedList.length === 0"
            plain
            type="primary"
            size="mini"
            @click="returnHandle(selectedList)"
            >退回草稿</el-button
          >
        </template>
      </service-general-report>
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <BatchMaintenance
    @submit-after="searchPageData"
    inputKey="wh"
    input-text="评审文号"
    modalTitle="评审信息维护"
    :selectData="selectedDatas"
    :allowed-file-types="['pdf', 'ofd']"
    ref="batchMaintenanceRef"
    :submit-api="pfwhwhData"
  />
  <review-modal ref="returnModal" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag" />
</template>

<script setup lang="ts" name="/service/Storage/Review/index">
import { onMounted, ref, provide } from 'vue'
import { ServiceGeneralReport } from '@/components/service'
import type { UserInfo } from '@/components/service/ServiceGeneralReport/types'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { saveOrUpdateTXmThxxb } from '@/api/workflow/xm'
import { exportData, getPageDataList, pfwhwhData, submitData, thData } from '@/api/service/Storage/xmpsyjsc'
import BatchMaintenance from '@/views/service/Storage/components/BatchMaintenance/index.vue'
import { RowVo } from '@/views/service/Storage/interface'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { useStore } from 'vuex'
import reviewModal from '@/components/yssxTable/reviewModal.vue'

const store = useStore()

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const serviceGeneralReportRef = ref<InstanceType<typeof ServiceGeneralReport>>()
const isShowPage = ref(false)
const buttonPermissions = ref<string[]>([])

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

const selectedRows = ref<any[]>([])
const selectedDatas = ref<RowVo[]>([])
const batchMaintenanceRef = ref<InstanceType<typeof BatchMaintenance>>()
const returnModal = ref()
const xmIdList = ref<any[]>([])
const xmInfoList = ref<any[]>([])

const getRoleHandle = async () => {
  if (userRoleSelectorRef.value) {
    isShowPage.value = userRoleSelectorRef.value.canRender
    buttonPermissions.value = await userRoleSelectorRef.value.getButtonPermissions()
  }
}

const searchApi = async (params: any) => {
  const limit = Number.isFinite(Number(params?.limit)) && Number(params.limit) > 0 ? Math.floor(Number(params.limit)) : 20
  const page = Number.isFinite(Number(params?.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
  params['limit'] = limit
  params['page'] = page
  return getPageDataList(params)
}

const exportApi = async (params: any) => {
  const limit = Number.isFinite(Number(params?.limit)) && Number(params.limit) > 0 ? Math.floor(Number(params.limit)) : 20
  const page = Number.isFinite(Number(params?.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
  params['limit'] = limit
  params['page'] = page
  return exportData(params)
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

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
  if (batchMaintenanceRef.value) batchMaintenanceRef.value?.openModal()
}

const returnMag = async (val: any) => {
  try {
    const params = {
      reason: val.reason,
      xmIdList: xmIdList.value,
      spRoleId: currentUserRole.value.spRoleId,
      userId: store.getters.getUserMsg.id,
      spOrgId: currentUserRole.value.bmId
    }
    let thList: any[] = xmInfoList.value.map((element: any) => ({
      id: element.id,
      thyj: val?.reason,
      thsbys: element.amount
    }))
    await saveOrUpdateTXmThxxb({ list: thList })
    let res: any = await thData(params)
    if (res.success) {
      ElMessage.success('退回成功！')
      returnModal.value?.closeHandle()
      serviceGeneralReportRef.value?.refresh()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  }
}

const returnHandle = async (records: any) => {
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作!')
    return
  }
  xmIdList.value = records.map((item: any) => item.id)
  xmInfoList.value = records
  returnModal.value.isShowModel = true
}

const reserveHandle = async (records: RowVo[]) => {
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作!')
    return
  }
  const type = await VXETable.modal.confirm('确认是否提交?', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type === 'confirm') {
    try {
      const ids = records.map((item: any) => item.id)
      const res = await submitData(ids)
      if (res.success) {
        serviceGeneralReportRef.value?.refresh()
        await VXETable.modal.message({
          content: '提交成功',
          status: 'success',
          duration: 2000
        })
      } else {
        throw new Error(res.msg)
      }
    } catch (e: any) {
      await VXETable.modal.message({
        content: e.message,
        status: 'error',
        duration: 2000
      })
    }
  }
}

const searchPageData = () => {
  serviceGeneralReportRef.value?.refresh()
}

const isShowButton = (btnRole: string) => {
  return buttonPermissions.value.includes(btnRole)
}

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
