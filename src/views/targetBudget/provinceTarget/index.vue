<template>
  <div class="container" v-show="isShowPage">
    <div class="container-operation" v-if="isShowPage">
      <Operation :search="searchMainPageData" :ndList="ndList" ref="operationRef" />
    </div>
    <div class="container-search">
      <Search :search="searchMainPageData" :statusList="statusList" ref="searchRef" />
    </div>
    <div class="container-table">
      <Table :search="searchMainPageData" ref="tableRef" />
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<!--省级统筹目标值管理-->
<script setup lang="ts" name="/targetBudget/provinceTarget/index">
import { useProvinceTarget } from '@/views/targetBudget/provinceTarget/hooks/useProvinceTarget'
import Operation from '@/views/targetBudget/provinceTarget/components/Operation.vue'
import Search from '@/views/targetBudget/provinceTarget/components/Search.vue'
import Table from '@/views/targetBudget/provinceTarget/components/Table.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { onMounted } from 'vue'
const {
  getPublicCodeData,
  getRoleHandle,
  userRoleSelectorRef,
  ndList,
  statusList,
  operationRef,
  tableRef,
  searchRef,
  isShowPage,
  searchMainPageData
} = useProvinceTarget()

onMounted(() => {
  getPublicCodeData()
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/provinceTarget';
</style>
