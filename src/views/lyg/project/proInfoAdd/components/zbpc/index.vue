<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="70%"
    height="60%"
    @close="resetForm"
    :loading="loading"
    show-footer
    ><ProTable
      @search="resetTable"
      @reset="resetHandle"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="rangeId"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <el-button @click="handleConfirm(scope.selectedList)" size="mini" type="primary">确 认</el-button>
      </template>
    </ProTable>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'zbpc'
}
</script>

<script setup lang="ts">
import { ref, reactive, nextTick, h } from 'vue'
import { zbpcxxPage } from '@/api/lyg/index'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTablePage/index.vue'

const emit = defineEmits(['handlePcType'])

const isShowModal = ref(false)
const loading = ref(false)
const proTableRef = ref<any>(null)
const userInfo = ref<any>()
const modalTitle = ref('')
const store = useStore()
const pcType = ref<string>('')

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  proTableRef.value?.clearSelection()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (param: any) => {
  loading.value = true
  param = {
    ...param,
    pcType: pcType.value
  }
  return zbpcxxPage(param)
}

/** 重置表单数据与校验状态 */
const resetForm = () => {
  isShowModal.value = false
}

/** 关闭弹窗 */
const handleClose = () => {
  resetForm()
}

/** 打开弹窗 */
const acceptParams = async (params: any) => {
  modalTitle.value = params.modalTitle
  pcType.value = params.type
  isShowModal.value = true
  proTableRef.value?.getTableList()
}

// 确认
const handleConfirm = (selectedList: any[]) => {
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  const zbxx = selectedList[0]
  emit('handlePcType', { zbpc: zbxx.pcId, zbpcName: zbxx.pcName, type: pcType.value })
  resetForm()
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'nd',
    label: '年度',
    width: '120',
    search: { el: 'date-picker', order: 3, props: { type: 'year', valueFormat: 'YYYY', multiple: true, collapseTags: true } }
  },
  { prop: 'pcCode', label: '批次编码', width: '150', search: { el: 'input', order: 1 } },
  { prop: 'pcName', label: '批次名称', width: '300', search: { el: 'input', order: 2 } },
  { prop: 'pcTypeName', label: '批次类型', width: '120' },
  {
    prop: 'jhsbjzsj',
    label: '计划申报截止时间',
    width: '150'
    // search: { el: 'date-picker', order: 4, props: { type: 'date', valueFormat: 'YYYY-MM-DD', multiple: true, collapseTags: true } }
  },
  { prop: 'fbggsj', label: '发布公告时间', width: '150' },
  { prop: 'kbsj', label: '开标时间', width: '150' },
  { prop: 'dbsj', label: '定标时间', width: '150' }
])
defineExpose({ acceptParams })
</script>
