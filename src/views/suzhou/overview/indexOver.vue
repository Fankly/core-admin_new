<!-- 预警看板 -->
<template>
  <div class="container" v-loading="loading" v-show="isShowPage">
    <el-row class=""> </el-row>
  </div>
  <!-- 登录 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>
<script setup lang="ts" name="/lyg/projectProcessWarning/warning/index">
import { ref, reactive, onMounted, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const userInfo = ref<any>()
const userDialogRef = ref()
const processList = ref<any[]>([
  {
    name: ''
  }
])

const getRoleHandle = async () => {
  isShowPage.value = false
  loading.value = true
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    isShowPage.value = true
    loading.value = false
  }
}

// 方法
onMounted(async () => {
  await userDialogRef.value.getUser()
})
</script>
<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
