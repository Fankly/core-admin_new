<!-- 项目历史评审意见 -->
<template>
  <div>
    <vxe-modal ref="dialogHistoryef" :destroy-on-close="true" v-model="isShowModal" resize show-zoom fullscreen :title="`项目评审历史记录`" width="1200" :close-on-press-escape="false" @close="closeHandle">
      <div :style="{ maxHeight: isShowData ? '60vh' : '80vh' }" v-if="isShowModal">
        <proTable ref="proDataRef" :isShowTable="isShowTable" :data="props.dataList" @row-click="handerClickTable" :columns="tableColumns" :pagination="true" :toolButton="['other']">
          <!-- 表格 header 按钮 -->
          <template #tableHeader="scope">
            <el-button :disabled="!scope.isSelected || scope.selectedList.length != 1" size="mini" type="primary" plain @click="showProjectInfo(scope.selectedList)"> 项目信息查看 </el-button>
          </template>
          <template #headerButton>
            <div style="position: relative">
              <span @click="isShowTable = !isShowTable" style="position: absolute; left: 100px; top: 13px; z-index: 999 !important">
                <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" style="cursor: pointer"></i>
              </span>
              <el-tabs>
                <el-tab-pane label="组长评审信息" name="0"></el-tab-pane>
              </el-tabs>
            </div>
          </template>
        </proTable>
      </div>
      <div :style="{ maxHeight: isShowTable ? '25vh' : '65vh' }">
        <expertReview @handle-table="handleTable" :pageDataList="pageDataList" />
      </div>
    </vxe-modal>
    <CentralizedModification :get-api="'LHHS'" ref="editPageRef" :userInfo="userInfo" :formData="selectData" :flag="'VIEW'" />
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, reactive, defineProps, nextTick, defineExpose } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { pageExpertReviewInfo } from '@/api/service/jointReview'
import expertReview from '@/views/service/ywpt/components/expertReview.vue' //专家评审信息
import { ElMessage } from 'element-plus'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'

//接收父组件传参
const props = defineProps({
  dataList: {
    type: Array,
    default: () => []
  }
})
// // 子组件
const proDataRef = ref() // 初始化页面
const isShowTable = ref(true) //显示表格
const isShowData = ref(true)
const pageDataList = ref<any>([]) //专家评审意见表格数据
const isShowModal = ref<boolean>(false)
const userInfo = ref<any>() // 用户角色
const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const chooseDataPrj = ref<any>()
var timer: any

// 点击行查看点击项目专家的评审信息
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proDataRef.value?.clearSelection()
    proDataRef.value?.element.toggleRowSelection(val)
  })
  clearTimeout(timer)
  timer = setTimeout(async () => {
    let params: any = {
      xmId: val.xmId,
      limit: 100,
      page: 1,
      meetingId: val.meetingId,
      isPack: chooseDataPrj.value.isPack
    }
    let res: any = await pageExpertReviewInfo(params)
    if (res.success) {
      pageDataList.value = res.data.records
    }
  }, 300)
}
const handleTable = (val: any) => {
  isShowData.value = val.value
}
const closeHandle = () => {
  pageDataList.value.length = 0
  if (pageDataList.value.length == 0) {
    isShowModal.value = false
  }
}
const showProjectInfo = async (selectedList: any) => {
  let val = selectedList[0]
  selectData.value.id = val.xmId
  selectData.value.xmlx = val.pro_type_id
  editPageRef.value.isShowModal = true
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'meetingCode', label: '会议编号', width: '100' },
  { prop: 'meetingName', label: '会议名称', width: '280' },
  { prop: 'organizer', label: '组织人', width: '80' },
  { prop: 'review_expert_name', label: '专家组长', width: '80' },
  { prop: 'review_opinion', label: '专家组长终评意见', width: '140' },
  { prop: 'review_reason', label: '专家组长终评意见说明', width: '200' },
  { prop: 'review_time', label: '专家组长终评时间', width: '150' },
  { prop: 'xmbm', label: '项目编码', width: '180' },
  { prop: 'xmmc', label: '项目名称', width: '280' },
  // { prop: 'sfgmb', label: '是否规模包', width: '100' },
  // { prop: 'gmbbm', label: '规模包编码', width: '180' },
  // { prop: 'gmbmc', label: '规模包名称', width: '200' },
  { prop: 'pro_type_name', label: '项目类型', width: '180' },
  { prop: 'yjdw', label: '一级单位', width: '180' },
  { prop: 'ejdw', label: '二级单位', width: '180' }
])

defineExpose({
  proDataRef,
  isShowModal,
  chooseDataPrj
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
