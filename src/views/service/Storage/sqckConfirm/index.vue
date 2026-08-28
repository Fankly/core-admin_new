<script setup lang="ts" name="/service/Storage/sqckConfirm/index">
import userDialog from '@/components/select/userDialog.vue'
import GeneralReport from '@/views/service/Storage/components/GeneralReport/index.vue'
import { ElMessage } from 'element-plus'
import { UserInfo } from '@/views/service/Storage/interface'
import { exportData, stockOutData, getSqckPage, thData } from '@/api/service/Storage/sqckConfirm'
import { RowVo } from '@/views/service/Storage/interface'
import { getInfo } from '@/api/service/Storage/PlannedOutbound/Declaration'
import { onMounted, ref } from 'vue'
import { getPublicCodeList } from '@/api/common'
import VXETable from 'vxe-table'
import { useUser } from '@/hooks/useUser'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { GlobalInfo } from '@/views/service/lkyptzl/interface'
import { useGuide } from '@/hooks/useGuide'
import { checkSameProperty } from '@/utils/utils'
import SqckConfirmTypeModal from '@/views/service/Storage/sqckConfirm/components/SqckConfirmTypeModal.vue'
// import reviewModal from '@/components/yssxTable/reviewModal.vue'

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

const sqckConfirmTypeModalRef = ref<InstanceType<typeof SqckConfirmTypeModal>>()

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

const tab = ref<{
  type: string
  name: string
}>({
  type: '',
  name: '省级统筹项目'
})
const generalReportRef = ref<InstanceType<typeof GeneralReport>>()
const isShowPage = ref(false)

const returnModal = ref()
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

const outboundHandle = async (list: RowVo[]) => {
  if (list && list.length === 0) {
    ElMessage.warning('请至少选择一条数据!')
    return
  }
  selectedDatas.value = list
  // 相同类型校验
  const isSameXmlx = checkSameProperty(list, 'xmlx')
  const isSameNd = checkSameProperty(list, 'nd')
  if (!isSameXmlx) {
    ElMessage.warning('请选择相同的项目类型进行出库确认!')
    return
  }
  if (!isSameNd) {
    ElMessage.warning('请选择相同的出库年度进行出库确认!')
    return
  }
  // 校验confirm_flag
  const isConfirmFlag = list.every((obj) => obj['confirm_flag'] === '0')
  if (isConfirmFlag) await submitHandle()
  else {
    const type = await VXETable.modal.confirm('存在可调整项目类型的项目,是否需要进行项目类型调整?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm')
      sqckConfirmTypeModalRef.value?.acceptParams({
        checkedData: list,
        searchData: searchData
      })
    else if (type === 'cancel') {
      await boundQueryData()
    }
  }
}

const boundQueryData = async () => {
  try {
    if (generalReportRef.value) generalReportRef.value.loading = true
    const xmIds: string[] = selectedDatas.value.map((item) => item.id)
    const res = await stockOutData(xmIds)
    if (res.success) {
      ElMessage.success('确认出库成功!')
      if (generalReportRef.value) {
        await generalReportRef.value.searchDataHandle()
      }
    } else {
      throw new Error(res.msg)
    }
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    if (generalReportRef.value) generalReportRef.value.loading = false
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
    const type = await VXETable.modal.confirm('是否确认出库?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      await boundQueryData()
    }
  } catch (e: any) {
    ElMessage.error(e.message)
  }
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

// 修改项目类型
const editProjectTypeHandle = async (records: RowVo[]) => {
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
    sqckConfirmTypeModalRef.value?.acceptParams({
      checkedData: records,
      searchData: searchData
    })
  } else {
    ElMessage.warning('不存在可调整项目类型的项目!')
    return
  }
}

// 退回
const returnHandle = async (records: RowVo[]) => {
  try {
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    xmIdList.value = records.map((item: any) => item.id)
    // returnModal.value.isShowModel = true
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
        if (generalReportRef.value) {
          generalReportRef.value.loading = false
        }
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
    if (generalReportRef.value) {
      generalReportRef.value.loading = false
    }
  }
}
const searchData = () => {
  if (generalReportRef.value) {
    generalReportRef.value.loading = false
    generalReportRef.value.searchDataHandle()
  }
}
// // 退回意见
// const returnMag = async (val: any) => {
//   try {
//     const params = {
//       reason: val.reason,
//       xmIdList: xmIdList.value,
//       spRoleId: userInfo.value.spRoleId,
//       userId: store.getters.getUserMsg.id,
//       spOrgId: userInfo.value.deptId
//     }
//     let res: any = await thData(params)
//     if (res.success) {
//       ElMessage.success('退回成功！')
//       returnModal.value?.closeHandle()
//       generalReportRef.value.searchDataHandle()
//     } else {
//       ElMessage.error(res.msg)
//     }
//   } catch (e) {
//     const error = e as Error
//     ElMessage.error(error.message)
//   }
// }
</script>

<template>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <GeneralReport
    ref="generalReportRef"
    v-if="isShowPage"
    search-code="SQCK_CONFIRM"
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
        >出库确认</el-button
      >
      <el-button
        v-permission="'BOUNCED'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="returnHandle(scope['selectedList'])"
        >退回出库申请</el-button
      >
      <el-button
        v-permission="'EDITTYPE'"
        :disabled="scope['selectedList'].length === 0"
        plain
        type="primary"
        size="mini"
        @click="editProjectTypeHandle(scope['selectedList'])"
        >修改项目类型</el-button
      >
    </template>
  </GeneralReport>
  <!-- <review-modal ref="returnModal" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag" /> -->
  <SqckConfirmTypeModal ref="sqckConfirmTypeModalRef" />
</template>
