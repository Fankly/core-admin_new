<!-- 查看更多专家线上预审意见  -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      destroy-on-close
      :title="`专家评审意见`"
      :width="1200"
      :height="800"
      @close="closeSxModal"
      :loading="loading"
    >
      <div class="container">
        <el-tabs v-model="activeTab" @tab-click="handleTabChange">
          <el-tab-pane :key="item.label" v-for="item in filterTabs" :label="item.label" :name="item.label" />
        </el-tabs>
        <div style="height: 85%">
          <proTable ref="meetingTableRef" :data="pageList" :columns="meetingColumns" :toolButton="false" :pagination="false" />
        </div>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'otherOpinion'
}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'

import { listExpertReviewTabForSjtc, listExpertReviewInfoByTabForSjtc } from '@/api/service/jointReview'
import { ElMessage } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件

const modalRef = ref()
const isShowTable = ref<boolean>(false)
const loading = ref<boolean>(false)
const pageList = ref<any[]>([])
const activeTab = ref<any>()
const filterTabs = ref<any[]>([])
const parmasCode = ref<any>()

// 切换tab
const handleTabChange = async () => {
  loading.value = true
  const clickTab = filterTabs.value.filter((item: any) => item.label == activeTab.value)
  const parmas = {
    meetingId: parmasCode.value?.meetingId,
    originXmId: parmasCode.value?.originXmId,
    ...clickTab[0]
  }
  let res = await listExpertReviewInfoByTabForSjtc(parmas)
  if (res.success) {
    loading.value = false
    pageList.value = res.data
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const getPageList = async (params: any) => {
  parmasCode.value = { ...params }
  let res = await listExpertReviewTabForSjtc(params)
  if (res.success) {
    if (res.data.length == 0) return ElMessage.warning('暂无评审意见，请勿重复点击。')
    filterTabs.value = res.data
    activeTab.value = filterTabs.value[0].label
    isShowTable.value = true
    handleTabChange()
  } else {
    ElMessage.error(res.msg)
  }
}

// 评审意见列表
const meetingColumns = reactive<any>([
  { type: 'index', width: 50, label: '序号' },
  { prop: 'reviewExpertName', label: '专家姓名', width: '100' },
  { prop: 'reviewOpinion', label: '专家意见', width: '100' },
  { prop: 'reviewReason', label: '意见说明', showOverflowTooltip: false },
  { prop: 'reviewTime', label: '评审时间', width: '200', sortable: true }
])

//关闭
const closeSxModal = () => {
  isShowTable.value = false
}

defineExpose({
  isShowTable,
  loading,
  getPageList
})
</script>
<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}
</style>
