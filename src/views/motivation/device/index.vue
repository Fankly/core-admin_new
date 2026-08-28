<script lang="tsx">
export default {
  name: '/motivation/device/index'
}
</script>
<script setup lang="tsx">
import userDialog from '@/components/select/userDialog.vue'
import BDZ from './components/BDZ.vue'
import SDXL from './components/SDXL.vue'
import ZSJXJ from './components/ZSJXJ.vue'
import { ref, onMounted } from 'vue'
import { getEjdw, getPublicData, getYjdw } from '@/api/common' //公共代码

const tabMsg = ref('1') //当前页签位置
const userDialogRef = ref()
const isShowPage = ref(false)

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
})

const yjdwList = ref<
  {
    code: string
    name: string
  }[]
>([]) // 一级单位

const getYjdwData = async () => {
  const yjdwRes = await getYjdw({
    dwId: userInfo.value.dwId,
    bmId: userInfo.value.deptId
  })
  if (yjdwRes.success) {
    yjdwList.value.push(...yjdwRes.data)
  }
}

//  获取权限
const getRoleHandle = () => {
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
    getYjdwData()

    isShowPage.value = true
  }
}

onMounted(async () => {
  await userDialogRef.value.getUser()
})
</script>

<template>
  <el-tabs v-model="tabMsg" type="border-card">
    <el-tab-pane label="变电站信息" name="1">
      <BDZ :yjdwList="yjdwList" :isShowPage="isShowPage" :userInfo="userInfo" />
    </el-tab-pane>
    <el-tab-pane label="输电线路信息" name="2">
      <SDXL :yjdwList="yjdwList" :isShowPage="isShowPage" :userInfo="userInfo" />
    </el-tab-pane>
    <el-tab-pane label="直升机巡检信息" name="3">
      <ZSJXJ :yjdwList="yjdwList" :isShowPage="isShowPage" :userInfo="userInfo" />
    </el-tab-pane>
  </el-tabs>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>
