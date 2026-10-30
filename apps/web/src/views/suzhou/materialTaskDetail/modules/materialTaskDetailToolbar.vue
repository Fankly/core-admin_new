<template>
  <div style="display: flex; justify-content: space-between">
    <div>
      <el-button v-if="hasPermission('CKJTKMX')" type="primary" plain @click="handleCkTkDetail">出入库明细</el-button>
      <el-button v-if="hasPermission('KJPZ')" type="primary" plain @click="handleShowFile">会计凭证</el-button>
    </div>
    <div>
      <el-button v-if="hasPermission('EXPORT')" type="primary" plain @click="handleExport">导 出</el-button>
    </div>
  </div>
  <materialTaskCkTkDetail ref="materialTaskCkTkDetailRef" />
</template>

<script setup lang="ts">
defineOptions({ name: "materialTaskDetailToolbar" })
import { inject, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/hooks/usePermission'
import { apiExportHandle } from '@/utils/export'
import { CrudTableRefInjectionKey, CheckedRowsInjectionKey, CurrentUserRoleInjectionKey, defaultUserRole } from '@/views/suzhou/common/types/crud'
import { getRoleQueryParams } from '@/views/suzhou/common/utils/params'
import { MATERIAL_TASK_DETAIL_EXPORT_API, MATERIAL_TASK_DETAIL_EXPORT_FILE_NAME } from '@/views/suzhou/materialTaskDetail/config'
import materialTaskCkTkDetail from '@/views/suzhou/materialTask/modules/materialTaskCkTkDetail.vue'
import VXETable from 'vxe-table'
import { getParamValueMulti } from '@/api/common'
import { getProfitCenter } from '@/api/suzhou/materialTask'

const { hasPermission } = usePermission()
const materialTableRef = inject(CrudTableRefInjectionKey, ref())
const currentUserRole = inject(CurrentUserRoleInjectionKey, ref(defaultUserRole()))
const checkedData = inject<Ref<[]>>(CheckedRowsInjectionKey as InjectionKey<Ref<[]>>, ref([]) as Ref<[]>)
const materialTaskCkTkDetailRef = ref<InstanceType<typeof materialTaskCkTkDetail>>()

const handleExport = async () => {
  try {
    const params = {
      ...(materialTableRef.value?.getSearchParams?.() || {}),
      ...getRoleQueryParams(currentUserRole.value)
    }
    await apiExportHandle(params, MATERIAL_TASK_DETAIL_EXPORT_FILE_NAME, MATERIAL_TASK_DETAIL_EXPORT_API, {
      useResponseFileName: true
    })
  } catch (error) {
    ElMessage.error((error as Error).message || '导出失败!')
  }
}

// 出库及退库明细查询
const handleCkTkDetail = () => {
  if (!checkedData.value || checkedData.value.length !== 1) {
    ElMessage.warning('请选择一条数据！')
    return
  }
  const { pspid, matnr } = checkedData.value[0] as { pspid?: string; matnr?: string }
  if (!pspid || !matnr) return ElMessage.warning('当前行缺少项目定义或物料编码，无法查询')
  materialTaskCkTkDetailRef.value?.open({ pspid, matnr })
}
// 查看会计凭证
const handleShowFile = async () => {
  if (!checkedData.value || checkedData.value.length !== 1) {
    ElMessage.warning('请选择一条数据！')
    return
  }
  const { pspid, mjahr } = checkedData.value[0] as { pspid?: string; mjahr?: string }
  if (!pspid || !mjahr) return ElMessage.warning('当前行缺少项目定义或年度，无法查询')
  let year = new Date().getFullYear()
  let month = new Date().getMonth() + 1 > 9 ? new Date().getMonth() + 1 : `0${new Date().getMonth() + 1}`
  let day = new Date().getDate() > 9 ? new Date().getDate() : '0' + new Date().getDate()
  let date = `${year}${month}${day}`
  const profit = await getProfitCenter({ pspid, mjahr })
  const profit_center = profit.data
  let res = await getParamValueMulti(['ERP_TCODE228_URL'])
  const profitCenter = profit_center ? profit_center.substring(2, 6) : '1235'
  if (res.success) {
    const sapUrl = `${res.data.ERP_TCODE228_URL}&AutoStart=true&DynamicParameter=P_BUKRS=${profitCenter};S_PSPID-LOW=${pspid};S_BUDAT-HIGH=`
    const type = await VXETable.modal.confirm('过账日期是否默认设置为今日？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'close') return ElMessage.info('已取消')
    const url = type === 'confirm' ? sapUrl + date : sapUrl
    openWithSAPGUI(url)
  } else {
    ElMessage.error(res.msg)
  }
}

//打开SAP
function openWithSAPGUI(fileUrl: any) {
  window.open(fileUrl, '_blank')
  // const userAgent = navigator.userAgent
  // if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
  //   var iframe = document.createElement('iframe')
  //   iframe.style.display = 'none'
  //   iframe.src = fileUrl
  //   document.body.appendChild(iframe)
  //   setTimeout(() => {
  //     document.body.removeChild(iframe)
  //   }, 1000)
  // } else {
  //   window.open(fileUrl, '_blank')
  // }
}
</script>

<style scoped></style>
