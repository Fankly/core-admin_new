<!-- 物资部门 -->
<style lang="less" scoped></style>
<template>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <el-tabs v-model="tabModel" type="border-card">
    <el-tab-pane :label="item.label" :name="item.value" v-for="item in tabs" :key="item.value">
      <div style="height: 80vh">
        <component v-if="item.value === tabModel" :is="item.component" v-bind="item.data" v-on="item.events" />
      </div>
    </el-tab-pane>
  </el-tabs>
</template>
<script setup lang="ts" name="/motivation/goods/index">
import { onMounted, ref } from 'vue'
import RegeistLibrary from './RegeistLibrary.vue'
import ProfressLibrary from './ProfressLibrary.vue'
import userDialog from '@/components/select/userDialog.vue'
import type { TabItem, UserInfo } from './types/index'
// 载入成功控制器
let loaded: any = null
// 用户信息载入控制
const isLoad: Promise<any> = new Promise((res) => {
  loaded = res
})
// 用户信息
const userInfo = ref<UserInfo>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
})

const tabModel = ref<string>('1')
const tabs: TabItem[] = [
  {
    value: '1',
    label: '注册库信息填报',
    component: RegeistLibrary,
    data: { isLoad, userInfo },
    events: {}
  },
  {
    value: '2',
    label: '专业仓信息填报',
    component: ProfressLibrary,
    data: { isLoad, userInfo },
    events: {}
  }
]

//  用户弹框
const userDialogRef = ref<typeof userDialog>()
// 获取角色信息
const getRoleHandle = () => {
  if (!userDialogRef.value) return
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    userInfo.value = {
      deptId: userInfOther.specialorgid,
      deptName: userInfOther.specialorgname,
      dwId: userInfOther.org_id,
      dwName: userInfOther.org_name,
      roleId: userInfOther.role_id,
      roleCode: userInfOther.code,
      spRoleId: userInfOther.id,
      specialorgcode: userInfOther.specialorgcode
    }
  }
  loaded()
}
onMounted(async () => {
  if (userDialogRef.value) {
    await userDialogRef.value.getUser()
  }
})
//  弹框展示
</script>
