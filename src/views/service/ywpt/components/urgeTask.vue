<!-- 催办 -->
<template>
  <vxe-modal
    @close="closeHandle"
    :title="'催办'"
    :loading="loading"
    :destroy-on-close="true"
    v-model="modalVisible"
    width="70%"
    height="820"
    resize
    show-zoom
    position="center"
  >
    <ProTable
      @row-click="rowClick"
      @search="clearSelect"
      @reset="clearSelect"
      :pagination="false"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="programColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" plain @click="handleSelectAll">全 选</el-button>
        <el-button size="mini" type="primary" plain @click="handleInverseSelect">反 选</el-button>
        <el-button :disabled="!scope['isSelected']" size="mini" type="primary" plain @click="inItiateReminder(scope['selectedList'])">
          催 办
        </el-button>
      </template>
    </ProTable>
  </vxe-modal>
</template>

<script lang="tsx">
export default {
  name: 'proAssignedModal'
}
</script>

<script setup lang="tsx">
import { ref, reactive } from 'vue'
import { handleCb, ListCbryxx } from '@/api/service/jointReview'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import { VXETable } from 'vxe-table'

interface ModalProps {
  title: string
  row: Partial<any>
  getTableList?: () => void
}

const proTableRef = ref()
const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const projectTypeList: any = ref([])
const ndDataList: any = ref([])

const rowClick = (row: any) => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.element.toggleRowSelection(row)
}

const modalProps = ref<ModalProps>({
  title: '',
  row: {}
})

const closeHandle = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  ndDataList.value.length = 0
  projectTypeList.value.length = 0
}

const handleSelectAll = () => {
  const tableData = proTableRef.value?.tableData
  if (!tableData) return
  tableData.forEach((row: any) => {
    proTableRef.value?.element?.toggleRowSelection(row, true)
  })
}
const handleInverseSelect = () => {
  const tableData = proTableRef.value?.tableData
  if (!tableData) return
  tableData.forEach((row: any) => {
    proTableRef.value?.element?.toggleRowSelection(row)
  })
}

const clearSelect = () => {
  ejdwListData.value.length = 0
  proTableRef.value?.clearSelection()
}

const inItiateReminder = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('催办消息发送时，自动跳过待评审数量为0的专家', '催办确认', {
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      const res = await handleCb({
        ...modalProps.value.row,
        cbryxxList: selectedList
      })
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('催办已发送!')
      // modalProps.value.getTableList?.()
      modalVisible.value = false
    } catch (e: any) {
      ElMessage.error(e.toString())
      console.error(e)
    } finally {
      loading.value = false
    }
  }
}

const loading = ref(false)

const programColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'major', label: '评审专业' },
  { prop: 'expertName', label: '专家姓名' },
  { prop: 'totalCount', label: '评审项目数量' },
  { prop: 'thCount', label: '退回数量' },
  { prop: 'pendingReviewCount', label: '待评审数量' },
  { prop: 'reviewedCount', label: '已评审数量' }
])

const getPageList = (params: any) => {
  loading.value = true
  params['meetingId'] = modalProps.value.row['meetingId']
  return ListCbryxx(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  if (proTableRef.value) {
    handleSelectAll()
  }
  return val
}

const modalVisible = ref(false)

const acceptParams = (params: ModalProps) => {
  modalProps.value = { ...modalProps.value, ...params }
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
