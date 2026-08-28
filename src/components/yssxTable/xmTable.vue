<!--项目信息展示列表 -->
<template>
  <div class="container_table" v-loading="loading">
    <proTable
      ref="proTableRef"
      :data-callback="pageList"
      :toolButton="['other']"
      :request-api="pageMeeting"
      :request-auto="false"
      :search-col="4"
      :columns="columns"
      @row-click="handleClickRow"
    >
      <template #tableHeader="scope">
        <el-button
          size="mini"
          :disabled="scope.selectedList.length != 1"
          type="primary"
          plain
          @click="handleInfom(scope.selectedList)"
        >
          项目信息查看
        </el-button>
        <el-button size="mini" type="primary" plain @click="handleExport(scope.selectedList)"
          >导 出</el-button
        >
      </template>
    </proTable>
  </div>
  <CentralizedModification
    :get-api="apiType"
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    :flag="'VIEW'"
  />
</template>
<script lang="ts">
export default {
  name: 'xmTable'
}
</script>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ElMessage } from 'element-plus'
import { apiExportHandle } from '@/utils/export'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'

interface propsVo {
  getTableApi: (params: any) => Promise<any>
  exportApi: (params: any) => Promise<any>
  columns: any[]
  apiType:string
}
const props = defineProps<propsVo>()
// 子组件
const emit = defineEmits(['pageType'])
const formData = ref<any>({})
const loading = ref<boolean>(false)
const proTableRef = ref() // 初始化页面
const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const userInfo = ref<any>() // 用户角色
// 列表查询
const pageMeeting = (params: any) => {
  loading.value = true
  params = { ...params, ...formData.value }
  return props.getTableApi(params)
}
// 数据回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
// 单击行选中当前行
const handleClickRow = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
const handleInfom = (val: any) => {
  selectData.value.id = val[0].xmId
  selectData.value.xmlx = val[0].proType
  editPageRef.value.isShowModal = true
}
// 导出
const handleExport = (val: any) => {
  try {
    loading.value = true
    const params = { ...formData.value }
    const fileName = '项目明细表'
    apiExportHandle(params, fileName, props.exportApi)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}

defineExpose({
  proTableRef,
  formData
})
</script>
<style scoped lang="less">
.container_table {
  width: 98%;
  height: 90%;
  margin: 0 auto;
}
</style>
