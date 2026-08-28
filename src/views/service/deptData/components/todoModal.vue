<!-- 推送待办 -->
<template>
  <vxe-modal show-zoom v-model="isShowModel" :destroy-on-close="true" :title="`推送待办`" :width="800" :height="600" @close="closeHandle">
    <div class="top_btn"> </div>
    <proTable
      ref="proTableRef"
      :pagination="false"
      :data="deptList"
      :search-col="4"
      :toolButton="['search']"
      :columns="tableColumns"
      @row-click="handerClickTable"
    >
      <template #tableHeader="scope">
        <el-button :disabled="!scope.isSelected" size="mini" type="primary" plain @click="sendDb(scope.selectedList)">发送待办</el-button>
        <el-button size="mini" type="primary" plain @click="seetingPerson">人员设置</el-button>
      </template>
    </proTable>
  </vxe-modal>
  <UserManager :special-org-id="modalParam?.specialorgid" v-model="dialogVisible" ref="userManagerRef" @close="getGkbmEnum" />
</template>
<script lang="tsx">
export default {
  name: 'todoModal'
}
</script>
<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import UserManager from '@/views/service/deptData/components/UserManager.vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ElMessage } from 'element-plus'
import { sendNotify, listGroupByDept } from '@/api/service/deptData/index'
const proTableRef = ref()
const isShowModel = ref(false)
const dialogVisible = ref(false)
const deptList = ref<any[]>([])
const modalParam = ref<any>({})
// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}

const sendDb = async (selectedList: any) => {
  const deptIds = selectedList.map(({ deptId }: any) => deptId)
  const handlerUserIds = selectedList.map(({ userId }: any) => userId)
  selectedList.forEach((item: any) => {
    item.endDate = modalParam.value.endDate
    item.currentUserDwId = modalParam.value.currentUserDwId
    item.senderId = modalParam.value.senderId
    item.handlerUserIds = item.userid
  })
  ElMessageBox.confirm('是否确定通知？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const res = await sendNotify(selectedList)
      if (res.success) {
        ElMessage.success('通知成功')
        closeHandle()
      } else {
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}

const getGkbmEnum = async () => {
  if (modalParam.value.specialorgid) {
    deptList.value.length = 0
    const record = await listGroupByDept({})
    if (!record.success) {
      throw new Error(record.msg)
    }
    deptList.value = record.data
  }
}

const seetingPerson = () => {
  dialogVisible.value = true
}

const closeHandle = () => {
  isShowModel.value = false
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  { prop: 'deptName', label: '归口部门' },
  { prop: 'username', label: '推送人员' }
])

const acceptParams = (param: any) => {
  isShowModel.value = true
  modalParam.value = { ...param }
  getGkbmEnum()
}

defineExpose({
  acceptParams
})
</script>
<style lang="less" scoped>
.top_btn {
  margin-bottom: 10px;
}
</style>
