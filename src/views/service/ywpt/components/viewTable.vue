<!--联合会审会议页面组件 -->
<template>
  <div class="container" v-loading="loading">
    <proTable
      :data-callback="dataList"
      ref="proTableRef"
      @search="searchHandle"
      @reset="resetHandle"
      :row-style="rowStyle"
      :cell-style="columnStyle"
      @cell-click="downloadReport"
      @row-click="handerClickTable"
      :request-api="pageMeeting"
      :request-auto="true"
      :search-col="4"
      :columns="props.tableColumns"
      @selection-change="selectionChange"
      guide-module-key="viewTable"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-if="props.type == 'expert'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="handleReview(scope.selectedList, '项目评审')"
        >
          项目评审
        </el-button>
        <el-button
          v-if="props.type == 'leader'"
          size="mini"
          :disabled="!scope.isSelected || scope.selectedListIds.length != 1"
          type="primary"
          plain
          @click="handleReview(scope.selectedList, '组长终审')"
          >组长终审</el-button
        >
        <el-button
          v-if="props.type == 'leader'"
          size="mini"
          :disabled="!scope.isSelected || scope.selectedListIds.length != 1"
          type="primary"
          plain
          v-permission="'ASSIGNED'"
          @click="handleReview(scope.selectedList, '评审分工')"
          >评审分工</el-button
        >
        <el-dropdown v-if="props.type == 'leader'" placement="bottom" style="margin: 0 10px">
          <el-button :disabled="!scope.isSelected" size="mini" plain type="primary"> 现场评审管理 </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleReview(scope.selectedList, '开启评审')"> 开启评审 </el-dropdown-item>
              <el-dropdown-item @click="handleReview(scope.selectedList, '关闭评审')"> 关闭评审 </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          v-if="['leader', 'expert'].includes(props.type)"
          size="mini"
          type="primary"
          plain
          v-permission="'REVIEWAGAIN'"
          :disabled="!scope.isSelected || scope.selectedListIds.length != 1"
          @click="handleReview(scope.selectedList, '添加退改需求')"
        >
          添加退改需求
        </el-button>
        <div v-if="props.type == 'report'" style="display: flex">
          <el-button
            v-permission="'PSBGSC'"
            size="mini"
            :disabled="!scope.isSelected"
            type="primary"
            plain
            @click="handleReview(scope.selectedList, '评审报告生成')"
            >评审报告生成</el-button
          >

          <el-upload action="#" :before-upload="handleUplaod" :limit="1" :multiple="false" :show-file-list="false" style="margin: 0 10px">
            <el-button
              v-permission="'PSBGUP'"
              size="mini"
              :disabled="!scope.isSelected || scope.selectedList.length != 1 || scope.selectedList[0].meetingStatus != '01'"
              type="primary"
              plain
              @click="clickUpload(scope.selectedList)"
            >
              评审报告上传
            </el-button>
          </el-upload>
          <el-button
            v-permission="'PSBGDEL'"
            size="mini"
            :disabled="!scope.isSelected || scope.selectedList.length != 1 || scope.selectedList[0].meetingStatus != '01'"
            type="primary"
            plain
            @click="handleReview(scope.selectedList, '评审报告删除')"
          >
            评审报告删除
          </el-button>
          <el-button
            v-permission="'REVIEWVIEW'"
            size="mini"
            :disabled="!scope.isSelected || scope.selectedListIds.length != 1"
            type="primary"
            plain
            @click="handleReview(scope.selectedList, '查看专家评审意见')"
            >查看专家评审意见</el-button
          >
          <el-button
            v-permission="'MEETINGEND'"
            size="mini"
            :disabled="!scope.isSelected"
            type="primary"
            plain
            @click="handleReview(scope.selectedList, '结束会议')"
            >结束会议</el-button
          >
          <el-button
            v-permission="'MEETINGAGAIN'"
            size="mini"
            :disabled="!scope.isSelected"
            type="primary"
            plain
            @click="handleReview(scope.selectedList, '重新打开会议')"
            >重新打开会议</el-button
          >
        </div>
      </template>
    </proTable>
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, defineEmits, defineProps, nextTick, defineExpose, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

import proTable from '@/components/ProTable/index.vue' //表格组件
import {
  pageMeetingInfo,
  leaderReviewPageMeetingInfo,
  reviewReportPageMeetingInfo,
  downloadReviewReport,
  uploadFinalReport
} from '@/api/service/jointReview'
import { useReviewModeCode } from '@/hooks/useReviewModeCode'

//接收父组件传参
const props = defineProps({
  // 页面类型
  type: {
    type: String,
    default: '专家'
  },
  tableColumns: {
    type: [],
    default: []
  }
})
// 子组件
const emit = defineEmits(['pageType', 'cellType', 'fileType'])
const meetingId = ref('')

// 初始化页面
const proTableRef = ref()
const loading = ref(false) //接口调用加载中。。。
const { loadReviewModeOptions, hasReviewMode } = useReviewModeCode()

// 重置
const resetHandle = () => {
  proTableRef.value?.clearSelection()
}
// 搜索
const searchHandle = (val: any) => {
  proTableRef.value?.clearSelection()
}
// 列表查询
const pageMeeting = (params: any) => {
  const api = props.type == 'expert' ? pageMeetingInfo : props.type == 'leader' ? leaderReviewPageMeetingInfo : reviewReportPageMeetingInfo
  if (params.startTimeBegin) {
    let startTimeBegin: any = params.startTimeBegin
    params.startTimeBegin = startTimeBegin[0]
    params.startTimeEnd = startTimeBegin[1]
  }
  return api(params)
}
// 单选
const selectionChange = (selection: any) => {
  if (props.type == 'expert' && selection.length > 1) {
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(selection[selection.length - 1])
    })
  }
}
// 点击行查看点击项目专家的评审信息
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
const clickUpload = (selectedList: any) => {
  meetingId.value = selectedList[0].meetingId
}
const handleUplaod = (file: any) => {
  try {
    loading.value = true
    const isSize = file.size / 1024 / 1024 > 50
    if (isSize) {
      return ElMessage.warning('只能上传大小不超过50M的文件')
    }
    const excelFormData = new FormData()
    excelFormData.append('file', file)
    excelFormData.append('fileName', file.name)
    excelFormData.append('meetingId', meetingId.value)
    uploadFinalReport(excelFormData).then((res: any) => {
      if (res.success) {
        ElMessage.success('上传成功')
        loading.value = false
        emit('fileType', true)
      } else {
        ElMessage.error(res.msg)
        loading.value = false
      }
    })
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  }

  return false
}

// 按钮点击事件
const handleReview = async (selectedList: any[], val: any) => {
  if (val == '项目评审' && selectedList[0].sfkqps != 1) {
    return ElMessage.warning('会议评审未开启，请联系本次会议评审组长！')
  }
  if (props.type == 'leader' && ['开启评审', '关闭评审', '评审分工'].includes(val)) {
    let isAll: any = selectedList.find((item: any) => item.meetingStatus == '02')
    let isAllClik: any = selectedList.find((item: any) => item.sfkqps == '1')
    let isAllEnd: any = selectedList.find((item: any) => item.sfkqps != '1')
    if (isAll) {
      return ElMessage.warning('所选会议包含已结束的会议,请重新选择')
    }
    if (val == '开启评审' && isAllClik) {
      return ElMessage.warning('所选会议包含开启的会议,请重新选择')
    }
    if (val == '关闭评审' && isAllEnd) {
      return ElMessage.warning('所选会议包含未开启的会议,请重新选择')
    }
  }
  if (props.type == 'report' && ['结束会议', '重新打开会议'].includes(val)) {
    let isAll: any = selectedList.find((item: any) => item.meetingStatus == '02')
    let isAllClick: any = selectedList.find((item: any) => item.meetingStatus != '02')
    if (val == '结束会议' && isAll) {
      return ElMessage.warning('所选会议包含已结束的会议,请重新选择')
    }
    if (val == '重新打开会议' && isAllClick) {
      return ElMessage.warning('所选会议包含未结束的会议,请重新选择')
    }
  }
  emit('pageType', { value: val, selectedList: selectedList })
}
const dataList = (val: any) => {
  val.records.forEach((element: any) => {
    if (['expert', 'leader'].includes(props.type)) {
      element.sfkqpsName = element.sfkqps == '1' ? '是' : '否'
    } else {
      element.reportType = element.reportUuid ? '评审报告.doc' : '-'
    }
    element.meetingStatusName = element.meetingStatus == '01' ? '评审中' : element.meetingStatus == '02' ? '已结束' : '未发布'
  })
  return val
}
// 下载附件
const downloadReport = async (row: any, column: any) => {
  if (props.type == 'report' && (column.label == '评审意见报告(初稿)' || column.label == '评审意见报告(定稿)')) {
    try {
      const uuid: any = column.label == '评审意见报告(初稿)' ? row.reportUuid : row.finalReportUuid
      const fileName: any = column.label == '评审意见报告(初稿)' ? `${row.meetingName}-评审报告.doc` : row.finalReportName
      const params: any = {
        uuid: uuid,
        fileName: fileName
      }
      if (!uuid) return ElMessage.warning('报告未维护，请勿重复点击！')
      ElNotification({
        title: '温馨提示',
        message: '如果文件庞大会导致下载缓慢哦，请您耐心等待！',
        type: 'info',
        duration: 3000
      })
      loading.value = true
      const blob: any = await downloadReviewReport({ ...params })
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = `${fileName}`
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    } catch (e: any) {
      console.error(e.toString())
    }
  }
  if (props.type == 'leader' && column.label == '评审模式') {
    if (!hasReviewMode(row.psms)) {
      return ElMessage.warning('暂未选择评审模式，请选择后查看。')
    }
    emit('cellType', row.meetingId)
  }
}
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (props.type == 'report' && (column.label == '评审意见报告(初稿)' || column.label == '评审意见报告(定稿)')) {
    return 'color:#00706b;cursor: pointer;'
  }
  if (props.type == 'leader' && ['评审模式'].includes(column.label)) {
    return {
      cursor: 'pointer',
      color: 'var(--color-primary, #00857c)'
    }
  }
}
// 行颜色
const rowStyle = ({ row }: any) => {
  if (props.type != 'report' && row.sfkqps == '1') {
    return 'backgroundColor:#E0F2F1' //;color:#00706b;
  }
}

onMounted(() => {
  if (props.type == 'leader') loadReviewModeOptions()
})

defineExpose({
  proTableRef
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
