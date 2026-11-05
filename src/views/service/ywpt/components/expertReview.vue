<!-- 查看专家评审意见组件-->
<template>
  <div style="height: 100%">
    <proTable :isShowTable="isShowTable" :data="pageDataList" :columns="tableTwoColumns" :pagination="false" :toolButton="false">
      <template #headerButton>
        <div style="position: relative">
          <span @click="handleClick" style="position: absolute; left: 100px; top: 13px; z-index: 999 !important">
            <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" style="cursor: pointer"></i>
          </span>
          <el-tabs>
            <el-tab-pane label="专家评审信息" name="0"></el-tab-pane>
          </el-tabs>
        </div>
      </template>
    </proTable>
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件

interface propsVo {
  pageDataList: any[]
}
const emits = defineEmits(['handleTable'])
const props = defineProps<propsVo>()
const isShowTable = ref(true) //显示表格
const handleClick = () => {
  isShowTable.value = !isShowTable.value
  emits('handleTable', { value: isShowTable.value })
}
const tableTwoColumns = reactive<any>([
  { type: 'index', width: 80, label: '序号' },
  { prop: 'xmbm', label: '项目编码', width: '180' },
  { prop: 'xmmc', label: '项目名称', width: '200' },
  { prop: 'major', label: '评审专业', width: '120' },
  { prop: 'reviewExpertName', label: '专家姓名', width: '150' },
  { prop: 'reviewOpinion', label: '专家评审意见', width: '150' },
  { prop: 'reviewTime', label: '专家评审时间', width: '150' },
  { prop: 'reviewReason', label: '专家评审意见说明' },
  { prop: 'meetingCode', label: '会议编号', width: '180' },
  { prop: 'meetingName', label: '会议名称', width: '180' }
])
</script>
<style scoped lang="less"></style>
