<template>
  <BudgetConfigLayout :columns="columns" v-if="isShowPage">
    <template #toolbar>
      <el-button size="mini" type="primary" plain> 新 增 </el-button>
      <el-button size="mini" type="primary" plain> 编 辑 </el-button>
      <el-button size="mini" type="primary" plain> 查 看</el-button>
      <el-button size="mini" type="danger" plain> 删 除</el-button>
      <el-button size="mini" type="primary" plain> 导 出</el-button>
      <el-button size="mini" type="primary" plain> 会计科目</el-button>
      <el-button size="mini" type="primary" plain> 项目分类</el-button>
    </template>
  </BudgetConfigLayout>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/fy/config/budget/capital/index">
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import BudgetConfigLayout from '@/views/fy/config/budget/layout/BudgetConfigLayout.vue'
import { useCapital } from './useCapital'
import { onMounted } from 'vue'
import columns from './columns'

const { userRoleSelectorRef, getRoleHandle, isShowPage } = useCapital()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style lang="less" scoped></style>
