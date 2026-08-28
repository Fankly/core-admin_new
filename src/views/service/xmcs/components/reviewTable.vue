<!-- 审批意见 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      :destroy-on-close="true"
      :title="`审批意见`"
      :width="1200"
      :height="500"
      :close-on-press-escape="false"
      @close="closeSxModal"
    >
      <proTable
        ref="proTableRef"
        :data-callback="pageList"
        @search="searchHandle"
        @reset="searchHandle"
        :pagination="false"
        :toolButton="['other']"
        :request-api="pageMeeting"
        :request-auto="true"
        :search-col="4"
        :columns="tableColumns"
        @row-click="handerClickTable"
        height="100%"
      />
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'reviewTable'
}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ElMessage } from 'element-plus'
import { getWhyj } from '@/api/service/xmcs/index'
import { getPublicData } from '@/api/common' //公共代码
import { VXETable } from 'vxe-table'

// 子组件
const emit = defineEmits(['pageType'])
const formData = ref<any>({})
const proTableRef = ref() // 初始化页面
const isShowTable = ref<boolean>(false)

// 列表查询
const pageMeeting = (params: any) => {
  return getWhyj(params)
}
// 数据回调
const pageList = (val: any) => {
  return val
}
const closeSxModal = () => {
  isShowTable.value = false
}
const searchHandle = () => {
  proTableRef.value?.clearSelection()
}
// 单击行选中当前行
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}

const acceptParams = (param: any) => {
  isShowTable.value = true
  formData.value = { ...param }
  if (formData.value) proTableRef.value?.getTableList()
}

const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  { prop: 'opinion', label: '审批结果' },
  { prop: 'reason', label: '工作量及审批意见说明' },
  { prop: 'djReason', label: '单价审批意见说明' },
  { prop: 'sszqReason', label: '实施周期审批意见说明' },
  { prop: 'updateTime', label: '更新时间' }
])

defineExpose({ acceptParams })
</script>
<style scoped lang="less"></style>
