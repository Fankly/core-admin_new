<!-- 服务计划信息查询（测试版）：仅保留年度、项目名称查询条件，去掉导出 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      height="100%"
      :pagination="true"
      @search="resetTable"
      @reset="resetHandle"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
      stripe
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="tsx">
defineOptions({ name: "/lyg/report/fwjhxxTest/index" })
import { onMounted, ref, reactive, computed } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { useStore } from '@/store/business'
import { getPublicData } from '@/api/common'
import { fwjhxxPage } from '@/api/lyg/report'
import { columns } from './columns'

// ========== 响应式状态 ==========
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const userInfo = ref<any>()
const store = useStore()

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}

const resetHandle = () => {
  proTableRef.value?.clearSelection()
}

const callBackHandle = (data: any) => {
  return data
}

const getPageList = (param: any) => {
  return fwjhxxPage({
    ...param,
    userId: store.getters.getUserMsg.id,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    roleId: userInfo.value.role_id,
    roleCode: userInfo.value.code,
    pspidList: [],
    cbzxList: []
  })
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})

// 查询条件列：仅保留年度、项目名称
const queryColumns = reactive<any[]>([
  {
    prop: 'zyear',
    label: '年度',
    isShow: false,
    search: { el: 'select', order: 1, defaultValue: new Date().getFullYear().toString() },
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'post1', label: '项目名称', isShow: false, search: { el: 'input', order: 2, props: { maxlength: 120 } } }
])

// 查询条件列 + 表头列
const tableColumns = computed(() => [...queryColumns, ...columns])
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
